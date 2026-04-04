/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  BIT_DEPTH_OPTIONS,
  CHANNEL_OPTIONS,
  OUTPUT_SAMPLE_RATE_OPTIONS,
  QUALITY_MODE_OPTIONS,
} from '../constants';
import { GenerationConfig } from '../types';

interface OutputConfigSectionProps {
  outputClass: string;
  setOutputClass: (c: string) => void;
  languageModel: string;
  setLanguageModel: (m: string) => void;
  acousticStyle: string;
  setAcousticStyle: (s: string) => void;
  duration: number;
  setDuration: (d: number) => void;
  generationConfig: GenerationConfig;
  onGenerationConfigChange: (config: GenerationConfig) => void;
}

const QUALITY_MODE_COPY = {
  fast: 'Lower refinement, quicker turnaround',
  balanced: 'Default mode for most generation runs',
  'high-quality': 'Extra refinement and post-processing emphasis',
} as const;

export function OutputConfigSection({
  outputClass,
  setOutputClass,
  languageModel,
  setLanguageModel,
  acousticStyle,
  setAcousticStyle,
  duration,
  setDuration,
  generationConfig,
  onGenerationConfigChange,
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
            {['Sound Effects', 'Speech', 'Music', 'Atmosphere'].map((cls) => (
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
              {['Industrial', 'Organic', 'Digital'].map((style) => (
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

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="font-label text-[10px] uppercase tracking-widest text-outline">Quality Mode</label>
            <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
              {generationConfig.qualityMode === 'fast' ? 'Fast' : generationConfig.qualityMode === 'high-quality' ? 'High Quality' : 'Balanced'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {QUALITY_MODE_OPTIONS.map((mode) => (
              <button
                key={mode}
                onClick={() => onGenerationConfigChange({ ...generationConfig, qualityMode: mode })}
                className={`rounded-xl border px-4 py-4 text-left transition-all ${generationConfig.qualityMode === mode ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-lowest border-outline-variant/10 hover:bg-surface-container-low'}`}
              >
                <p className="text-xs font-bold uppercase tracking-widest">
                  {mode === 'high-quality' ? 'High Quality' : mode[0].toUpperCase() + mode.slice(1)}
                </p>
                <p className={`text-[11px] mt-2 leading-relaxed ${generationConfig.qualityMode === mode ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                  {QUALITY_MODE_COPY[mode]}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <ConfigCard
            label="Output Sample Rate"
            value={generationConfig.outputSampleRate}
            onChange={(value) => onGenerationConfigChange({ ...generationConfig, outputSampleRate: value as GenerationConfig['outputSampleRate'] })}
            options={OUTPUT_SAMPLE_RATE_OPTIONS}
          />
          <ConfigCard
            label="Bit Depth"
            value={generationConfig.bitDepth}
            onChange={(value) => onGenerationConfigChange({ ...generationConfig, bitDepth: value as GenerationConfig['bitDepth'] })}
            options={BIT_DEPTH_OPTIONS}
          />
          <ConfigCard
            label="Channels"
            value={generationConfig.channels}
            onChange={(value) => onGenerationConfigChange({ ...generationConfig, channels: value as GenerationConfig['channels'] })}
            options={CHANNEL_OPTIONS}
          />
          <div className="bg-surface-container-lowest p-4 rounded border-l-2 border-primary">
            <p className="font-label text-[9px] text-outline uppercase mb-1">Export Format</p>
            <p className="text-sm font-bold text-on-surface">{generationConfig.exportFormat}</p>
            <p className="text-[10px] mt-2 text-on-surface-variant">Advanced Settings</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigCard({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="bg-surface-container-lowest p-4 rounded border border-outline-variant/10 space-y-3">
      <p className="font-label text-[9px] text-outline uppercase">{label}</p>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-surface-container-highest border-none text-sm font-bold p-3 rounded appearance-none text-on-surface pr-10"
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
      </div>
    </div>
  );
}
