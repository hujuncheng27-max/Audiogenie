/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { View, Artifact, GenerationPayload } from './types';
import { TopNavBar } from './components/TopNavBar';
import { Footer } from './components/Footer';
import { Workspace } from './components/Workspace';
import { ProcessingView } from './components/ProcessingView';
import { ResultsView } from './components/ResultsView';
import { getGenerations, createGeneration, pollGenerationStatus } from './services/api';

export default function App() {
  const [view, setView] = useState<View>('workspace');
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);

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
      // 1. Create the generation job
      const response = await createGeneration(payload);
      
      // 2. Poll for status (simulated polling logic)
      // In a real app, this might involve a loop or a websocket
      const result = await pollGenerationStatus(response.id);
      
      if (result.status === 'completed' && result.artifact) {
        setArtifacts(prev => [result.artifact!, ...prev]);
        setView('results');
      } else {
        // Handle failure
        console.error('Generation failed or returned incomplete data');
        setView('workspace');
      }
    } catch (error) {
      console.error('Generation process failed:', error);
      setView('workspace');
    }
  };

  const handleNewGeneration = async () => {
    // This is just a mock for adding a "new generation" manually
    // In a real app, this might just reset the workspace or trigger a default generation
    const mockPayload: GenerationPayload = {
      prompt: "Manual Generation",
      outputClass: "Music",
      languageModel: "English (Studio High-Def)",
      acousticStyle: "Industrial",
      duration: 30
    };
    
    try {
      const response = await createGeneration(mockPayload);
      const result = await pollGenerationStatus(response.id);
      if (result.artifact) {
        setArtifacts(prev => [result.artifact!, ...prev]);
      }
    } catch (error) {
      console.error('Manual generation failed:', error);
    }
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

      <main className="flex-grow flex flex-col">
        <AnimatePresence mode="wait">
          {view === 'workspace' && (
            <motion.div
              key="workspace"
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
              <ProcessingView />
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
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
