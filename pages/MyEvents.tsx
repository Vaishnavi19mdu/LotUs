import React, { useState, useEffect } from 'react';
import { Card, Badge } from '../components/UI';
import { getEvents } from '../services/events';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Event } from '../types';

export const MyEventsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents().then(all => {
      const myEvents = all.filter(e =>
        currentUser && e.registeredUserIds.includes(currentUser.id)
      );
      setEvents(myEvents);
      setLoading(false);
    });
  }, [currentUser]);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading your events...</div>;

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-serif">My Events</h2>
        <p className="text-gray-400">Events you've registered for.</p>
      </header>

      {events.length === 0 ? (
        <div className="text-center py-32 space-y-4">
          <AlertCircle size={48} className="mx-auto text-gray-600" />
          <p className="text-2xl font-serif text-gray-400">No events yet</p>
          <p className="text-gray-500 text-sm">Browse events and claim your spot!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((event, idx) => {
            const spotsLeft = event.capacity - event.participantsCount;
            const now = new Date();
            const eventDate = new Date(event.date);
            const isUpcoming = eventDate > now;
            const fillPct = Math.min((event.participantsCount / event.capacity) * 100, 100);

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
              >
                <Card className="p-6 border border-gray-100 hover:border-rose/30 transition-all space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="rose">{event.type}</Badge>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${isUpcoming ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                          {isUpcoming ? 'Upcoming' : 'Started'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-charcoal">{event.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                    </div>
                    <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                      <CheckCircle size={18} className="text-emerald-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={14} className="text-rose" />
                      {eventDate.toLocaleDateString()}
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

                  <div className="pt-3 border-t border-gray-100">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-rose h-2 rounded-full transition-all"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">
                      {Math.round(fillPct)}% capacity filled
                    </p>
                  </div>

                  {event.paymentLink && (
                    <a
                      href={event.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-rose font-bold uppercase tracking-widest hover:underline"
                    >
                      View Payment Link →
                    </a>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};