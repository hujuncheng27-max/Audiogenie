/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface OutputConfigSectionProps {
  outputClass: string;
  setOutputClass: (c: string) => void;
  languageModel: string;
  setLanguageModel: (m: string) => void;
  acousticStyle: string;
  setAcousticStyle: (s: string) => void;
  duration: number;
  setDuration: (d: number) => void;
}

export function OutputConfigSection({
  outputClass,
  setOutputClass,
  languageModel,
  setLanguageModel,
  acousticStyle,
  setAcousticStyle,
  duration,
  setDuration
}: OutputConfigSectionProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.00s`;
  };

  return (
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
  );
}
