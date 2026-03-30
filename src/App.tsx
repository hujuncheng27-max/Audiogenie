/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { View, Artifact } from './types';
import { MOCK_ARTIFACTS } from './constants';
import { TopNavBar } from './components/TopNavBar';
import { Footer } from './components/Footer';
import { Workspace } from './components/Workspace';
import { ProcessingView } from './components/ProcessingView';
import { ResultsView } from './components/ResultsView';

export default function App() {
  const [view, setView] = useState<View>('workspace');
  const [artifacts, setArtifacts] = useState<Artifact[]>(MOCK_ARTIFACTS);

  const handleGenerate = () => {
    setView('processing');
    // Simulate generation delay
    setTimeout(() => {
      const newId = Date.now().toString();
      const newArtifact: Artifact = {
        id: newId,
        title: `Synthesis_${Math.floor(Math.random() * 1000)}`,
        type: 'SFX',
        duration: '00:15.0s',
        heights: Array.from({ length: 20 }, () => Math.floor(Math.random() * 10) + 2)
      };
      setArtifacts(prev => [newArtifact, ...prev]);
      setView('results');
    }, 5000);
  };

  const handleNewGeneration = () => {
    const newId = Date.now().toString();
    const newArtifact: Artifact = {
      id: newId,
      title: `Manual Gen_${Math.floor(Math.random() * 1000)}`,
      type: 'Music',
      duration: '00:30.0s',
      heights: Array.from({ length: 20 }, () => Math.floor(Math.random() * 10) + 2)
    };
    setArtifacts(prev => [newArtifact, ...prev]);
  };

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
