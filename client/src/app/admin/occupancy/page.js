'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getOccupancy } from '@/lib/api';

export default function OccupancyPage() {
  const { user } = useAuth();
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
      <div className="flex items-center gap-6 flex-wrap">
        <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] px-5 py-3">
          <span className="text-xl font-bold text-indigo-400">{data.occupied}</span>
          <span className="text-[var(--text-secondary)] text-xl font-light mx-1">/</span>
          <span className="text-xl font-bold">{data.total}</span>
          <span className="text-xs text-[var(--text-secondary)] ml-2">occupied</span>
        </div>
        <div className="flex-1 max-w-xs">
          <div className="w-full bg-[var(--card-border)]/50 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-700"
              style={{ width: `${data.occupancyRate}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-600 mt-1">{data.occupancyRate}% utilized</p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500/50" /> Available ({data.available})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500/30 border border-red-500/50" /> Occupied ({data.occupied})
          </span>
        </div>
      </div>

      {/* Desk Grid by Section */}
      {Object.entries(sections).map(([section, desks]) => (
        <div key={section} className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-5">
          <h3 className="text-sm font-semibold mb-3">Section {section}</h3>
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

      <p className="text-[10px] text-[var(--text-secondary)]/60 text-center">Auto-refreshes every 10s</p>
    </div>
  );
}
