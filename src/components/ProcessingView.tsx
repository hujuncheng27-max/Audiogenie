/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, RefreshCw, Hourglass, Cpu } from 'lucide-react';
import { ActiveGeneration } from '../types';

interface ProcessingViewProps {
  activeGeneration: ActiveGeneration | null;
}

function getProgress(status: ActiveGeneration['status'] | undefined) {
  switch (status) {
    case 'pending':
      return 24;
    case 'processing':
      return 68;
    case 'completed':
      return 100;
    case 'failed':
      return 100;
    default:
      return 12;
  }
}

function getStatusLabel(status: ActiveGeneration['status'] | undefined) {
  switch (status) {
    case 'pending':
      return 'Queueing';
    case 'processing':
      return 'Synthesis Active';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    default:
      return 'Initializing';
  }
}

export function ProcessingView({ activeGeneration }: ProcessingViewProps) {
  const status = activeGeneration?.status;
  const progress = getProgress(status);
  const statusLabel = getStatusLabel(status);
  const isPending = status === 'pending';
  const isProcessing = status === 'processing';
  const isCompleted = status === 'completed';
  const promptPreview = activeGeneration?.payload.prompt?.trim() || 'No prompt supplied';
  const inputSource = activeGeneration?.payload.videoRef
    ? 'Uploaded video'
    : activeGeneration?.payload.imageRef
      ? 'Uploaded image'
      : 'Prompt only';

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto w-full space-y-12">
      <header className="mb-12">
        <h1 className="font-headline font-bold text-4xl tracking-tight text-on-surface uppercase mb-2">Processing</h1>
        <div className="flex items-center gap-4">
          <div className="h-1 w-24 bg-surface-container-highest rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-inverse-primary"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <span className="font-label text-xs uppercase tracking-widest text-primary">
            {statusLabel} // {progress}% Complete
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`bg-surface-container p-6 rounded-lg border-l-2 ${!isPending ? 'border-primary/20' : 'border-primary'}`}>
              <div className="flex justify-between items-start mb-4">
                {isPending ? <RefreshCw size={20} className="text-primary animate-spin" /> : <CheckCircle2 size={20} className="text-primary fill-primary/20" />}
                <span className={`font-label text-[10px] uppercase tracking-wider ${isPending ? 'text-primary' : 'text-outline'}`}>Stage 01</span>
              </div>
              <h3 className="font-headline font-bold text-sm uppercase text-on-surface mb-2">Task Decomposition</h3>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">Analyzing spectral density and temporal markers for atomic routing.</p>
            </div>

            <div className={`p-6 rounded-lg border-l-2 shadow-2xl relative overflow-hidden ${isProcessing ? 'bg-surface-container-high border-primary' : 'bg-surface-container-lowest border-outline-variant/40'}`}>
              {isProcessing && (
                <div className="absolute top-0 right-0 p-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
                </div>
              )}
              <div className="flex justify-between items-start mb-4">
                {isProcessing ? <RefreshCw size={20} className="text-primary animate-spin" /> : isCompleted ? <CheckCircle2 size={20} className="text-primary fill-primary/20" /> : <Hourglass size={20} className="text-outline" />}
                <span className={`font-label text-[10px] uppercase tracking-wider ${isProcessing ? 'text-primary' : 'text-outline'}`}>{isProcessing ? 'Active Stage' : 'Stage 02'}</span>
              </div>
              <h3 className="font-headline font-bold text-sm uppercase text-on-surface mb-2">Expert Routing</h3>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">Distributing sub-processes across high-fidelity synthesis nodes.</p>
              <div className="mt-4 h-[2px] w-full bg-surface-container-highest">
                <motion.div
                  className="h-full bg-primary"
                  animate={isProcessing ? { width: ['0%', '50%'] } : { width: isCompleted ? '100%' : '10%' }}
                  transition={isProcessing ? { duration: 1, repeat: Infinity, repeatType: 'reverse' } : { duration: 0.4 }}
                />
              </div>
            </div>

            <div className={`p-6 rounded-lg border-l-2 ${isCompleted ? 'bg-surface-container border-primary/20' : 'bg-surface-container-lowest border-outline-variant opacity-60'}`}>
              <div className="flex justify-between items-start mb-4">
                {isCompleted ? <CheckCircle2 size={20} className="text-primary fill-primary/20" /> : <Hourglass size={20} className="text-outline" />}
                <span className={`font-label text-[10px] uppercase tracking-wider ${isCompleted ? 'text-primary' : 'text-outline'}`}>Stage 03</span>
              </div>
              <h3 className={`font-headline font-bold text-sm uppercase mb-2 ${isCompleted ? 'text-on-surface' : 'text-on-surface-variant'}`}>Iterative Refinement</h3>
              <p className={`font-body text-xs leading-relaxed ${isCompleted ? 'text-on-surface-variant' : 'text-outline'}`}>Final harmonic alignment and spatial normalization pass.</p>
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
                  <span className="font-mono text-sm text-on-surface">{isPending ? 'Standby' : isCompleted ? 'Stable' : '14.2 kHz'}</span>
                </div>
                <div>
                  <span className="block font-label text-[10px] uppercase text-outline tracking-widest mb-1">Latency</span>
                  <span className="font-mono text-sm text-on-surface">{isPending ? 'Queued' : isCompleted ? '0ms' : '12ms'}</span>
                </div>
              </div>
              <div className="bg-surface-container-highest border border-outline-variant/15 text-on-surface px-4 py-2 rounded text-xs font-bold uppercase tracking-widest">
                {activeGeneration?.id || 'Awaiting Job'}
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container p-6 rounded-lg">
            <h2 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface mb-6 border-b border-outline-variant/20 pb-2">Job Configuration</h2>
            <dl className="space-y-4">
              <div className="flex justify-between gap-4">
                <dt className="font-label text-[10px] text-outline uppercase">Input Source</dt>
                <dd className="font-body text-xs text-on-surface font-medium text-right">{inputSource}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-label text-[10px] text-outline uppercase">Sample Rate</dt>
                <dd className="font-body text-xs text-on-surface font-medium text-right">48 kHz / 24-bit</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-label text-[10px] text-outline uppercase">Target Model</dt>
                <dd className="font-body text-xs text-on-surface font-medium text-right">{activeGeneration?.payload.languageModel || 'Genie-V3-Pro'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-label text-[10px] text-outline uppercase">Output Format</dt>
                <dd className="font-body text-xs text-on-surface font-medium text-right">
                  {activeGeneration ? `${activeGeneration.payload.outputClass} / ${activeGeneration.payload.duration}s` : 'FLAC (Lossless)'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-6 border border-outline-variant/10 h-80 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline font-bold text-xs uppercase tracking-widest text-primary">System Logs</h2>
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            </div>
            <div className="flex-grow overflow-y-auto font-mono text-[10px] space-y-2 text-on-surface-variant leading-relaxed no-scrollbar">
              <p><span className="text-outline">[LIVE]</span> JOB {activeGeneration?.id || 'PENDING'} REGISTERED.</p>
              <p><span className="text-outline">[LIVE]</span> PROMPT PROFILE: {promptPreview.slice(0, 48).toUpperCase()}{promptPreview.length > 48 ? '...' : ''}</p>
              <p><span className="text-outline">[LIVE]</span> OUTPUT CLASS: {(activeGeneration?.payload.outputClass || 'Unknown').toUpperCase()}.</p>
              <p className="text-primary"><span className="text-outline">[LIVE]</span> CURRENT STATUS: {(status || 'pending').toUpperCase()}.</p>
              <p><span className="text-outline">[LIVE]</span> ACOUSTIC STYLE: {(activeGeneration?.payload.acousticStyle || 'Default').toUpperCase()}.</p>
              <p><span className="text-outline">[LIVE]</span> TARGET DURATION: {activeGeneration?.payload.duration || 0}S.</p>
              <p><span className="text-outline">[LIVE]</span> LANGUAGE MODEL: {(activeGeneration?.payload.languageModel || 'Default').toUpperCase()}.</p>
              <p><span className="text-outline">[LIVE]</span> VISUAL CONDITIONING: {(activeGeneration?.payload.videoRef || activeGeneration?.payload.imageRef) ? 'ATTACHED' : 'NONE'}.</p>
              <p className={isProcessing ? 'animate-pulse' : ''}><span className="text-outline">[LIVE]</span> PIPELINE HEARTBEAT ACTIVE.</p>
              <div className="pt-2 border-t border-outline-variant/10 mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-3 bg-primary animate-bounce"></span>
                  <span className="text-primary italic">{isCompleted ? 'Artifact ready for results view.' : 'Awaiting next status update...'}</span>
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
                <span className="font-headline font-bold text-lg">{progress}%</span>
                <div className="h-1 flex-grow bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
