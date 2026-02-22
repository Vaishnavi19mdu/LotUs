import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getEvents } from '../services/events';
import {
  Users, ArrowLeft, Calendar, MapPin, Clock,
  Mail, Briefcase, Star, Tag, X, Phone, User as UserIcon
} from 'lucide-react';
import { Card, Badge } from '../components/UI';
import { motion, AnimatePresence } from 'framer-motion';

export const EventParticipantsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [event, setEvent] = useState<any>(location.state?.event || null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    if (!event && eventId) {
      getEvents().then(events => {
        const found = events.find(e => e.id === eventId);
        setEvent(found || null);
      });
    }
  }, [eventId]);

  useEffect(() => {
    if (!event) return;
    const ids: string[] = event.registeredUserIds || [];
    if (!ids.length) { setLoading(false); return; }

    Promise.all(ids.map(async (uid: string) => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        return snap.exists() ? { id: snap.id, ...snap.data() } : { id: uid, name: 'Unknown', email: uid, skills: [], interests: [] };
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    })).then(r => { setParticipants(r.filter(Boolean)); setLoading(false); });
  }, [event]);

  const spotsLeft = event ? event.capacity - event.participantsCount : 0;
  const fillPct = event ? Math.min((event.participantsCount / event.capacity) * 100, 100) : 0;

  return (
    <div className="flex gap-6 pb-20">
      {/* Main content */}
      <div className={`space-y-8 transition-all duration-300 ${selectedUser ? 'flex-1 min-w-0' : 'w-full'}`}>
        <button
          onClick={() => navigate('/dashboard/manage-events')}
          className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-rose transition-colors uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Back to Manage Events
        </button>

        {event && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 flex-wrap">
              <Badge variant="rose">{event.type}</Badge>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${new Date(event.date) > new Date() ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                {new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
              </span>
            </div>
            <h2 className="text-3xl font-serif">{event.name}</h2>
            <p className="text-gray-500">{event.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-rose" />{new Date(event.date).toLocaleDateString()}</span>
              <span className="flex items-center gap-1.5"><MapPin size={14} className="text-rose" />{event.venue || 'Online'}</span>
              <span className="flex items-center gap-1.5"><Clock size={14} className="text-rose" />Deadline: {new Date(event.registrationDeadline).toLocaleDateString()}</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-rose/5 rounded-2xl text-center border border-rose/10">
                <p className="text-2xl font-bold text-rose">{event.participantsCount}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">Registered</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl text-center border border-gray-100">
                <p className="text-2xl font-bold text-charcoal">{spotsLeft}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">Spots Left</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl text-center border border-gray-100">
                <p className="text-2xl font-bold text-charcoal">{Math.round(fillPct)}%</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">Filled</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div className="bg-rose h-2.5 rounded-full" style={{ width: `${fillPct}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-sm text-red-600 font-bold">
            Firebase error: {error}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-xl font-serif">
            Registered Participants
            <span className="ml-2 text-rose text-base">({participants.length})</span>
          </h3>

          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading participants...</div>
          ) : participants.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <Users size={48} className="mx-auto text-gray-200" />
              <p className="text-xl font-serif text-gray-400">No participants yet</p>
              <p className="text-xs font-mono text-gray-300">IDs: {event?.registeredUserIds?.join(', ') || 'none'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {participants.map((user, idx) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card
                    className={`p-5 border transition-all cursor-pointer hover:shadow-md ${selectedUser?.id === user.id ? 'border-rose/40 bg-rose/5' : 'border-gray-100 hover:border-rose/20'}`}
                    onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-rose/10 border-2 border-rose/20 flex items-center justify-center overflow-hidden shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-rose font-bold text-lg">{user.name?.[0]?.toUpperCase()}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-charcoal truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                          <Mail size={10} /> {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Phone size={10} /> {user.phone}
                          </p>
                        )}
                      </div>

                      {/* Role + gender */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[9px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                          {user.role || 'participant'}
                        </span>
                        {user.gender && (
                          <span className="text-[9px] font-bold uppercase tracking-widest bg-violet-50 text-violet-500 px-2 py-1 rounded-full">
                            {user.gender}
                          </span>
                        )}
                      </div>

                      {/* View Profile button */}
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedUser(selectedUser?.id === user.id ? null : user); }}
                        className={`ml-2 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-all shrink-0 ${selectedUser?.id === user.id ? 'bg-rose text-white' : 'bg-rose/10 text-rose hover:bg-rose hover:text-white'}`}
                      >
                        {selectedUser?.id === user.id ? 'Close' : 'View Profile'}
                      </button>
                    </div>

                    {/* Skill pills always visible */}
                    {user.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3 pl-16">
                        {user.skills.slice(0, 4).map((s: string) => (
                          <span key={s} className="text-[10px] bg-rose/10 text-rose px-2 py-0.5 rounded-full font-bold">{s}</span>
                        ))}
                        {user.skills.length > 4 && (
                          <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">+{user.skills.length - 4}</span>
                        )}
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slide-in Profile Panel */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0, x: 40, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 340 }}
            exit={{ opacity: 0, x: 40, width: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="w-[340px] bg-white rounded-3xl border border-gray-100 shadow-xl overflow-y-auto max-h-[calc(100vh-8rem)] sticky top-8">
              {/* Header */}
              <div className="bg-gradient-to-br from-rose/5 to-violet-50 p-6 space-y-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-white border-2 border-rose/20 shadow flex items-center justify-center overflow-hidden">
                      {selectedUser.avatar ? (
                        <img src={selectedUser.avatar} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-rose font-bold text-2xl">{selectedUser.name?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-charcoal">{selectedUser.name}</h3>
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-rose/10 text-rose px-2 py-0.5 rounded-full">
                        {selectedUser.role || 'participant'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-xl hover:bg-white/80 text-gray-400">
                    <X size={16} />
                  </button>
                </div>

                {selectedUser.bio && (
                  <p className="text-xs text-gray-600 italic leading-relaxed bg-white/60 rounded-xl p-3">
                    "{selectedUser.bio}"
                  </p>
                )}
              </div>

              <div className="p-6 space-y-5">
                {/* Contact info */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Contact</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Mail size={12} className="text-rose shrink-0" /> {selectedUser.email}
                    </div>
                    {selectedUser.phone && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone size={12} className="text-rose shrink-0" /> {selectedUser.phone}
                      </div>
                    )}
                    {selectedUser.gender && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <UserIcon size={12} className="text-rose shrink-0" /> {selectedUser.gender}
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills */}
                {selectedUser.skills?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                      <Briefcase size={10} /> Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUser.skills.map((s: string) => (
                        <span key={s} className="text-xs bg-rose/10 text-rose px-2.5 py-1 rounded-full font-bold">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {selectedUser.interests?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                      <Star size={10} /> Interests
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUser.interests.map((i: string) => (
                        <span key={i} className="text-xs bg-violet-50 text-violet-600 px-2.5 py-1 rounded-full">{i}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedUser.tags?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                      <Tag size={10} /> Tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUser.tags.map((t: string) => (
                        <span key={t} className="text-xs bg-blue-50 text-blue-500 px-2.5 py-1 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {!selectedUser.skills?.length && !selectedUser.interests?.length && !selectedUser.bio && (
                  <p className="text-sm text-gray-400 text-center py-4">No profile info filled out yet.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};