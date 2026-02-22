import React, { useState } from 'react';
import { Card, Button, Input } from '../components/UI';
import { EventType } from '../types';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Link as LinkIcon, Users, Save, User, CreditCard, Gift } from 'lucide-react';
import { createEvent } from '../services/events';
import { useAuth } from '../context/AuthContext';

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [participationType, setParticipationType] = useState<'Individual' | 'Team'>('Team');
  const [entryType, setEntryType] = useState<'Free' | 'Paid'>('Free');
  const [form, setForm] = useState({
    name: '', description: '', date: '', type: EventType.HACKATHON,
    venue: '', onlineLink: '', maxTeamSize: 4,
    capacity: 100, registrationDeadline: '', paymentLink: ''
  });

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createEvent({
        ...form,
        participationType,
        entryType,
        maxTeamSize: participationType === 'Individual' ? 1 : Number(form.maxTeamSize),
        capacity: Number(form.capacity),
        date: new Date(form.date).toISOString(),
        registrationDeadline: new Date(form.registrationDeadline).toISOString(),
        paymentLink: entryType === 'Paid' ? form.paymentLink : '',
      }, currentUser!.id);
      alert('Event successfully planted!');
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="space-y-1">
        <h2 className="text-3xl font-serif">Create New Event</h2>
        <p className="text-gray-400">Set the stage for your community to grow.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-8 space-y-8 shadow-xl">

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Event Name</label>
              <Input placeholder="e.g. LotUs Bloom Summit 2024" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Description</label>
              <textarea
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose outline-none text-charcoal h-32 resize-none"
                placeholder="What is this event about?"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Date & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Event Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input type="date" className="pl-12" value={form.date} onChange={e => set('date', e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Event Type</label>
              <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-charcoal appearance-none" value={form.type} onChange={e => set('type', e.target.value)}>
                {Object.values(EventType).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Venue & Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Venue</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input placeholder="Physical location" className="pl-12" value={form.venue} onChange={e => set('venue', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Online Link (Optional)</label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input placeholder="Meeting or Portal URL" className="pl-12" value={form.onlineLink} onChange={e => set('onlineLink', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Participation Type */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Participation Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setParticipationType('Individual')}
                className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${participationType === 'Individual' ? 'border-rose bg-rose/5' : 'border-gray-200 bg-white hover:border-rose/30'}`}
              >
                <User className={participationType === 'Individual' ? 'text-rose' : 'text-gray-400'} size={24} />
                <p className={`font-bold text-sm ${participationType === 'Individual' ? 'text-rose' : 'text-charcoal'}`}>Individual</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Solo participants</p>
              </button>
              <button
                type="button"
                onClick={() => setParticipationType('Team')}
                className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${participationType === 'Team' ? 'border-rose bg-rose/5' : 'border-gray-200 bg-white hover:border-rose/30'}`}
              >
                <Users className={participationType === 'Team' ? 'text-rose' : 'text-gray-400'} size={24} />
                <p className={`font-bold text-sm ${participationType === 'Team' ? 'text-rose' : 'text-charcoal'}`}>Team</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Group collaboration</p>
              </button>
            </div>
          </div>

          {/* Team Size — only if Team */}
          {participationType === 'Team' && (
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Max Team Size</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input type="number" min="2" max="10" className="pl-12" value={form.maxTeamSize} onChange={e => set('maxTeamSize', e.target.value)} required />
              </div>
            </div>
          )}

          {/* Capacity & Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Total Capacity</label>
              <Input type="number" min="1" placeholder="100" value={form.capacity} onChange={e => set('capacity', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Registration Deadline</label>
              <Input type="date" value={form.registrationDeadline} onChange={e => set('registrationDeadline', e.target.value)} required />
            </div>
          </div>

          {/* Entry Type */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Entry Fee</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setEntryType('Free')}
                className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${entryType === 'Free' ? 'border-rose bg-rose/5' : 'border-gray-200 bg-white hover:border-rose/30'}`}
              >
                <Gift className={entryType === 'Free' ? 'text-rose' : 'text-gray-400'} size={24} />
                <p className={`font-bold text-sm ${entryType === 'Free' ? 'text-rose' : 'text-charcoal'}`}>Free</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">No entry fee</p>
              </button>
              <button
                type="button"
                onClick={() => setEntryType('Paid')}
                className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${entryType === 'Paid' ? 'border-rose bg-rose/5' : 'border-gray-200 bg-white hover:border-rose/30'}`}
              >
                <CreditCard className={entryType === 'Paid' ? 'text-rose' : 'text-gray-400'} size={24} />
                <p className={`font-bold text-sm ${entryType === 'Paid' ? 'text-rose' : 'text-charcoal'}`}>Paid</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Entry fee required</p>
              </button>
            </div>
          </div>

          {/* GPay link — only if Paid */}
          {entryType === 'Paid' && (
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Payment Link (GPay / UPI)</label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="https://pay.google.com/... or UPI link"
                  className="pl-12"
                  value={form.paymentLink}
                  onChange={e => set('paymentLink', e.target.value)}
                  required
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 italic">Participants will be redirected to this link to complete payment before registration.</p>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400 italic">This event will be visible to all LotUs participants.</p>
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="gap-2 px-10">
                {loading ? 'Creating...' : <><Save size={18} /> Launch Event</>}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};