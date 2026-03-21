'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  getDailyStats,
  getOccupancy,
  getLeaderboard,
  getAllFees,
  getRecentActivity,
  updateFee,
} from '@/lib/api';
import { formatTime } from '@/lib/utils';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [fees, setFees] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, [user]);

  async function loadAll() {
    try {
      const [s, o, l, f, a] = await Promise.all([
        getDailyStats(),
        getOccupancy(),
        getLeaderboard(5),
        getAllFees('pending', 1),
        getRecentActivity(),
      ]);
      setStats(s.data);
      setOccupancy(o.data);
      setLeaderboard(l.data);
      setFees(f.data.payments?.slice(0, 5) || []);
      setActivity(a.data?.slice(0, 8) || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    }
  }

  async function handleMarkPaid(id) {
    try {
      await updateFee(id, 'paid');
      loadAll();
    } catch (err) {
      console.error(err);
    }
  }

  if (!stats || !occupancy) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  const activeSessions = occupancy.occupied;
  const kpis = [
    {
      label: 'Students Today',
      value: stats.uniqueStudents || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      color: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/20',
    },
    {
      label: 'Active Sessions',
      value: activeSessions,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
        </svg>
      ),
      color: 'from-emerald-500 to-green-500',
      glow: 'shadow-emerald-500/20',
    },
    {
      label: 'Study Hours',
      value: stats.totalHours || 0,
      suffix: 'h',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-amber-500 to-orange-500',
      glow: 'shadow-amber-500/20',
    },
    {
      label: 'Desk Occupancy',
      value: `${occupancy.occupied}/${occupancy.total}`,
      sub: `${occupancy.occupancyRate}%`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      ),
      color: 'from-purple-500 to-pink-500',
      glow: 'shadow-purple-500/20',
    },
  ];

  const rankColors = ['text-amber-400', 'text-slate-300', 'text-amber-600'];

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* ═══ Section 1: KPI Cards ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`
              relative overflow-hidden rounded-2xl
              bg-[var(--card-bg)] border border-[var(--card-border)]
              p-4 lg:p-5 group
              hover:border-[var(--accent)]/50 hover:shadow-xl ${kpi.glow}
              transition-all duration-300 cursor-default
            `}
          >
            {/* Gradient accent line */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${kpi.color} opacity-60 group-hover:opacity-100 transition-opacity`} />

            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.color} bg-opacity-10 flex items-center justify-center text-white`}>
                {kpi.icon}
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-bold tracking-tight">
              {kpi.value}{kpi.suffix || ''}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] font-medium mt-1 uppercase tracking-wider">
              {kpi.label}
            </div>
            {kpi.sub && (
              <div className="text-xs text-indigo-400 mt-1 font-semibold">{kpi.sub} utilized</div>
            )}
          </div>
        ))}
      </div>

      {/* ═══ Section 2: Occupancy Grid + Leaderboard ═══ */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        {/* Desk Grid */}
        <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Live Occupancy</h3>
            <div className="flex items-center gap-4 text-[11px] text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500/50" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500/30 border border-red-500/50" /> Occupied
              </span>
            </div>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {occupancy.desks.map((desk) => (
              <div
                key={desk._id}
                className={`
                  relative group/desk p-2 rounded-xl text-center text-xs font-bold
                  transition-all duration-200
                  ${desk.isOccupied
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                    : 'bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 hover:scale-105'
                  }
                `}
              >
                {desk.deskNumber}
                {/* Tooltip */}
                {desk.isOccupied && desk.currentUser && (
                  <div className="absolute hidden group-hover/desk:block bottom-full left-1/2 -translate-x-1/2 mb-2 z-20
                    px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--card-border)]
                    text-[10px] text-[var(--text-primary)] whitespace-nowrap shadow-xl">
                    {desk.currentUser.name}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-[var(--card-border)]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-5">
          <h3 className="text-sm font-semibold mb-4">🏅 Top 5 Leaderboard</h3>
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div
                key={entry.rank}
                className={`
                  flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200
                  hover:bg-[var(--card-border)]/30
                `}
              >
                <div className={`
                  w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                  ${i === 0 ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30' :
                    i === 1 ? 'bg-slate-400/10 text-slate-500 border border-slate-400/20' :
                    i === 2 ? 'bg-amber-700/15 text-amber-600 border border-amber-700/20' :
                    'bg-[var(--card-border)]/5 text-[var(--text-secondary)] border border-[var(--card-border)]/30'}
                `}>
                  {entry.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">{entry.name}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-500 font-bold">🔥 {entry.currentStreak}</span>
                  <span className="text-[var(--text-secondary)] font-mono">{entry.totalStudyHours}h</span>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-center text-[var(--text-secondary)] text-xs py-8">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Section 3: Fees + Activity Feed ═══ */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Pending Fees */}
        <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">💰 Pending Fees</h3>
            <a href="/admin/fees" className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium">
              View All →
            </a>
          </div>
          <div className="space-y-2">
            {fees.map((fee) => (
              <div
                key={fee._id}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--card-border)]/50 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 text-xs font-bold">
                    ₹
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate">{fee.user?.name || '—'}</p>
                    <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                      Due {new Date(fee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}
                      <span className="mx-1.5">·</span>
                      <span className="capitalize">{fee.type}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">₹{fee.amount}</span>
                  <button
                    onClick={() => handleMarkPaid(fee._id)}
                    className="opacity-0 group-hover:opacity-100 px-2.5 py-1 rounded-lg
                      bg-emerald-500/10 border border-emerald-500/30 text-emerald-500
                      text-[11px] font-semibold hover:bg-emerald-500/20 transition-all"
                  >
                    ✓ Paid
                  </button>
                </div>
              </div>
            ))}
            {fees.length === 0 && (
              <div className="text-center py-8">
                <p className="text-[var(--text-secondary)] text-xs font-medium">No pending fees 🎉</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-5">
          <h3 className="text-sm font-semibold mb-4">⚡ Recent Activity</h3>
          <div className="space-y-1">
            {activity.map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-2.5 border-b border-[var(--card-border)]/30 last:border-0"
              >
                <div className="mt-0.5 text-sm">{a.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[var(--text-secondary)] font-medium leading-relaxed">{a.text}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]/60 mt-0.5">
                    {formatTime(a.time)}
                  </p>
                </div>
              </div>
            ))}
            {activity.length === 0 && (
              <p className="text-center text-[var(--text-secondary)] text-xs py-8">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
