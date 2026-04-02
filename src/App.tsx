import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  PenTool, 
  Wand2, 
  MessageSquare, 
  Sparkles, 
  Heart,
  ChevronRight,
  Copy,
  Check,
  Zap,
  BookOpen,
  ArrowRightLeft,
  EyeOff,
  Trophy,
  TrendingUp,
  Plus,
  Trash2,
  Save,
  Send,
  User,
  Bot,
  Settings,
  AlertCircle,
  ArrowUpRight,
  Library
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { cn } from './lib/utils';
import { HOOK_CATEGORIES, HOOKS, SMART_INSERTS, EXAMPLES } from './constants';
import { HookCategory, Hook, ScriptSection, ExampleScript } from './types';
import { 
  generateHookSuggestions, 
  generateCategorySpecificHooks, 
  weakToViralRewriter, 
  watchTimeBooster, 
  storyExpander, 
  createChatSession,
  analyzeHookStrength
} from './services/geminiService';

// --- Components ---

const Navbar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const tabs = [
    { id: 'discover', icon: LayoutGrid, label: 'Discover' },
    { id: 'builder', icon: PenTool, label: 'Builder' },
    { id: 'optimize', icon: Wand2, label: 'Optimize' },
    { id: 'ai', icon: Sparkles, label: 'AI' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-brand-black/80 backdrop-blur-xl border-t border-white/10 px-4 pt-3 pb-8 z-50">
      <div className="flex justify-between items-center max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300 flex-1",
              activeTab === tab.id ? "text-brand-blue scale-110" : "text-white/40 hover:text-white/60"
            )}
          >
            <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span className="text-[9px] font-medium uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const CategoryCard = ({ category, onClick }: { category: any, onClick: () => void }) => {
  const Icon = { Zap, BookOpen, ArrowRightLeft, EyeOff, Heart, Trophy, TrendingUp }[category.icon] || Zap;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-card p-5 text-left flex flex-col gap-3 group relative overflow-hidden"
    >
      <div className="blue-gradient w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue/20">
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <h3 className="font-bold text-lg group-hover:text-brand-blue transition-colors">{category.label}</h3>
        <p className="text-white/50 text-sm leading-snug">{category.description}</p>
      </div>
      <ChevronRight size={20} className="absolute top-5 right-5 text-white/20 group-hover:text-brand-blue transition-colors" />
    </motion.button>
  );
};

