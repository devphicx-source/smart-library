'use client';

import { useTheme } from '@/lib/theme-context';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all flex items-center gap-2 text-sm font-medium"
      aria-label="Toggle Theme"
    >
      {theme === 'light' ? (
        <>
          <span className="text-lg">🌙</span>
          <span className="text-slate-600">Switch to Dark</span>
        </>
      ) : (
        <>
          <span className="text-lg">☀️</span>
          <span className="text-slate-300">Switch to Light</span>
        </>
      )}
    </button>
  );
}
