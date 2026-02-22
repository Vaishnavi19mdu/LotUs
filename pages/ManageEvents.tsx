import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '../components/UI';
import { getEvents } from '../services/events';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Trash2, Clock, CreditCard, Gift, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export const ManageEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const isSuperAdmin = currentUser?.role === Role.SUPERADMIN;
    getEvents(isSuperAdmin ? undefined : currentUser?.id).then(data => {
      setEvents(data);
      setLoading(false);
    });
  }, [currentUser]);

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    setDeleting(eventId);
    await deleteDoc(doc(db, 'events', eventId));
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setDeleting(null);
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading events...</div>;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif">Manage Events</h2>
          <p className="text-gray-400">View and manage your events.</p>
        </div>
        <Button onClick={() => navigate('/dashboard/create-event')} className="gap-2">
          + Create New Event
        </Button>
      </header>

      {events.length === 0 ? (
        <div className="text-center py-32 space-y-4">
          <p className="text-3xl font-serif">No events yet</p>
          <p className="text-gray-500">Create your first event to get started.</p>
          <Button onClick={() => navigate('/dashboard/create-event')}>Create Event</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {events.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-6 border border-gray-100 hover:border-rose/20 transition-all space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="rose">{event.type}</Badge>
                        {event.entryType === 'Paid' ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            <CreditCard size={10} /> Paid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                            <Gift size={10} /> Free
                          </span>
                        )}
                        {event.participationType && (
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            <UserIcon size={10} /> {event.participationType}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-charcoal">{event.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deleting === event.id}
                      className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={14} className="text-rose" />
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={14} className="text-rose" />
                      Deadline: {new Date(event.registrationDeadline).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin size={14} className="text-rose" />
                      {event.venue || 'Online'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users size={14} className="text-rose" />
                      {event.participantsCount} / {event.capacity} registered
                    </div>
                  </div>

                  {/* Capacity bar */}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-rose h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((event.participantsCount / event.capacity) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                        {Math.round((event.participantsCount / event.capacity) * 100)}% capacity filled
                      </p>
                      {/* VIEW PARTICIPANTS BUTTON */}
                      <button
                        onClick={() => navigate(`/dashboard/event-participants/${event.id}`, { state: { event } })}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-rose hover:text-white hover:bg-rose bg-rose/10 px-3 py-1.5 rounded-full transition-all uppercase tracking-widest"
                      >
                        <Users size={11} />
                        View Participants
                      </button>
                    </div>
                  </div>

                  {event.paymentLink && (
                    <a
                      href={event.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-rose font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                      <CreditCard size={10} /> View Payment Link
                    </a>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};