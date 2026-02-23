import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../components/UI';
import { db } from '../firebase';
import {
  collection, getDocs, addDoc, updateDoc, doc,
  arrayUnion, arrayRemove, getDoc
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { getEvents } from '../services/events';
import { createJoinRequestNotification, createJoinAcceptedNotification } from '../services/notifications';
import {
  Users, CheckCircle, X, Clock, Calendar, Plus,
  Search, Shield, LogIn, Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Team {
  id: string;
  name: string;
  eventId: string;
  eventName?: string;
  leaderId: string;
  leaderName?: string;
  maxMembers: number;
  members: string[];
  memberProfiles?: any[];
  invites: string[];
  createdAt: string;
  lookingForMembers: boolean;
}

export const ConnectionsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<'invites' | 'myteams' | 'browse' | 'create'>('invites');
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create team form
  const [createForm, setCreateForm] = useState({
    name: '',
    eventId: '',
    maxMembers: '4',
    lookingForMembers: true,
  });
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    const [snap, evts] = await Promise.all([
      getDocs(collection(db, 'teams')),
      getEvents()
    ]);
    setEvents(evts);

    const teamsRaw = snap.docs.map(d => ({ id: d.id, ...d.data() } as Team));

    // Hydrate event names + leader names + member profiles
    const hydrated = await Promise.all(teamsRaw.map(async team => {
      const event = evts.find(e => e.id === team.eventId);
      const leaderSnap = await getDoc(doc(db, 'users', team.leaderId)).catch(() => null);
      const leaderName = leaderSnap?.exists() ? leaderSnap.data().name : 'Unknown';

      const memberProfiles = await Promise.all(
        (team.members || []).slice(0, 6).map(async uid => {
          const s = await getDoc(doc(db, 'users', uid)).catch(() => null);
          return s?.exists() ? { id: uid, ...s.data() } : { id: uid, name: '?', avatar: '' };
        })
      );

      return {
        ...team,
        eventName: event?.name || 'Unknown Event',
        leaderName,
        memberProfiles,
      };
    }));

    setAllTeams(hydrated);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [currentUser]);

  const myInvites = allTeams.filter(t =>
    t.invites?.includes(currentUser!.id) && !t.members?.includes(currentUser!.id)
  );
  const myTeams = allTeams.filter(t => t.members?.includes(currentUser!.id));
  const browseTeams = allTeams.filter(t =>
    !t.members?.includes(currentUser!.id) &&
    !t.invites?.includes(currentUser!.id) &&
    t.lookingForMembers &&
    (t.members?.length || 0) < t.maxMembers
  ).filter(t =>
    !searchQuery ||
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.eventName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.leaderName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAccept = async (team: Team) => {
    setActing(team.id);
    try {
      await updateDoc(doc(db, 'teams', team.id), {
        members: arrayUnion(currentUser!.id),
        invites: arrayRemove(currentUser!.id)
      });
      await fetchData();
      setTab('myteams');
    } catch { alert('Failed to accept invite.'); }
    finally { setActing(null); }
  };

  const handleDecline = async (team: Team) => {
    setActing(team.id);
    try {
      await updateDoc(doc(db, 'teams', team.id), {
        invites: arrayRemove(currentUser!.id)
      });
      await fetchData();
    } catch { alert('Failed to decline invite.'); }
    finally { setActing(null); }
  };

  const handleJoinRequest = async (team: Team) => {
    setActing(team.id);
    try {
      await updateDoc(doc(db, 'teams', team.id), {
        joinRequests: arrayUnion(currentUser!.id)
      });

      // Notify the team leader
      await createJoinRequestNotification({
        recipientId: team.leaderId,
        requesterName: currentUser!.name,
        requesterId: currentUser!.id,
        requesterAvatar: (currentUser as any).avatar || '',
        teamName: team.name,
        eventName: team.eventName || '',
        teamId: team.id,
      });

      alert(`Join request sent to ${team.leaderName}! 🌸`);
      await fetchData();
    } catch { alert('Failed to send join request.'); }
    finally { setActing(null); }
  };

  const handleAcceptJoinRequest = async (team: Team, userId: string) => {
    setActing(team.id + userId);
    try {
      await updateDoc(doc(db, 'teams', team.id), {
        members: arrayUnion(userId),
        joinRequests: arrayRemove(userId)
      });

      // Notify the person who requested
      await createJoinAcceptedNotification({
        recipientId: userId,
        leaderName: currentUser!.name,
        teamName: team.name,
        eventName: team.eventName || '',
      });

      await fetchData();
    } catch { alert('Failed to accept.'); }
    finally { setActing(null); }
  };

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.eventId) {
      alert('Please fill in team name and select an event.'); return;
    }
    setCreating(true);
    try {
      await addDoc(collection(db, 'teams'), {
        name: createForm.name.trim(),
        eventId: createForm.eventId,
        leaderId: currentUser!.id,
        leaderName: currentUser!.name,
        maxMembers: parseInt(createForm.maxMembers) || 4,
        members: [currentUser!.id],
        invites: [],
        joinRequests: [],
        lookingForMembers: createForm.lookingForMembers,
        createdAt: new Date().toISOString(),
      });
      setCreateForm({ name: '', eventId: '', maxMembers: '4', lookingForMembers: true });
      await fetchData();
      setTab('myteams');
    } catch { alert('Failed to create team.'); }
    finally { setCreating(false); }
  };

  const TABS = [
    { key: 'invites', label: 'Invites', count: myInvites.length },
    { key: 'myteams', label: 'My Teams', count: myTeams.length },
    { key: 'browse', label: 'Browse Teams', count: null },
    { key: 'create', label: 'Create Team', count: null },
  ] as const;

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-serif">Teams & Connections</h2>
        <p className="text-gray-400">Create a team, browse open spots, or manage your invites.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${
              tab === t.key
                ? 'bg-rose text-white border-rose'
                : 'bg-white text-gray-500 border-gray-200 hover:border-rose hover:text-rose'
            }`}
          >
            {t.key === 'create' && <Plus size={12} />}
            {t.key === 'browse' && <Search size={12} />}
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${tab === t.key ? 'bg-white text-rose' : 'bg-rose text-white'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading teams...</div>
      ) : (
        <AnimatePresence mode="wait">

          {/* ── INVITES TAB ─────────────────────────────────────── */}
          {tab === 'invites' && (
            <motion.div key="invites" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {myInvites.length === 0 ? (
                <Card className="p-10 border border-gray-100 text-center space-y-3">
                  <Clock size={36} className="mx-auto text-gray-200" />
                  <p className="text-gray-400">No pending invites right now.</p>
                  <p className="text-xs text-gray-300">Use LotUs Match to get invited, or browse open teams!</p>
                </Card>
              ) : (
                myInvites.map((team, idx) => (
                  <motion.div key={team.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: idx * 0.05 }}>
                    <Card className="p-6 border border-rose/20 bg-rose/5 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <h4 className="font-bold text-charcoal text-lg">{team.name}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Calendar size={11} className="text-rose" /> {team.eventName}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Crown size={11} className="text-rose" /> Led by {team.leaderName}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Users size={11} className="text-rose" /> {team.members?.length || 0} / {team.maxMembers} members
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-rose/10 text-rose px-2.5 py-1 rounded-full shrink-0">Invited</span>
                      </div>
                      {/* Member avatars */}
                      <MemberAvatars profiles={team.memberProfiles || []} currentUserId={currentUser!.id} />
                      <div className="flex gap-3">
                        <Button onClick={() => handleAccept(team)} disabled={acting === team.id} className="gap-2 flex-1">
                          <CheckCircle size={14} /> {acting === team.id ? 'Joining...' : 'Accept & Join'}
                        </Button>
                        <Button onClick={() => handleDecline(team)} disabled={acting === team.id} variant="outline" className="gap-2 flex-1 border-red-200 text-red-400 hover:bg-red-50">
                          <X size={14} /> Decline
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ── MY TEAMS TAB ────────────────────────────────────── */}
          {tab === 'myteams' && (
            <motion.div key="myteams" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {myTeams.length === 0 ? (
                <Card className="p-10 border border-gray-100 text-center space-y-3">
                  <Users size={36} className="mx-auto text-gray-200" />
                  <p className="text-gray-400">You haven't joined any teams yet.</p>
                  <button onClick={() => setTab('create')} className="text-rose font-bold text-sm hover:underline">Create one →</button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {myTeams.map((team, idx) => {
                    const isLeader = team.leaderId === currentUser!.id;
                    const joinRequests = (team as any).joinRequests || [];
                    return (
                      <motion.div key={team.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                        <Card className="p-6 border border-gray-100 hover:border-rose/20 transition-all space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="font-bold text-charcoal text-lg">{team.name}</h4>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Calendar size={11} className="text-rose" /> {team.eventName}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${isLeader ? 'bg-amber-100 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {isLeader ? '👑 Leader' : 'Member'}
                              </span>
                              <span className="text-[10px] text-gray-400">{team.members?.length || 0} / {team.maxMembers} members</span>
                            </div>
                          </div>

                          <MemberAvatars profiles={team.memberProfiles || []} currentUserId={currentUser!.id} />

                          {/* Looking for members toggle */}
                          {isLeader && (
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <span className="text-xs text-gray-500 font-bold">Open to join requests</span>
                              <button
                                onClick={async () => {
                                  await updateDoc(doc(db, 'teams', team.id), {
                                    lookingForMembers: !team.lookingForMembers
                                  });
                                  fetchData();
                                }}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${team.lookingForMembers ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}
                              >
                                {team.lookingForMembers ? 'Yes' : 'No'}
                              </button>
                            </div>
                          )}

                          {/* Join requests — leader only */}
                          {isLeader && joinRequests.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-rose">
                                {joinRequests.length} Join Request{joinRequests.length > 1 ? 's' : ''}
                              </p>
                              {joinRequests.map((uid: string) => (
                                <JoinRequestRow
                                  key={uid}
                                  uid={uid}
                                  acting={acting}
                                  onAccept={() => handleAcceptJoinRequest(team, uid)}
                                  onDecline={async () => {
                                    await updateDoc(doc(db, 'teams', team.id), { joinRequests: arrayRemove(uid) });
                                    fetchData();
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── BROWSE TEAMS TAB ────────────────────────────────── */}
          {tab === 'browse' && (
            <motion.div key="browse" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by team name, event, or leader..."
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose"
                />
              </div>

              {browseTeams.length === 0 ? (
                <Card className="p-10 border border-gray-100 text-center space-y-2">
                  <Search size={36} className="mx-auto text-gray-200" />
                  <p className="text-gray-400">No open teams found.</p>
                  <p className="text-xs text-gray-300">Be the first — create a team!</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {browseTeams.map((team, idx) => (
                    <motion.div key={team.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                      <Card className="p-6 border border-gray-100 hover:border-rose/20 hover:shadow-md transition-all space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h4 className="font-bold text-charcoal">{team.name}</h4>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Calendar size={11} className="text-rose" /> {team.eventName}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Crown size={11} className="text-rose" /> {team.leaderName}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-rose">{team.members?.length || 0}/{team.maxMembers}</div>
                            <div className="text-[10px] text-gray-400">members</div>
                            <div className="mt-1 text-[9px] bg-emerald-50 text-emerald-600 font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                              Open
                            </div>
                          </div>
                        </div>

                        <MemberAvatars profiles={team.memberProfiles || []} currentUserId={currentUser!.id} />

                        <Button
                          onClick={() => handleJoinRequest(team)}
                          disabled={acting === team.id || (team as any).joinRequests?.includes(currentUser!.id)}
                          fullWidth
                          className="gap-2"
                          variant={(team as any).joinRequests?.includes(currentUser!.id) ? 'outline' : 'primary'}
                        >
                          <LogIn size={14} />
                          {(team as any).joinRequests?.includes(currentUser!.id) ? 'Request Sent' : 'Request to Join'}
                        </Button>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── CREATE TEAM TAB ─────────────────────────────────── */}
          {tab === 'create' && (
            <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="p-8 border border-gray-100 max-w-lg mx-auto space-y-6">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 bg-rose/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Users size={22} className="text-rose" />
                  </div>
                  <h3 className="text-xl font-serif">Create a Team</h3>
                  <p className="text-sm text-gray-400">Start a team for an event and invite others.</p>
                </div>

                {/* Team Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Team Name</label>
                  <Input
                    value={createForm.name}
                    onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Team Phoenix, The Builders..."
                  />
                </div>

                {/* Event */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Event</label>
                  <select
                    value={createForm.eventId}
                    onChange={e => setCreateForm(f => ({ ...f, eventId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose bg-white"
                  >
                    <option value="">Select an event...</option>
                    {events.map(e => (
                      <option key={e.id} value={e.id}>{e.name} — {e.type}</option>
                    ))}
                  </select>
                </div>

                {/* Max Members */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Max Team Size</label>
                  <div className="flex gap-2 flex-wrap">
                    {['2', '3', '4', '5', '6', '8', '10'].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setCreateForm(f => ({ ...f, maxMembers: n }))}
                        className={`w-11 h-11 rounded-xl font-bold text-sm border-2 transition-all ${createForm.maxMembers === n ? 'border-rose bg-rose text-white' : 'border-gray-200 text-gray-500 hover:border-rose hover:text-rose'}`}
                      >
                        {n}
                      </button>
                    ))}
                    <input
                      type="number"
                      min="2"
                      max="50"
                      value={['2','3','4','5','6','8','10'].includes(createForm.maxMembers) ? '' : createForm.maxMembers}
                      onChange={e => setCreateForm(f => ({ ...f, maxMembers: e.target.value }))}
                      placeholder="Other"
                      className="w-20 h-11 px-3 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose focus:border-rose"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">Depends on the competition rules</p>
                </div>

                {/* Looking for members toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-charcoal">Open to join requests</p>
                    <p className="text-[11px] text-gray-400">Others can discover and request to join your team</p>
                  </div>
                  <button
                    onClick={() => setCreateForm(f => ({ ...f, lookingForMembers: !f.lookingForMembers }))}
                    className={`w-12 h-6 rounded-full transition-all relative ${createForm.lookingForMembers ? 'bg-rose' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${createForm.lookingForMembers ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <Button onClick={handleCreate} disabled={creating} fullWidth className="gap-2">
                  <Plus size={16} />
                  {creating ? 'Creating...' : 'Create Team'}
                </Button>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      )}
    </div>
  );
};

