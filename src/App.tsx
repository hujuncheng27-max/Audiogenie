/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { View, Artifact, GenerationPayload, ActiveGeneration } from './types';
import { TopNavBar } from './components/TopNavBar';
import { Footer } from './components/Footer';
import { Workspace } from './components/Workspace';
import { ProcessingView } from './components/ProcessingView';
import { ResultsView } from './components/ResultsView';
import { HistoryView } from './components/HistoryView';
import { DocsView } from './components/DocsView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getGenerations, createGeneration, pollGenerationStatus } from './services/api';

export default function App() {
  const [view, setView] = useState<View>('workspace');
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  const [activeGeneration, setActiveGeneration] = useState<ActiveGeneration | null>(null);

  // Fetch initial generations on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const data = await getGenerations();
        setArtifacts(data);
      } catch (error) {
        console.error('Failed to fetch initial generations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleGenerate = async (payload: GenerationPayload) => {
    setView('processing');
    
    try {
      const response = await createGeneration(payload);
      setActiveGeneration({
        id: response.id,
        status: response.status,
        payload,
      });
      const result = await pollGenerationStatus(response.id, (update) => {
        setActiveGeneration({
          id: update.id,
          status: update.status,
          payload,
        });
      });
      
      if (result.status === 'completed' && result.artifact) {
        const refreshedArtifacts = await getGenerations();
        setArtifacts(refreshedArtifacts);
        setActiveGeneration({
          id: result.id,
          status: result.status,
          payload,
        });
        setView('results');
      } else {
        console.error('Generation failed or returned incomplete data');
        alert('Generation did not complete successfully. Please try again.');
        setActiveGeneration(null);
        setView('workspace');
      }
    } catch (error) {
      console.error('Generation process failed:', error);
      alert(error instanceof Error ? error.message : 'Generation process failed. Please try again.');
      setActiveGeneration(null);
      setView('workspace');
    }
  };

  const handleNewGeneration = () => {
    setWorkspaceVersion((current) => current + 1);
    setActiveGeneration(null);
    setView('workspace');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary font-headline text-xl animate-pulse uppercase tracking-widest">Initializing Synthesis Engine...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary/30 flex flex-col">
      <TopNavBar currentView={view} setView={setView} />

      <ErrorBoundary>
      <main className="flex-grow flex flex-col">
        <AnimatePresence mode="wait">
          {view === 'workspace' && (
            <motion.div
              key={`workspace-${workspaceVersion}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-grow flex flex-col"
            >
              <Workspace 
                onGenerate={handleGenerate} 
                artifacts={artifacts}
                onNewGeneration={handleNewGeneration}
                onViewHistory={() => setView('history')}
              />
            </motion.div>
          )}
          {view === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="flex-grow flex flex-col"
            >
              <ProcessingView activeGeneration={activeGeneration} />
            </motion.div>
          )}
          {view === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-grow flex flex-col"
            >
              <ResultsView artifacts={artifacts} />
            </motion.div>
          )}
          {view === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-grow flex flex-col"
            >
              <HistoryView artifacts={artifacts} onOpenWorkspace={() => setView('workspace')} />
            </motion.div>
          )}
          {view === 'docs' && (
            <motion.div
              key="docs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-grow flex flex-col"
            >
              <DocsView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      </ErrorBoundary>

      <Footer />
    </div>
  );
}
