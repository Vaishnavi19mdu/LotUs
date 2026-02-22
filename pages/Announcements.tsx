import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../components/UI';
import { db } from '../firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc, orderBy, query
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { Megaphone, Trash2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'Announcement' | 'Reminder' | 'Update';
  date: string;
  createdBy: string;
}

export const AnnouncementsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === Role.SUPERADMIN;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'Announcement' as 'Announcement' | 'Reminder' | 'Update'
  });

  const fetchAnnouncements = async () => {
    const q = query(collection(db, 'announcements'), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        ...form,
        date: new Date().toISOString(),
        createdBy: currentUser!.id
      });
      setForm({ title: '', message: '', type: 'Announcement' });
      setShowForm(false);
      await fetchAnnouncements();
    } catch {
      alert('Failed to post announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    setDeleting(id);
    await deleteDoc(doc(db, 'announcements', id));
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    setDeleting(null);
  };

  const typeColors: Record<string, string> = {
    Announcement: 'bg-rose/10 text-rose border-rose/20',
    Reminder: 'bg-amber-50 text-amber-600 border-amber-200',
    Update: 'bg-blue-50 text-blue-600 border-blue-200'
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading announcements...</div>;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif">Announcements</h2>
          <p className="text-gray-400">Stay updated with the latest from the platform.</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setShowForm(v => !v)} className="gap-2">
            {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> New Announcement</>}
          </Button>
        )}
      </header>

      {/* Create Form — superadmin only */}
      <AnimatePresence>
        {showForm && isSuperAdmin && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-6 border border-rose/20 space-y-4">
              <h3 className="text-lg font-serif text-charcoal">Post New Announcement</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Title</label>
                  <Input
                    placeholder="Announcement title"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Message</label>
                  <textarea
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose outline-none text-charcoal h-28 resize-none"
                    placeholder="Write your message here..."
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Type</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-charcoal appearance-none"
                    value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}
                  >
                    <option>Announcement</option>
                    <option>Reminder</option>
                    <option>Update</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Posting...' : 'Post Announcement'}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="text-center py-32 space-y-4">
          <Megaphone size={48} className="mx-auto text-gray-200" />
          <p className="text-2xl font-serif text-gray-400">No announcements yet</p>
          {isSuperAdmin && <p className="text-gray-400 text-sm">Create your first announcement above.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {announcements.map((a, idx) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className="p-6 border border-gray-100 hover:border-rose/20 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${typeColors[a.type]}`}>
                          {a.type}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                          {new Date(a.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-charcoal">{a.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{a.message}</p>
                    </div>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDelete(a.id)}
                        disabled={deleting === a.id}
                        className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};