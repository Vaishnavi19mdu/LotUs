import React, { useState, useEffect } from 'react';
import { Card, Badge } from '../components/UI';
import { getEvents } from '../services/events';
import { getAllUsers } from '../services/users';
import { Users, Calendar, TrendingUp, Award, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export const AnalyticsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isSuperAdmin = currentUser?.role === Role.SUPERADMIN;
    Promise.all([
      getEvents(isSuperAdmin ? undefined : currentUser?.id),
      getAllUsers()
    ]).then(([evs, usrs]) => {
      setEvents(evs);
      setUsers(usrs);
      setLoading(false);
    });
  }, [currentUser]);

  const totalParticipants = events.reduce((acc, e) => acc + (e.participantsCount || 0), 0);
  const upcomingEvents = events.filter(e => new Date(e.date) > new Date()).length;
  const paidEvents = events.filter(e => e.entryType === 'Paid').length;
  const freeEvents = events.filter(e => e.entryType === 'Free' || !e.entryType).length;
  const avgCapacityFilled = events.length > 0
    ? Math.round(events.reduce((acc, e) => acc + ((e.participantsCount / e.capacity) * 100), 0) / events.length)
    : 0;

  const typeBreakdown = events.reduce((acc: any, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <div className="text-center py-20 text-gray-400">Loading analytics...</div>;

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-serif">Analytics</h2>
        <p className="text-gray-400">Real-time insights across your events.</p>
      </header>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Calendar className="text-rose" size={20} />, label: 'Total Events', value: events.length },
          { icon: <Users className="text-rose" size={20} />, label: 'Total Participants', value: totalParticipants },
          { icon: <TrendingUp className="text-rose" size={20} />, label: 'Upcoming Events', value: upcomingEvents },
          { icon: <Award className="text-rose" size={20} />, label: 'Avg Capacity Filled', value: `${avgCapacityFilled}%` },
        ].map((stat, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
            <Card className="p-6 flex items-center gap-4 border border-gray-100">
              <div className="p-3 bg-rose/10 rounded-xl">{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold text-charcoal">{stat.value}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{stat.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Event Type Breakdown */}
        <Card className="p-6 space-y-4 border border-gray-100">
          <h3 className="text-lg font-serif text-charcoal">Events by Type</h3>
          <div className="space-y-3">
            {Object.entries(typeBreakdown).map(([type, count]: any) => {
              const pct = Math.round((count / events.length) * 100);
              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-charcoal">{type}</span>
                    <span className="text-gray-400">{count} event{count > 1 ? 's' : ''} • {pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="bg-rose h-2 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Entry Fee Breakdown */}
        <Card className="p-6 space-y-4 border border-gray-100">
          <h3 className="text-lg font-serif text-charcoal">Entry Fee Distribution</h3>
          <div className="flex items-center justify-center gap-12 py-6">
            <div className="text-center space-y-2">
              <div className="w-24 h-24 rounded-full bg-rose/10 border-4 border-rose flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-rose">{freeEvents}</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Free</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-24 h-24 rounded-full bg-emerald-50 border-4 border-emerald-400 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-emerald-500">{paidEvents}</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Paid</p>
            </div>
          </div>
        </Card>

        {/* Event Capacity Table */}
        <Card className="p-6 space-y-4 border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-serif text-charcoal">Event Capacity Overview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Event</th>
                  <th className="text-left py-3 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Type</th>
                  <th className="text-left py-3 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Registered</th>
                  <th className="text-left py-3 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Capacity</th>
                  <th className="text-left py-3 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Fill Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {events.map(event => {
                  const fillRate = Math.round((event.participantsCount / event.capacity) * 100);
                  return (
                    <tr key={event.id} className="hover:bg-rose/5 transition-colors">
                      <td className="py-3 font-bold text-charcoal">{event.name}</td>
                      <td className="py-3"><Badge variant="rose">{event.type}</Badge></td>
                      <td className="py-3 text-gray-500">{event.participantsCount}</td>
                      <td className="py-3 text-gray-500">{event.capacity}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-rose h-1.5 rounded-full" style={{ width: `${Math.min(fillRate, 100)}%` }} />
                          </div>
                          <span className={`text-xs font-bold ${fillRate > 80 ? 'text-rose' : 'text-gray-400'}`}>{fillRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};