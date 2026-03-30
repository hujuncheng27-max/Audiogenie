/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, RefreshCw, Hourglass, Cpu } from 'lucide-react';

export function ProcessingView() {
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
