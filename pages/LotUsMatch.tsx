import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button, Input } from '../components/UI';
import { ScoreCircle } from '../components/Icons';
import { Sparkles, UserPlus, Search, Trophy, CheckCircle, Mail, X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers } from '../services/users';
import { getEvents } from '../services/events';
import { computeMatchScore, getWhyMatchAI } from '../services/match';
import { createTeamInviteNotification, createMessageNotification } from '../services/notifications';
import { sendMessage } from '../services/messages';
import { User, Role, Event, EventType } from '../types';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

export const LotUsMatchPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedEventType, setSelectedEventType] = useState<EventType | undefined>();
  const [selectedEventName, setSelectedEventName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState<string | null>(null);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [userTeams, setUserTeams] = useState<Record<string, string>>({});  // userId -> teamName
  const [whyMatchCache, setWhyMatchCache] = useState<Record<string, string>>({});
  const [messageModal, setMessageModal] = useState<{ user: any; } | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [allUsers, allEvents] = await Promise.all([getAllUsers(), getEvents()]);
      const participants = allUsers.filter(u =>
        u.id !== currentUser?.id &&
        u.role !== Role.ADMIN &&
        u.role !== Role.SUPERADMIN
      );
      setUsers(participants);
      setEvents(allEvents);
      if (allEvents.length > 0) {
        setSelectedEventId(allEvents[0].id);
        setSelectedEventType(allEvents[0].type as EventType);
        setSelectedEventName(allEvents[0].name);
      }
      setLoading(false);

      // Fetch which users are in teams
      const teamsSnap = await getDocs(collection(db, 'teams'));
      const teamMap: Record<string, string> = {};
      teamsSnap.docs.forEach(d => {
        const t = d.data();
        (t.members || []).forEach((uid: string) => { teamMap[uid] = t.name; });
      });
      setUserTeams(teamMap);
    };
    load();
  }, [currentUser]);

  const handleEventSelect = (event: Event) => {
    setSelectedEventId(event.id);
    setSelectedEventType(event.type as EventType);
    setSelectedEventName(event.name);
  };

  // Fetch AI explanations for all users when event or users change
  useEffect(() => {
    if (!currentUser || !users.length) return;
    users.forEach(async (u) => {
      const key = u.id + selectedEventId;
      if (whyMatchCache[key]) return;
      const why = await getWhyMatchAI(currentUser, u, selectedEventType, selectedEventName);
      setWhyMatchCache(prev => ({ ...prev, [u.id]: why }));
    });
  }, [users, selectedEventId, currentUser]);

  const suggestedTeammates = users
    .map(u => ({
      ...u,
      matchScore: currentUser ? computeMatchScore(currentUser, u, selectedEventType) : 0,
      whyMatch: whyMatchCache[u.id] || ''
    }))
    .filter(u => !searchQuery || u.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
    .sort((a, b) => b.matchScore - a.matchScore);

  const handleSendMessage = async () => {
    if (!messageModal || !currentUser || !messageText.trim()) return;
    setSending(true);
    try {
      const ref = await sendMessage({
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: (currentUser as any).avatar || '',
        recipientId: messageModal.user.id,
        content: messageText.trim(),
        eventId: selectedEventId,
        eventName: selectedEventName,
      });

      // Send notification
      await createMessageNotification({
        recipientId: messageModal.user.id,
        senderName: currentUser.name,
        senderId: currentUser.id,
        senderAvatar: (currentUser as any).avatar || '',
        eventName: selectedEventName,
        messageId: '', // ref not needed for lookup
      });

      setInvited(prev => new Set(prev).add(messageModal.user.id));
      setMessageModal(null);
      setMessageText('');
    } catch (err) {
      console.error(err);
      alert('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleInvite = async (invitedUser: User) => {
    if (!currentUser || !selectedEventId) return;
    setInviting(invitedUser.id);
    try {
      // Check if team already exists
      const teamsSnap = await getDocs(
        query(
          collection(db, 'teams'),
          where('leaderId', '==', currentUser.id),
          where('eventId', '==', selectedEventId)
        )
      );

      let teamName = `${currentUser.name}'s Team`;

      if (teamsSnap.empty) {
        // Create new team
        await addDoc(collection(db, 'teams'), {
          name: teamName,
          eventId: selectedEventId,
          leaderId: currentUser.id,
          members: [currentUser.id],
          invites: [invitedUser.id],
          createdAt: new Date().toISOString()
        });
      } else {
        const teamDoc = teamsSnap.docs[0];
        const teamData = teamDoc.data();
        teamName = teamData.name;

        if (teamData.invites?.includes(invitedUser.id) || teamData.members?.includes(invitedUser.id)) {
          alert(`${invitedUser.name} is already invited or in your team!`);
          setInviting(null);
          return;
        }
        await teamDoc.ref.update({
          invites: [...(teamData.invites || []), invitedUser.id]
        });
      }

      // Send notification to the invited user
      await createTeamInviteNotification({
        recipientId: invitedUser.id,
        inviterName: currentUser.name,
        inviterId: currentUser.id,
        inviterAvatar: (currentUser as any).avatar || '',
        eventId: selectedEventId,
        eventName: selectedEventName,
        teamName,
      });

      // Mark as invited locally so button changes
      setInvited(prev => new Set(prev).add(invitedUser.id));

    } catch (err) {
      console.error('Invite error:', err);
      alert('Failed to send invite. Please try again.');
    } finally {
      setInviting(null);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="max-w-3xl">
        <h2 className="text-4xl font-serif mb-2">LotUs Team Match</h2>
        <p className="text-gray-400 text-lg">
          Our algorithm finds teammates with <span className="text-rose font-semibold">complementary skills</span> — not just similar ones.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Step 1: Select Event</label>
          {events.length === 0 ? (
            <p className="text-sm text-gray-400">No events available.</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {events.map(e => (
                <button
                  key={e.id}
                  onClick={() => handleEventSelect(e)}
                  className={`px-6 py-4 rounded-2xl border-2 transition-all shrink-0 text-left min-w-[200px] ${selectedEventId === e.id ? 'border-rose bg-rose/5' : 'border-gray-100 bg-white'}`}
                >
                  <p className={`font-bold text-sm ${selectedEventId === e.id ? 'text-rose' : 'text-charcoal'}`}>{e.name}</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">{e.type}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Step 2: Filter Expertise</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="e.g. React, UI Design..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
          {selectedEventType && (
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">
              Optimized for <span className="text-rose font-bold">{selectedEventType}</span>
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Finding your matches...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {suggestedTeammates.map((user, idx) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 flex flex-col sm:flex-row gap-6 hover:shadow-xl transition-shadow border border-gray-100">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-2 border-rose/20 shadow-lg overflow-hidden bg-rose/10 flex items-center justify-center">
                        {user.avatar ? (
                          <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-rose font-bold text-2xl">{user.name?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-rose text-white p-1 rounded-full">
                        <Sparkles size={12} />
                      </div>
                    </div>
                    <ScoreCircle score={user.matchScore} size={70} />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-xl font-bold text-charcoal">{user.name}</h4>
                      <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">
                        {user.bio ? `"${user.bio}"` : ''}
                      </p>
                      {/* Registered events */}
                      {user.registeredEventIds?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {user.registeredEventIds.slice(0, 2).map((eid: string) => {
                            const ev = events.find((e: any) => e.id === eid);
                            return ev ? (
                              <span key={eid} className="text-[9px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-bold">{ev.name}</span>
                            ) : null;
                          })}
                        </div>
                      )}
                      {/* Team membership */}
                      {userTeams[user.id] && (
                        <div className="mt-1.5 flex items-center gap-1 text-[9px] text-emerald-600 font-bold uppercase tracking-widest">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                          In team: {userTeams[user.id]}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Top Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {user.skills.slice(0, 3).map(s => <Badge key={s} variant="rose">{s}</Badge>)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 italic">✨ {user.whyMatch}</p>
                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-rose font-bold text-xs">
                        <Trophy size={14} /> {user.matchScore}% Match
                      </div>
                      <Button
                        size="sm"
                        className="gap-2"
                        disabled={invited.has(user.id) || !selectedEventId}
                        onClick={() => {
                          if (!invited.has(user.id)) {
                            setMessageModal({ user });
                            setMessageText('');
                          }
                        }}
                      >
                        {invited.has(user.id) ? (
                          <><CheckCircle size={16} /> Message Sent!</>
                        ) : (
                          <><UserPlus size={16} /> Invite to Team</>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {suggestedTeammates.length === 0 && !loading && (
            <div className="col-span-2 text-center py-20 text-gray-400">
              No matches found. Try adjusting your skill filter.
            </div>
          )}
        </div>
      )}
      {/* Message Modal */}
      <AnimatePresence>
        {messageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setMessageModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-rose/10 border-2 border-rose/20 flex items-center justify-center overflow-hidden">
                    {messageModal.user.avatar ? (
                      <img src={messageModal.user.avatar} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-rose font-bold text-lg">{messageModal.user.name?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-charcoal">{messageModal.user.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                      Invite for <span className="text-rose">{selectedEventName}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setMessageModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={18} />
                </button>
              </div>

              {/* Message area */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Mail size={11} /> Your Message
                </label>
                <textarea
                  value={messageText}
                  onChange={e => {
                    if (e.target.value.length <= 200) setMessageText(e.target.value);
                  }}
                  placeholder={`Hi ${messageModal.user.name?.split(' ')[0]}, I'd love to have you on my team for ${selectedEventName}! I think your skills in ${messageModal.user.skills?.slice(0,2).join(' & ')} would complement our team perfectly...`}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-charcoal outline-none focus:ring-2 focus:ring-rose resize-none"
                />
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-gray-400">{messageText.length}/200 characters</p>
                  {messageText.length > 150 && (
                    <p className="text-[10px] text-amber-500 font-bold">{200 - messageText.length} left</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setMessageModal(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !messageText.trim()}
                  className="flex-1 py-3 rounded-xl bg-rose text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Send size={14} />
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};