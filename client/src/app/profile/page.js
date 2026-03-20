'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getLeaderboard, getActiveSession, checkOut } from '@/lib/api';
import { formatDuration } from '@/lib/utils';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [myRank, setMyRank] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    // Fetch rank
    getLeaderboard(100)
      .then((res) => {
        const me = res.data.find((e) => e.userId === user._id);
        setMyRank(me || null);
      })
      .catch(console.error);

    // Check active session
    getActiveSession()
      .then((res) => setHasActiveSession(!!res.data))
      .catch(() => setHasActiveSession(false));
  }, [user]);

  async function handleLogout() {
    if (hasActiveSession) {
      setShowLogoutConfirm(true);
      return;
    }
    logout();
  }

  async function confirmLogout() {
    setLogoutLoading(true);
    try {
      // Auto check-out before logging out
      await checkOut();
    } catch (err) {
      // Ignore — maybe session already ended
    }
    setLogoutLoading(false);
    logout();
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-[#080b16]"><div className="spinner" /></div>;
  }

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
    : '—';

  const stats = [
    { label: 'Rank', value: myRank ? `#${myRank.rank}` : '—', icon: '🏅' },
    { label: 'Streak', value: `${user.currentStreak || 0} days`, icon: '🔥' },
    { label: 'Best Streak', value: `${user.longestStreak || 0} days`, icon: '⭐' },
    { label: 'Total Study', value: formatDuration(user.totalStudyMinutes || 0), icon: '📚' },
  ];

  return (
    <div className="min-h-screen bg-[#080b16] text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#080b16]/80 border-b border-white/[0.06]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-sm font-bold text-white">Profile</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* ═══ Profile Card ═══ */}
        <div className="rounded-2xl bg-[#0f1328]/80 border border-white/[0.06] p-6 text-center">
          {/* Avatar */}
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-indigo-500/25 mb-4">
            {user.name?.charAt(0) || '?'}
          </div>

          <h2 className="text-lg font-bold text-white">{user.name}</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">{user.phone}</p>

          {/* Badges */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-semibold text-indigo-400">
              Student
            </span>
            {user.currentStreak >= 7 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-semibold text-amber-400">
                🔥 {user.currentStreak} Day Streak
              </span>
            )}
            {hasActiveSession && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                In Session
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-600 mt-3">Member since {joinDate}</p>
        </div>

        {/* ═══ Stats Grid ═══ */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-[#0f1328]/80 border border-white/[0.06] p-4 text-center">
              <div className="text-xl mb-1">{stat.icon}</div>
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ═══ Actions ═══ */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/leaderboard')}
            className="w-full py-3 rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-2
              bg-[#0f1328]/80 border border-white/[0.06] text-slate-300
              hover:bg-white/[0.04] transition-all"
          >
            🏅 View Full Leaderboard
          </button>

          <button
            onClick={handleLogout}
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
      </div>

      {/* ═══ Logout Confirmation Modal ═══ */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0f1328] border border-white/[0.08] p-6 shadow-2xl text-center">
            {/* Warning Icon */}
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl mb-4">
              ⚠️
            </div>

            <h2 className="text-[15px] font-bold text-white mb-2">Active Session Detected</h2>
            <p className="text-[12px] text-slate-400 leading-relaxed mb-5">
              You have an ongoing study session. Logging out will <span className="text-amber-400 font-semibold">automatically end your session</span> and save your progress.
            </p>
            <p className="text-[11px] text-slate-500 mb-5">Are you sure you want to logout?</p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold
                  bg-white/[0.04] border border-white/[0.06] text-slate-300
                  hover:bg-white/[0.08] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                disabled={logoutLoading}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold
                  bg-gradient-to-r from-red-500 to-red-600 text-white
                  hover:shadow-lg hover:shadow-red-500/25 transition-all
                  disabled:opacity-50"
              >
                {logoutLoading ? 'Ending session...' : 'Yes, Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
