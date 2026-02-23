import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, Input, BackButton } from '../components/UI';
import { Event, EventType, Role } from '../types';
import { getEvents, registerForEvent, unregisterForEvent } from '../services/events';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, Calendar, MapPin, Users, Clock, AlertCircle, CheckCircle } from 'lucide-react';

export const BrowseEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Upcoming' | 'Ongoing'>('All');

  useEffect(() => {
    getEvents().then(setEvents);
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'All' || event.type === typeFilter;
      const now = new Date();
      const eventDate = new Date(event.date);
      const isUpcoming = eventDate > now;
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'Upcoming' ? isUpcoming : !isUpcoming);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [events, searchQuery, typeFilter, statusFilter]);

  const handleRegister = async (eventId: string) => {
    if (!currentUser) { navigate('/login'); return; }
    try {
      await registerForEvent(
        eventId,
        currentUser.id,
        currentUser.name,
        currentUser.avatar
      );
      setEvents(prev => prev.map(e => e.id === eventId ? {
        ...e,
        participantsCount: e.participantsCount + 1,
        registeredUserIds: [...e.registeredUserIds, currentUser.id]
      } : e));
      alert('Registration Successful! Welcome to the garden. 🌸');
    } catch (err) {
      alert('Registration failed. Please try again.');
    }
  };

  const handleUnregister = async (eventId: string) => {
    if (!currentUser) return;
    if (!confirm('Are you sure you want to unregister?')) return;
    try {
      await unregisterForEvent(eventId, currentUser.id);
      setEvents(prev => prev.map(e => e.id === eventId ? {
        ...e,
        participantsCount: Math.max(0, e.participantsCount - 1),
        registeredUserIds: e.registeredUserIds.filter(id => id !== currentUser.id)
      } : e));
    } catch {
      alert('Failed to unregister. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-charcoal text-cream overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
        <header className="space-y-6">
          <BackButton to="/" />
          <div className="max-w-3xl">
            <h2 className="text-5xl font-serif mb-4 leading-tight">Explore the Garden</h2>
            <p className="text-gray-400 text-xl leading-relaxed">
              Discover active hackathons, global summits, and niche workshops.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end bg-gray-900/40 p-6 rounded-3xl border border-gray-800">
          <div className="md:col-span-2 space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Search Events</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <Input placeholder="Search by name or description..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 bg-charcoal border-gray-800 text-cream" />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Event Type</label>
            <select className="w-full px-4 py-3 bg-charcoal border border-gray-800 rounded-xl text-sm text-cream outline-none focus:ring-2 focus:ring-rose appearance-none cursor-pointer" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option>All</option>
              {Object.values(EventType).map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Status</label>
            <select className="w-full px-4 py-3 bg-charcoal border border-gray-800 rounded-xl text-sm text-cream outline-none focus:ring-2 focus:ring-rose appearance-none cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              <option value="All">All Events</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event, idx) => (
              <motion.div key={event.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <EventDiscoveryCard
                  event={event}
                  onRegister={() => handleRegister(event.id)}
                  onUnregister={() => handleUnregister(event.id)}
                  currentUser={currentUser}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
            <div className="p-10 bg-gray-900/50 rounded-full text-gray-600"><AlertCircle size={64} /></div>
            <div className="space-y-2">
              <h3 className="text-3xl font-serif">A Quiet Garden</h3>
              <p className="text-gray-500 max-w-sm mx-auto">No events match your filters.</p>
            </div>
            <Button variant="ghost" onClick={() => { setSearchQuery(''); setTypeFilter('All'); setStatusFilter('All'); }}>Reset All Filters</Button>
          </div>
        )}
      </div>
    </div>
  );
};

const EventDiscoveryCard: React.FC<{ event: Event; onRegister: () => void; onUnregister: () => void; currentUser: any }> = ({ event, onRegister, onUnregister, currentUser }) => {
  const navigate = useNavigate();
  const isAdminOrSuper = currentUser?.role === Role.ADMIN || currentUser?.role === Role.SUPERADMIN;
  const isRegistered = currentUser && event.registeredUserIds.includes(currentUser.id);
  const spotsLeft = event.capacity - event.participantsCount;
  const deadlinePassed = new Date(event.registrationDeadline) < new Date();
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const distance = new Date(event.date).getTime() - new Date().getTime();
      if (distance < 0) { setTimeLeft('Started'); clearInterval(timer); return; }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    }, 1000);
    return () => clearInterval(timer);
  }, [event.date]);

  return (
    <Card className="h-full flex flex-col p-8 border border-rose/10 bg-cream-pink hover:shadow-2xl hover:border-rose/30 transition-all group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
      <div className="flex justify-between items-start mb-6 relative z-10">
        <Badge variant="rose">{event.type}</Badge>
        <div className="flex items-center gap-1.5 text-rose font-bold text-xs bg-rose/10 px-3 py-1.5 rounded-full">
          <Clock size={12} /> {timeLeft}
        </div>
      </div>
      <div className="flex-1 space-y-6 relative z-10">
        <h3 className="text-3xl font-serif text-charcoal group-hover:text-rose transition-colors leading-tight">{event.name}</h3>
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{event.description}</p>
        <div className="grid grid-cols-2 gap-y-4 gap-x-6 pt-4">
          <div className="flex items-center gap-3 text-rose font-medium text-xs opacity-80">
            <div className="p-1.5 bg-rose/10 rounded-lg"><Calendar size={14} /></div>
            {new Date(event.date).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-3 text-rose font-medium text-xs opacity-80">
            <div className="p-1.5 bg-rose/10 rounded-lg"><MapPin size={14} /></div>
            {event.venue}
          </div>
          <div className="flex items-center gap-3 text-rose font-medium text-xs opacity-80">
            <div className="p-1.5 bg-rose/10 rounded-lg"><Users size={14} /></div>
            Teams: {event.maxTeamSize} Max
          </div>
          <div className={`flex items-center gap-3 text-xs font-bold ${spotsLeft < 10 ? 'text-rose' : 'text-rose opacity-80'}`}>
            <div className="p-1.5 bg-rose/10 rounded-lg"><AlertCircle size={14} /></div>
            {spotsLeft > 0 ? `${spotsLeft} Spots Left` : 'Full'}
          </div>
        </div>
      </div>
      <div className="mt-8 pt-8 border-t border-rose/10 flex items-center justify-between relative z-10">
        {!currentUser ? (
          <Button fullWidth onClick={() => navigate('/login')} variant="outline" className="py-4 border-rose/30 text-rose">
            Login to Register
          </Button>
        ) : isAdminOrSuper ? (
          <Button fullWidth onClick={() => navigate('/dashboard/manage-events')} className="py-4">
            Manage Event
          </Button>
        ) : isRegistered ? (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-center gap-2 py-3 bg-green-500/10 text-green-600 rounded-full font-bold text-sm border border-green-500/20">
              <CheckCircle size={18} /> You are Registered
            </div>
            <button
              onClick={onUnregister}
              className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-400 transition-colors py-1"
            >
              Unregister
            </button>
          </div>
        ) : (
          <Button
            fullWidth
            onClick={onRegister}
            disabled={spotsLeft <= 0 || deadlinePassed}
            variant={deadlinePassed ? 'ghost' : 'primary'}
            className="py-4 shadow-xl shadow-rose/10"
          >
            {deadlinePassed ? 'Registration Closed' : spotsLeft <= 0 ? 'Capacity Reached' : 'Claim Your Spot'}
          </Button>
        )}
      </div>
    </Card>
  );
};