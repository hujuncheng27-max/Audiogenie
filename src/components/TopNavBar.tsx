/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Settings, User } from 'lucide-react';
import { View } from '../types';

interface TopNavBarProps {
  currentView: View;
  setView: (v: View) => void;
}

export function TopNavBar({ currentView, setView }: TopNavBarProps) {
  return (
    <nav className="flex justify-between items-center w-full px-12 h-20 bg-background sticky top-0 z-50 border-b border-outline-variant/10">
      <div className="flex items-center gap-8">
        <span className="text-xl font-black tracking-tighter text-on-surface font-headline uppercase cursor-pointer" onClick={() => setView('workspace')}>
          AudioGenie
        </span>
        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => setView('workspace')}
            className={`text-sm tracking-wider transition-colors duration-200 ${currentView === 'workspace' ? 'text-primary border-b-2 border-primary pb-1' : 'text-outline hover:text-on-surface'}`}
          >
            Workspace
          </button>
          <button 
            onClick={() => setView('results')}
            className={`text-sm tracking-wider transition-colors duration-200 ${currentView === 'results' ? 'text-primary border-b-2 border-primary pb-1' : 'text-outline hover:text-on-surface'}`}
          >
            History
          </button>
          <button className="text-outline font-body text-sm tracking-wider hover:text-on-surface transition-colors duration-200">
            Docs
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-outline hover:text-on-surface transition-all duration-200 active:scale-95">
          <Settings size={20} />
        </button>
        <button className="text-outline hover:text-on-surface transition-all duration-200 active:scale-95">
          <User size={20} />
        </button>
      </div>
    </nav>
  );
}
