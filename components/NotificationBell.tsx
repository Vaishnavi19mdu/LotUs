import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Calendar, ChevronRight, CheckCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import {
  getNotifications,
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  Notification,
} from '../services/notifications';
import { db } from '../firebase';
import { doc, getDoc, deleteDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  skills: string[];
  interests: string[];
  tags: string[];
  avatar?: string;
  role: string;
}

export const NotificationBell: React.FC = () => {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === Role.SUPERADMIN;

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [clearing, setClearing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const data = isSuperAdmin
        ? await getAllNotifications()
        : await getNotifications(currentUser.id);
      setNotifications(data);
    } catch (err) {
      console.error('Notification fetch error:', err);
    }
  };

  useEffect(() => { fetchNotifications(); }, [currentUser]);
  useEffect(() => { if (open) fetchNotifications(); }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSelectedProfile(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    }
    setLoadingProfile(true);
    try {
      const snap = await getDoc(doc(db, 'users', notification.registeredUserId));
      if (snap.exists()) setSelectedProfile({ id: snap.id, ...snap.data() } as UserProfile);
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead(notifications);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = async () => {
    if (!currentUser) return;
    if (!confirm('Clear all notifications? This cannot be undone.')) return;
    setClearing(true);
    try {
      // Delete each notification doc from Firestore
      await Promise.all(
        notifications.map(n => deleteDoc(doc(db, 'notifications', n.id)))
      );
      setNotifications([]);
      setSelectedProfile(null);
    } catch (err) {
      console.error('Clear error:', err);
    } finally {
      setClearing(false);
    }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(v => !v); setSelectedProfile(null); }}
        className="relative p-2.5 bg-gray-900 rounded-full text-gray-400 hover:text-white transition-all"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose rounded-full text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-14 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-charcoal">Notifications</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">{unreadCount} unread</p>
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-rose hover:opacity-70 transition-opacity"
                    title="Mark all as read"
                  >
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    disabled={clearing}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                    title="Clear all notifications"
                  >
                    <Trash2 size={11} /> {clearing ? '...' : 'Clear'}
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex max-h-[480px]">
              {/* Notification List */}
              <div className={`overflow-y-auto ${selectedProfile ? 'w-1/2 border-r border-gray-100' : 'w-full'}`}>
                {notifications.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <Bell size={32} className="mx-auto text-gray-200" />
                    <p className="text-sm text-gray-400">No notifications</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-rose/5 transition-colors flex items-start gap-3 ${!n.read ? 'bg-rose/5' : 'bg-white'}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-rose/10 flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
                        {n.registeredUserAvatar ? (
                          <img src={n.registeredUserAvatar} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-rose font-bold text-sm">{n.registeredUserName?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-charcoal font-semibold leading-snug">
                          <span className="text-rose">{n.registeredUserName}</span> registered for{' '}
                          <span className="font-bold">{n.eventName}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar size={10} className="text-gray-400" />
                          <p className="text-[10px] text-gray-400">{timeAgo(n.createdAt)}</p>
                          {!n.read && <span className="w-1.5 h-1.5 bg-rose rounded-full ml-auto" />}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 shrink-0 mt-1" />
                    </button>
                  ))
                )}
              </div>

              {/* Profile Panel */}
              <AnimatePresence>
                {selectedProfile && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="w-1/2 overflow-y-auto"
                  >
                    {loadingProfile ? (
                      <div className="flex items-center justify-center py-20 text-sm text-gray-400">Loading...</div>
                    ) : (
                      <div className="p-4 space-y-4">
                        <button onClick={() => setSelectedProfile(null)} className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold">
                          <X size={10} /> Close
                        </button>
                        <div className="text-center space-y-2">
                          <div className="w-14 h-14 rounded-full bg-rose/10 border-2 border-rose/20 flex items-center justify-center mx-auto overflow-hidden">
                            {selectedProfile.avatar ? (
                              <img src={selectedProfile.avatar} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <span className="text-rose font-bold text-xl">{selectedProfile.name?.[0]?.toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-charcoal text-sm">{selectedProfile.name}</p>
                            <p className="text-[10px] text-gray-400">{selectedProfile.email}</p>
                            <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-widest bg-rose/10 text-rose px-2 py-0.5 rounded-full">
                              {selectedProfile.role}
                            </span>
                          </div>
                        </div>
                        {selectedProfile.bio && (
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Bio</p>
                            <p className="text-[11px] text-gray-600 leading-relaxed">{selectedProfile.bio}</p>
                          </div>
                        )}
                        {selectedProfile.skills?.length > 0 && (
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedProfile.skills.map(s => (
                                <span key={s} className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedProfile.interests?.length > 0 && (
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Interests</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedProfile.interests.map(i => (
                                <span key={i} className="text-[9px] bg-rose/10 text-rose px-2 py-0.5 rounded-full">{i}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};