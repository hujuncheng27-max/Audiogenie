/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Database, Film, Image as ImageIcon, CheckCircle, Terminal } from 'lucide-react';

interface UploadSectionProps {
  videoFile: File | null;
  setVideoFile: (f: File | null) => void;
  imageFile: File | null;
  setImageFile: (f: File | null) => void;
  prompt: string;
  setPrompt: (p: string) => void;
}

export function UploadSection({
  videoFile,
  setVideoFile,
  imageFile,
  setImageFile,
  prompt,
  setPrompt
}: UploadSectionProps) {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  return (
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
  );
}
