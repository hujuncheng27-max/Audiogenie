/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export function Footer() {
  return (
    <footer className="flex flex-col md:flex-row justify-between items-center px-12 gap-4 w-full py-8 mt-auto bg-surface-container-lowest border-t border-outline-variant/10">
      <p className="font-body text-[10px] uppercase tracking-widest text-outline">© 2024 AudioGenie. Precise Synthesis.</p>
      <div className="flex gap-6">
        <button className="font-body text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors">Privacy Policy</button>
        <button className="font-body text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors">Terms of Service</button>
        <button className="font-body text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors">Discord</button>
      </div>
    </footer>
  );
}
