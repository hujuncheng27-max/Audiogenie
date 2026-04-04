import React from 'react';
import { AlertCircle, CheckCircle2, Info, Sparkles, X } from 'lucide-react';
import { AppNotice } from '../types';

interface AppNoticeBannerProps {
  notice: AppNotice;
  demoModeEnabled: boolean;
  onDismiss: () => void;
}

const toneStyles: Record<AppNotice['tone'], string> = {
  info: 'border-primary/30 bg-primary/10 text-on-surface',
  success: 'border-tertiary/30 bg-tertiary/10 text-on-surface',
  warning: 'border-secondary-fixed-dim/30 bg-secondary-fixed-dim/10 text-on-surface',
  error: 'border-destructive/30 bg-destructive/10 text-on-surface',
};

const toneIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: AlertCircle,
};

export function AppNoticeBanner({ notice, demoModeEnabled, onDismiss }: AppNoticeBannerProps) {
  const Icon = toneIcons[notice.tone];

  return (
    <div className="px-8 md:px-12 pt-6">
      <div className={`max-w-[1600px] mx-auto rounded-2xl border px-5 py-4 flex items-start justify-between gap-4 ${toneStyles[notice.tone]}`}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-background/40 flex items-center justify-center shrink-0">
            <Icon size={18} className={notice.tone === 'warning' ? 'text-secondary-fixed-dim' : notice.tone === 'success' ? 'text-tertiary' : notice.tone === 'error' ? 'text-destructive' : 'text-primary'} />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs uppercase tracking-widest font-bold">{notice.title}</p>
              {demoModeEnabled && (
                <span className="inline-flex items-center gap-1 rounded-full bg-background/40 px-2 py-1 text-[10px] uppercase tracking-widest text-secondary-fixed-dim font-bold">
                  <Sparkles size={10} /> Demo Mode Ready
                </span>
              )}
            </div>
            <p className="text-sm text-on-surface-variant">{notice.message}</p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-outline hover:text-on-surface transition-colors shrink-0"
          aria-label="Dismiss notice"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
