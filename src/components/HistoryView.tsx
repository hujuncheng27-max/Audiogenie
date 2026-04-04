/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Archive, ArrowDownAZ, ArrowUpAZ, CalendarClock, Download, Filter, Layers, Play, Search, Waves, X } from 'lucide-react';
import { Artifact } from '../types';
import { exportGeneration, getGenerationById } from '../services/api';

const ALL_TYPES = ['All', 'SFX', 'Speech', 'Music', 'Atmosphere'] as const;
type SortField = 'title' | 'type' | 'duration';
type SortDir = 'asc' | 'desc';

function parseDuration(d: string): number {
  // "00:12.4s" or "01:30.0s" → seconds as float
  const cleaned = d.replace(/s$/i, '');
  const parts = cleaned.split(':');
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(cleaned) || 0;
}

interface HistoryViewProps {
  artifacts: Artifact[];
  onOpenWorkspace: () => void;
}

export function HistoryView({ artifacts, onOpenWorkspace }: HistoryViewProps) {
  const [selectedTrack, setSelectedTrack] = useState(artifacts[0]?.id || '');
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(artifacts[0] || null);
  const [isExporting, setIsExporting] = useState(false);

  // Filter & sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const filteredArtifacts = useMemo(() => {
    let result = artifacts;

    // Type filter
    if (typeFilter !== 'All') {
      result = result.filter((a) => a.type === typeFilter);
    }

    // Search by title (case-insensitive)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((a) => a.title.toLowerCase().includes(q));
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (sortField === 'type') {
        cmp = a.type.localeCompare(b.type);
      } else if (sortField === 'duration') {
        cmp = parseDuration(a.duration) - parseDuration(b.duration);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [artifacts, typeFilter, searchQuery, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  useEffect(() => {
    if (artifacts.length === 0) {
      setSelectedTrack('');
      setSelectedArtifact(null);
      return;
    }

    const nextSelectedTrack = artifacts.some((artifact) => artifact.id === selectedTrack)
      ? selectedTrack
      : artifacts[0].id;

    setSelectedTrack(nextSelectedTrack);
    setSelectedArtifact(artifacts.find((artifact) => artifact.id === nextSelectedTrack) || artifacts[0]);
  }, [artifacts, selectedTrack]);

  useEffect(() => {
    if (!selectedTrack) {
      return;
    }

    let cancelled = false;

    const loadDetail = async () => {
      try {
        const response = await getGenerationById(selectedTrack);
        if (!cancelled && response.artifact) {
          setSelectedArtifact(response.artifact);
        }
      } catch (error) {
        console.error('Failed to load history detail:', error);
      }
    };

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedTrack]);

  const handleExport = async () => {
    if (!selectedTrack) {
      alert('No artifact is selected for export.');
      return;
    }

    setIsExporting(true);
    try {
      const response = await exportGeneration(selectedTrack);
      window.open(response.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('History export failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to export artifact.');
    } finally {
      setIsExporting(false);
    }
  };

  const hasActiveFilters = searchQuery.trim() !== '' || typeFilter !== 'All';

  return (
    <div className="p-8 md:p-12 max-w-[1600px] mx-auto w-full space-y-12">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-l-4 border-primary pl-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface uppercase">History</h1>
          <p className="text-on-surface-variant font-label text-sm tracking-widest uppercase">
            Archive Loaded // {artifacts.length} Stored Artifacts
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onOpenWorkspace}
            className="bg-surface-container-high text-on-surface px-6 py-3 rounded font-bold uppercase tracking-widest text-xs hover:bg-surface-container transition-all"
          >
            Back To Workspace
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !selectedTrack}
            className={`bg-primary text-on-primary px-8 py-3 rounded font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${isExporting || !selectedTrack ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-container'}`}
          >
            <Download size={16} /> {isExporting ? 'Exporting...' : 'Export Selected'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-4 space-y-6">
          {/* Archive Summary */}
          <div className="bg-surface-container p-6 rounded-xl space-y-4">
            <h2 className="font-label text-xs font-bold uppercase tracking-widest text-outline flex items-center gap-2">
              <Archive size={14} /> Archive Summary
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-lowest rounded-lg p-4">
                <p className="text-[10px] uppercase tracking-widest text-outline mb-2">Total</p>
                <p className="text-2xl font-headline font-bold text-on-surface">{artifacts.length}</p>
              </div>
              <div className="bg-surface-container-lowest rounded-lg p-4">
                <p className="text-[10px] uppercase tracking-widest text-outline mb-2">Showing</p>
                <p className="text-2xl font-headline font-bold text-on-surface">
                  {filteredArtifacts.length}
                  {hasActiveFilters && (
                    <span className="text-xs text-outline font-normal ml-1">/ {artifacts.length}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Search, Filter & Sort Controls */}
          <div className="bg-surface-container p-5 rounded-xl space-y-4">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title..."
                className="w-full bg-surface-container-lowest text-xs font-body text-on-surface pl-9 pr-8 py-2.5 rounded-lg border border-outline-variant/10 placeholder:text-outline/40 focus:outline-none focus:border-primary/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Type filter chips */}
            <div className="space-y-2">
              <p className="font-label text-[10px] uppercase tracking-widest text-outline flex items-center gap-1.5">
                <Filter size={10} /> Type
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider transition-all ${
                      typeFilter === t
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort buttons */}
            <div className="space-y-2">
              <p className="font-label text-[10px] uppercase tracking-widest text-outline flex items-center gap-1.5">
                {sortDir === 'asc' ? <ArrowDownAZ size={10} /> : <ArrowUpAZ size={10} />} Sort By
              </p>
              <div className="flex gap-1.5">
                {([['title', 'Title'], ['type', 'Type'], ['duration', 'Duration']] as const).map(([field, label]) => (
                  <button
                    key={field}
                    onClick={() => toggleSort(field)}
                    className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1 ${
                      sortField === field
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {label}
                    {sortField === field && (
                      <span className="text-[8px]">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear all filters */}
            {hasActiveFilters && (
              <button
                onClick={() => { setSearchQuery(''); setTypeFilter('All'); }}
                className="text-[10px] uppercase tracking-widest text-primary hover:underline font-bold"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Artifact list */}
          <div className="space-y-3 overflow-y-auto max-h-[480px] pr-2 no-scrollbar">
            {filteredArtifacts.length === 0 ? (
              <div className="bg-surface-container-low rounded-xl p-6 text-sm text-on-surface-variant text-center">
                {artifacts.length === 0
                  ? 'No completed generations yet. Create one from the workspace to populate the archive.'
                  : 'No artifacts match the current filters.'}
              </div>
            ) : (
              filteredArtifacts.map((artifact) => (
                <button
                  key={artifact.id}
                  onClick={() => setSelectedTrack(artifact.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selectedTrack === artifact.id ? 'bg-surface-container-high border-primary shadow-lg shadow-primary/5' : 'bg-surface-container-low border-outline-variant/10 hover:bg-surface-container hover:border-outline-variant/30'}`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-surface-container-highest rounded flex items-center justify-center text-primary">
                        <Waves size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-on-surface uppercase tracking-tight">{artifact.title}</h3>
                        <p className="text-[10px] text-outline uppercase tracking-widest">{artifact.type} // {artifact.duration}</p>
                      </div>
                    </div>
                    <Play size={14} className="text-outline" />
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="lg:col-span-8 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-outline-variant/10 pb-6 mb-8">
              <div>
                <h2 className="font-headline text-3xl font-bold uppercase tracking-tight text-on-surface">
                  {selectedArtifact?.title || 'No Artifact Selected'}
                </h2>
                <p className="font-label text-xs text-outline uppercase tracking-widest mt-2">
                  {selectedArtifact ? `${selectedArtifact.type} // ${selectedArtifact.duration}` : 'Select an artifact to inspect'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 min-w-[240px]">
                <div className="bg-surface-container-low rounded-lg p-4">
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Artifact ID</p>
                  <p className="font-mono text-xs text-on-surface">{selectedArtifact?.id || '-'}</p>
                </div>
                <div className="bg-surface-container-low rounded-lg p-4">
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Duration</p>
                  <p className="font-mono text-xs text-on-surface">{selectedArtifact?.duration || '-'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-background/40 rounded-xl p-6 border border-outline-variant/10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline flex items-center gap-2">
                    <Layers size={14} /> Waveform Snapshot
                  </h3>
                  <span className="text-[10px] bg-surface-container-highest px-2 py-1 rounded text-on-surface uppercase font-bold">Archive Preview</span>
                </div>
                <div className="h-56 w-full flex items-end gap-[3px]">
                  {(selectedArtifact?.heights || []).map((height, index) => (
                    <div
                      key={`${selectedArtifact?.id || 'artifact'}-${index}`}
                      className="flex-grow bg-primary/50 rounded-t-sm"
                      style={{ height: `${Math.max(height * 6, 8)}px` }}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-surface-container-low rounded-xl p-5">
                  <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline flex items-center gap-2">
                    <CalendarClock size={14} /> Metadata
                  </h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-outline uppercase text-[10px] tracking-widest">Type</span>
                      <span className="text-on-surface">{selectedArtifact?.type || '-'}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-outline uppercase text-[10px] tracking-widest">Track</span>
                      <span className="text-on-surface uppercase">{selectedArtifact?.title || '-'}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-outline uppercase text-[10px] tracking-widest">Bars</span>
                      <span className="text-on-surface">{selectedArtifact?.heights.length || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-xl p-5">
                  <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline">Notes</h3>
                  <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
                    This archive view is backed by the FastAPI history endpoints. Selecting a track refreshes its detail from the backend so the UI stays aligned with stored generation state.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
