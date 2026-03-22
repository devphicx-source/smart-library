'use language';

import { useLanguage } from '@/lib/language-context';

export default function LanguageToggle() {
  const { language, toggleLanguage, mounted } = useLanguage();

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--card-border)] shadow-sm">
      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mr-1 opacity-60">Lang</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => toggleLanguage('en')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
            language === 'en'
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-border)]/20'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => toggleLanguage('hi')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
            language === 'hi'
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-border)]/20'
          }`}
        >
          हिं
        </button>
      </div>
    </div>
  );
}
