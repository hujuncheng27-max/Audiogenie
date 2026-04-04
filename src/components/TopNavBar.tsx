/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Settings, User } from 'lucide-react';
import { View } from '../types';
import { SettingsPanel } from './SettingsPanel';
import { UserMenu } from './UserMenu';

interface TopNavBarProps {
  currentView: View;
  setView: (v: View) => void;
}

export function TopNavBar({ currentView, setView }: TopNavBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <>
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
              onClick={() => setView('history')}
              className={`text-sm tracking-wider transition-colors duration-200 ${currentView === 'history' ? 'text-primary border-b-2 border-primary pb-1' : 'text-outline hover:text-on-surface'}`}
            >
              History
            </button>
            <button
              onClick={() => setView('docs')}
              className={`text-sm tracking-wider transition-colors duration-200 ${currentView === 'docs' ? 'text-primary border-b-2 border-primary pb-1' : 'text-outline hover:text-on-surface'}`}
            >
              Docs
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setSettingsOpen(true); setUserMenuOpen(false); }}
            className={`transition-all duration-200 active:scale-95 ${settingsOpen ? 'text-primary' : 'text-outline hover:text-on-surface'}`}
          >
            <Settings size={20} />
          </button>
          <div className="relative">
            <button
              onClick={() => { setUserMenuOpen(!userMenuOpen); setSettingsOpen(false); }}
              className={`transition-all duration-200 active:scale-95 ${userMenuOpen ? 'text-primary' : 'text-outline hover:text-on-surface'}`}
            >
              <User size={20} />
            </button>
            <AnimatePresence>
              {userMenuOpen && <UserMenu open={userMenuOpen} onClose={() => setUserMenuOpen(false)} />}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {settingsOpen && <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
