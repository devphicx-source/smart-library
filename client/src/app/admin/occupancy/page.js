'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getOccupancy } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';

export default function OccupancyPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadOccupancy();
    const interval = setInterval(loadOccupancy, 10000);
    return () => clearInterval(interval);
  }, [user]);

  async function loadOccupancy() {
    try {
      const res = await getOccupancy();
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  const sections = {};
  data.desks.forEach((d) => {
    const sec = d.section || 'General';
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push(d);
  });

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-black text-indigo-400">{data.occupied}</div>
          <div className="h-8 w-[1px] bg-[var(--card-border)]" />
          <div className="flex flex-col">
            <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold">{t('total_desks')}</span>
            <span className="text-sm font-bold">{data.total}</span>
          </div>
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-[var(--text-secondary)] uppercase tracking-wider">{t('occupancy_rate')}</span>
            <span className="text-indigo-400">{data.occupancyRate}%</span>
          </div>
          <div className="w-full bg-[var(--card-border)]/50 rounded-full h-2.5 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.3)]"
              style={{ width: `${data.occupancyRate}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--card-border)]/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.2)]" />
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] text-[var(--text-secondary)] uppercase font-bold tracking-tighter">{t('available')}</span>
              <span className="text-[13px] font-black">{data.available}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.2)]" />
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] text-[var(--text-secondary)] uppercase font-bold tracking-tighter">{t('occupied')}</span>
              <span className="text-[13px] font-black">{data.occupied}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desk Grid by Section */}
      {Object.entries(sections).map(([section, desks]) => (
        <div key={section} className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-5">
          <h3 className="text-sm font-semibold mb-3">{t('section_label')} {section}</h3>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
            {desks.map((desk) => (
              <div
                key={desk._id}
                className={`
                  relative group p-3 rounded-xl text-center transition-all duration-200
                  ${desk.isOccupied
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                    : 'bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 hover:scale-105'
                  }
                `}
              >
                <div className="text-sm font-bold">{desk.deskNumber}</div>
                {desk.isOccupied && desk.currentUser && (
                  <div className="text-[9px] text-red-400/60 mt-0.5 truncate">{desk.currentUser.name}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <p className="text-[10px] text-[var(--text-secondary)]/60 text-center">{t('auto_refresh')}</p>
    </div>
  );
}
