import React, { useState, useEffect } from 'react';
import { Card, Badge } from '../components/UI';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getEvents } from '../services/events';
import { useAuth } from '../context/AuthContext';
import { Role, User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Gem, Flame, Star, Award, Users, Calendar, ChevronDown, ChevronUp, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface GemUser {
  id: string;
  name: string;
  email: string;
  bio: string;
  skills: string[];
  interests: string[];
  tags: string[];
  avatar?: string;
  role: string;
  // computed
  eventsJoined: number;
  teamInvitesReceived: number;
  teamInvitesSent: number;
  skillDepth: number;
  gemScore: number;
  gemType: GemType[];
}

type GemType = 'hidden_gem' | 'silent_grinder' | 'unsung_hero';

const GEM_META: Record<GemType, { label: string; color: string; bg: string; icon: React.ReactNode; desc: string }> = {
  hidden_gem: {
    label: 'Hidden Gem',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    icon: <Gem size={13} />,
    desc: 'Strong skills but rarely in the spotlight'
  },
  silent_grinder: {
    label: 'Silent Grinder',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    icon: <Flame size={13} />,
    desc: 'Consistently registers & shows up quietly'
  },
  unsung_hero: {
    label: 'Unsung Hero',
    color: 'text-rose',
    bg: 'bg-rose/10',
    icon: <Star size={13} />,
    desc: 'Great profile but never gets invited to teams'
  }
};

// ─── Score & classify ─────────────────────────────────────────────────────────
const computeGemScore = (
  user: any,
  eventsJoined: number,
  teamInvitesReceived: number,
  totalEvents: number
): { score: number; types: GemType[] } => {
  const types: GemType[] = [];
  let score = 0;

  const skillDepth = user.skills?.length || 0;
  const hasRichProfile = skillDepth >= 3 && (user.interests?.length || 0) >= 2 && user.bio;

  // Hidden Gem: strong skills but low team invites relative to skill depth
  if (skillDepth >= 3 && teamInvitesReceived <= 1) {
    types.push('hidden_gem');
    score += 40;
  }

  // Silent Grinder: joined multiple events but low social footprint
  if (eventsJoined >= 2 && teamInvitesReceived <= 1) {
    types.push('silent_grinder');
    score += eventsJoined * 15;
  }

  // Unsung Hero: rich profile + joined events but barely invited
  if (hasRichProfile && eventsJoined >= 1 && teamInvitesReceived === 0) {
    types.push('unsung_hero');
    score += 35;
  }

  // Bonus for skill depth
  score += Math.min(skillDepth * 3, 15);

  // Bonus for consistency (multiple events)
  score += Math.min(eventsJoined * 5, 20);

  return { score: Math.min(score, 100), types };
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export const HiddenGemsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === Role.SUPERADMIN;
  const isAdmin = currentUser?.role === Role.ADMIN || isSuperAdmin;

  const [gems, setGems] = useState<GemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<GemType | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<GemUser | null>(null);

  useEffect(() => {
    const load = async () => {
      const [usersSnap, events, teamsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getEvents(),
        getDocs(collection(db, 'teams'))
      ]);

      const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const allTeams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

      // Only participants
      const participants = allUsers.filter(u =>
        u.role !== Role.ADMIN && u.role !== Role.SUPERADMIN
      );

      const gemUsers: GemUser[] = participants.map(user => {
        const eventsJoined = events.filter(e =>
          e.registeredUserIds?.includes(user.id)
        ).length;

        const teamInvitesReceived = allTeams.filter(t =>
          t.invites?.includes(user.id) || t.members?.includes(user.id)
        ).length;

        const teamInvitesSent = allTeams.filter(t =>
          t.leaderId === user.id
        ).length;

        const skillDepth = user.skills?.length || 0;

        const { score, types } = computeGemScore(
          user, eventsJoined, teamInvitesReceived, events.length
        );

        return {
          ...user,
          eventsJoined,
          teamInvitesReceived,
          teamInvitesSent,
          skillDepth,
          gemScore: score,
          gemType: types
        };
      }).filter(u => u.gemType.length > 0) // only those who qualify
        .sort((a, b) => b.gemScore - a.gemScore);

      setGems(gemUsers);
      setLoading(false);
    };

    load();
  }, []);

  const filtered = filter === 'all'
    ? gems
    : gems.filter(g => g.gemType.includes(filter));

  const counts = {
    all: gems.length,
    hidden_gem: gems.filter(g => g.gemType.includes('hidden_gem')).length,
    silent_grinder: gems.filter(g => g.gemType.includes('silent_grinder')).length,
    unsung_hero: gems.filter(g => g.gemType.includes('unsung_hero')).length,
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
        <Gem size={48} className="text-gray-300" />
        <h2 className="text-2xl font-serif text-gray-400">Admins only</h2>
        <p className="text-gray-500 text-sm">This page is only visible to admins and superadmins.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-50 rounded-2xl">
            <Gem size={24} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-3xl font-serif">Hidden Gems</h2>
            <p className="text-gray-400">Participants doing great work quietly — they deserve a spotlight.</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-2">
          {(Object.entries(GEM_META) as [GemType, typeof GEM_META[GemType]][]).map(([key, meta]) => (
            <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${meta.bg} ${meta.color}`}>
              {meta.icon} {meta.label} — {meta.desc}
            </div>
          ))}
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'all', label: `All (${counts.all})` },
          { key: 'hidden_gem', label: `Hidden Gems (${counts.hidden_gem})` },
          { key: 'silent_grinder', label: `Silent Grinders (${counts.silent_grinder})` },
          { key: 'unsung_hero', label: `Unsung Heroes (${counts.unsung_hero})` },
        ] as { key: GemType | 'all'; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              filter === tab.key
                ? 'bg-rose text-white shadow-md'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Discovering gems...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-32 space-y-3">
          <Gem size={48} className="mx-auto text-gray-200" />
          <p className="text-xl font-serif text-gray-400">No gems found</p>
          <p className="text-sm text-gray-400">Participants need to register for events to appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((user, idx) => (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.04 }}
              >
                <GemCard user={user} onClick={() => setSelectedUser(user)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Profile Modal */}
      <AnimatePresence>
        {selectedUser && (
          <GemProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Gem Card ─────────────────────────────────────────────────────────────────
const GemCard: React.FC<{ user: GemUser; onClick: () => void }> = ({ user, onClick }) => (
  <Card
    className="p-6 border border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all cursor-pointer group space-y-4"
    onClick={onClick}
  >
    <div className="flex items-start gap-4">
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-14 h-14 rounded-2xl bg-violet-50 border-2 border-violet-100 flex items-center justify-center overflow-hidden">
          {user.avatar ? (
            <img src={user.avatar} className="w-full h-full object-cover" alt="" />
          ) : (
            <span className="text-violet-600 font-bold text-xl">{user.name?.[0]?.toUpperCase()}</span>
          )}
        </div>
        {/* Gem score badge */}
        <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-rose text-white text-[10px] font-bold flex items-center justify-center shadow">
          {user.gemScore}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-charcoal group-hover:text-violet-600 transition-colors truncate">{user.name}</h3>
        <p className="text-xs text-gray-400 truncate">{user.email}</p>
        {user.bio && <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic">"{user.bio}"</p>}
      </div>

      {/* Gem types */}
      <div className="flex flex-col gap-1 shrink-0">
        {user.gemType.map(type => {
          const meta = GEM_META[type];
          return (
            <span key={type} className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${meta.bg} ${meta.color}`}>
              {meta.icon} {meta.label}
            </span>
          );
        })}
      </div>
    </div>

    {/* Stats row */}
    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50">
      <div className="text-center">
        <p className="text-lg font-bold text-charcoal">{user.eventsJoined}</p>
        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Events</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-charcoal">{user.skillDepth}</p>
        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Skills</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-charcoal">{user.teamInvitesReceived}</p>
        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Invites</p>
      </div>
    </div>

    {/* Skills preview */}
    {user.skills?.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {user.skills.slice(0, 4).map(s => (
          <span key={s} className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{s}</span>
        ))}
        {user.skills.length > 4 && (
          <span className="text-[9px] bg-violet-50 text-violet-500 px-2 py-0.5 rounded-full font-medium">+{user.skills.length - 4} more</span>
        )}
      </div>
    )}
  </Card>
);

