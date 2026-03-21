'use language';

import { useLanguage } from '@/lib/language-context';

export default function LanguageToggle() {
  const { language, toggleLanguage, t, mounted } = useLanguage();

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--card-border)]">
      <button
        onClick={() => toggleLanguage('en')}
        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
          language === 'en'
            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => toggleLanguage('hi')}
        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
          language === 'hi'
            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
      >
        हिं
      </button>
    </div>
  );
}
