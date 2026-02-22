
import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LotusLogo, LotusPattern, PhoneIllustration, ScoreCircle } from '../components/Icons';
import { Button, Card, Badge, Input } from '../components/UI';
import { BrainCircuit, Sparkles, UserSearch, FileText, ChevronRight, Send, Upload, Paperclip, AlertCircle, Users, Trophy, ArrowLeft, LogIn, LayoutDashboard, Calendar, Clock, BarChart3, Rocket } from 'lucide-react';
import { currentUser } from '../mockData';

const JoinGardenButton: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string; text?: string }> = ({ size = 'sm', className = "", text = "Join the Garden" }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative flex flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to="/signup" className="relative z-10">
        <Button variant="primary" size={size} className={`${className}`}>
          {text}
        </Button>
      </Link>
      
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -5 }}
            animate={{ opacity: 1, scale: 1.1, y: 12 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-full flex flex-col items-center pointer-events-none z-0"
          >
            <div className="relative mt-1">
              <LotusLogo size={24} className="text-rose-gold filter drop-shadow-[0_0_8px_rgba(212,165,165,0.6)]" />
              <motion.div 
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }} 
                transition={{ repeat: Infinity, duration: 0.6 }} 
                className="absolute -top-1 -right-1 w-1 h-1 bg-white rounded-full" 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ExploreGardenButton: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'lg', className = "" }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div 
      className="relative flex flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to="/browse">
        <Button variant="outline" size={size} className={`border-rose/30 text-rose relative z-10 bg-transparent ${className}`}>
          Explore the Garden
        </Button>
      </Link>
      <AnimatePresence>
        {isHovered && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ 
                  opacity: [0, 0.8, 0], 
                  scale: [0, 1.2, 1.5], 
                  x: i === 0 ? -45 : i === 1 ? 45 : 0, 
                  y: i === 2 ? 45 : -35,
                  rotate: i * 45
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.05 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <LotusLogo size={20} className="text-rose-gold" />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [message, setMessage] = useState('');
  const [hasAccount, setHasAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showLogoTransition, setShowLogoTransition] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'organizer' | 'student'>('organizer');
  const [accountExists, setAccountExists] = useState(false);
  
  // Student form fields
  const [university, setUniversity] = useState('');
  const [lookingFor, setLookingFor] = useState('Hackathons');

  const handleExperienceClick = () => {
    setShowLogoTransition(true);
    setTimeout(() => {
      setShowLogoTransition(false);
      setShowPreview(true);
    }, 1200);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccount) { alert("Please acknowledge the account status."); return; }
    
    if (!accountExists) {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      alert("Inquiry received!");
      setIsSubmitting(false);
      setContactName(''); setContactEmail(''); setMessage('');
      setUniversity('');
      setHasAccount(false);
    }, 1500);
  };

  if (showLogoTransition) {
    return (
      <div className="fixed inset-0 z-[100] bg-charcoal flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5 }}
        >
          <LotusLogo className="text-rose" size={120} />
        </motion.div>
      </div>
    );
  }

  if (showPreview) {
    return (
      <div className="bg-cream-pink min-h-screen text-charcoal px-6 py-20 relative">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={() => setShowPreview(false)}
            className="flex items-center gap-2 text-rose font-bold hover:opacity-80 transition-opacity mb-12"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <div className="text-center mb-16 space-y-4">
            <Badge variant="rose">Step Inside</Badge>
            <h2 className="text-5xl font-serif">Preview the Experience</h2>
            <p className="text-gray-500 text-xl max-w-2xl mx-auto">
              Step inside the ecosystem. Discover events, build teams, and manage impact — all powered by intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 1. Event Hub Preview */}
            <Card className="p-8 bg-white border border-rose/10 flex flex-col items-center text-center space-y-6 group hover:shadow-2xl transition-all h-full">
              <div className="p-4 bg-rose/10 rounded-2xl text-rose"><Calendar size={32} /></div>
              <div className="flex-1 space-y-4">
                <Badge variant="rose">Hackathon</Badge>
                <h3 className="text-2xl font-serif">EcoHack 2024</h3>
                <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2"><Clock size={14} /> 12d 4h 30m Left</div>
                  <div className="px-3 py-1 bg-rose/5 text-rose rounded-full font-bold text-[10px] uppercase tracking-widest">Spots Filling Fast</div>
                </div>
              </div>
              <Button fullWidth onClick={() => navigate('/browse')}>🌸 Explore the Garden</Button>
            </Card>

            {/* 2. LotUs Match Preview */}
            <Card className="p-8 bg-white border border-rose/10 flex flex-col items-center text-center space-y-6 group hover:shadow-2xl transition-all h-full">
              <div className="p-4 bg-rose/10 rounded-2xl text-rose"><Sparkles size={32} /></div>
              <div className="flex-1 w-full space-y-6">
                <div className="flex items-center justify-center gap-4">
                  <ScoreCircle score={98} size={80} />
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Compatibility</p>
                    <p className="text-xl font-bold text-rose">98% Synergy</p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {['AI', 'Design', 'Backend'].map(tag => (
                    <span key={tag} className="px-2 py-0.5 border border-rose/20 text-[10px] font-bold text-rose rounded uppercase">{tag}</span>
                  ))}
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose w-[98%]" />
                </div>
              </div>
              <Button fullWidth variant="outline" onClick={() => navigate('/login')}>🤝 Try LotUs Match</Button>
            </Card>

            {/* 3. Admin Analytics Preview */}
            <Card className="p-8 bg-white border border-rose/10 flex flex-col items-center text-center space-y-6 group hover:shadow-2xl transition-all h-full">
              <div className="p-4 bg-rose/10 rounded-2xl text-rose"><BarChart3 size={32} /></div>
              <div className="flex-1 w-full space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl text-left"><p className="text-xl font-bold">1,240</p><p className="text-[10px] text-gray-400 font-bold uppercase">Participants</p></div>
                  <div className="p-4 bg-gray-50 rounded-xl text-left"><p className="text-xl font-bold">32</p><p className="text-[10px] text-gray-400 font-bold uppercase">Teams</p></div>
                </div>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400"><span>Check-in Progress</span><span>75%</span></div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="w-[75%] h-full bg-rose" /></div>
                </div>
              </div>
              <Button fullWidth variant="secondary" className="bg-charcoal text-white" onClick={() => navigate('/login')}>🚀 Launch Event</Button>
            </Card>
          </div>

          <div className="mt-16 flex flex-col items-center gap-6">
            <Button size="lg" className="px-12 py-5 text-xl shadow-2xl shadow-rose/20 gap-3" onClick={() => navigate('/login')}>
              🔐 Login to Unlock Full Access
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-charcoal text-cream selection:bg-rose selection:text-white relative">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-charcoal/80 backdrop-blur-md border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <LotusLogo className="text-rose" size={32} />
              <span className="text-2xl font-serif font-bold tracking-tight text-white">LotUs</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-rose transition-colors">Synergy</a>
            <a href="#how-it-works" className="hover:text-rose transition-colors">Process</a>
            <a href="#contact" className="hover:text-rose transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to={currentUser ? '/dashboard' : '/login'}>
              <Button variant="ghost" size="sm" className="gap-2 text-gray-400 hover:text-rose">
                {currentUser ? <LayoutDashboard size={18} /> : <LogIn size={18} />}
                <span className="hidden sm:inline">{currentUser ? 'Dashboard' : 'Login'}</span>
              </Button>
            </Link>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleExperienceClick}
            >
              Experience
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-[85vh] flex flex-col items-center justify-center px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-rose/10 rounded-full blur-[120px] -z-10"></div>
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <Badge variant="rose">The Intelligent Event Ecosystem</Badge>
            <h1 className="mt-6 text-6xl md:text-8xl font-serif leading-tight">
              Connect. Compete. <br/> <span className="italic text-rose">Grow Together.</span>
            </h1>
            <p className="mt-8 text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              LotUs is a multi-event management hub where intelligence meets community. 
              We connect high-impact participants with groundbreaking hackathons, summits, and workshops.
            </p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-col sm:flex-row items-center justify-center gap-12 pt-6">
            <JoinGardenButton size="lg" className="px-10 py-4 text-lg" />
            <ExploreGardenButton className="px-10 py-4 text-lg" />
          </motion.div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="relative py-32 bg-charcoal px-6 overflow-hidden">
        <LotusPattern className="absolute inset-0 z-0 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20 space-y-4">
            <Badge variant="rose">Synergy in Bloom</Badge>
            <h2 className="text-5xl font-serif text-cream">Powerful Tools for Organizers & Participants</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard icon={<BrainCircuit className="text-rose" />} title="Smart Discovery" description="Find events that perfectly match your skill set and professional trajectory using our AI matching engine." />
            <FeatureCard icon={<Users className="text-rose" />} title="Team Formation" description="Form synergistic teams based on complementary skill analysis, not just random proximity." />
            <FeatureCard icon={<Sparkles className="text-rose" />} title="LotUs Match" description="The novelty teammate engine. We find the person who fills your missing link for any given hackathon." />
            <FeatureCard icon={<Trophy className="text-rose" />} title="Event Analytics" description="Admins get real-time insights into participant engagement, check-ins, and team health." />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 bg-cream-pink text-charcoal px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <h2 className="text-5xl font-serif leading-tight">The Journey <br/> of <span className="text-rose italic">Participation</span></h2>
              <div className="space-y-12">
                <StageItem num="1" title="Planting (Discovery)" desc="Browse curated hackathons and workshops. Filter by your expertise and find the challenge that calls to you." />
                <StageItem num="2" title="Budding (Matching)" desc="Use LotUs Match to find teammates. Our AI suggests partners with complementary skills for your chosen event." />
                <StageItem num="3" title="Blooming (Collaboration)" desc="Form your team, enter the event, and deliver excellence. Track your progress and scale your network." />
              </div>
            </div>
            <div className="relative">
               <div className="absolute -inset-10 bg-rose/10 blur-3xl rounded-full"></div>
               <div className="relative grid grid-cols-2 gap-6">
                  <div className="mt-16 space-y-6">
                     <Card className="p-4 bg-white shadow-2xl overflow-hidden"><Badge variant="rose">Active Event</Badge><div className="mt-4 h-40 w-full rounded-lg overflow-hidden"><img src="https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" alt="" /></div><p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Discovery Engine</p></Card>
                  </div>
                  <div className="space-y-6">
                     <Card className="p-4 bg-white shadow-2xl"><div className="h-56 w-full rounded-lg overflow-hidden"><img src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" alt="" /></div><p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Team Bloom Hub</p></Card>
                     <Card className="p-4 bg-white shadow-2xl flex items-center justify-between"><span className="text-xs font-bold text-rose">98% Match Rating</span><Sparkles size={14} className="text-rose" /></Card>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 bg-cream-pink text-charcoal px-6">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <Badge variant="rose">Inquiries & Partnerships</Badge>
            <h2 className="text-5xl font-serif">Host Your Event. <br/> <span className="text-rose italic">Join the Movement.</span></h2>
          </div>

          <div className="max-w-2xl mx-auto mb-8 flex p-1 bg-gray-100 rounded-2xl border border-gray-200">
            <button 
              onClick={() => setSelectedTab('organizer')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${selectedTab === 'organizer' ? 'bg-white text-rose shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              For Organizers
            </button>
            <button 
              onClick={() => setSelectedTab('student')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${selectedTab === 'student' ? 'bg-white text-rose shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              For Students
            </button>
          </div>

          <form onSubmit={handleContactSubmit} className="space-y-6 text-left max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-rose/10 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input placeholder="Full Name" required value={contactName} onChange={(e) => setContactName(e.target.value)} />
              <Input type="email" placeholder="Email Address" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            
            {selectedTab === 'student' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input placeholder="University / Skill Area" required value={university} onChange={(e) => setUniversity(e.target.value)} />
                <select 
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose outline-none appearance-none cursor-pointer text-sm"
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                >
                  <option>Hackathons</option>
                  <option>Teammates</option>
                  <option>Workshops</option>
                  <option>Mentorship</option>
                </select>
              </div>
            )}

            <textarea className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose outline-none h-40 resize-none" placeholder={selectedTab === 'student' ? "Short Message (optional)" : "Your Message..."} required={selectedTab === 'organizer'} value={message} onChange={(e) => setMessage(e.target.value)} />
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border-2 ${hasAccount ? 'bg-rose border-rose' : 'border-gray-300'}`}>
                  {hasAccount && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1" />}
                </div>
                <input type="checkbox" className="hidden" checked={hasAccount} required onChange={() => setHasAccount(!hasAccount)} />
                <span className="text-sm text-gray-500">I understand that LotUs uses AI for synergetic analysis</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border-2 ${accountExists ? 'bg-rose border-rose' : 'border-gray-300'}`}>
                  {accountExists && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1" />}
                </div>
                <input type="checkbox" className="hidden" checked={accountExists} onChange={() => setAccountExists(!accountExists)} />
                <span className="text-sm text-gray-500 font-bold">Account already created</span>
              </label>
            </div>

            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
              {accountExists ? 'Send Inquiry' : 'Login & Send Inquiry'}
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-gray-800 px-6 bg-charcoal text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
          <div className="flex items-center gap-2"><LotusLogo className="text-rose" size={32} /><span className="font-serif font-bold text-2xl text-white">LotUs</span></div>
          <p className="text-gray-500 text-sm max-w-xs">Cultivating community and synergy through intelligent event management.</p>
          <div className="flex gap-12 text-xs font-bold uppercase tracking-widest text-rose">
            <button onClick={handleExperienceClick}>Experience</button><a href="#features">Synergy</a><a href="#how-it-works">Process</a>
          </div>
          <p className="text-gray-500 text-xs">© 2024 LotUs Event Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <Card dark className="p-8 space-y-4 border border-gray-800 hover:border-rose/30 transition-all bg-charcoal/50 backdrop-blur-md group h-full">
    <div className="p-3 bg-rose/10 w-fit rounded-xl">{icon}</div>
    <h3 className="text-xl font-bold text-cream">{title}</h3>
    <p className="text-gray-400 leading-relaxed text-sm">{description}</p>
    <div className="flex items-center gap-1 text-rose text-sm font-bold pt-4">Learn more <ChevronRight size={16} /></div>
  </Card>
);

const StageItem: React.FC<{ num: string; title: string; desc: string }> = ({ num, title, desc }) => (
  <div className="flex gap-6 group text-left">
     <div className="w-12 h-12 rounded-full border-2 border-rose flex items-center justify-center font-serif text-xl font-bold text-rose group-hover:bg-rose group-hover:text-white transition-all shrink-0">{num}</div>
     <div><h3 className="text-2xl font-bold mb-2 text-charcoal">{title}</h3><p className="text-gray-500 leading-relaxed">{desc}</p></div>
  </div>
);