// ─── Member Avatars ───────────────────────────────────────────────────────────
const MemberAvatars: React.FC<{ profiles: any[]; currentUserId: string }> = ({ profiles, currentUserId }) => (
  <div className="flex -space-x-2">
    {profiles.map((p, i) => (
      <div
        key={p.id}
        title={p.name}
        className="w-8 h-8 rounded-full border-2 border-white bg-rose/10 flex items-center justify-center overflow-hidden text-xs font-bold text-rose shadow-sm"
      >
        {p.avatar ? (
          <img src={p.avatar} className="w-full h-full object-cover" alt="" />
        ) : (
          <span>{p.name?.[0]?.toUpperCase() || '?'}</span>
        )}
      </div>
    ))}
  </div>
);

// ─── Join Request Row ─────────────────────────────────────────────────────────
const JoinRequestRow: React.FC<{ uid: string; acting: string | null; onAccept: () => void; onDecline: () => void }> = ({ uid, acting, onAccept, onDecline }) => {
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    getDoc(doc(db, 'users', uid)).then(s => { if (s.exists()) setProfile(s.data()); });
  }, [uid]);

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
      <div className="w-8 h-8 rounded-full bg-rose/10 flex items-center justify-center text-rose font-bold text-xs overflow-hidden shrink-0">
        {profile?.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" alt="" /> : profile?.name?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-charcoal truncate">{profile?.name || 'Loading...'}</p>
        <p className="text-[10px] text-gray-400 truncate">{profile?.email || ''}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={onAccept} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors">
          <CheckCircle size={14} />
        </button>
        <button onClick={onDecline} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};