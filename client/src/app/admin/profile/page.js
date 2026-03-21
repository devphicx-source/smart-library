'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getDailyStats, getOccupancy, getAllFees, getAllStudents } from '@/lib/api';

export default function AdminProfile() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadStats();
  }, [user]);

  async function loadStats() {
    try {
      const [daily, occ, fees, students] = await Promise.all([
        getDailyStats(),
        getOccupancy(),
        getAllFees('', 1).catch(() => ({ data: { total: 0 } })),
        getAllStudents().catch(() => ({ data: { total: 0 } })),
      ]);
      setStats({
        studentsToday: daily.data?.uniqueStudents || 0,
        totalHours: daily.data?.totalHours || 0,
        totalDesks: occ.data?.total || 0,
        occupied: occ.data?.occupied || 0,
        totalFees: fees.data?.total || 0,
        totalStudents: students.data?.total || 0,
      });
    } catch (err) {
      console.error(err);
    }
  }

  if (!user) return null;

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
    : '—';

  const overviewCards = stats ? [
    { label: 'Total Students', value: stats.totalStudents, icon: '👥' },
    { label: 'Students Today', value: stats.studentsToday, icon: '📊' },
    { label: 'Study Hours Today', value: `${stats.totalHours}h`, icon: '⏱️' },
    { label: 'Desks Occupied', value: `${stats.occupied}/${stats.totalDesks}`, icon: '🪑' },
    { label: 'Total Fee Records', value: stats.totalFees, icon: '💰' },
  ] : [];

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* ═══ Profile Card ═══ */}
      <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-indigo-500/25 mb-4">
          {user.name?.charAt(0) || 'A'}
        </div>
        <h2 className="text-lg font-bold">{user.name}</h2>
        <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">{user.phone}</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] font-semibold text-purple-400">
            👑 Admin
          </span>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] mt-3">Managing since {joinDate}</p>
      </div>

      {/* ═══ Library Overview Stats ═══ */}
      {stats && (
        <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-5">
          <h3 className="text-sm font-semibold mb-4">📊 Library Overview</h3>
          <div className="space-y-2">
            {overviewCards.map((card) => (
              <div key={card.label} className="flex items-center justify-between py-2.5 border-b border-[var(--card-border)]/30 last:border-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{card.icon}</span>
                  <span className="text-[13px] text-[var(--text-secondary)]">{card.label}</span>
                </div>
                <span className="text-[14px] font-bold">{card.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Quick Links ═══ */}
      <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-5">
        <h3 className="text-sm font-semibold mb-3">⚡ Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Students', href: '/admin/students', icon: '👥' },
            { label: 'Fees', href: '/admin/fees', icon: '💰' },
            { label: 'Occupancy', href: '/admin/occupancy', icon: '🗺️' },
            { label: 'Analytics', href: '/admin/analytics', icon: '📈' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="flex items-center gap-2 p-3 rounded-xl
                bg-[var(--bg-primary)] border border-[var(--card-border)] text-[12px] text-[var(--text-secondary)] font-medium
                hover:bg-[var(--card-border)]/50 hover:border-[var(--card-border)] transition-all"
            >
              <span>{link.icon}</span>
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* ═══ Logout ═══ */}
      <button
        onClick={logout}
        className="w-full py-3 rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-2
          bg-red-500/8 border border-red-500/20 text-red-400
          hover:bg-red-500/15 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logout
      </button>
    </div>
  );
}
