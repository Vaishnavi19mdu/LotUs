import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input, Button, Card } from '../components/UI';
import { LotusLogo } from '../components/Icons';
import { signUp, logIn } from '../services/auth';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Role } from '../types';
import { Mail, Lock, User, Phone, Eye, EyeOff, Camera, Briefcase, Users, CheckCircle, XCircle } from 'lucide-react';

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const getPasswordStrength = (password: string) => [
  { label: 'At least 9 characters', met: password.length >= 9 },
  { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
  { label: 'One number', met: /[0-9]/.test(password) },
  { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
];

// ─── Login ────────────────────────────────────────────────────────────────────
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await logIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <LotusLogo className="text-rose group-hover:rotate-12 transition-transform duration-500" size={40} />
            <span className="text-3xl font-serif text-cream">LotUs</span>
          </Link>
          <p className="text-gray-400">Welcome back to the garden.</p>
        </div>

        <Card className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 rounded-xl text-sm text-red-600 font-medium border border-red-200">{error}</div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <Mail size={11} /> Email
              </label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <Lock size={11} /> Password
              </label>
              <div className="relative">
                <Input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="pr-10" />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" fullWidth disabled={loading} className="mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-rose font-bold hover:underline">Sign up</Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

// ─── Signup ───────────────────────────────────────────────────────────────────
export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    password: '',
    confirmPassword: '',
    role: Role.PARTICIPANT as Role,
  });
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarBase64, setAvatarBase64] = useState<string>('');
  const [showPw, setShowPw] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { setError('Profile photo must be under 500KB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setAvatarBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Please enter your full name'); return; }
    if (!form.email.trim()) { setError('Please enter your email'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 9) { setError('Password must be at least 9 characters'); return; }
    if (!/[A-Z]/.test(form.password)) { setError('Password must contain at least one uppercase letter'); return; }
    if (!/[0-9]/.test(form.password)) { setError('Password must contain at least one number'); return; }
    if (!/[^A-Za-z0-9]/.test(form.password)) { setError('Password must contain at least one special character'); return; }
    setLoading(true);
    setError('');
    try {
      const userCred = await signUp(form.email, form.password);
      const uid = userCred.user.uid;

      await setDoc(doc(db, 'users', uid), {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || '',
        gender: form.gender || '',
        role: form.role || 'participant',
        bio: '',
        skills: [],
        interests: [],
        tags: [],
        avatar: avatarBase64 || '',
        createdAt: new Date().toISOString(),
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const strengthChecks = getPasswordStrength(form.password);
  const allMet = strengthChecks.every(c => c.met);

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <LotusLogo className="text-rose group-hover:rotate-12 transition-transform duration-500" size={40} />
            <span className="text-3xl font-serif text-cream">LotUs</span>
          </Link>
          <p className="text-gray-400">Join the garden today.</p>
        </div>

        <Card className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 rounded-xl text-sm text-red-600 font-medium border border-red-200">{error}</div>
          )}

          <form onSubmit={handleSignup} className="space-y-6">
            {/* Profile Photo */}
            <div className="flex flex-col items-center gap-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full border-2 border-dashed border-rose/40 bg-rose/5 flex items-center justify-center cursor-pointer hover:border-rose hover:bg-rose/10 transition-all overflow-hidden relative group"
              >
                {avatarPreview ? (
                  <>
                    <img src={avatarPreview} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={18} className="text-white" />
                    </div>
                  </>
                ) : (
                  <Camera size={22} className="text-rose/50" />
                )}
              </div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                {avatarPreview ? 'Change photo' : 'Profile photo (optional)'}
              </p>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Role Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">I am joining as</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: Role.PARTICIPANT }))}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${form.role === Role.PARTICIPANT ? 'border-rose bg-rose/5' : 'border-gray-200 hover:border-rose/30'}`}
                >
                  <Users size={20} className={`mb-2 ${form.role === Role.PARTICIPANT ? 'text-rose' : 'text-gray-400'}`} />
                  <p className={`font-bold text-sm ${form.role === Role.PARTICIPANT ? 'text-rose' : 'text-charcoal'}`}>Participant</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Join events & find teammates</p>
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: Role.ADMIN }))}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${form.role === Role.ADMIN ? 'border-rose bg-rose/5' : 'border-gray-200 hover:border-rose/30'}`}
                >
                  <Briefcase size={20} className={`mb-2 ${form.role === Role.ADMIN ? 'text-rose' : 'text-gray-400'}`} />
                  <p className={`font-bold text-sm ${form.role === Role.ADMIN ? 'text-rose' : 'text-charcoal'}`}>Organizer</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Create & manage events</p>
                </button>
              </div>
            </div>

            {/* Row 1: Name + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <User size={11} /> Full Name
                </label>
                <Input placeholder="Your full name" value={form.name} onChange={set('name')} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Mail size={11} /> Email
                </label>
                <Input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
              </div>
            </div>

            {/* Row 2: Phone + Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Phone size={11} /> Phone
                </label>
                <Input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Gender</label>
                <div className="flex flex-wrap gap-1.5">
                  {GENDER_OPTIONS.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, gender: g }))}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
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
            </div>

            <hr className="border-gray-100" />

            {/* Row 3: Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Lock size={11} /> Password
                </label>
                <div className="relative">
                  <Input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min 9 chars"
                    value={form.password}
                    onChange={set('password')}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password strength checklist */}
                {(passwordFocused || form.password.length > 0) && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                    {strengthChecks.map(({ label, met }) => (
                      <div key={label} className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${met ? 'text-green-600' : 'text-gray-400'}`}>
                        {met
                          ? <CheckCircle size={13} className="text-green-500 shrink-0" />
                          : <XCircle size={13} className="text-gray-300 shrink-0" />
                        }
                        {label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Lock size={11} /> Confirm
                </label>
                <Input type={showPw ? 'text' : 'password'} placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
                {form.confirmPassword.length > 0 && (
                  <p className={`text-[11px] font-medium flex items-center gap-1 ${form.password === form.confirmPassword ? 'text-green-600' : 'text-red-400'}`}>
                    {form.password === form.confirmPassword
                      ? <><CheckCircle size={12} /> Passwords match</>
                      : <><XCircle size={12} /> Passwords don't match</>
                    }
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" fullWidth disabled={loading || !allMet} className="mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-rose font-bold hover:underline">Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
};