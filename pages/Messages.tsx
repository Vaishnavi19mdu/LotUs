import React, { useState, useEffect } from 'react';
import { Card, Button } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { getMessagesForUser, markMessageRead, Message } from '../services/messages';
import { db } from '../firebase';
import { collection, getDocs, query, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { Mail, Calendar, UserPlus, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MessagesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [addingToTeam, setAddingToTeam] = useState(false);
  const [addedSenders, setAddedSenders] = useState<Set<string>>(new Set());

  const fetchMessages = async () => {
    if (!currentUser) return;
    const msgs = await getMessagesForUser(currentUser.id);
    setMessages(msgs);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, [currentUser]);

  const handleOpen = async (msg: Message) => {
    setSelectedMessage(msg);
    if (!msg.read) {
      await markMessageRead(msg.id);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
    }
  };

  const handleAddToTeam = async (msg: Message) => {
    if (!currentUser || !msg.eventId) return;
    setAddingToTeam(true);
    try {
      // Find current user's team for this event
      const teamsSnap = await getDocs(
        query(
          collection(db, 'teams'),
          where('leaderId', '==', currentUser.id),
          where('eventId', '==', msg.eventId)
        )
      );

      if (teamsSnap.empty) {
        alert("You don't have a team for this event yet. Create one from Teams & Connections first!");
        return;
      }

      const teamDoc = teamsSnap.docs[0];
      const teamData = teamDoc.data();

      if (teamData.members?.includes(msg.senderId)) {
        alert('This person is already in your team!');
        return;
      }
      if ((teamData.members?.length || 0) >= teamData.maxMembers) {
        alert('Your team is already full!');
        return;
      }

      await updateDoc(doc(db, 'teams', teamDoc.id), {
        members: arrayUnion(msg.senderId),
        invites: (teamData.invites || []).filter((id: string) => id !== msg.senderId),
      });

      setAddedSenders(prev => new Set(prev).add(msg.senderId));
      setSelectedMessage(null);
      alert(`Added to your team for ${msg.eventName}! 🌸`);
    } catch (err) {
      console.error(err);
      alert('Failed to add to team.');
    } finally {
      setAddingToTeam(false);
    }
  };

  const unreadCount = messages.filter(m => !m.read).length;

  if (loading) return <div className="text-center py-20 text-gray-400">Loading messages...</div>;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center gap-3">
        <div>
          <h2 className="text-3xl font-serif">Messages</h2>
          <p className="text-gray-400">Team invites and messages from other members.</p>
        </div>
        {unreadCount > 0 && (
          <span className="w-7 h-7 bg-rose rounded-full text-white text-xs font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </header>

      {messages.length === 0 ? (
        <Card className="p-16 border border-gray-100 text-center space-y-3">
          <Mail size={40} className="mx-auto text-gray-200" />
          <p className="text-gray-400">No messages yet.</p>
          <p className="text-xs text-gray-300">When someone invites you to their team, you'll see their message here.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Card
                className={`p-5 border cursor-pointer hover:border-rose/30 hover:shadow-md transition-all ${
                  !msg.read ? 'border-rose/30 bg-rose/5' : 'border-gray-100'
                }`}
                onClick={() => handleOpen(msg)}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-rose/10 border-2 border-rose/20 flex items-center justify-center overflow-hidden shrink-0">
                    {msg.senderAvatar ? (
                      <img src={msg.senderAvatar} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-rose font-bold">{msg.senderName?.[0]?.toUpperCase()}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-charcoal text-sm">
                        {msg.senderName}
                        {!msg.read && (
                          <span className="ml-2 w-2 h-2 bg-rose rounded-full inline-block" />
                        )}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {msg.eventName && (
                      <div className="flex items-center gap-1 text-[10px] text-rose font-bold uppercase tracking-widest mt-0.5">
                        <Calendar size={9} /> {msg.eventName}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{msg.content}</p>
                  </div>

                  <div className="shrink-0">
                    {addedSenders.has(msg.senderId) ? (
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-1 rounded-full">Added ✓</span>
                    ) : (
                      <span className="text-[10px] bg-rose/10 text-rose font-bold px-2 py-1 rounded-full">View →</span>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Message Detail Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMessage(null)}
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
                    {selectedMessage.senderAvatar ? (
                      <img src={selectedMessage.senderAvatar} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-rose font-bold text-lg">{selectedMessage.senderName?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-charcoal">{selectedMessage.senderName}</p>
                    {selectedMessage.eventName && (
                      <p className="text-[10px] text-rose font-bold uppercase tracking-widest">
                        For {selectedMessage.eventName}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedMessage(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={18} />
                </button>
              </div>

              {/* Message content */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <p className="text-sm text-charcoal leading-relaxed">{selectedMessage.content}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {selectedMessage.eventId && !addedSenders.has(selectedMessage.senderId) && (
                  <button
                    onClick={() => handleAddToTeam(selectedMessage)}
                    disabled={addingToTeam}
                    className="flex-1 py-3 rounded-xl bg-rose text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <UserPlus size={14} />
                    {addingToTeam ? 'Adding...' : `Add to Team`}
                  </button>
                )}
                {addedSenders.has(selectedMessage.senderId) && (
                  <div className="flex-1 py-3 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-bold flex items-center justify-center gap-2">
                    <CheckCircle size={14} /> Added to Team!
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};