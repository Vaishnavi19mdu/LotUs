import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '../components/UI';
import { Role } from '../types';
import { ScoreCircle } from '../components/Icons';
import { ArrowRight, Calendar, Users, BarChart3, Clock, Bell, PlusCircle, Sparkles, X, MapPin, CreditCard, Gift, User as UserIcon, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEvents } from '../services/events';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === Role.ADMIN || currentUser?.role === Role.SUPERADMIN;
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [myTeamsCount, setMyTeamsCount] = useState(0);
  const [engagementScore, setEngagementScore] = useState(0);

  useEffect(() => {
    getEvents().then(evts => {
      setEvents(evts);
      if (currentUser) {
        // Engagement = mix of: registered events, profile completeness, teams
        const registeredCount = evts.filter(e => e.registeredUserIds?.includes(currentUser.id)).length;
        const hasAvatar = (currentUser as any).avatar ? 10 : 0;
        const hasBio = (currentUser as any).bio ? 10 : 0;
        const hasSkills = ((currentUser as any).skills?.length || 0) > 0 ? 15 : 0;
        const hasInterests = ((currentUser as any).interests?.length || 0) > 0 ? 10 : 0;
        const eventScore = Math.min(registeredCount * 15, 40);
        const base = 15; // base for just being here
        const score = Math.min(base + hasAvatar + hasBio + hasSkills + hasInterests + eventScore, 100);
        setEngagementScore(score);
      }
    });
    // Fetch real team count + engagement score
    if (currentUser) {
      getDocs(collection(db, 'teams')).then(snap => {
        const count = snap.docs.filter(d => d.data().members?.includes(currentUser.id)).length;
        setMyTeamsCount(count);
      });
    }
    // Fetch real announcements
    getDocs(query(collection(db, 'announcements'), orderBy('date', 'desc'), limit(3)))
      .then(snap => setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const myRegisteredEvents = events.filter(e => e.registeredUserIds?.includes(currentUser?.id)).length;
  const totalParticipants = events.reduce((acc, e) => acc + (e.participantsCount || 0), 0);
  const upcomingDeadlines = events.filter(e => new Date(e.registrationDeadline) > new Date()).length;

  const handleDownloadReport = () => {
    const lines = [
      'LotUs Platform — Event Health Report',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      `Total Events: ${events.length}`,
      `Total Participants: ${totalParticipants}`,
      `Upcoming Events: ${events.filter(e => new Date(e.date) > new Date()).length}`,
      `Avg Capacity Filled: ${events.length > 0 ? Math.round(events.reduce((a, e) => a + (e.participantsCount / e.capacity) * 100, 0) / events.length) : 0}%`,
      '',
      'EVENT BREAKDOWN',
      '---------------',
      ...events.map(e =>
        `${e.name} | ${e.type} | ${e.participantsCount}/${e.capacity} registered | ${new Date(e.date).toLocaleDateString()}`
      )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lotus-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 flex flex-col sm:flex-row items-center justify-between p-8 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-64 h-64 bg-rose/5 rounded-full -mr-20 -mt-20" />
          <div className="space-y-4 relative z-10 text-center sm:text-left">
            <Badge variant="rose">{isAdmin ? 'Admin Console' : 'Participant Hub'}</Badge>
            <h2 className="text-3xl font-serif">
              {isAdmin ? 'Ready to grow your garden?' : `Welcome back, ${currentUser?.name?.split(' ')[0] || 'friend'}.`}
            </h2>
            <p className="text-gray-500 max-w-md">
              {isAdmin
                ? 'Create and manage your events with intelligent analysis of participant synergy.'
                : 'Browse upcoming events and use LotUs Match to find the perfect teammates.'}
            </p>
            <div className="flex gap-3">
              <Button size="sm" onClick={() => navigate(isAdmin ? '/dashboard/create-event' : '/dashboard/browse')}>
                {isAdmin ? 'Create New Event' : 'Explore Events'}
              </Button>
              {!isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/lotus-match')}>
                  LotUs Match
                </Button>
              )}
            </div>
          </div>
          <div className="mt-8 sm:mt-0 flex flex-col items-center gap-2 relative z-10">
            <ScoreCircle score={engagementScore} size={120} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Platform Engagement</p>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          <StatCard
            icon={isAdmin ? <PlusCircle className="text-rose" /> : <Calendar className="text-rose" />}
            label={isAdmin ? 'Total Events' : 'My Registered Events'}
            value={isAdmin ? events.length : myRegisteredEvents}
          />
          <StatCard
            icon={isAdmin ? <Users className="text-rose" /> : <Sparkles className="text-rose" />}
            label={isAdmin ? 'Total Participants' : 'Team Matches'}
            value={isAdmin ? totalParticipants : myTeamsCount}
          />
          <StatCard
            icon={<Clock className="text-rose" />}
            label="Upcoming Deadlines"
            value={upcomingDeadlines}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif">{isAdmin ? 'Active Events' : 'Recommended for You'}</h3>
            <button
              className="text-xs font-bold uppercase tracking-widest text-rose hover:underline"
              onClick={() => navigate(isAdmin ? '/dashboard/manage-events' : '/dashboard/browse')}
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.slice(0, 4).map(event => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-xl font-serif">Notifications</h3>
          <Card className="p-0 overflow-hidden divide-y divide-gray-100">
            {announcements.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">No announcements yet.</div>
            ) : (
              announcements.map(a => (
                <div
                  key={a.id}
                  className="p-4 hover:bg-rose/5 transition-colors cursor-pointer group"
                  onClick={() => navigate('/dashboard/announcements')}
                >
                  <div className="flex gap-3">
                    <div className="p-2 bg-rose/10 rounded-lg h-fit group-hover:bg-rose group-hover:text-white transition-colors">
                      <Bell size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-charcoal">{a.title}</p>
                      <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{a.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </Card>

          {isAdmin && (
            <Card className="bg-charcoal text-white p-6 space-y-4">
              <BarChart3 className="text-rose" size={24} />
              <h4 className="font-bold">Event Health Overview</h4>
              <p className="text-xs text-gray-400">
                {totalParticipants} total participants across {events.length} events.
              </p>
              <Button fullWidth variant="primary" size="sm" onClick={handleDownloadReport} className="gap-2">
                <Download size={14} /> Download Report
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            isAdmin={isAdmin}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Event Detail Modal ───────────────────────────────────────────────────────
const EventDetailModal: React.FC<{ event: any; isAdmin: boolean; onClose: () => void }> = ({ event, isAdmin, onClose }) => {
  const { currentUser } = useAuth();
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const isRegistered = currentUser && event.registeredUserIds?.includes(currentUser.id);
  const spotsLeft = event.capacity - event.participantsCount;
  const fillPct = Math.min((event.participantsCount / event.capacity) * 100, 100);

  useEffect(() => {
    if (!isAdmin || !event.registeredUserIds?.length) return;
    setLoadingUsers(true);
    Promise.all(
      event.registeredUserIds.map((uid: string) =>
        getDoc(doc(db, 'users', uid)).then(s => s.exists() ? { id: s.id, ...s.data() } : null)
      )
    ).then(users => {
      setRegisteredUsers(users.filter(Boolean));
      setLoadingUsers(false);
    });
  }, [event, isAdmin]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
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
              <h2 className="text-2xl font-bold text-charcoal">{event.name}</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all shrink-0">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Description */}
          <p className="text-gray-600 leading-relaxed">{event.description}</p>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Calendar size={16} className="text-rose" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Event Date</p>
                <p className="text-sm font-bold text-charcoal">{new Date(event.date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Clock size={16} className="text-rose" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Deadline</p>
                <p className="text-sm font-bold text-charcoal">{new Date(event.registrationDeadline).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <MapPin size={16} className="text-rose" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Venue</p>
                <p className="text-sm font-bold text-charcoal">{event.venue || 'Online'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Users size={16} className="text-rose" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Capacity</p>
                <p className="text-sm font-bold text-charcoal">{event.participantsCount} / {event.capacity}</p>
              </div>
            </div>
          </div>

          {/* Capacity Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-bold">{spotsLeft} spots left</span>
              <span className="text-rose font-bold">{Math.round(fillPct)}% filled</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div className="bg-rose h-2.5 rounded-full transition-all" style={{ width: `${fillPct}%` }} />
            </div>
          </div>

          {/* Online link */}
          {event.onlineLink && (
            <a href={event.onlineLink} target="_blank" rel="noopener noreferrer"
              className="text-xs text-rose font-bold uppercase tracking-widest hover:underline">
              Join Online →
            </a>
          )}

          {/* Registered Users — Admin only */}
          {isAdmin && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-lg text-charcoal">
                  Registered Participants
                  <span className="ml-2 text-sm text-rose font-bold">({event.participantsCount})</span>
                </h4>
              </div>

              {loadingUsers ? (
                <p className="text-sm text-gray-400">Loading participants...</p>
              ) : registeredUsers.length === 0 ? (
                <p className="text-sm text-gray-400">No participants yet.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {registeredUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-rose/5 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-rose/10 border-2 border-rose/20 flex items-center justify-center overflow-hidden shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-rose font-bold text-sm">{user.name?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-charcoal truncate">{user.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                      </div>
                      {user.skills?.length > 0 && (
                        <div className="flex gap-1 shrink-0">
                          {user.skills.slice(0, 2).map((s: string) => (
                            <span key={s} className="text-[9px] bg-rose/10 text-rose px-1.5 py-0.5 rounded-full font-bold">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Participant status */}
          {!isAdmin && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold ${isRegistered ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'}`}>
              {isRegistered ? '✅ You are registered for this event!' : '📌 You have not registered for this event yet.'}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <Card className="flex items-center gap-4 py-4 px-6 border border-gray-100">
    <div className="p-2.5 bg-rose/10 rounded-xl">{icon}</div>
    <div>
      <p className="text-xl font-bold text-charcoal">{value}</p>
      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{label}</p>
    </div>
  </Card>
);

const EventCard: React.FC<{ event: any; onClick: () => void }> = ({ event, onClick }) => (
  <Card
    className="p-5 border border-gray-100 group cursor-pointer hover:border-rose/30 hover:shadow-lg transition-all"
    onClick={onClick}
  >
    <div className="flex justify-between items-start mb-4">
      <Badge variant="rose">{event.type}</Badge>
      <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
        <Clock size={10} /> {new Date(event.date).toLocaleDateString()}
      </span>
    </div>
    <h4 className="font-bold text-charcoal group-hover:text-rose transition-colors mb-2">{event.name}</h4>
    <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">{event.description}</p>
    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
      <div className="flex items-center gap-1">
        <Users size={12} className="text-gray-400" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{event.participantsCount} Registered</span>
      </div>
      <span className="text-xs text-rose font-bold flex items-center gap-1">View <ArrowRight size={12} /></span>
    </div>
  </Card>
);