import React, { useEffect, useState } from 'react';
import { Mail, Briefcase, Star, Tag, ArrowLeft } from 'lucide-react';

export const ProfileViewPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('viewProfile');
    if (raw) {
      setUser(JSON.parse(raw));
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">No profile data found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto py-12 px-6 space-y-8">

        {/* Back */}
        <button onClick={() => window.close()} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-rose transition-colors uppercase tracking-widest">
          <ArrowLeft size={16} /> Close Tab
        </button>

        {/* Hero card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-rose/5 to-violet-50 p-8 space-y-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-rose/20 shadow flex items-center justify-center overflow-hidden shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-rose font-bold text-3xl">{user.name?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-serif font-bold text-charcoal">{user.name}</h1>
                <p className="text-sm text-gray-400 flex items-center gap-1.5">
                  <Mail size={13} /> {user.email}
                </p>
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest bg-rose/10 text-rose px-2.5 py-1 rounded-full">
                  {user.role || 'participant'}
                </span>
              </div>
            </div>

            {user.bio && (
              <div className="bg-white/60 rounded-xl p-4">
                <p className="text-sm text-gray-600 italic leading-relaxed">"{user.bio}"</p>
              </div>
            )}
          </div>

          <div className="p-8 space-y-6">
            {user.skills?.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Briefcase size={12} /> Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((s: string) => (
                    <span key={s} className="text-sm bg-rose/10 text-rose px-3 py-1.5 rounded-full font-bold">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {user.interests?.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Star size={12} /> Interests
                </p>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((i: string) => (
                    <span key={i} className="text-sm bg-violet-50 text-violet-600 px-3 py-1.5 rounded-full font-medium">{i}</span>
                  ))}
                </div>
              </div>
            )}

            {user.tags?.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Tag size={12} /> Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {user.tags.map((t: string) => (
                    <span key={t} className="text-sm bg-blue-50 text-blue-500 px-3 py-1.5 rounded-full font-medium">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {!user.skills?.length && !user.interests?.length && !user.tags?.length && !user.bio && (
              <div className="text-center py-8">
                <p className="text-gray-400">This participant hasn't filled out their profile yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};