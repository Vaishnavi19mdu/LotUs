
import React, { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../components/UI';
import { mockUsers } from '../mockData';
import { Filter, Search, Sparkles, MessageSquare, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MatchesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [minScore, setMinScore] = useState(0);

  const filteredMatches = useMemo(() => {
    return mockUsers.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           user.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      const matchesScore = user.matchScore >= minScore;
      return matchesSearch && matchesRole && matchesScore;
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [searchQuery, roleFilter, minScore]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif">Explore Matches</h2>
          <p className="text-gray-500">Discover partners aligned with your vision and aesthetic.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter size={16} /> Filters
          </Button>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-full px-4 py-2 text-sm text-gray-300 focus:ring-2 focus:ring-rose outline-none"
          >
            <option>All Roles</option>
            <option>Creator</option>
            <option>Brand</option>
            <option>Student</option>
            <option>Community</option>
          </select>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, niche or tag..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-charcoal outline-none focus:ring-2 focus:ring-rose transition-all"
          />
        </div>
        <div className="bg-cream border border-gray-100 rounded-2xl px-6 flex flex-col justify-center gap-1">
          <div className="flex justify-between text-xs font-bold text-gray-400">
            <span>Match Score</span>
            <span>{minScore}%+</span>
          </div>
          <input 
            type="range" 
            min="0" max="100" 
            value={minScore}
            onChange={(e) => setMinScore(parseInt(e.target.value))}
            className="accent-rose w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <Button variant="secondary" className="rounded-2xl">Sort: Relevance</Button>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredMatches.map((user) => (
            <MatchCard key={user.id} user={user} />
          ))}
        </AnimatePresence>
      </div>

      {filteredMatches.length === 0 && (
        <div className="text-center py-20 space-y-4">
           <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto text-gray-500">
              <Search size={32} />
           </div>
           <p className="text-xl font-serif">No matches found matching your criteria</p>
           <Button variant="ghost" onClick={() => { setSearchQuery(''); setRoleFilter('All'); setMinScore(0); }}>Clear All Filters</Button>
        </div>
      )}
    </div>
  );
};

const MatchCard: React.FC<{ user: any }> = ({ user }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
  >
    <Card className="p-6 border border-gray-100 flex flex-col h-full shadow-sm hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-4 mb-6">
        <img src={user.avatar} className="w-14 h-14 rounded-full border-2 border-rose/30 object-cover" alt={user.name} />
        <div>
          <h3 className="font-bold text-lg text-charcoal">{user.name}</h3>
          <Badge variant="rose">{user.role}</Badge>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold text-gray-400">Match Score</span>
          <span className={`text-sm font-bold ${user.matchScore >= 85 ? 'text-rose' : 'text-gray-600'}`}>{user.matchScore}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${user.matchScore}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${user.matchScore >= 85 ? 'bg-rose' : 'bg-charcoal opacity-40'}`}
          />
        </div>
        <p className="text-sm text-gray-500 italic line-clamp-2 leading-relaxed">&ldquo;{user.whyMatch}&rdquo;</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {user.tags.map((tag: string) => (
          <span key={tag} className="text-[10px] font-bold tracking-wider uppercase text-gray-400 border border-gray-200 px-2 py-0.5 rounded">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto grid grid-cols-2 gap-3">
        <Button variant="outline" size="sm" className="text-xs">View Profile</Button>
        <Button variant="primary" size="sm" className="text-xs">Connect</Button>
      </div>
      <button className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-rose transition-colors flex items-center justify-center gap-2">
        <Sparkles size={12} /> Generate Pitch
      </button>
    </Card>
  </motion.div>
);
