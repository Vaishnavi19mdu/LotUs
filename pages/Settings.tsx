import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Role } from '../types';
import {
  User, Mail, Phone, Briefcase, Star, Tag,
  Save, CheckCircle, Camera, Building2, Clock,
  FileText, Upload, X
} from 'lucide-react';

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === Role.ADMIN || currentUser?.role === Role.SUPERADMIN;
  const isSuperAdmin = currentUser?.role === Role.SUPERADMIN;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [resumeName, setResumeName] = useState<string>('');
  const [resumeBase64, setResumeBase64] = useState<string>('');

  const [form, setForm] = useState({
    name: '',
    bio: '',
    phone: '',
    gender: '',
    skills: '',
    interests: '',
    tags: '',
    organization: '',
    yearsOfExperience: '',
    designation: '',
    website: '',
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, 'users', currentUser.id)).then(snap => {
      if (!snap.exists()) return;
      const d = snap.data();
      setAvatarPreview(d.avatar || '');
      setResumeName(d.resumeName || '');
      setForm({
        name: d.name || '',
        bio: d.bio || '',
        phone: d.phone || '',
        gender: d.gender || '',
        skills: (d.skills || []).join(', '),
        interests: (d.interests || []).join(', '),
        tags: (d.tags || []).join(', '),
        organization: d.organization || '',
        yearsOfExperience: d.yearsOfExperience || '',
        designation: d.designation || '',
        website: d.website || '',
      });
    });
  }, [currentUser]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { alert('Photo must be under 500KB'); return; }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Resume must be under 2MB'); return; }
    setResumeName(file.name);
    const reader = new FileReader();
    reader.onload = () => setResumeBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const parseList = (val: string) => val.split(',').map(s => s.trim()).filter(Boolean);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    const payload: any = {
      name: form.name,
      email: currentUser.email,
      bio: form.bio,
      phone: form.phone,
      gender: form.gender,
      role: currentUser.role,
      avatar: avatarPreview,
    };

    if (isAdmin) {
      payload.organization = form.organization;
      payload.yearsOfExperience = form.yearsOfExperience;
      payload.designation = form.designation;
      payload.website = form.website;
      if (resumeBase64) {
        payload.resume = resumeBase64;
        payload.resumeName = resumeName;
      }
    } else {
      payload.skills = parseList(form.skills);
      payload.interests = parseList(form.interests);
      payload.tags = parseList(form.tags);
    }

    await setDoc(doc(db, 'users', currentUser.id), payload, { merge: true });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const roleLabel = isSuperAdmin ? '👑 Super Admin' : isAdmin ? 'Organizer' : 'Participant';
  const roleBg = isSuperAdmin ? 'bg-amber-100 text-amber-600' : isAdmin ? 'bg-blue-50 text-blue-600' : 'bg-rose/10 text-rose';

  return (
    <div className="min-h-full flex flex-col items-center py-8 px-4 pb-20">
      <div className="w-full max-w-2xl space-y-8">
        <header className="text-center">
          <h2 className="text-3xl font-serif">Settings</h2>
          <p className="text-gray-400 mt-1">Manage your profile and preferences.</p>
        </header>

        <Card className="p-8 border border-gray-100 space-y-7">

          {/* Avatar + identity */}
          <div className="flex flex-col items-center gap-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full border-2 border-dashed border-rose/40 bg-rose/5 flex items-center justify-center cursor-pointer hover:border-rose hover:bg-rose/10 transition-all overflow-hidden relative group"
            >
              {avatarPreview ? (
                <>
                  <img src={avatarPreview} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <Camera size={18} className="text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl font-bold text-rose">{currentUser?.name?.[0]?.toUpperCase()}</span>
                  <Camera size={12} className="text-rose/40" />
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <div className="text-center">
              <p className="font-bold text-charcoal text-lg">{form.name || currentUser?.name}</p>
              <p className="text-sm text-gray-400">{currentUser?.email}</p>
              <span className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${roleBg}`}>
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <User size={11} /> Display Name
            </label>
            <Input value={form.name} onChange={set('name')} placeholder="Your name" />
          </div>

          {/* Email read-only */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Mail size={11} /> Email
            </label>
            <Input value={currentUser?.email || ''} disabled className="opacity-50 cursor-not-allowed" />
            <p className="text-[10px] text-gray-400">Email cannot be changed.</p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Phone size={11} /> Phone Number
            </label>
            <Input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Gender</label>
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, gender: g }))}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                    form.gender === g
                      ? 'bg-rose text-white border-rose'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-rose hover:text-rose'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Bio</label>
            <textarea
              value={form.bio}
              onChange={set('bio')}
              placeholder={isAdmin ? 'About you and your organization...' : 'Tell others about yourself...'}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-charcoal outline-none focus:ring-2 focus:ring-rose resize-none"
            />
          </div>

          <div className="border-t border-gray-100" />

          {/* Admin fields */}
          {isAdmin ? (
            <div className="space-y-6">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Organization Info</p>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Building2 size={11} /> Organization / Company
                </label>
                <Input value={form.organization} onChange={set('organization')} placeholder="e.g. LotUs Technologies" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Briefcase size={11} /> Designation / Role
                </label>
                <Input value={form.designation} onChange={set('designation')} placeholder="e.g. Event Manager, CTO" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Clock size={11} /> Years of Experience
                </label>
                <Input type="number" min="0" max="60" value={form.yearsOfExperience} onChange={set('yearsOfExperience')} placeholder="e.g. 5" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Tag size={11} /> Website / LinkedIn
                </label>
                <Input value={form.website} onChange={set('website')} placeholder="https://..." />
              </div>

              {/* Resume */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <FileText size={11} /> Resume / CV
                  <span className="text-gray-300 normal-case font-normal tracking-normal">(optional · PDF, max 2MB)</span>
                </label>
                <div
                  onClick={() => resumeInputRef.current?.click()}
                  className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    resumeName ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 hover:border-rose/40 hover:bg-rose/5'
                  }`}
                >
                  {resumeName ? (
                    <>
                      <FileText size={18} className="text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-emerald-700 truncate">{resumeName}</p>
                        <p className="text-[10px] text-emerald-500">Click to replace</p>
                      </div>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setResumeName(''); setResumeBase64(''); }}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload size={18} className="text-gray-400 shrink-0" />
                      <p className="text-sm text-gray-400">Click to upload resume</p>
                    </>
                  )}
                </div>
                <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeChange} />
              </div>
            </div>
          ) : (
            /* Participant fields */
            <div className="space-y-6">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Profile Details</p>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Briefcase size={11} /> Skills
                </label>
                <Input value={form.skills} onChange={set('skills')} placeholder="React, Python, Figma, ML..." />
                <p className="text-[10px] text-gray-400">Comma separated</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Star size={11} /> Interests
                </label>
                <Input value={form.interests} onChange={set('interests')} placeholder="AI, Sustainability, Design..." />
                <p className="text-[10px] text-gray-400">Comma separated</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Tag size={11} /> Tags
                </label>
                <Input value={form.tags} onChange={set('tags')} placeholder="Open to team, Looking for mentor..." />
                <p className="text-[10px] text-gray-400">Comma separated</p>
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} fullWidth className="gap-2 mt-2">
            {saved ? <><CheckCircle size={16} /> Saved!</> : saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
          </Button>
        </Card>
      </div>
    </div>
  );
};