// ─── Profile Modal ────────────────────────────────────────────────────────────
const GemProfileModal: React.FC<{ user: GemUser; onClose: () => void }> = ({ user, onClose }) => (
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
      className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      onClick={e => e.stopPropagation()}
    >
      {/* Hero */}
      <div className="p-8 bg-gradient-to-br from-violet-50 to-rose/5 border-b border-gray-100 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-violet-200 shadow flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="text-violet-600 font-bold text-2xl">{user.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-charcoal">{user.name}</h2>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/60 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Gem types */}
        <div className="flex flex-wrap gap-2">
          {user.gemType.map(type => {
            const meta = GEM_META[type];
            return (
              <div key={type} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${meta.bg} ${meta.color}`}>
                {meta.icon} {meta.label}
              </div>
            );
          })}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-charcoal text-white">
            <Award size={10} /> Gem Score: {user.gemScore}
          </div>
        </div>

        {user.bio && (
          <p className="text-sm text-gray-600 italic">"{user.bio}"</p>
        )}
      </div>

      <div className="p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 bg-gray-50 rounded-2xl text-center space-y-1">
            <Calendar size={16} className="mx-auto text-rose" />
            <p className="text-2xl font-bold text-charcoal">{user.eventsJoined}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Events Joined</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl text-center space-y-1">
            <Users size={16} className="mx-auto text-rose" />
            <p className="text-2xl font-bold text-charcoal">{user.teamInvitesReceived}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Team Invites</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl text-center space-y-1">
            <Star size={16} className="mx-auto text-rose" />
            <p className="text-2xl font-bold text-charcoal">{user.skillDepth}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Skills</p>
          </div>
        </div>

        {/* Why they're a gem */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Why They Stand Out</p>
          <div className="space-y-2">
            {user.gemType.includes('hidden_gem') && (
              <div className="flex items-start gap-2 p-3 bg-violet-50 rounded-xl">
                <Gem size={14} className="text-violet-600 shrink-0 mt-0.5" />
                <p className="text-xs text-violet-700">Has <strong>{user.skillDepth} skills</strong> but only received <strong>{user.teamInvitesReceived} team invite(s)</strong> — massively underutilized.</p>
              </div>
            )}
            {user.gemType.includes('silent_grinder') && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl">
                <Flame size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">Registered for <strong>{user.eventsJoined} events</strong> consistently — shows up without needing recognition.</p>
              </div>
            )}
            {user.gemType.includes('unsung_hero') && (
              <div className="flex items-start gap-2 p-3 bg-rose/10 rounded-xl">
                <Star size={14} className="text-rose shrink-0 mt-0.5" />
                <p className="text-xs text-rose">Rich profile with skills, interests, and bio — but <strong>zero team invites</strong>. Needs to be found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        {user.skills?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {user.skills.map(s => (
                <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {user.interests?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Interests</p>
            <div className="flex flex-wrap gap-1.5">
              {user.interests.map(i => (
                <span key={i} className="text-xs bg-rose/10 text-rose px-2.5 py-1 rounded-full font-medium">{i}</span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {user.tags?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {user.tags.map(t => (
                <span key={t} className="text-xs bg-blue-50 text-blue-500 px-2.5 py-1 rounded-full font-medium">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  </motion.div>
);