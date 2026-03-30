/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BarChart3 } from 'lucide-react';

interface JobSummarySectionProps {
  prompt: string;
  videoFile: File | null;
  imageFile: File | null;
  outputClass: string;
  acousticStyle: string;
  onGenerate: () => void;
}

export function JobSummarySection({
  prompt,
  videoFile,
  imageFile,
  outputClass,
  acousticStyle,
  onGenerate
}: JobSummarySectionProps) {
  return (
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
  );
}
