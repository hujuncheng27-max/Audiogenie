import React from 'react';
import { motion } from 'motion/react';
import { User, LogIn, Star, Clock, HelpCircle } from 'lucide-react';

interface UserMenuProps {
  open: boolean;
  onClose: () => void;
}

export function UserMenu({ open, onClose }: UserMenuProps) {
  if (!open) return null;

  return (
    <>
      {/* Invisible backdrop to close on click outside */}
      <div className="fixed inset-0 z-[90]" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute right-0 top-full mt-2 z-[100] w-64 bg-surface-container border border-outline-variant/20 rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Profile header */}
        <div className="p-5 border-b border-outline-variant/15 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">Guest User</p>
            <p className="text-[10px] text-outline uppercase tracking-widest">Free Tier</p>
          </div>
        </div>

        {/* Menu items */}
        <div className="p-2">
          <MenuItem icon={<LogIn size={14} />} label="Sign In" hint="Unlock full features" />
          <MenuItem icon={<Star size={14} />} label="Upgrade Plan" hint="Pro synthesis engine" />
          <MenuItem icon={<Clock size={14} />} label="Usage Stats" hint="3 generations today" />
          <MenuItem icon={<HelpCircle size={14} />} label="Help & Support" hint="Docs and FAQ" />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-outline-variant/15">
          <p className="text-[10px] text-outline uppercase tracking-widest">Session Active // 0 Credits Used</p>
        </div>
      </motion.div>
    </>
  );
}

function MenuItem({ icon, label, hint }: { icon: React.ReactNode; label: string; hint: string }) {
  return (
    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container-high transition-colors text-left group">
      <span className="text-outline group-hover:text-primary transition-colors">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-on-surface">{label}</p>
        <p className="text-[10px] text-outline">{hint}</p>
      </div>
    </button>
  );
}
