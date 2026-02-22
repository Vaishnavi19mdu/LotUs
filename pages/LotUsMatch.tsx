import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button, Input } from '../components/UI';
import { ScoreCircle } from '../components/Icons';
import { Sparkles, UserPlus, Search, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers } from '../services/users';
import { getEvents } from '../services/events';
import { computeMatchScore, getWhyMatch } from '../services/match';
import { User, Role, Event, EventType } from '../types';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export const LotUsMatchPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedEventType, setSelectedEventType] = useState<EventType | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAllUsers(), getEvents()]).then(([allUsers, allEvents]) => {
      // Only show participants — filter out Admin and SuperAdmin
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
      }
      setLoading(false);
    });
  }, [currentUser]);

  const handleEventSelect = (event: Event) => {
    setSelectedEventId(event.id);
    setSelectedEventType(event.type as EventType);
  };

  // Recompute scores whenever selected event type changes
  const suggestedTeammates = users
    .map(u => ({
      ...u,
      matchScore: currentUser ? computeMatchScore(currentUser, u, selectedEventType) : 0,
      whyMatch: currentUser ? getWhyMatch(currentUser, u, selectedEventType) : ''
    }))
    .filter(u => !searchQuery || u.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
    .sort((a, b) => b.matchScore - a.matchScore);

  const handleInvite = async (invitedUser: User) => {
    if (!currentUser || !selectedEventId) return;
    setInviting(invitedUser.id);
    try {
      const teamsSnap = await getDocs(
        query(
          collection(db, 'teams'),
          where('leaderId', '==', currentUser.id),
          where('eventId', '==', selectedEventId)
        )
      );

      if (teamsSnap.empty) {
        await addDoc(collection(db, 'teams'), {
          name: `${currentUser.name}'s Team`,
          eventId: selectedEventId,
          leaderId: currentUser.id,
          members: [currentUser.id],
          invites: [invitedUser.id],
          createdAt: new Date().toISOString()
        });
      } else {
        const teamDoc = teamsSnap.docs[0];
        const teamData = teamDoc.data();
        if (teamData.invites?.includes(invitedUser.id) || teamData.members?.includes(invitedUser.id)) {
          alert(`${invitedUser.name} is already invited or in your team!`);
          return;
        }
        await teamDoc.ref.update({
          invites: [...(teamData.invites || []), invitedUser.id]
        });
      }
      alert(`Invite sent to ${invitedUser.name}! 🌸`);
    } catch {
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
                      <img
                        src={user.avatar || `https://picsum.photos/seed/${user.id}/100`}
                        className="w-20 h-20 rounded-full border-2 border-rose/20 shadow-lg object-cover"
                        alt=""
                      />
                      <div className="absolute -bottom-1 -right-1 bg-rose text-white p-1 rounded-full">
                        <Sparkles size={12} />
                      </div>
                    </div>
                    <ScoreCircle score={user.matchScore} size={70} />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-xl font-bold text-charcoal">{user.name}</h4>
                      <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">"{user.bio}"</p>
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
                        disabled={inviting === user.id || !selectedEventId}
                        onClick={() => handleInvite(user)}
                      >
                        <UserPlus size={16} />
                        {inviting === user.id ? 'Inviting...' : 'Invite to Team'}
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
    </div>
  );
};