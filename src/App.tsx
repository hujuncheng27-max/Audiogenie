/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Play, 
  RefreshCw, 
  Download, 
  Mic2, 
  Volume2, 
  Music, 
  Mic, 
  CheckCircle2, 
  Hourglass, 
  Terminal, 
  Cpu, 
  ChevronDown, 
  Database, 
  Film, 
  Image as ImageIcon,
  BarChart3,
  PlusCircle,
  Waves,
  Music2,
  CheckCircle,
  Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type View = 'workspace' | 'processing' | 'results';

interface Artifact {
  id: string;
  title: string;
  type: string;
  duration: string;
  heights: number[];
}

export default function App() {
  const [view, setView] = useState<View>('workspace');
  const [artifacts, setArtifacts] = useState<Artifact[]>([
    { id: '1', title: 'Cybernetic Whirr_v1', type: 'SFX', duration: '00:04.2s', heights: [4, 8, 10, 6, 12, 4, 9, 7, 5, 8, 11, 6, 4, 7, 10, 5, 3, 6, 9, 4] },
    { id: '2', title: 'Ambient Void_Deep', type: 'Atmosphere', duration: '01:30.0s', heights: [] },
  ]);

  const handleGenerate = () => {
    setView('processing');
    setTimeout(() => {
      // Add a new mock artifact when processing completes
      const newArtifact: Artifact = {
        id: Date.now().toString(),
        title: `New Synthesis_${Math.floor(Math.random() * 1000)}`,
        type: 'SFX',
        duration: '00:10.0s',
        heights: Array.from({ length: 20 }, () => Math.floor(Math.random() * 10) + 3)
      };
      setArtifacts(prev => [newArtifact, ...prev]);
      setView('results');
    }, 5000); // Simulate processing time
  };

  const handleNewGeneration = () => {
    const newArtifact: Artifact = {
      id: Date.now().toString(),
      title: `Manual Gen_${Math.floor(Math.random() * 1000)}`,
      type: 'Music',
      duration: '00:30.0s',
      heights: Array.from({ length: 20 }, () => Math.floor(Math.random() * 10) + 3)
    };
    setArtifacts(prev => [newArtifact, ...prev]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface font-body">
      <TopNavBar currentView={view} setView={setView} />
      
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {view === 'workspace' && (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Workspace onGenerate={handleGenerate} artifacts={artifacts} onNewGeneration={handleNewGeneration} />
            </motion.div>
          )}
          {view === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Processing />
            </motion.div>
          )}
          {view === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Results />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

function TopNavBar({ currentView, setView }: { currentView: View, setView: (v: View) => void }) {
  return (
    <nav className="flex justify-between items-center w-full px-12 h-20 bg-background sticky top-0 z-50 border-b border-outline-variant/10">
      <div className="flex items-center gap-8">
        <span className="text-xl font-black tracking-tighter text-on-surface font-headline uppercase cursor-pointer" onClick={() => setView('workspace')}>
          AudioGenie
        </span>
        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => setView('workspace')}
            className={`text-sm tracking-wider transition-colors duration-200 ${currentView === 'workspace' ? 'text-primary border-b-2 border-primary pb-1' : 'text-outline hover:text-on-surface'}`}
          >
            Workspace
          </button>
          <button 
            onClick={() => setView('results')}
            className={`text-sm tracking-wider transition-colors duration-200 ${currentView === 'results' ? 'text-primary border-b-2 border-primary pb-1' : 'text-outline hover:text-on-surface'}`}
          >
            History
          </button>
          <button className="text-outline font-body text-sm tracking-wider hover:text-on-surface transition-colors duration-200">
            Docs
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-outline hover:text-on-surface transition-all duration-200 active:scale-95">
          <Settings size={20} />
        </button>
        <button className="text-outline hover:text-on-surface transition-all duration-200 active:scale-95">
          <User size={20} />
        </button>
      </div>
    </nav>
  );
}

function Workspace({ onGenerate, artifacts, onNewGeneration }: { onGenerate: () => void, artifacts: Artifact[], onNewGeneration: () => void }) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [outputClass, setOutputClass] = useState("Sound Effects");
  const [languageModel, setLanguageModel] = useState("English (Studio High-Def)");
  const [acousticStyle, setAcousticStyle] = useState("Industrial");
  const [duration, setDuration] = useState(15);

  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.00s`;
  };

  return (
    <div className="p-8 md:p-12 max-w-[1600px] mx-auto w-full space-y-12">
      <header className="flex flex-col gap-2 border-l-4 border-primary pl-6">
        <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface uppercase">Workspace</h1>
        <p className="text-on-surface-variant font-label text-sm tracking-widest uppercase">Synthesis Engine v4.2 // Ready for Input</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Panel: Source Material */}
        <section className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col gap-6">
            <h2 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
              <Database size={14} /> Source Material
            </h2>
            
            <input 
              type="file" 
              ref={videoInputRef} 
              className="hidden" 
              accept="video/*" 
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
            />
            <div 
              onClick={() => videoInputRef.current?.click()}
              className="group cursor-pointer bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 p-4 rounded-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Film size={18} className="text-primary" />
                  <span className="font-label text-sm font-semibold uppercase tracking-tight">Upload Video</span>
                </div>
                {videoFile && <CheckCircle size={14} className="text-primary" />}
              </div>
              <p className="text-xs text-on-surface-variant/70 leading-relaxed">
                {videoFile ? `Selected: ${videoFile.name}` : "Extract timing and atmosphere for foley generation."}
              </p>
            </div>

            <input 
              type="file" 
              ref={imageInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            <div 
              onClick={() => imageInputRef.current?.click()}
              className="group cursor-pointer bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 p-4 rounded-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <ImageIcon size={18} className="text-primary" />
                  <span className="font-label text-sm font-semibold uppercase tracking-tight">Upload Image</span>
                </div>
                {imageFile && <CheckCircle size={14} className="text-primary" />}
              </div>
              <p className="text-xs text-on-surface-variant/70 leading-relaxed">
                {imageFile ? `Selected: ${imageFile.name}` : "Generate ambient soundscapes from visual context."}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 mb-1 px-1">
                <Terminal size={18} className="text-primary" />
                <span className="font-label text-sm font-semibold uppercase tracking-tight">Text Prompt</span>
              </div>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-surface-container-lowest border-l-2 border-primary border-t-0 border-r-0 border-b-0 rounded-none focus:ring-0 text-sm font-body p-4 min-h-[120px] placeholder:text-outline/40 text-on-surface" 
                placeholder="Describe the desired acoustic properties..."
              />
            </div>
          </div>
        </section>

        {/* Center Panel: Configure Outputs */}
        <section className="lg:col-span-6 flex flex-col gap-8">
          <div className="bg-surface p-8 rounded-xl border border-outline-variant/5 shadow-2xl">
            <h2 className="font-headline text-2xl font-bold mb-8 text-on-surface">Configure Outputs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-4">
                <label className="font-label text-[10px] uppercase tracking-widest text-outline">Output Class</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Sound Effects", "Speech", "Music", "Atmosphere"].map((cls) => (
                    <button 
                      key={cls}
                      onClick={() => setOutputClass(cls)}
                      className={`${outputClass === cls ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface hover:bg-surface-container-high'} text-[11px] font-bold py-3 rounded uppercase tracking-tighter transition-colors`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-label text-[10px] uppercase tracking-widest text-outline">Language Model</label>
                  <div className="relative">
                    <select 
                      value={languageModel}
                      onChange={(e) => setLanguageModel(e.target.value)}
                      className="w-full bg-surface-container-lowest border-none text-xs font-body p-3 rounded appearance-none text-on-surface pr-10"
                    >
                      <option>English (Studio High-Def)</option>
                      <option>Japanese (Cinematic)</option>
                      <option>French (Deep Tone)</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label text-[10px] uppercase tracking-widest text-outline">Acoustic Style</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {["Industrial", "Organic", "Digital"].map((style) => (
                      <span 
                        key={style}
                        onClick={() => setAcousticStyle(style)}
                        className={`px-3 py-1 cursor-pointer transition-all ${acousticStyle === style ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-high border-outline-variant/20 text-on-surface'} border rounded-full text-[10px] uppercase whitespace-nowrap`}
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="font-label text-[10px] uppercase tracking-widest text-outline">Target Duration</label>
                  <span className="text-primary font-mono text-xs">{formatDuration(duration)}</span>
                </div>
                <div className="h-1 bg-surface-container-highest w-full relative cursor-pointer group">
                  <input 
                    type="range" 
                    min="1" 
                    max="180" 
                    value={duration} 
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-inverse-primary transition-all duration-75" 
                    style={{ width: `${(duration / 180) * 100}%` }}
                  ></div>
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-on-surface rounded-full shadow-lg transition-all duration-75"
                    style={{ left: `calc(${(duration / 180) * 100}% - 6px)` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-container-lowest p-4 rounded border-l-2 border-tertiary">
                  <p className="font-label text-[9px] text-outline uppercase mb-1">Complexity</p>
                  <p className="text-sm font-bold text-tertiary">High-Res</p>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded">
                  <p className="font-label text-[9px] text-outline uppercase mb-1">Sample Rate</p>
                  <p className="text-sm font-bold text-on-surface">48 kHz</p>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded">
                  <p className="font-label text-[9px] text-outline uppercase mb-1">Bit Depth</p>
                  <p className="text-sm font-bold text-on-surface">24 bit</p>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded">
                  <p className="font-label text-[9px] text-outline uppercase mb-1">Channels</p>
                  <p className="text-sm font-bold text-on-surface">Stereo</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel: Job Summary */}
        <section className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-surface-container/60 backdrop-blur-xl p-6 rounded-xl flex flex-col gap-8 h-full border border-outline-variant/15">
            <h2 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
              <BarChart3 size={14} /> Job Summary
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] text-outline uppercase tracking-widest">Inputs Detected</p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <span className={`w-1 h-1 ${prompt ? 'bg-primary' : 'bg-outline'} rounded-full`}></span>
                    <span className={`text-xs ${prompt ? 'text-on-surface' : 'text-outline italic'}`}>
                      {prompt ? `Text Prompt (${prompt.length} chars)` : "No text prompt entered"}
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className={`w-1 h-1 ${videoFile || imageFile ? 'bg-primary' : 'bg-outline'} rounded-full`}></span>
                    <span className={`text-xs ${videoFile || imageFile ? 'text-on-surface' : 'text-outline italic'}`}>
                      {videoFile ? `Video: ${videoFile.name}` : imageFile ? `Image: ${imageFile.name}` : "No visual material attached"}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-outline uppercase tracking-widest">Synthesis Pipeline</p>
                <div className="bg-surface-container-lowest/50 p-4 rounded text-xs font-body text-on-surface-variant leading-relaxed">
                  Generating high-fidelity <span className="text-primary lowercase">{outputClass}</span> with <span className="text-primary lowercase">{acousticStyle}</span> acoustic properties. Estimated compute: <span className="text-primary">12.4 TFLOPs</span>.
                </div>
              </div>
              <div className="pt-4 border-t border-outline-variant/10">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs text-outline uppercase">Estimated Time</span>
                  <span className="text-lg font-bold text-on-surface">~14s</span>
                </div>
                <button 
                  onClick={onGenerate}
                  className="w-full bg-primary py-4 rounded-lg text-on-primary font-headline font-extrabold uppercase tracking-widest hover:bg-primary-container transition-all active:scale-[0.98]"
                >
                  Generate Audio
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Recent Artifacts */}
      <section className="flex flex-col gap-6 mt-4">
        <div className="flex justify-between items-end border-b border-outline-variant/20 pb-4">
          <h2 className="font-headline text-xl font-bold text-on-surface uppercase tracking-tight">Recent Artifacts</h2>
          <button className="text-[10px] uppercase font-bold text-primary tracking-widest hover:underline">View All History</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artifacts.map((art) => (
            <div key={art.id} className="bg-surface-container-low group hover:bg-surface-container-high p-4 rounded-lg flex flex-col gap-4 transition-all border border-transparent hover:border-outline-variant/20">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-surface-container-highest rounded flex items-center justify-center text-primary">
                    {art.type === 'Atmosphere' ? <Music2 size={20} className="text-tertiary" /> : <Waves size={20} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface uppercase tracking-tighter">{art.title}</h3>
                    <p className="text-[9px] text-outline uppercase">{art.type} // {art.duration}</p>
                  </div>
                </div>
                <button className="text-outline hover:text-primary transition-colors">
                  <Download size={16} />
                </button>
              </div>
              <div className="h-12 w-full flex items-end gap-[1px]">
                {art.heights.length > 0 ? (
                  art.heights.map((h, i) => (
                    <div key={i} className="flex-grow bg-primary/40 rounded-t-sm" style={{ height: `${h * 4}px` }}></div>
                  ))
                ) : (
                  <div className="w-full h-[1px] bg-outline-variant/30 relative mb-4">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[60%] h-[3px] bg-tertiary"></div>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div 
            onClick={onNewGeneration}
            className="border-2 border-dashed border-outline-variant/20 rounded-lg flex flex-col items-center justify-center p-8 text-outline gap-2 cursor-pointer hover:bg-surface-container-low transition-colors"
          >
            <PlusCircle size={24} />
            <span className="text-[10px] uppercase font-bold tracking-widest">New Generation</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function Processing() {
  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto w-full space-y-12">
      <header className="mb-12">
        <h1 className="font-headline font-bold text-4xl tracking-tight text-on-surface uppercase mb-2">Processing</h1>
        <div className="flex items-center gap-4">
          <div className="h-1 w-24 bg-surface-container-highest rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-inverse-primary"
              animate={{ width: ['0%', '64%'] }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
          </div>
          <span className="font-label text-xs uppercase tracking-widest text-primary">Synthesis Active — 64% Complete</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container p-6 rounded-lg border-l-2 border-primary/20">
              <div className="flex justify-between items-start mb-4">
                <CheckCircle2 size={20} className="text-primary fill-primary/20" />
                <span className="font-label text-[10px] text-outline uppercase tracking-wider">Stage 01</span>
              </div>
              <h3 className="font-headline font-bold text-sm uppercase text-on-surface mb-2">Task Decomposition</h3>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">Analyzing spectral density and temporal markers for atomic routing.</p>
            </div>

            <div className="bg-surface-container-high p-6 rounded-lg border-l-2 border-primary shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
              </div>
              <div className="flex justify-between items-start mb-4">
                <RefreshCw size={20} className="text-primary animate-spin" />
                <span className="font-label text-[10px] text-primary uppercase tracking-wider">Active Stage</span>
              </div>
              <h3 className="font-headline font-bold text-sm uppercase text-on-surface mb-2">Expert Routing</h3>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">Distributing sub-processes across high-fidelity synthesis nodes.</p>
              <div className="mt-4 h-[2px] w-full bg-surface-container-highest">
                <motion.div 
                  className="h-full bg-primary"
                  animate={{ width: ['0%', '50%'] }}
                  transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                />
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-lg border-l-2 border-outline-variant opacity-60">
              <div className="flex justify-between items-start mb-4">
                <Hourglass size={20} className="text-outline" />
                <span className="font-label text-[10px] text-outline uppercase tracking-wider">Stage 03</span>
              </div>
              <h3 className="font-headline font-bold text-sm uppercase text-on-surface-variant mb-2">Iterative Refinement</h3>
              <p className="font-body text-xs text-outline leading-relaxed">Final harmonic alignment and spatial normalization pass.</p>
            </div>
          </section>

          <section className="bg-surface-container-low rounded-xl p-8 aspect-video flex flex-col justify-center relative group overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <div className="flex items-end justify-between gap-1 h-32 px-4">
              {[12, 16, 24, 32, 28, 20, 24, 12, 8, 14, 20, 16, 10, 12, 8, 15, 22, 18, 25, 30, 14, 10, 18, 24, 20, 16, 12, 8].map((h, i) => (
                <motion.div 
                  key={i} 
                  className={`w-1 rounded-t-sm ${i < 10 ? 'bg-primary' : 'bg-secondary-fixed-dim'}`}
                  animate={{ height: [`${h * 2}px`, `${h * 3}px`, `${h * 2}px`] }}
                  transition={{ duration: 1 + Math.random(), repeat: Infinity }}
                />
              ))}
            </div>
            <div className="mt-12 flex justify-between items-center border-t border-outline-variant/20 pt-6">
              <div className="flex gap-8">
                <div>
                  <span className="block font-label text-[10px] uppercase text-outline tracking-widest mb-1">Current Frequency</span>
                  <span className="font-mono text-sm text-on-surface">14.2 kHz</span>
                </div>
                <div>
                  <span className="block font-label text-[10px] uppercase text-outline tracking-widest mb-1">Latency</span>
                  <span className="font-mono text-sm text-on-surface">12ms</span>
                </div>
              </div>
              <button className="bg-surface-container-highest border border-outline-variant/15 text-on-surface px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high transition-all">
                Abort Session
              </button>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container p-6 rounded-lg">
            <h2 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface mb-6 border-b border-outline-variant/20 pb-2">Job Configuration</h2>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="font-label text-[10px] text-outline uppercase">Input Source</dt>
                <dd className="font-body text-xs text-on-surface font-medium">RAW_VOCAL_A_04.wav</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-label text-[10px] text-outline uppercase">Sample Rate</dt>
                <dd className="font-body text-xs text-on-surface font-medium">48 kHz / 24-bit</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-label text-[10px] text-outline uppercase">Target Model</dt>
                <dd className="font-body text-xs text-on-surface font-medium">Genie-V3-Pro</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-label text-[10px] text-outline uppercase">Output Format</dt>
                <dd className="font-body text-xs text-on-surface font-medium">FLAC (Lossless)</dd>
              </div>
            </dl>
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-6 border border-outline-variant/10 h-80 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline font-bold text-xs uppercase tracking-widest text-primary">System Logs</h2>
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            </div>
            <div className="flex-grow overflow-y-auto font-mono text-[10px] space-y-2 text-on-surface-variant leading-relaxed no-scrollbar">
              <p><span className="text-outline">[14:20:01]</span> INITIALIZING CORE PIPELINE...</p>
              <p><span className="text-outline">[14:20:02]</span> AUTHENTICATING EXPERT NODES...</p>
              <p><span className="text-outline">[14:20:03]</span> DATA PACKET 0xFF2A RECEIVED.</p>
              <p className="text-primary"><span className="text-outline">[14:20:05]</span> TASK DECOMPOSITION COMPLETE.</p>
              <p><span className="text-outline">[14:20:06]</span> ROUTING TO NODE_07 (NEURAL_SYNTH)...</p>
              <p><span className="text-outline">[14:20:08]</span> OPTIMIZING SPECTRAL WEIGHTS...</p>
              <p><span className="text-outline">[14:20:10]</span> NODE_07 RESPONDING: 200 OK.</p>
              <p><span className="text-outline">[14:20:12]</span> COMPUTING HARMONIC RESIDUE...</p>
              <p className="animate-pulse"><span className="text-outline">[14:20:15]</span> ITERATING PHASE ALIGNMENT...</p>
              <div className="pt-2 border-t border-outline-variant/10 mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-3 bg-primary animate-bounce"></span>
                  <span className="text-primary italic">Awaiting refinement block...</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-high p-4 rounded-lg flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
              <Cpu size={20} className="text-primary" />
            </div>
            <div className="flex-grow">
              <span className="block font-label text-[10px] uppercase text-outline">Resource Load</span>
              <div className="flex items-center gap-2">
                <span className="font-headline font-bold text-lg">88%</span>
                <div className="h-1 flex-grow bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full w-[88%] bg-tertiary"></div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Results() {
  const [selectedTrack, setSelectedTrack] = useState("speech");
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [iteration, setIteration] = useState("A");

  const handleExport = () => {
    console.log("Export master mix initiated...");
    alert("Export started. Preparing high-fidelity master mix.");
  };

  const togglePlay = (track: string) => {
    if (playingTrack === track) {
      setPlayingTrack(null);
    } else {
      setPlayingTrack(track);
    }
  };

  return (
    <div className="p-8 md:p-12 max-w-[1600px] mx-auto w-full space-y-12">
      <header className="mb-12">
        <h1 className="font-headline text-5xl font-extrabold tracking-tight text-on-surface mb-2">Results</h1>
        <p className="font-label text-xs tracking-widest uppercase text-on-surface-variant">Review Synthesis • Project ID: AG-992-X</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-label text-xs tracking-widest uppercase text-on-surface-variant">Track Selection</h2>
            <span className="font-label text-[10px] text-primary/60">5 STEMS GENERATED</span>
          </div>

          <div className="space-y-3">
            <TrackCard 
              icon={<Mic2 size={18} />} 
              title="speech" 
              duration="00:42" 
              color="primary" 
              active={selectedTrack === "speech"}
              playing={playingTrack === "speech"}
              onSelect={() => setSelectedTrack("speech")}
              onTogglePlay={() => togglePlay("speech")}
            />
            <TrackCard 
              icon={<Volume2 size={18} />} 
              title="sound effects" 
              duration="00:15" 
              color="secondary" 
              active={selectedTrack === "sound effects"}
              playing={playingTrack === "sound effects"}
              onSelect={() => setSelectedTrack("sound effects")}
              onTogglePlay={() => togglePlay("sound effects")}
            />
            <TrackCard 
              icon={<Music size={18} />} 
              title="music" 
              duration="02:30" 
              color="secondary" 
              active={selectedTrack === "music"}
              playing={playingTrack === "music"}
              onSelect={() => setSelectedTrack("music")}
              onTogglePlay={() => togglePlay("music")}
            />
            <TrackCard 
              icon={<Mic size={18} />} 
              title="song" 
              duration="03:15" 
              color="secondary" 
              active={selectedTrack === "song"}
              playing={playingTrack === "song"}
              onSelect={() => setSelectedTrack("song")}
              onTogglePlay={() => togglePlay("song")}
            />
          </div>

          <div className="mt-8">
            <h2 className="font-label text-xs tracking-widest uppercase text-on-surface-variant mb-4">Multi-Track Synchronization</h2>
            <div className="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant/20">
              <div className="flex flex-col gap-2">
                <div className="h-6 w-full flex justify-between border-b border-outline-variant/20 mb-2">
                  <span className="font-label text-[9px] text-on-surface-variant">0:00</span>
                  <span className="font-label text-[9px] text-on-surface-variant">0:30</span>
                  <span className="font-label text-[9px] text-on-surface-variant">1:00</span>
                  <span className="font-label text-[9px] text-on-surface-variant">1:30</span>
                  <span className="font-label text-[9px] text-on-surface-variant">2:00</span>
                </div>
                <div className={`h-4 bg-primary/20 w-3/4 rounded-sm border-l-2 border-primary transition-opacity ${selectedTrack === 'speech' ? 'opacity-100' : 'opacity-40'}`}></div>
                <div className={`h-4 bg-secondary-container/40 w-1/4 ml-[10%] rounded-sm transition-opacity ${selectedTrack === 'sound effects' ? 'opacity-100' : 'opacity-40'}`}></div>
                <div className={`h-4 bg-secondary-container/40 w-1/2 ml-[20%] rounded-sm transition-opacity ${selectedTrack === 'music' ? 'opacity-100' : 'opacity-40'}`}></div>
                <div className={`h-4 bg-secondary-container/40 w-full rounded-sm transition-opacity ${selectedTrack === 'song' ? 'opacity-100' : 'opacity-40'}`}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <section className="bg-surface-container p-8 border border-outline-variant/10">
            <h2 className="font-label text-xs tracking-widest uppercase text-primary mb-6">Master Output</h2>
            <div className="flex flex-col items-center text-center">
              <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-outline-variant/20"></div>
                <div className={`absolute inset-0 rounded-full border-4 border-primary border-t-transparent ${playingTrack === 'master' ? 'animate-spin-slow' : ''}`}></div>
                <button 
                  onClick={() => togglePlay('master')}
                  className="w-24 h-24 rounded-full bg-primary text-on-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                  {playingTrack === 'master' ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" />}
                </button>
              </div>
              <h3 className="font-headline text-2xl font-bold mb-1">Final Mix v1.4</h3>
              <p className="font-label text-xs text-on-surface-variant mb-6 uppercase tracking-widest">48KHZ / 32-BIT FLOAT</p>
              <div className="w-full space-y-4">
                <div className="flex justify-between font-label text-[10px] text-on-surface-variant uppercase">
                  <span>Master Level</span>
                  <span>-0.3 dB</span>
                </div>
                <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-inverse-primary transition-all duration-300" 
                    style={{ width: playingTrack === 'master' ? '92%' : '0%' }}
                  ></div>
                </div>
                <button 
                  onClick={handleExport}
                  className="w-full py-4 bg-primary text-on-primary font-bold uppercase tracking-widest text-sm hover:bg-primary-container transition-colors active:scale-[0.98]"
                >
                  Export Master
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-label text-xs tracking-widest uppercase text-on-surface-variant">Side-by-Side Comparison</h2>
            <div className="grid grid-cols-2 gap-2">
              <div 
                onClick={() => setIteration("A")}
                className={`bg-surface-container-low p-4 cursor-pointer transition-all border ${iteration === "A" ? 'border-primary/40 bg-surface-container-high' : 'border-transparent hover:bg-surface-container-high'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-label text-[10px] font-bold uppercase ${iteration === "A" ? 'text-primary' : ''}`}>Iteration A</span>
                  {iteration === "A" && <CheckCircle size={12} className="text-primary" />}
                </div>
                <p className="font-body text-[11px] text-on-surface-variant leading-relaxed">Warmer tones, emphasized mid-range vocals.</p>
              </div>
              <div 
                onClick={() => setIteration("B")}
                className={`bg-surface-container-low p-4 cursor-pointer transition-all border ${iteration === "B" ? 'border-primary/40 bg-surface-container-high' : 'border-transparent hover:bg-surface-container-high'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-label text-[10px] font-bold uppercase ${iteration === "B" ? 'text-primary' : ''}`}>Iteration B</span>
                  {iteration === "B" && <CheckCircle size={12} className="text-primary" />}
                </div>
                <p className="font-body text-[11px] text-on-surface-variant leading-relaxed">Crisp high-end, neutral spatial processing.</p>
              </div>
            </div>
          </section>

          <div className="bg-surface-container-lowest p-6">
            <h3 className="font-label text-[10px] tracking-widest uppercase text-on-surface-variant mb-4">Synthesis Metadata</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-label text-[10px] text-on-surface-variant uppercase">Model</span>
                <span className="font-label text-[10px] text-on-surface uppercase">A-GEN V2.1</span>
              </div>
              <div className="flex justify-between">
                <span className="font-label text-[10px] text-on-surface-variant uppercase">Compute Time</span>
                <span className="font-label text-[10px] text-on-surface uppercase">12.4s</span>
              </div>
              <div className="flex justify-between">
                <span className="font-label text-[10px] text-on-surface-variant uppercase">Seed</span>
                <span className="font-label text-[10px] text-on-surface uppercase">#482910</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackCard({ icon, title, duration, color, active = false, playing = false, onSelect, onTogglePlay }: { icon: React.ReactNode, title: string, duration: string, color: string, active?: boolean, playing?: boolean, onSelect: () => void, onTogglePlay: () => void }) {
  return (
    <div 
      onClick={onSelect}
      className={`p-6 flex flex-col gap-4 group cursor-pointer transition-all duration-200 border-l-2 ${active ? 'bg-surface-container-high border-primary' : 'bg-surface-container-low border-transparent hover:bg-surface-container-high'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={active ? 'text-primary' : 'text-secondary'}>{icon}</span>
          <span className="font-label text-sm font-semibold tracking-wide uppercase">{title}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-label text-[10px] text-on-surface-variant">{duration}</span>
          <div className="flex items-center gap-2">
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <RefreshCw size={16} />
            </button>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
          className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all ${playing ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface'}`}
        >
          {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <div className="flex-grow h-12 bg-surface-container-lowest relative overflow-hidden flex items-center px-1">
          <div className="flex items-end gap-[2px] h-8 w-full opacity-40">
            {Array.from({ length: 40 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-1 bg-primary transition-all duration-300`} 
                style={{ 
                  height: playing ? `${Math.random() * 80 + 20}%` : `${Math.random() * 40 + 10}%`,
                  opacity: playing ? 1 : 0.4
                }}
              ></div>
            ))}
          </div>
          {active && <div className={`absolute inset-0 bg-primary/10 w-1/3 border-r border-primary ${playing ? 'animate-pulse' : ''}`}></div>}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="flex flex-col md:flex-row justify-between items-center px-12 gap-4 w-full py-8 mt-auto bg-surface-container-lowest border-t border-outline-variant/10">
      <p className="font-body text-[10px] uppercase tracking-widest text-outline">© 2024 AudioGenie. Precise Synthesis.</p>
      <div className="flex gap-6">
        <button className="font-body text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors">Privacy Policy</button>
        <button className="font-body text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors">Terms of Service</button>
        <button className="font-body text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors">Discord</button>
      </div>
    </footer>
  );
}
