/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Play, Pause, Download, Share2, MoreHorizontal, ChevronRight, Layers, Maximize2, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { Artifact } from '../types';
import { TrackCard } from './TrackCard';
import { exportGeneration, getGenerationById } from '../services/api';

interface ResultsViewProps {
  artifacts: Artifact[];
}

export function ResultsView({ artifacts }: ResultsViewProps) {
  const [selectedTrack, setSelectedTrack] = useState(artifacts[0]?.id || '1');
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [iteration, setIteration] = useState('A');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(artifacts[0] || null);

  useEffect(() => {
    if (artifacts.length === 0) {
      setSelectedTrack('');
      setSelectedArtifact(null);
      return;
    }

    const selectedStillExists = artifacts.some((artifact) => artifact.id === selectedTrack);
    if (!selectedTrack || !selectedStillExists) {
      setSelectedTrack(artifacts[0].id);
      setSelectedArtifact(artifacts[0]);
    }
  }, [artifacts, selectedTrack]);

  useEffect(() => {
    if (!selectedTrack) {
      return;
    }

    const fallbackArtifact = artifacts.find((artifact) => artifact.id === selectedTrack) || null;
    setSelectedArtifact(fallbackArtifact);

    let isCancelled = false;

    const loadGenerationDetail = async () => {
      try {
        const response = await getGenerationById(selectedTrack);
        if (!isCancelled && response.artifact) {
          setSelectedArtifact(response.artifact);
        }
      } catch (error) {
        console.error('Failed to load generation detail:', error);
      }
    };

    loadGenerationDetail();

    return () => {
      isCancelled = true;
    };
  }, [artifacts, selectedTrack]);

  const togglePlay = (id: string) => {
    setPlayingTrack(playingTrack === id ? null : id);
  };

  const handleExport = async () => {
    if (!selectedTrack) {
      alert('No generated track is available to export yet.');
      return;
    }

    setIsExporting(true);
    try {
      const res = await exportGeneration(selectedTrack);
      window.open(res.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export master. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8 md:p-12 max-w-[1600px] mx-auto w-full space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-l-4 border-primary pl-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface uppercase">Synthesis Results</h1>
          <p className="text-on-surface-variant font-label text-sm tracking-widest uppercase">Batch ID: GEN-992A-X // 4 Artifacts Generated</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-surface-container-high text-on-surface px-6 py-3 rounded font-bold uppercase tracking-widest text-xs hover:bg-surface-container transition-all flex items-center gap-2">
            <Share2 size={16} /> Share Batch
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className={`bg-primary text-on-primary px-8 py-3 rounded font-bold uppercase tracking-widest text-xs transition-all shadow-lg shadow-primary/20 flex items-center gap-2 ${isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-container'}`}
          >
            <Download size={16} /> {isExporting ? 'Exporting...' : 'Export Master'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Track List */}
        <section className="lg:col-span-4 space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-label text-xs font-bold uppercase tracking-widest text-outline flex items-center gap-2">
              <Layers size={14} /> Generated Tracks
            </h2>
            <span className="text-[10px] bg-surface-container-highest px-2 py-1 rounded text-on-surface uppercase font-bold">48kHz / 24bit</span>
          </div>
          
          <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 no-scrollbar">
            {artifacts.map((art) => (
              <TrackCard 
                key={art.id}
                id={art.id}
                title={art.title}
                type={art.type}
                duration={art.duration}
                active={selectedTrack === art.id}
                playing={playingTrack === art.id}
                onSelect={() => setSelectedTrack(art.id)}
                onTogglePlay={() => togglePlay(art.id)}
              />
            ))}
          </div>
        </section>

        {/* Center: Master Preview */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-8 h-full flex flex-col shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
              <Maximize2 size={20} className="text-outline cursor-pointer hover:text-primary" />
            </div>
            
            <div className="flex-grow flex flex-col justify-center items-center gap-12">
              <div className="relative">
                <div className={`absolute inset-0 bg-primary/20 blur-3xl rounded-full transition-all duration-1000 ${playingTrack === 'master' ? 'scale-150 opacity-100' : 'scale-50 opacity-0'}`}></div>
                <button 
                  onClick={() => togglePlay('master')}
                  className="w-24 h-24 rounded-full bg-primary text-on-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                  {playingTrack === 'master' ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" />}
                </button>
              </div>
              <div className="text-center">
                <h3 className="font-headline text-2xl font-bold mb-1 uppercase tracking-tight text-on-surface">
                  {selectedArtifact?.title || 'Final Mix'}
                </h3>
                <p className="font-label text-xs text-outline uppercase tracking-widest">
                  {(selectedArtifact?.type || 'Master Output')} // {selectedArtifact?.duration || '00:00.0s'}
                </p>
              </div>
              
              <div className="w-full space-y-4">
                <div className="flex justify-between items-end">
                  <span className="font-mono text-[10px] text-outline">01:12.04</span>
                  <div className="flex gap-1 items-end h-8">
                    {[4, 8, 12, 16, 24, 20, 14, 10, 12, 18, 22, 16, 12, 8, 4].map((h, i) => (
                      <motion.div 
                        key={i} 
                        className="w-1 bg-primary/40 rounded-t-sm"
                        animate={playingTrack === 'master' ? { height: [`${h}px`, `${h*1.5}px`, `${h}px`] } : { height: `${h}px` }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[10px] text-outline">-01:32.96</span>
                </div>
                <div className="h-1 bg-surface-container-highest w-full relative rounded-full overflow-hidden">
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-primary"
                    animate={playingTrack === 'master' ? { width: ['0%', '100%'] } : { width: '40%' }}
                    transition={playingTrack === 'master' ? { duration: 165, ease: "linear" } : { duration: 0 }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 pt-8 border-t border-outline-variant/10">
              <div className="text-center">
                <span className="block font-label text-[9px] uppercase text-outline mb-1">Loudness</span>
                <span className="font-mono text-xs text-on-surface">-14.2 LUFS</span>
              </div>
              <div className="text-center">
                <span className="block font-label text-[9px] uppercase text-outline mb-1">Peak</span>
                <span className="font-mono text-xs text-on-surface">-1.0 dBTP</span>
              </div>
              <div className="text-center">
                <span className="block font-label text-[9px] uppercase text-outline mb-1">Dynamic</span>
                <span className="font-mono text-xs text-on-surface">8.4 DR</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Analysis & Comparison */}
        <section className="lg:col-span-3 space-y-6">
          <div className="bg-surface-container p-6 rounded-xl space-y-6">
            <h2 className="font-label text-xs font-bold uppercase tracking-widest text-outline flex items-center gap-2">
              <Activity size={14} /> Side-by-Side
            </h2>
            <div className="flex bg-surface-container-highest p-1 rounded-lg">
              <button 
                onClick={() => setIteration('A')}
                className={`flex-grow py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${iteration === 'A' ? 'bg-surface text-primary shadow-sm' : 'text-outline hover:text-on-surface'}`}
              >
                Iteration A
              </button>
              <button 
                onClick={() => setIteration('B')}
                className={`flex-grow py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${iteration === 'B' ? 'bg-surface text-primary shadow-sm' : 'text-outline hover:text-on-surface'}`}
              >
                Iteration B
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-on-surface uppercase tracking-tighter">Spectral Match</span>
                  <span className="text-xs font-mono text-primary">94.2%</span>
                </div>
                <div className="h-1 bg-surface-container-highest w-full rounded-full overflow-hidden">
                  <div className="h-full w-[94%] bg-primary"></div>
                </div>
              </div>
              <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-on-surface uppercase tracking-tighter">Temporal Alignment</span>
                  <span className="text-xs font-mono text-tertiary">88.7%</span>
                </div>
                <div className="h-1 bg-surface-container-highest w-full rounded-full overflow-hidden">
                  <div className="h-full w-[88%] bg-tertiary"></div>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <h3 className="font-label text-[10px] uppercase text-outline tracking-widest">Multi-Track Synchronization</h3>
              <div className="flex items-end gap-1 h-20 px-2">
                {artifacts.map((art, i) => (
                  <div 
                    key={art.id} 
                    className={`flex-grow rounded-t-sm transition-all duration-300 ${selectedTrack === art.id ? 'bg-primary' : 'bg-outline/20'}`}
                    style={{ height: `${20 + (i * 15)}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 flex flex-col gap-4">
            <h2 className="font-label text-[10px] uppercase text-outline tracking-widest">Next Steps</h2>
            <button className="w-full bg-surface-container-high hover:bg-surface-container text-on-surface py-3 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex justify-between items-center px-4">
              Refine Selected Track <ChevronRight size={14} />
            </button>
            <button className="w-full bg-surface-container-high hover:bg-surface-container text-on-surface py-3 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex justify-between items-center px-4">
              Apply Spatial Filter <ChevronRight size={14} />
            </button>
            <button className="w-full bg-surface-container-high hover:bg-surface-container text-on-surface py-3 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex justify-between items-center px-4">
              Add to Timeline <ChevronRight size={14} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
