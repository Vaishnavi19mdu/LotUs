import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '../components/UI';
import { db } from '../firebase';
import { collection, getDocs, query, where, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Users, CheckCircle, X, Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TeamInvite {
  id: string;
  name: string;
  eventId: string;
  eventName?: string;
  leaderId: string;
  leaderName?: string;
  members: string[];
  invites: string[];
}

export const ConnectionsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [myTeams, setMyTeams] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchData = async () => {
    if (!currentUser) return;

    const snap = await getDocs(collection(db, 'teams'));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as TeamInvite));

    // Teams where I'm invited but not yet a member
    const pending = all.filter(t =>
      t.invites?.includes(currentUser.id) && !t.members?.includes(currentUser.id)
    );

    // Teams I'm already a member of
    const joined = all.filter(t => t.members?.includes(currentUser.id));

    setInvites(pending);
    setMyTeams(joined);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [currentUser]);

  const handleAccept = async (team: TeamInvite) => {
    setActing(team.id);
    try {
      await updateDoc(doc(db, 'teams', team.id), {
        members: arrayUnion(currentUser!.id),
        invites: arrayRemove(currentUser!.id)
      });
      await fetchData();
    } catch {
      alert('Failed to accept invite.');
    } finally {
      setActing(null);
    }
  };

  const handleDecline = async (team: TeamInvite) => {
    setActing(team.id);
    try {
      await updateDoc(doc(db, 'teams', team.id), {
        invites: arrayRemove(currentUser!.id)
      });
      await fetchData();
    } catch {
      alert('Failed to decline invite.');
    } finally {
      setActing(null);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading invites...</div>;

  return (
    <div className="space-y-10 pb-20">
      <header>
        <h2 className="text-3xl font-serif">Team Invites</h2>
        <p className="text-gray-400">Manage your team invitations and memberships.</p>
      </header>

      {/* Pending Invites */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-serif text-charcoal">Pending Invites</h3>
          {invites.length > 0 && (
            <span className="w-5 h-5 bg-rose rounded-full text-white text-[10px] font-bold flex items-center justify-center">
              {invites.length}
            </span>
          )}
        </div>

        {invites.length === 0 ? (
          <Card className="p-8 border border-gray-100 text-center space-y-2">
            <Clock size={32} className="mx-auto text-gray-300" />
            <p className="text-gray-400 text-sm">No pending invites right now.</p>
            <p className="text-gray-400 text-xs">Use LotUs Match to connect with teammates!</p>
          </Card>
        ) : (
          <AnimatePresence>
            {invites.map((team, idx) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-6 border border-rose/20 bg-rose/5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-charcoal text-lg">{team.name}</h4>
                      {team.eventName && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar size={12} className="text-rose" />
                          {team.eventName}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users size={12} className="text-rose" />
                        {team.members?.length || 0} member{team.members?.length !== 1 ? 's' : ''} so far
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-rose/10 text-rose px-2 py-1 rounded-full">
                      Invited
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAccept(team)}
                      disabled={acting === team.id}
                      className="gap-2 flex-1"
                    >
                      <CheckCircle size={15} />
                      {acting === team.id ? 'Joining...' : 'Accept'}
                    </Button>
                    <Button
                      onClick={() => handleDecline(team)}
                      disabled={acting === team.id}
                      variant="outline"
                      className="gap-2 flex-1 border-red-200 text-red-400 hover:bg-red-50"
                    >
                      <X size={15} />
                      Decline
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </section>

      {/* My Teams */}
      <section className="space-y-4">
        <h3 className="text-lg font-serif text-charcoal">My Teams</h3>

        {myTeams.length === 0 ? (
          <Card className="p-8 border border-gray-100 text-center space-y-2">
            <Users size={32} className="mx-auto text-gray-300" />
            <p className="text-gray-400 text-sm">You haven't joined any teams yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {myTeams.map((team, idx) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-6 border border-gray-100 hover:border-rose/20 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-charcoal">{team.name}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">
                      {team.leaderId === currentUser?.id ? 'Leader' : 'Member'}
                    </span>
                  </div>
                  {team.eventName && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={12} className="text-rose" />
                      {team.eventName}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users size={13} className="text-rose" />
                    <span className="text-xs text-gray-500">{team.members?.length || 0} members</span>
                  </div>
                  {/* Member avatars */}
                  <div className="flex -space-x-2">
                    {(team.members || []).slice(0, 6).map((memberId, i) => (
                      <div
                        key={memberId}
                        className="w-8 h-8 rounded-full bg-rose/10 border-2 border-white flex items-center justify-center text-rose text-xs font-bold"
                      >
                        {memberId === currentUser?.id ? currentUser?.name?.[0] : '?'}
                      </div>
                    ))}
                    {(team.members?.length || 0) > 6 && (
                      <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-400 text-xs font-bold">
                        +{team.members.length - 6}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};