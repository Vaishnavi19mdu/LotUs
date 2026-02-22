import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Role } from '../types';
import {
  Mail, Phone, User, Briefcase, Star, Tag,
  Building2, Clock, Globe, FileText, Camera, Settings
} from 'lucide-react';
import { Card } from '../components/UI';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const ProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.role === Role.ADMIN || currentUser?.role === Role.SUPERADMIN;
  const isSuperAdmin = currentUser?.role === Role.SUPERADMIN;

  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, 'users', currentUser.id)).then(snap => {
      if (snap.exists()) setProfile(snap.data());
      setLoading(false);
    });
  }, [currentUser]);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading profile...</div>;

  const roleLabel = isSuperAdmin ? '👑 Super Admin' : isAdmin ? 'Organizer' : 'Participant';
  const roleBg = isSuperAdmin ? 'bg-amber-100 text-amber-600' : isAdmin ? 'bg-blue-50 text-blue-600' : 'bg-rose/10 text-rose';

  return (
    <div className="space-y-8 pb-20 max-w-2xl mx-auto">
      {/* Hero card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden border border-gray-100">
          {/* Banner */}
          <div className="h-28 bg-gradient-to-br from-rose/20 via-violet-100 to-rose/5" />

          <div className="px-8 pb-8">
            {/* Avatar */}
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-rose/10 flex items-center justify-center overflow-hidden">
                {profile?.avatar ? (
                  <img src={profile.avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-rose font-bold text-4xl">
                    {profile?.name?.[0]?.toUpperCase() || currentUser?.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('/dashboard/settings')}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-rose transition-colors px-3 py-2 rounded-xl hover:bg-rose/5 border border-gray-200"
              >
                <Settings size={13} /> Edit Profile
              </button>
            </div>

            {/* Name + role */}
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-charcoal">
                {profile?.name || currentUser?.name}
              </h2>
              {isAdmin && profile?.designation && (
                <p className="text-gray-500 text-sm">{profile.designation}</p>
              )}
              <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${roleBg}`}>
                {roleLabel}
              </span>
            </div>

            {/* Bio */}
            {profile?.bio && (
              <p className="mt-4 text-sm text-gray-600 leading-relaxed italic border-l-2 border-rose/30 pl-4">
                "{profile.bio}"
              </p>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Contact info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-6 border border-gray-100 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Contact</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Mail size={15} className="text-rose shrink-0" />
              {profile?.email || currentUser?.email}
            </div>
            {profile?.phone && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone size={15} className="text-rose shrink-0" />
                {profile.phone}
              </div>
            )}
            {profile?.gender && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <User size={15} className="text-rose shrink-0" />
                {profile.gender}
              </div>
            )}
            {isAdmin && profile?.website && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Globe size={15} className="text-rose shrink-0" />
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-rose hover:underline truncate">
                  {profile.website}
                </a>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Admin: Org info */}
      {isAdmin && (profile?.organization || profile?.yearsOfExperience) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="p-6 border border-gray-100 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Organization</h3>
            <div className="space-y-3">
              {profile?.organization && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Building2 size={15} className="text-rose shrink-0" />
                  {profile.organization}
                </div>
              )}
              {profile?.designation && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Briefcase size={15} className="text-rose shrink-0" />
                  {profile.designation}
                </div>
              )}
              {profile?.yearsOfExperience && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock size={15} className="text-rose shrink-0" />
                  {profile.yearsOfExperience} years of experience
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Admin: Resume */}
      {isAdmin && profile?.resumeName && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-6 border border-gray-100 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Resume / CV</h3>
            <a
              href={profile.resume}
              download={profile.resumeName}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-rose/5 transition-colors group"
            >
              <FileText size={18} className="text-rose shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-charcoal truncate group-hover:text-rose transition-colors">
                  {profile.resumeName}
                </p>
                <p className="text-[10px] text-gray-400">Click to download</p>
              </div>
            </a>
          </Card>
        </motion.div>
      )}

      {/* Participant: Skills, Interests, Tags */}
      {!isAdmin && (
        <>
          {profile?.skills?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6 border border-gray-100 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Briefcase size={11} /> Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s: string) => (
                    <span key={s} className="text-sm bg-rose/10 text-rose px-3 py-1.5 rounded-full font-bold">{s}</span>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {profile?.interests?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="p-6 border border-gray-100 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Star size={11} /> Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((i: string) => (
                    <span key={i} className="text-sm bg-violet-50 text-violet-600 px-3 py-1.5 rounded-full font-medium">{i}</span>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {profile?.tags?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6 border border-gray-100 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Tag size={11} /> Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.tags.map((t: string) => (
                    <span key={t} className="text-sm bg-blue-50 text-blue-500 px-3 py-1.5 rounded-full font-medium">{t}</span>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {!profile?.skills?.length && !profile?.interests?.length && !profile?.bio && (
            <Card className="p-8 border border-gray-100 text-center space-y-3">
              <p className="text-gray-400">Your profile is looking a bit empty.</p>
              <button
                onClick={() => navigate('/dashboard/settings')}
                className="text-rose font-bold text-sm hover:underline"
              >
                Fill it out in Settings →
              </button>
            </Card>
          )}
        </>
      )}
    </div>
  );
};