/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { ArrowRight, Clapperboard, Image as ImageIcon, Mic2, Music4, Sparkles, Play, Clock, Volume2 } from 'lucide-react';

interface HomeViewProps {
  onStartCreating: () => void;
  onOpenHistory: () => void;
}

const demos = [
  {
    title: 'Forest Breeze Ambience',
    description: 'Gentle wind rustling through tree leaves, soft birdsong layered with warm ambient pads and acoustic guitar accents.',
    outputType: 'Atmosphere',
    duration: '00:12.0s',
    icon: ImageIcon,
    source: 'Image + Text Prompt',
    bars: [8, 12, 10, 14, 16, 18, 14, 12, 16, 20, 18, 14, 10, 12, 16, 14],
    color: 'bg-tertiary-container text-on-tertiary-container',
    accent: 'tertiary',
  },
  {
    title: 'Cinematic Action Foley',
    description: 'Tightly timed impacts and movement layers extracted from action footage with cinematic transitions and rumble bass.',
    outputType: 'Sound Effects',
    duration: '00:18.0s',
    icon: Clapperboard,
    source: 'Video Upload',
    bars: [14, 24, 18, 12, 28, 30, 22, 16, 10, 18, 26, 20, 24, 14, 20, 16],
    color: 'bg-primary-container text-on-primary-container',
    accent: 'primary',
  },
  {
    title: 'Studio Narration Pass',
    description: 'Bright, expressive voice with rising-falling contour and soft onset. Full of surprise and delight, studio clarity.',
    outputType: 'Speech',
    duration: '00:06.0s',
    icon: Mic2,
    source: 'Text Prompt',
    bars: [4, 10, 18, 28, 14, 22, 16, 24, 12, 18, 26, 16, 20, 8, 14, 10],
    color: 'bg-secondary-container text-on-secondary-container',
    accent: 'secondary',
  },
  {
    title: 'Ethereal Score Bed',
    description: 'Soft ambient pads with gentle piano arpeggios, slow tempo, airy texture. Evokes morning light across still water.',
    outputType: 'Music',
    duration: '00:15.0s',
    icon: Music4,
    source: 'Image + Text Prompt',
    bars: [12, 16, 20, 24, 28, 26, 22, 18, 24, 28, 22, 16, 20, 24, 18, 14],
    color: 'bg-primary-container text-on-primary-container',
    accent: 'primary',
  },
];

const pipelineSteps = [
  { step: '01', title: 'Upload or Describe', detail: 'Provide a video, image, or text prompt as your source material.' },
  { step: '02', title: 'Configure Output', detail: 'Select audio category (SFX / Speech / Music / Atmosphere) and target duration.' },
  { step: '03', title: 'AI Planning', detail: 'The LLM decomposes your input into a structured audio event plan.' },
  { step: '04', title: 'Synthesize & Mix', detail: 'Domain experts generate each event via Tree-of-Thought refinement, then mix.' },
];

export function HomeView({ onStartCreating, onOpenHistory }: HomeViewProps) {
  const showcaseRef = useRef<HTMLElement | null>(null);

  return (
    <div className="p-8 md:p-12 max-w-[1600px] mx-auto w-full space-y-20">
      {/* Hero */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
        <div className="xl:col-span-7 bg-white border border-outline-variant/30 rounded-3xl p-8 md:p-12 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(103,80,164,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(125,82,96,0.06),transparent_35%)] pointer-events-none"></div>
          <div className="relative space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-container text-on-primary-container text-[10px] font-bold uppercase tracking-widest">
              <Sparkles size={12} /> AI Audio Generation Studio
            </div>
            <div className="space-y-5 max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-headline font-extrabold uppercase tracking-tight text-on-surface leading-none">
                Shape sound from video, images, and text.
              </h1>
              <p className="text-base md:text-lg leading-relaxed text-on-surface-variant max-w-2xl">
                DubMaster is a multi-agent AI studio that generates speech, music, sound effects, and
                atmospheric layers. Upload a video, drop in an image, or write a prompt to build polished
                audio in one workspace.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onStartCreating}
                className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                Start Creating <ArrowRight size={16} />
              </button>
              <button
                onClick={() => showcaseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="bg-surface-container-high text-on-surface px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-surface-container-highest transition-all"
              >
                View Demos
              </button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-5 grid grid-cols-1 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-4">How It Works</p>
            <div className="space-y-3">
              {pipelineSteps.map((s) => (
                <div key={s.step} className="flex gap-4 items-start bg-surface-container-low rounded-xl px-4 py-3.5">
                  <span className="text-primary font-mono text-xs font-bold mt-0.5">{s.step}</span>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{s.title}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-3">Quick Start</p>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              No account required. Open the workspace, configure your generation,
              and export the result. All history stays on this browser.
            </p>
            <button
              onClick={onOpenHistory}
              className="mt-4 text-[10px] uppercase tracking-widest font-bold text-primary hover:underline"
            >
              Open Local History
            </button>
          </div>
        </div>
      </section>

      {/* Demo Showcase */}
      <section ref={showcaseRef} className="space-y-8">
        <div className="border-b border-outline-variant/30 pb-4">
          <h2 className="font-headline text-2xl md:text-3xl font-bold uppercase tracking-tight text-on-surface">
            Featured Demos
          </h2>
          <p className="text-sm text-on-surface-variant mt-2">
            Sample outputs generated by DubMaster from different input types and output categories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {demos.map((demo) => {
            const Icon = demo.icon;

            return (
              <article
                key={demo.title}
                className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Waveform visualization */}
                <div className="h-28 bg-surface-container-low px-6 py-4 flex items-end gap-[3px] relative">
                  <div className="absolute top-4 left-6 flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${demo.color} flex items-center justify-center`}>
                      <Icon size={14} />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">{demo.outputType}</span>
                  </div>
                  {demo.bars.map((bar, index) => (
                    <div
                      key={`${demo.title}-${index}`}
                      className="flex-grow bg-primary/30 rounded-t-sm hover:bg-primary/50 transition-colors"
                      style={{ height: `${bar * 2.2}px` }}
                    ></div>
                  ))}
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-headline font-bold tracking-tight text-on-surface">{demo.title}</h3>
                    <p className="text-sm leading-relaxed text-on-surface-variant">{demo.description}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-outline">
                      <span className="flex items-center gap-1"><Clock size={10} /> {demo.duration}</span>
                      <span className="flex items-center gap-1"><Volume2 size={10} /> {demo.source}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary cursor-pointer hover:shadow-md hover:shadow-primary/25 transition-all">
                      <Play size={14} className="ml-0.5" />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex justify-center pt-4">
          <button
            onClick={onStartCreating}
            className="bg-primary-container text-on-primary-container px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:shadow-lg hover:shadow-primary/15 transition-all flex items-center gap-2"
          >
            Try It Yourself <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
