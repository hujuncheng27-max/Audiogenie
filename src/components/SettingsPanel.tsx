import React from 'react';
import { X, Monitor, Volume2, Cpu, HardDrive } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="relative w-full max-w-sm h-full bg-surface-container border-l border-outline-variant/20 overflow-y-auto no-scrollbar"
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface-container z-10 flex items-center justify-between px-6 py-5 border-b border-outline-variant/15">
          <h2 className="font-headline text-lg font-bold uppercase tracking-tight text-on-surface">Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-outline hover:text-on-surface transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Audio Engine */}
          <section className="space-y-4">
            <h3 className="font-label text-[10px] uppercase tracking-widest text-outline flex items-center gap-2">
              <Volume2 size={12} /> Audio Engine
            </h3>
            <div className="space-y-3">
              <SettingRow label="Default Sample Rate">
                <select className="bg-surface-container-lowest border-none text-xs font-body p-2 rounded text-on-surface">
                  <option>44.1 kHz</option>
                  <option>48 kHz</option>
                  <option>96 kHz</option>
                </select>
              </SettingRow>
              <SettingRow label="Bit Depth">
                <select className="bg-surface-container-lowest border-none text-xs font-body p-2 rounded text-on-surface">
                  <option>16 bit</option>
                  <option>24 bit</option>
                  <option>32 bit</option>
                </select>
              </SettingRow>
              <SettingRow label="Output Channels">
                <select className="bg-surface-container-lowest border-none text-xs font-body p-2 rounded text-on-surface">
                  <option>Mono</option>
                  <option>Stereo</option>
                  <option>5.1 Surround</option>
                </select>
              </SettingRow>
            </div>
          </section>

          {/* Display */}
          <section className="space-y-4">
            <h3 className="font-label text-[10px] uppercase tracking-widest text-outline flex items-center gap-2">
              <Monitor size={12} /> Display
            </h3>
            <div className="space-y-3">
              <SettingRow label="Waveform Resolution">
                <select className="bg-surface-container-lowest border-none text-xs font-body p-2 rounded text-on-surface">
                  <option>Standard</option>
                  <option>High</option>
                  <option>Ultra</option>
                </select>
              </SettingRow>
              <SettingRow label="Animation Speed">
                <select className="bg-surface-container-lowest border-none text-xs font-body p-2 rounded text-on-surface">
                  <option>Normal</option>
                  <option>Fast</option>
                  <option>Reduced</option>
                </select>
              </SettingRow>
            </div>
          </section>

          {/* Processing */}
          <section className="space-y-4">
            <h3 className="font-label text-[10px] uppercase tracking-widest text-outline flex items-center gap-2">
              <Cpu size={12} /> Processing
            </h3>
            <div className="space-y-3">
              <SettingRow label="Max Concurrent Jobs">
                <select className="bg-surface-container-lowest border-none text-xs font-body p-2 rounded text-on-surface">
                  <option>1</option>
                  <option>2</option>
                  <option>4</option>
                </select>
              </SettingRow>
              <SettingRow label="Auto-Export on Complete">
                <ToggleSwitch />
              </SettingRow>
            </div>
          </section>

          {/* Storage */}
          <section className="space-y-4">
            <h3 className="font-label text-[10px] uppercase tracking-widest text-outline flex items-center gap-2">
              <HardDrive size={12} /> Storage
            </h3>
            <div className="space-y-3">
              <SettingRow label="Export Format">
                <select className="bg-surface-container-lowest border-none text-xs font-body p-2 rounded text-on-surface">
                  <option>WAV</option>
                  <option>FLAC</option>
                  <option>MP3 (320kbps)</option>
                </select>
              </SettingRow>
              <SettingRow label="Keep History">
                <select className="bg-surface-container-lowest border-none text-xs font-body p-2 rounded text-on-surface">
                  <option>Forever</option>
                  <option>30 Days</option>
                  <option>7 Days</option>
                </select>
              </SettingRow>
            </div>
          </section>

          {/* About */}
          <section className="pt-4 border-t border-outline-variant/15 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-outline">About</p>
            <p className="text-xs text-on-surface-variant">AudioGenie Synthesis Engine v4.2</p>
            <p className="text-[10px] text-outline">Build 2024.01 // MIT License</p>
          </section>
        </div>
      </motion.aside>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-surface-container-low rounded-lg px-4 py-3">
      <span className="text-xs text-on-surface-variant">{label}</span>
      {children}
    </div>
  );
}

function ToggleSwitch() {
  const [on, setOn] = React.useState(false);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`w-10 h-5 rounded-full relative transition-colors ${on ? 'bg-primary' : 'bg-surface-container-highest'}`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${on ? 'left-5 bg-on-primary' : 'left-0.5 bg-outline'}`}
      />
    </button>
  );
}
