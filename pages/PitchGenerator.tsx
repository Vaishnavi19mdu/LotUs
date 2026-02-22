
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge } from '../components/UI';
import { GoogleGenAI } from "@google/genai";
import { Send, Copy, Bookmark, Sparkles, Loader2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SavedTemplate {
  id: string;
  target: string;
  type: string;
  content: string;
  date: string;
}

export const PitchGeneratorPage: React.FC = () => {
  const [targetName, setTargetName] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [industry, setIndustry] = useState('Creative Arts');
  const [niche, setNiche] = useState('Minimalist');
  const [goal, setGoal] = useState('Collaboration');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'DM' | 'Email' | 'Proposal'>('DM');
  const [pitches, setPitches] = useState<{ DM: string; Email: string; Proposal: string } | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('lotus_saved_pitches');
    if (stored) setSavedTemplates(JSON.parse(stored));
  }, []);

  const generatePitch = async () => {
    if (!targetName) return;
    setLoading(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Act as an expert partnership strategist for LotUs. 
      Target: ${targetName}
      Industry: ${industry}
      Niche: ${niche}
      Goal: ${goal}
      Platform: ${platform}
      
      Create 3 tailored outreach templates:
      1. DM: Short, industry-aware, platform-native (under 300 chars).
      2. Email: Professional, including a compelling subject line.
      3. Proposal: A 2-3 paragraph professional plan emphasizing industry-specific synergy.
      
      Tone: Elegant, professional, high-value.
      
      Return as JSON: {"DM": "", "Email": "", "Proposal": ""}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const data = JSON.parse(response.text || '{}');
      setPitches(data);
    } catch (error) {
      console.error('Error generating pitch:', error);
      setPitches({
        DM: `Hi ${targetName}! Loving your ${niche} approach in ${industry}. LotUs shows we have 94% synergy. Open to a quick collab chat for ${platform}?`,
        Email: `Subject: Synergistic Collaboration: ${industry} x LotUs\n\nHi ${targetName},\n\nI've been following your ${niche} work. Given our shared values, I believe a ${goal} would be mutually beneficial.`,
        Proposal: `Strategic Proposal for ${targetName}...\n\nIn the ${industry} space, ${niche} aesthetics are key. Our combined reach on ${platform} would drive significant engagement...`
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = () => {
    if (!pitches) return;
    const newTemplate: SavedTemplate = {
      id: Date.now().toString(),
      target: targetName,
      type: activeTab,
      content: pitches[activeTab],
      date: new Date().toLocaleDateString()
    };
    const updated = [newTemplate, ...savedTemplates];
    setSavedTemplates(updated);
    localStorage.setItem('lotus_saved_pitches', JSON.stringify(updated));
    alert('Template saved to your collection!');
  };

  const deleteTemplate = (id: string) => {
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem('lotus_saved_pitches', JSON.stringify(updated));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-serif">AI Pitch Generator</h2>
          <p className="text-gray-400">Tailored intelligence for the modern collaborator.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowSaved(!showSaved)} className="gap-2">
          <Bookmark size={16} /> {showSaved ? 'Hide Saved' : 'Saved Templates'} ({savedTemplates.length})
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Panel */}
        <Card className="lg:col-span-4 p-6 space-y-6 h-fit sticky top-8">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Target Name</label>
              <Input placeholder="e.g. Serena Bloom" value={targetName} onChange={(e) => setTargetName(e.target.value)} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Industry</label>
                  <select 
                    value={industry} onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-rose text-sm text-charcoal"
                  >
                    {['Creative Arts', 'Tech & Web3', 'Wellness', 'Fashion', 'Sustainability', 'Education'].map(i => <option key={i}>{i}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Niche</label>
                  <Input placeholder="e.g. Minimalist" value={niche} onChange={(e) => setNiche(e.target.value)} className="py-2.5 text-sm" />
               </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm">
                {['Instagram', 'YouTube', 'TikTok', 'LinkedIn', 'Discord'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Goal</label>
              <select value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm">
                {['Collaboration', 'Sponsorship', 'Interview', 'Feedback'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          
          <Button fullWidth onClick={generatePitch} disabled={loading || !targetName} className="gap-2 shadow-lg shadow-rose/20">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Generate Templates
          </Button>
        </Card>

        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence>
            {showSaved && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <Card className="p-6 bg-cream/50 border-dashed border-2 border-rose/20 mb-6">
                  <h3 className="text-lg font-serif mb-4 flex items-center gap-2">
                    <Bookmark className="text-rose" size={18} /> Your Collection
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {savedTemplates.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No saved templates yet.</p>
                    ) : (
                      savedTemplates.map(t => (
                        <div key={t.id} className="p-3 bg-white border border-gray-100 rounded-lg flex items-center justify-between group">
                          <div className="truncate flex-1">
                            <p className="text-xs font-bold text-charcoal">{t.target} <span className="text-gray-400 font-normal ml-2">({t.type})</span></p>
                            <p className="text-[10px] text-gray-400">{t.date}</p>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => copyToClipboard(t.content)} className="p-1.5 hover:text-rose transition-colors"><Copy size={14}/></button>
                            <button onClick={() => deleteTemplate(t.id)} className="p-1.5 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="p-0 overflow-hidden min-h-[500px] flex flex-col shadow-xl">
            {pitches ? (
              <>
                <div className="flex border-b border-gray-100">
                  {(['DM', 'Email', 'Proposal'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-5 text-[10px] font-bold tracking-widest uppercase transition-all relative ${activeTab === tab ? 'text-rose' : 'text-gray-400 hover:text-charcoal'}`}
                    >
                      {tab}
                      {activeTab === tab && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose" />}
                    </button>
                  ))}
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="mb-4 flex items-center justify-between">
                     <Badge variant="rose">{industry} • {niche}</Badge>
                     <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">AI Optimized for {platform}</span>
                  </div>
                  <textarea 
                    className="w-full flex-1 bg-gray-50/50 rounded-2xl p-6 text-charcoal leading-relaxed font-sans outline-none border border-transparent focus:border-rose/20 focus:bg-white transition-all resize-none shadow-inner"
                    value={pitches[activeTab]}
                    onChange={(e) => setPitches({ ...pitches, [activeTab]: e.target.value })}
                  />
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                     <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Growth Focused Copy</p>
                     <div className="flex gap-3 w-full sm:w-auto">
                        <Button variant="ghost" size="sm" onClick={saveTemplate} className="gap-2 flex-1 sm:flex-none">
                          <Bookmark size={16} /> Save
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(pitches[activeTab])} className="gap-2 flex-1 sm:flex-none">
                          <Copy size={16} /> Copy
                        </Button>
                        <Button variant="primary" size="sm" className="gap-2 flex-1 sm:flex-none">
                          <Send size={16} /> Send via LotUs
                        </Button>
                     </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="w-24 h-24 bg-rose/5 rounded-full flex items-center justify-center text-rose animate-pulse">
                  <Sparkles size={48} />
                </div>
                <h3 className="text-2xl font-serif text-charcoal">Awaiting Intelligence</h3>
                <p className="text-gray-500 max-w-sm">Define your target and industry to generate high-conversion outreach templates tailored for {platform}.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