const HookItem = ({ hook }: { hook: Hook }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(hook.example);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 flex flex-col gap-4"
    >
      <div className="flex justify-between items-start">
        <span className="px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-xs font-bold uppercase tracking-widest border border-brand-blue/20">
          {hook.word}
        </span>
        <button onClick={handleCopy} className="text-white/40 hover:text-white transition-colors">
          {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
        </button>
      </div>
      
      <div className="space-y-2">
        <p className="text-white/90 italic font-medium">"{hook.example}"</p>
        <div className="pt-4 border-t border-white/5 space-y-3">
          <div>
            <span className="text-[10px] uppercase text-white/30 font-bold tracking-widest block mb-1">Purpose</span>
            <p className="text-sm text-white/70">{hook.purpose}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase text-white/30 font-bold tracking-widest block mb-1">When to use</span>
            <p className="text-sm text-white/70">{hook.whenToUse}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedCategory, setSelectedCategory] = useState<HookCategory | null>(null);
  const [script, setScript] = useState<ScriptSection[]>([
    { id: '1', type: 'hook', content: '' },
    { id: '2', type: 'body', content: '' },
    { id: '3', type: 'payoff', content: '' },
  ]);
  const [aiTopic, setAiTopic] = useState('');
  const [aiResults, setAiResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API Key Selection
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  // Category AI Logic
  const [categoryTopic, setCategoryTopic] = useState('');
  const [categoryAiResults, setCategoryAiResults] = useState<any>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);

  const handleCategoryAiGenerate = async () => {
    if (!categoryTopic || !selectedCategory) return;
    setCategoryLoading(true);
    setError(null);
    try {
      const results = await generateCategorySpecificHooks(selectedCategory, categoryTopic);
      setCategoryAiResults(results);
    } catch (err: any) {
      console.error("Category AI Error:", err);
      if (err.message?.includes('403') || err.message?.includes('permission')) {
        setHasApiKey(false);
        setError("API Key required. Please select a paid API key.");
      }
    }
    setCategoryLoading(false);
  };

  // Weak to Viral Rewriter
  const [boringSentence, setBoringSentence] = useState('');
  const [rewriterResults, setRewriterResults] = useState<any>(null);
  const [rewriterLoading, setRewriterLoading] = useState(false);

  const handleRewriter = async () => {
    if (!boringSentence) return;
    setRewriterLoading(true);
    setError(null);
    try {
      const results = await weakToViralRewriter(boringSentence);
      setRewriterResults(results);
    } catch (err: any) {
      console.error("Rewriter Error:", err);
      if (err.message?.includes('403') || err.message?.includes('permission')) {
        setHasApiKey(false);
        setError("API Key required. Please select a paid API key.");
      }
    }
    setRewriterLoading(false);
  };

  // Watch Time Booster
  const [boosterScript, setBoosterScript] = useState('');
  const [boosterResults, setBoosterResults] = useState<any>(null);
  const [boosterLoading, setBoosterLoading] = useState(false);

  const handleBooster = async () => {
    if (!boosterScript) return;
    setBoosterLoading(true);
    setError(null);
    try {
      const results = await watchTimeBooster(boosterScript);
      setBoosterResults(results);
    } catch (err: any) {
      console.error("Booster Error:", err);
      if (err.message?.includes('403') || err.message?.includes('permission')) {
        setHasApiKey(false);
        setError("API Key required. Please select a paid API key.");
      }
    }
    setBoosterLoading(false);
  };

  // Story Expander
  const [simpleIdea, setSimpleIdea] = useState('');
  const [expanderResults, setExpanderResults] = useState<any>(null);
  const [expanderLoading, setExpanderLoading] = useState(false);

  const handleExpander = async () => {
    if (!simpleIdea) return;
    setExpanderLoading(true);
    setError(null);
    try {
      const results = await storyExpander(simpleIdea, userStyle);
      setExpanderResults(results);
    } catch (err: any) {
      console.error("Expander Error:", err);
      if (err.message?.includes('403') || err.message?.includes('permission')) {
        setHasApiKey(false);
        setError("API Key required. Please select a paid API key.");
      }
    }
    setExpanderLoading(false);
  };

  // Style Learner
  const [userStyle, setUserStyle] = useState(() => localStorage.getItem('hookflow_style') || '');
  useEffect(() => {
    localStorage.setItem('hookflow_style', userStyle);
  }, [userStyle]);

  // Chatbot
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSession, setChatSession] = useState<any>(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const session = createChatSession("You are HookFlow AI, a senior mobile app developer, UI/UX designer, and AI product strategist. Your goal is to help content creators generate high-retention hooks and storytelling scripts. Be professional, expert-level, and encouraging.");
    setChatSession(session);
  }, []);

  const handleSendMessage = async () => {
    if (!chatInput || !chatSession || chatLoading) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);
    try {
      const result = await chatSession.sendMessage({ message: userMsg });
      setChatMessages(prev => [...prev, { role: 'model', text: result.text }]);
    } catch (error) {
      console.error("Chat Error:", error);
    }
    setChatLoading(false);
  };

  // Hook Strength Analyzer
  const [analyzerHook, setAnalyzerHook] = useState('');
  const [analyzerResults, setAnalyzerResults] = useState<any>(null);
  const [analyzerLoading, setAnalyzerLoading] = useState(false);

  const handleAnalyzeHook = async () => {
    if (!analyzerHook) return;
    setAnalyzerLoading(true);
    setError(null);
    try {
      const results = await analyzeHookStrength(analyzerHook);
      setAnalyzerResults(results);
    } catch (err: any) {
      console.error("Analyzer Error:", err);
      if (err.message?.includes('403') || err.message?.includes('permission')) {
        setHasApiKey(false);
        setError("API Key required or permission denied. Please select a paid API key.");
      } else {
        setError("Failed to analyze hook. Please try again.");
      }
    }
    setAnalyzerLoading(false);
  };

  // Script Builder Logic
  const updateScript = (id: string, content: string) => {
    setScript(prev => prev.map(s => s.id === id ? { ...s, content } : s));
  };

  const addSmartInsert = (id: string, word: string) => {
    setScript(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, content: s.content + (s.content.endsWith(' ') ? '' : ' ') + word + ' ' };
      }
      return s;
    }));
  };

  // AI Logic
  const handleAiGenerate = async () => {
    if (!aiTopic) return;
    setLoading(true);
    setError(null);
    try {
      const results = await generateHookSuggestions(aiTopic);
      setAiResults(results);
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      if (err.message?.includes('403') || err.message?.includes('permission')) {
        setHasApiKey(false);
        setError("API Key required or permission denied. Please select a paid API key.");
      } else {
        setError("Failed to generate hooks. Please try again.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 sticky top-0 bg-brand-black/80 backdrop-blur-xl z-40 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            HOOK<span className="text-brand-blue">FLOW</span>
          </h1>
          <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Retention Engine</p>
        </div>
        <div className="w-10 h-10 rounded-full blue-gradient flex items-center justify-center">
          <Zap size={20} className="text-white fill-white" />
        </div>
      </header>

      <main className="px-6">
        <AnimatePresence mode="wait">
          {/* Discover Tab */}
          {activeTab === 'discover' && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {!selectedCategory ? (
                <>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold">What are we building?</h2>
                    <p className="text-white/50">Select a category to find high-retention hooks.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {HOOK_CATEGORIES.map((cat) => (
                      <CategoryCard 
                        key={cat.id} 
                        category={cat} 
                        onClick={() => setSelectedCategory(cat.id as HookCategory)} 
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <button 
                    onClick={() => {
                      setSelectedCategory(null);
                      setCategoryAiResults(null);
                      setCategoryTopic('');
                    }}
                    className="flex items-center gap-2 text-brand-blue font-bold text-sm uppercase tracking-wider"
                  >
                    <ChevronRight size={18} className="rotate-180" />
                    Back to Categories
                  </button>
                  
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold">{HOOK_CATEGORIES.find(c => c.id === selectedCategory)?.label}</h2>
                    <p className="text-white/50">Generate AI hooks for this specific category.</p>
                  </div>

                  <div className="glass-card p-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-white/30">Topic or Script Context</label>
                      <input
                        type="text"
                        value={categoryTopic}
                        onChange={(e) => setCategoryTopic(e.target.value)}
                        placeholder="What is your video about?"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:border-brand-blue/50 focus:ring-0 outline-none transition-all"
                      />
                    </div>
                    <button
                      onClick={handleCategoryAiGenerate}
                      disabled={categoryLoading || !categoryTopic}
                      className={cn(
                        "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                        categoryLoading || !categoryTopic ? "bg-white/5 text-white/20" : "blue-gradient shadow-xl shadow-brand-blue/20"
                      )}
                    >
                      {categoryLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <Sparkles size={20} />
                        </motion.div>
                      ) : (
                        <>
                          <Sparkles size={20} /> Generate {HOOK_CATEGORIES.find(c => c.id === selectedCategory)?.label}
                        </>
                      )}
                    </button>
                  </div>

                  {categoryAiResults && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-brand-blue">
                        <Check size={18} />
                        <span className="text-sm font-bold uppercase tracking-wider">AI Suggestions</span>
                      </div>
                      
                      <div className="space-y-4">
                        {categoryAiResults.hooks.map((hook: any, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-6 space-y-4"
                          >
                            <div className="flex justify-between items-start">
                              <span className="px-2 py-1 rounded bg-brand-blue/10 text-brand-blue text-[10px] font-black uppercase tracking-widest border border-brand-blue/20">
                                Option {i + 1}
                              </span>
                              <button 
                                onClick={() => navigator.clipboard.writeText(hook.text)}
                                className="text-white/20 hover:text-white transition-colors"
                              >
                                <Copy size={16} />
                              </button>
                            </div>
                            <p className="text-lg font-bold leading-snug">"{hook.text}"</p>
                            
                            <div className="pt-4 border-t border-white/5 space-y-3">
                              <div>
                                <span className="text-[9px] uppercase text-white/30 font-bold tracking-widest block mb-1">Psychology</span>
                                <p className="text-xs text-white/60 leading-relaxed">{hook.reason}</p>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase text-white/30 font-bold tracking-widest block mb-1">Delivery Tip</span>
                                <p className="text-xs text-white/60 leading-relaxed">{hook.delivery}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Builder Tab */}
          {activeTab === 'builder' && (
            <motion.div
              key="builder"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Script Builder</h2>
                <p className="text-white/50">Draft your video with smart retention inserts.</p>
              </div>

              <div className="space-y-6">
                {script.map((section, idx) => (
                  <div key={section.id} className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                        {idx + 1}. {section.type}
                      </span>
                    </div>
                    <div className="glass-card p-4 focus-within:border-brand-blue/50 transition-colors">
                      <textarea
                        value={section.content}
                        onChange={(e) => updateScript(section.id, e.target.value)}
                        placeholder={`Write your ${section.type} here...`}
                        className="w-full bg-transparent border-none focus:ring-0 text-white/90 resize-none min-h-[100px]"
                      />
                      <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                        <span className="text-[9px] uppercase text-white/20 font-bold flex items-center gap-1 w-full mb-1">
                          <Zap size={10} /> Smart Inserts
                        </span>
                        {SMART_INSERTS.map(word => (
                          <button
                            key={word}
                            onClick={() => addSmartInsert(section.id, word)}
                            className="px-2 py-1 rounded-md bg-white/5 hover:bg-brand-blue/20 text-[10px] font-bold text-white/60 hover:text-brand-blue transition-all"
                          >
                            {word}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button className="flex-1 blue-gradient py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-brand-blue/20">
                  <Save size={20} /> Save Script
                </button>
                <button 
                  onClick={() => setScript([{ id: '1', type: 'hook', content: '' }, { id: '2', type: 'body', content: '' }, { id: '3', type: 'payoff', content: '' }])}
                  className="glass-card p-4 text-white/40 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Optimize Tab */}
          {activeTab === 'optimize' && (
            <motion.div
              key="optimize"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-12"
            >
              {/* Weak to Viral Rewriter */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">Weak to Viral</h2>
                  <p className="text-white/50">Rewrite boring sentences into high-retention hooks.</p>
                </div>
                <div className="glass-card p-6 space-y-4">
                  <textarea
                    value={boringSentence}
                    onChange={(e) => setBoringSentence(e.target.value)}
                    placeholder="Enter a boring sentence (e.g. I went to the store today)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:border-brand-blue/50 focus:ring-0 outline-none transition-all resize-none min-h-[80px]"
                  />
                  <button
                    onClick={handleRewriter}
                    disabled={rewriterLoading || !boringSentence}
                    className={cn(
                      "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                      rewriterLoading || !boringSentence ? "bg-white/5 text-white/20" : "blue-gradient shadow-xl shadow-brand-blue/20"
                    )}
                  >
                    {rewriterLoading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Sparkles size={20} /></motion.div> : "Rewrite Sentence"}
                  </button>
                </div>

                {rewriterResults && (
                  <div className="space-y-4">
                    {[
                      { label: 'High Retention', data: rewriterResults.highRetention, color: 'text-brand-blue' },
                      { label: 'Emotional', data: rewriterResults.emotional, color: 'text-pink-400' },
                      { label: 'Suspenseful', data: rewriterResults.suspenseful, color: 'text-purple-400' },
                    ].map((res, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", res.color)}>{res.label}</span>
                          <button onClick={() => navigator.clipboard.writeText(res.data.text)} className="text-white/20 hover:text-white"><Copy size={14} /></button>
                        </div>
                        <p className="text-lg font-bold">"{res.data.text}"</p>
                        <div className="pt-3 border-t border-white/5">
                          <p className="text-xs text-white/40 leading-relaxed">{res.data.explanation}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Watch Time Booster */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">Watch Time Booster</h2>
                  <p className="text-white/50">Analyze your script for drop-off points and improvements.</p>
                </div>
                <div className="glass-card p-6 space-y-4">
                  <textarea
                    value={boosterScript}
                    onChange={(e) => setBoosterScript(e.target.value)}
                    placeholder="Paste your script here for analysis..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:border-brand-blue/50 focus:ring-0 outline-none transition-all resize-none min-h-[120px]"
                  />
                  <button
                    onClick={handleBooster}
                    disabled={boosterLoading || !boosterScript}
                    className={cn(
                      "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                      boosterLoading || !boosterScript ? "bg-white/5 text-white/20" : "blue-gradient shadow-xl shadow-brand-blue/20"
                    )}
                  >
                    {boosterLoading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Sparkles size={20} /></motion.div> : "Analyze Script"}
                  </button>
                </div>

                {boosterResults && (
                  <div className="space-y-4">
                    <div className="glass-card p-6 space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
                        <AlertCircle size={16} /> Drop-off Points
                      </h4>
                      <div className="space-y-3">
                        {boosterResults.dropOffPoints.map((dp: any, i: number) => (
                          <div key={i} className="bg-white/5 rounded-lg p-3 border-l-2 border-red-400">
                            <p className="text-xs font-bold text-white/80 mb-1">{dp.location}</p>
                            <p className="text-[11px] text-white/40">{dp.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="glass-card p-6 space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-brand-blue flex items-center gap-2">
                        <Zap size={16} /> Hook Suggestions
                      </h4>
                      <div className="space-y-3">
                        {boosterResults.hookSuggestions.map((hs: any, i: number) => (
                          <div key={i} className="bg-white/5 rounded-lg p-3 border-l-2 border-brand-blue">
                            <p className="text-xs font-bold text-white/40 mb-1">Insert at: {hs.location}</p>
                            <p className="text-sm font-bold text-white/90">"{hs.hook}"</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="glass-card p-6 space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-green-400 flex items-center gap-2">
                        <TrendingUp size={16} /> Flow Improvements
                      </h4>
                      <p className="text-sm text-white/70 leading-relaxed">{boosterResults.flowImprovements}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Story Expander */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">Story Expander</h2>
                  <p className="text-white/50">Turn a simple idea into a full engaging story.</p>
                </div>
                <div className="glass-card p-6 space-y-4">
                  <input
                    type="text"
                    value={simpleIdea}
                    onChange={(e) => setSimpleIdea(e.target.value)}
                    placeholder="Enter a simple idea (e.g. A cat that thinks it's a dog)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:border-brand-blue/50 focus:ring-0 outline-none transition-all"
                  />
                  <button
                    onClick={handleExpander}
                    disabled={expanderLoading || !simpleIdea}
                    className={cn(
                      "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                      expanderLoading || !simpleIdea ? "bg-white/5 text-white/20" : "blue-gradient shadow-xl shadow-brand-blue/20"
                    )}
                  >
                    {expanderLoading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Sparkles size={20} /></motion.div> : "Expand Idea"}
                  </button>
                </div>

                {expanderResults && (
                  <div className="space-y-4">
                    <div className="glass-card p-6 space-y-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue">Opening Hook</span>
                      <p className="text-lg font-bold">"{expanderResults.opening}"</p>
                    </div>
                    <div className="space-y-3">
                      {expanderResults.storyBeats.map((beat: any, i: number) => (
                        <div key={i} className="glass-card p-6 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Beat {i + 1}</span>
                            <span className="text-[10px] font-bold text-brand-blue">Hook Included</span>
                          </div>
                          <p className="text-sm text-white/80 leading-relaxed">{beat.beat}</p>
                          <div className="bg-brand-blue/5 p-3 rounded-lg border border-brand-blue/10">
                            <p className="text-xs italic text-brand-blue">"{beat.hook}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="glass-card p-6 space-y-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-green-400">Final Payoff</span>
                      <p className="text-lg font-bold">"{expanderResults.payoff}"</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* AI Tab */}
          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">AI Assistant</h2>
                <p className="text-white/50">Generate custom hooks for your specific topic.</p>
              </div>

              {!hasApiKey && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card p-6 border-brand-blue/30 bg-brand-blue/5 space-y-4"
                >
                  <div className="flex items-center gap-3 text-brand-blue">
                    <AlertCircle size={20} />
                    <h3 className="font-bold">API Key Required</h3>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">
                    To use advanced AI features, you need to select a paid Gemini API key. 
                    This ensures high-quality results and reliable performance.
                  </p>
                  <button
                    onClick={handleOpenKeyDialog}
                    className="w-full py-3 rounded-xl blue-gradient font-bold shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2"
                  >
                    <Settings size={18} /> Select API Key
                  </button>
                  <p className="text-[10px] text-white/30 text-center">
                    Requires a paid Google Cloud project. See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">billing docs</a>.
                  </p>
                </motion.div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div className="glass-card p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-white/30">Video Topic</label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g. How to grow a plant, Coding tutorial..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:border-brand-blue/50 focus:ring-0 outline-none transition-all"
                  />
                </div>
                <button
                  onClick={handleAiGenerate}
                  disabled={loading || !aiTopic}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                    loading || !aiTopic ? "bg-white/5 text-white/20" : "blue-gradient shadow-xl shadow-brand-blue/20"
                  )}
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Sparkles size={20} />
                    </motion.div>
                  ) : (
                    <>
                      <Sparkles size={20} /> Generate Hooks
                    </>
                  )}
                </button>
              </div>

              {/* Hook Strength Analyzer */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/30">
                  <TrendingUp size={14} />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Hook Strength Analyzer</h3>
                </div>
                <div className="glass-card p-6 space-y-4">
                  <p className="text-xs text-white/50 leading-relaxed">
                    Paste your hook or script. We'll analyze its strength, curiosity level, and retention potential.
                  </p>
                  <textarea
                    value={analyzerHook}
                    onChange={(e) => setAnalyzerHook(e.target.value)}
                    placeholder="Paste your hook or script here..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:border-brand-blue/50 focus:ring-0 outline-none transition-all resize-none h-24"
                  />
                  <button
                    onClick={handleAnalyzeHook}
                    disabled={analyzerLoading || !analyzerHook}
                    className={cn(
                      "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                      analyzerLoading || !analyzerHook ? "bg-white/5 text-white/20" : "blue-gradient shadow-xl shadow-brand-blue/20"
                    )}
                  >
                    {analyzerLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <Sparkles size={20} />
                      </motion.div>
                    ) : (
                      <>
                        <Sparkles size={20} /> Analyze Hook Strength
                      </>
                    )}
                  </button>
                </div>

                {analyzerResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="glass-card p-6 space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-bold">Analysis Results</h4>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Overall Score</span>
                          <span className="text-3xl font-black text-brand-blue">{analyzerResults.score}/100</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'Curiosity', value: analyzerResults.curiosity },
                          { label: 'Emotional', value: analyzerResults.emotional },
                          { label: 'Retention', value: analyzerResults.retention },
                        ].map((stat, i) => (
                          <div key={i} className="bg-white/5 p-3 rounded-xl text-center space-y-1">
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/30">{stat.label}</span>
                            <div className="text-lg font-bold text-white/90">{stat.value}/10</div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                          <h5 className="text-xs font-black uppercase tracking-widest text-red-400 flex items-center gap-2">
                            <AlertCircle size={14} /> Weak Points
                          </h5>
                          <ul className="space-y-1">
                            {analyzerResults.weakPoints.map((point: string, i: number) => (
                              <li key={i} className="text-xs text-white/60 flex gap-2">
                                <span className="text-red-400 shrink-0">•</span> {point}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h5 className="text-xs font-black uppercase tracking-widest text-brand-blue flex items-center gap-2">
                            <Zap size={14} /> Suggestions
                          </h5>
                          <ul className="space-y-1">
                            {analyzerResults.suggestions.map((suggestion: string, i: number) => (
                              <li key={i} className="text-xs text-white/60 flex gap-2">
                                <span className="text-brand-blue shrink-0">•</span> {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/5 space-y-3">
                        <div className="flex justify-between items-center">
                          <h5 className="text-xs font-black uppercase tracking-widest text-green-400 flex items-center gap-2">
                            <Sparkles size={14} /> Rewritten Stronger Version
                          </h5>
                          <button 
                            onClick={() => navigator.clipboard.writeText(analyzerResults.rewrittenVersion)}
                            className="text-white/20 hover:text-white transition-colors"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-green-400/20">
                          <p className="text-sm font-bold italic leading-relaxed">"{analyzerResults.rewrittenVersion}"</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Style Learner */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white/30">
                  <Settings size={14} />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Style Learner</h3>
                </div>
                <div className="glass-card p-6 space-y-4">
                  <p className="text-xs text-white/50 leading-relaxed">
                    Describe your unique tone or style. HookFlow will personalize all AI outputs to match your voice.
                  </p>
                  <textarea
                    value={userStyle}
                    onChange={(e) => setUserStyle(e.target.value)}
                    placeholder="e.g. High-energy, educational, sarcastic, minimalist, storytelling-focused..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:border-brand-blue/50 focus:ring-0 outline-none transition-all resize-none h-24"
                  />
                  <div className="flex items-center gap-2 text-[10px] font-bold text-brand-blue">
                    <Check size={12} /> Style preferences saved locally
                  </div>
                </div>
              </div>

              {aiResults && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-brand-blue">
                    <Check size={18} />
                    <span className="text-sm font-bold uppercase tracking-wider">Results Generated</span>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { label: 'Opening Hook', content: aiResults.opening, icon: Zap },
                      { label: 'Middle Loop', content: aiResults.middle, icon: BookOpen },
                      { label: 'Ending Payoff', content: aiResults.payoff, icon: Trophy },
                    ].map((res, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card p-6 space-y-3"
                      >
                        <div className="flex items-center gap-2 text-white/30">
                          <res.icon size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{res.label}</span>
                        </div>
                        <p className="text-lg font-medium leading-snug">{res.content}</p>
                        <button 
                          onClick={() => navigator.clipboard.writeText(res.content)}
                          className="text-brand-blue text-xs font-bold flex items-center gap-1 hover:underline"
                        >
                          <Copy size={12} /> Copy
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-[calc(100vh-240px)]"
            >
              <div className="space-y-2 mb-6">
                <h2 className="text-3xl font-bold">HookFlow AI</h2>
                <p className="text-white/50">Chat with your personal retention strategist.</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                    <MessageSquare size={64} />
                    <p className="max-w-[200px]">Ask me anything about hooks, scripts, or storytelling.</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-3 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                    <div className={cn("w-8 h-8 rounded-full shrink-0 flex items-center justify-center", msg.role === 'user' ? "bg-brand-blue" : "bg-white/10")}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={cn("p-4 rounded-2xl text-sm leading-relaxed", msg.role === 'user' ? "bg-brand-blue text-white rounded-tr-none" : "glass-card rounded-tl-none")}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                    <div className="p-4 rounded-2xl glass-card rounded-tl-none">
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                      </motion.div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask HookFlow AI..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:border-brand-blue/50 focus:ring-0 outline-none transition-all"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput || chatLoading}
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center transition-all",
                    !chatInput || chatLoading ? "bg-white/5 text-white/20" : "blue-gradient shadow-lg"
                  )}
                >
                  <Send size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Navbar activeTab={activeTab} setActiveTab={(tab) => {
        setActiveTab(tab);
        setSelectedCategory(null);
      }} />
      <SpeedInsights />
    </div>
  );
}
