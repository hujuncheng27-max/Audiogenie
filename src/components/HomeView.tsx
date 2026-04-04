/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { ArrowRight, Clapperboard, Image as ImageIcon, Mic2, Music4, Sparkles } from 'lucide-react';

interface HomeViewProps {
  onStartCreating: () => void;
  onOpenHistory: () => void;
}

const demos = [
  {
    title: 'Video to cinematic sound effects',
    description: 'Upload action footage and generate tightly timed impacts, movement layers, and cinematic transitions.',
    outputType: 'Sound Effects',
    duration: '00:18.0s',
    icon: Clapperboard,
    bars: [14, 24, 18, 12, 22, 30, 28, 16, 10, 18, 26, 20],
  },
  {
    title: 'Image to ambient atmosphere',
    description: 'Turn a still frame into evolving ambience, weather layers, distant textures, and room tone.',
    outputType: 'Atmosphere',
    duration: '01:12.0s',
    icon: ImageIcon,
    bars: [6, 8, 10, 14, 12, 18, 22, 18, 14, 10, 8, 6],
  },
  {
    title: 'Text prompt to speech narration',
    description: 'Describe the voice, pacing, and tone to produce a stylized narration pass from text only.',
    outputType: 'Speech',
    duration: '00:24.0s',
    icon: Mic2,
    bars: [10, 18, 28, 12, 16, 24, 14, 22, 12, 18, 26, 16],
  },
  {
    title: 'Text prompt to background music',
    description: 'Prototype score beds, emotional themes, and loopable musical layers directly from a prompt.',
    outputType: 'Music',
    duration: '00:45.0s',
    icon: Music4,
    bars: [12, 16, 20, 24, 30, 26, 22, 18, 24, 28, 20, 14],
  },
];

export function HomeView({ onStartCreating, onOpenHistory }: HomeViewProps) {
  const examplesRef = useRef<HTMLElement | null>(null);

  return (
    <div className="p-8 md:p-12 max-w-[1600px] mx-auto w-full space-y-16">
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
        <div className="xl:col-span-7 bg-surface-container-lowest border border-outline-variant/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(194,170,255,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,170,95,0.12),transparent_30%)] pointer-events-none"></div>
          <div className="relative space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
              <Sparkles size={12} /> AI Audio Generation Studio
            </div>
            <div className="space-y-5 max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-headline font-extrabold uppercase tracking-tight text-on-surface leading-none">
                Shape sound from video, images, and text.
              </h1>
              <p className="text-base md:text-lg leading-relaxed text-on-surface-variant max-w-2xl">
                AudioGenie is an AI audio generation studio for speech, music, sound effects, and atmospheric layers.
                Upload a video, drop in an image, or write a prompt to build polished audio outputs in one workspace.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onStartCreating}
                className="bg-primary text-on-primary px-8 py-4 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-primary-container transition-all flex items-center justify-center gap-2"
              >
                Start Creating <ArrowRight size={16} />
              </button>
              <button
                onClick={() => examplesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="bg-surface-container-high text-on-surface px-8 py-4 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-surface-container transition-all"
              >
                View Examples
              </button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-5 grid grid-cols-1 gap-6">
          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/10">
            <p className="text-[10px] uppercase tracking-widest text-outline mb-3">How It Works</p>
            <div className="space-y-4">
              {[
                '1. Upload or describe your source',
                '2. Configure output class and sonic style',
                '3. Generate, inspect, and export the result',
              ].map((step) => (
                <div key={step} className="bg-surface-container-lowest rounded-xl px-4 py-4 text-sm text-on-surface-variant">
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/10">
            <p className="text-[10px] uppercase tracking-widest text-outline mb-4">No Account Required</p>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              Open the site, create outputs, and keep your history on this browser and device. You can browse local history now and swap in backend persistence later.
            </p>
            <button
              onClick={onOpenHistory}
              className="mt-5 text-[10px] uppercase tracking-widest font-bold text-primary hover:underline"
            >
              Open Local History
            </button>
          </div>
        </div>
      </section>

      <section ref={examplesRef} className="space-y-6">
        <div className="flex justify-between items-end border-b border-outline-variant/20 pb-4">
          <div>
            <h2 className="font-headline text-2xl md:text-3xl font-bold uppercase tracking-tight text-on-surface">Examples</h2>
            <p className="text-sm text-on-surface-variant mt-2">
              A few sample workflows you can create inside the current AudioGenie studio.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {demos.map((demo) => {
            const Icon = demo.icon;

            return (
              <article key={demo.title} className="bg-surface-container-low rounded-2xl border border-outline-variant/10 p-6 space-y-5">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2">
                    <div className="w-11 h-11 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-lg font-headline font-bold uppercase tracking-tight text-on-surface">{demo.title}</h3>
                    <p className="text-sm leading-relaxed text-on-surface-variant">{demo.description}</p>
                  </div>
                </div>
                <div className="h-24 bg-background/50 rounded-xl border border-outline-variant/10 px-4 py-3 flex items-end gap-[3px]">
                  {demo.bars.map((bar, index) => (
                    <div key={`${demo.title}-${index}`} className="flex-grow bg-primary/45 rounded-t-sm" style={{ height: `${bar * 2}px` }}></div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest">
                  <span className="text-outline">{demo.outputType}</span>
                  <span className="text-primary font-bold">{demo.duration}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
