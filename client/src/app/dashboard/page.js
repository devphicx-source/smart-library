'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  getActiveSession,
  checkIn,
  checkOut,
  getLeaderboard,
  getWeeklyTrend,
  getDesks,
  getMyFees,
  payFee,
  notifyPayment,
  startBreak,
  endBreak,
} from '@/lib/api';
import { formatDuration } from '@/lib/utils';

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // ── State ──
  const [session, setSession] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [desks, setDesks] = useState([]);
  const [showDeskPicker, setShowDeskPicker] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [fees, setFees] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);


  // ── Auth guard ──
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'student')) router.push('/');
  }, [user, authLoading, router]);

  // ── Load data ──
  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);

  async function loadAll() {
    try {
      const [s, l, w, f] = await Promise.all([
        getActiveSession(),
        getLeaderboard(5),
        getWeeklyTrend().catch(() => ({ data: [] })),
        getMyFees().catch(() => ({ data: [] })),
      ]);
      setSession(s.data);
      setLeaderboard(l.data);
      setWeeklyData(w.data || []);
      setFees(Array.isArray(f.data) ? f.data : f.data?.payments || []);
    } catch (err) {
      console.error(err);
    }
  }

  // ── Live timer ──
  useEffect(() => {
    if (!session) { setElapsed(0); return; }
    
    const checkInTime = new Date(session.checkIn).getTime();
    
    const tick = () => {
      const now = Date.now();
      let totalBreakMs = 0;
      
      if (session.breaks && session.breaks.length > 0) {
        session.breaks.forEach(b => {
          if (b.start && b.end) {
            totalBreakMs += (new Date(b.end) - new Date(b.start));
          } else if (b.start && !b.end) {
            totalBreakMs += (now - new Date(b.start));
          }
        });
      }
      
      const studyMs = (now - checkInTime) - totalBreakMs;
      setElapsed(Math.max(0, Math.floor(studyMs / 1000)));
    };

    tick();
    // Only run interval if session is active
    if (session.status === 'active') {
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }
  }, [session]);


  // ── Actions ──
  async function openDeskPicker() {
    try {
      const res = await getDesks();
      setDesks(res.data.desks);
      setShowDeskPicker(true);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCheckIn(deskId) {
    setActionLoading(true);
    setError('');
    try {
      await checkIn(deskId);
      setShowDeskPicker(false);
      const s = await getActiveSession();
      setSession(s.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    if (session.status === 'on-break') {
      if (!confirm('You are currently on break. Check out now?')) return;
    }
    setActionLoading(true);
    setError('');
    try {
      await checkOut();
      setSession(null);
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStartBreak() {
    setActionLoading(true);
    try {
      await startBreak();
      const s = await getActiveSession();
      setSession(s.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEndBreak() {
    setActionLoading(true);
    try {
      await endBreak();
      const s = await getActiveSession();
      setSession(s.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePayFee(payment) {
    setSelectedFee(payment);
    setShowPaymentModal(true);
  }

  async function handleConfirmPayment(transactionId) {
    if (!selectedFee) return;
    setActionLoading(true);
    setError('');
    try {
      await notifyPayment(selectedFee._id, { transactionId });
      setShowPaymentModal(false);
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // ── Helpers ──
  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  function fmtTimer(secs) {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return { h, m, s };
  }

  const totalWeeklyMinutes = weeklyData.reduce((sum, d) => sum + (d.minutes || 0), 0);
  const totalWeeklyHours = +(totalWeeklyMinutes / 60).toFixed(1);
  const weeklyGoal = 40;
  const weeklyPct = Math.min((totalWeeklyHours / weeklyGoal) * 100, 100);
  const maxDayMinutes = Math.max(...weeklyData.map((d) => d.minutes || 0), 1);
  const avgDaily = weeklyData.length ? +(totalWeeklyMinutes / weeklyData.length / 60).toFixed(1) : 0;
  const bestDay = weeklyData.reduce((best, d) => (d.minutes || 0) > (best.minutes || 0) ? d : best, weeklyData[0] || {});

  const pendingFee = fees.find((f) => f.status === 'pending' || f.status === 'overdue' || f.status === 'submitted');
  const lastPaidFee = [...fees]
    .filter(f => f.status === 'paid')
    .sort((a, b) => {
      const dateA = new Date(a.billingEndDate || a.dueDate || 0);
      const dateB = new Date(b.billingEndDate || b.dueDate || 0);
      return dateB - dateA;
    })[0];

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]"><div className="spinner" /></div>;
  }

  const t = session ? fmtTimer(elapsed) : null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* ═══ TOP HEADER ═══ */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[var(--bg-primary)]/80 border-b border-[var(--card-border)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-bold">
              {greeting()}, {user.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-[11px] text-[var(--text-secondary)]">Let&apos;s build your streak today 🔥</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-sm">🔥</span>
              <span className="text-[13px] font-bold text-amber-400">{user.currentStreak || 0}</span>
              <span className="text-[10px] text-amber-500/60">days</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold cursor-pointer
                hover:ring-2 hover:ring-indigo-400/50 transition-all"
              onClick={() => router.push('/profile')} title="Profile">
              {user.name?.charAt(0) || '?'}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>
        )}

        {/* ═══ SECTION 1: PRIMARY ACTION ═══ */}
        <div className={`
          rounded-2xl p-6 text-center relative overflow-hidden
          ${session
            ? 'bg-gradient-to-br from-emerald-900/30 to-emerald-950/30 border border-emerald-500/20'
            : 'bg-[var(--card-bg)] border border-[var(--card-border)]'
          }
        `}>
          {session && (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.05),transparent_70%)]" />
          )}
          <div className="relative z-10">
            {session ? (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
                  <span className={`w-2 h-2 rounded-full ${session.status === 'on-break' ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                  <span className={`text-[11px] font-semibold uppercase tracking-wider ${session.status === 'on-break' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {session.status === 'on-break' ? 'Session on Break' : 'Session Active'}
                  </span>
                </div>

                {/* Timer */}
                <div className="flex items-center justify-center gap-2 my-4">
                  {[t.h, t.m, t.s].map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {i > 0 && <span className="text-2xl text-slate-600 font-light animate-pulse">:</span>}
                      <div className="w-16 h-16 rounded-2xl bg-black/10 dark:bg-black/30 border border-[var(--card-border)] flex items-center justify-center">
                        <span className="text-3xl font-mono font-bold text-[var(--text-primary)] tabular-nums">{v}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[12px] text-[var(--text-secondary)] mb-5">
                  Desk #{session.desk?.deskNumber || '?'} · Section {session.desk?.section || '?'}
                </p>

                <div className="flex flex-wrap justify-center gap-3">
                  {session.status === 'active' ? (
                    <button
                      onClick={handleStartBreak}
                      disabled={actionLoading}
                      className="px-6 py-3 rounded-2xl text-sm font-bold
                        bg-amber-500/10 border border-amber-500/30 text-amber-500
                        hover:bg-amber-500/20 transition-all disabled:opacity-50"
                    >
                      ☕ Take a Break
                    </button>
                  ) : (
                    <button
                      onClick={handleEndBreak}
                      disabled={actionLoading}
                      className="px-6 py-3 rounded-2xl text-sm font-bold
                        bg-emerald-500/10 border border-emerald-500/30 text-emerald-500
                        hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                    >
                      ▶ Resume Session
                    </button>
                  )}

                  <button
                    onClick={handleCheckOut}
                    disabled={actionLoading}
                    className="px-6 py-3 rounded-2xl text-sm font-bold
                      bg-gradient-to-r from-red-500 to-red-600 text-white
                      hover:shadow-xl hover:shadow-red-500/25 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'Ending...' : '⏹ End Session'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl mb-3">📚</div>
                <h2 className="text-lg font-bold mb-1">Ready to study?</h2>
                <p className="text-[12px] text-[var(--text-secondary)] mb-5">Pick a desk and start your session</p>
                <button
                  onClick={openDeskPicker}
                  className="px-8 py-3.5 rounded-2xl text-sm font-bold
                    bg-gradient-to-r from-emerald-500 to-emerald-600 text-white
                    hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5
                    transition-all relative group"
                >
                  <span className="absolute inset-0 rounded-2xl bg-emerald-400/20 blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
                  <span className="relative">▶ Start Session</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ═══ SECTION 2: STREAK + PROGRESS ═══ */}
        <div className="grid grid-cols-2 gap-4">
          {/* Streak Card */}
          <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-5 text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
              {/* Progress Ring */}
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--card-border)" strokeWidth="6" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="url(#streakGrad)" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(user.currentStreak || 0, 30) / 30 * 264} 264`}
                />
                <defs>
                  <linearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-amber-400">{user.currentStreak || 0}</span>
                <span className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider">days</span>
              </div>
            </div>
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">🔥 Current Streak</p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Best: {user.longestStreak || 0} days</p>
          </div>

          {/* Today's Progress */}
          <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-5 flex flex-col justify-between">
            <div>
              <p className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wider font-medium mb-1">Today&apos;s Study</p>
              <p className="text-2xl font-bold">
                {formatDuration(user.totalStudyMinutes || 0)}
              </p>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] text-[var(--text-secondary)]">Weekly Goal</p>
                <p className="text-[11px] font-semibold text-indigo-400">{totalWeeklyHours}h / {weeklyGoal}h</p>
              </div>
              <div className="w-full bg-[var(--card-border)] rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                  style={{ width: `${weeklyPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 3: WEEKLY CHART ═══ */}
        <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-5">
          <h3 className="text-sm font-semibold mb-4">📈 This Week</h3>
          <div className="flex items-end gap-2 h-28">
            {(weeklyData.length > 0 ? weeklyData : Array.from({ length: 7 }, (_, i) => ({ day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i], minutes: 0 }))).map((day, i) => {
              const hrs = +((day.minutes || 0) / 60).toFixed(1);
              const pct = maxDayMinutes > 0 ? ((day.minutes || 0) / maxDayMinutes) * 100 : 0;
              const isToday = i === weeklyData.length - 1 && weeklyData.length > 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-slate-500 font-semibold">{hrs > 0 ? `${hrs}h` : ''}</span>
                  <div
                    className={`w-full rounded-lg transition-all duration-500 min-h-[4px] ${
                      isToday
                        ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-lg shadow-indigo-500/20'
                        : 'bg-gradient-to-t from-slate-700 to-slate-600'
                    }`}
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                  <span className={`text-[9px] font-medium ${isToday ? 'text-indigo-400' : 'text-slate-600'}`}>
                    {day.day || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i % 7]}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-6 mt-4 pt-3 border-t border-[var(--card-border)]">
            <div>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Avg Daily</p>
              <p className="text-sm font-bold">{avgDaily}h</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Best Day</p>
              <p className="text-sm font-bold">
                {bestDay?.day || '—'} ({+((bestDay?.minutes || 0) / 60).toFixed(1)}h)
              </p>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 4 + 5 + 6: BOTTOM GRID ═══ */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Leaderboard */}
          <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-5 flex flex-col">
            <h3 className="text-sm font-semibold mb-3">🏅 Leaderboard</h3>
            <div className="space-y-1.5 flex-1">
              {leaderboard.map((entry) => {
                const isMe = entry.userId === user._id;
                return (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-2.5 p-2 rounded-xl transition-all
                      ${isMe ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-[var(--card-border)]/50'}
                    `}
                  >
                    <span className={`
                      w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold
                      ${entry.rank === 1 ? 'bg-amber-500/15 text-amber-400' :
                        entry.rank === 2 ? 'bg-slate-400/10 text-slate-300' :
                        entry.rank === 3 ? 'bg-amber-700/15 text-amber-600' :
                        'bg-white/[0.03] text-slate-500'}
                    `}>
                      {entry.rank}
                    </span>
                    <span className="flex-1 text-[12px] text-[var(--text-secondary)] truncate">{entry.name}</span>
                    <span className="text-[11px] text-amber-400 font-bold">🔥 {entry.currentStreak}</span>
                    <span className="text-[11px] text-[var(--text-secondary)] w-8 text-right font-mono">{entry.totalStudyHours}h</span>
                  </div>
                );
              })}
            </div>
            <a
              href="/leaderboard"
              className="mt-3 pt-3 border-t border-white/[0.03] flex items-center justify-end gap-1
                text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              View All →
            </a>
          </div>


          {/* Fees */}
          <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold mb-3">💰 Fee Status</h3>
              {pendingFee ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`
                      inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase
                      ${pendingFee.status === 'overdue'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }
                    `}>
                      {pendingFee.status}
                    </span>
                  </div>
                  <p className="text-xl font-bold mb-1">₹{pendingFee.amount}</p>
                  <p className="text-[11px] text-[var(--text-secondary)] capitalize">{pendingFee.type} fee</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Due: {new Date(pendingFee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                  </p>
                  {lastPaidFee && (lastPaidFee.billingEndDate || lastPaidFee.dueDate) && (
                    <p className="text-[10px] text-emerald-500/80 font-medium mt-2 pt-2 border-t border-white/[0.03]">
                      Fees Paid Till: {new Date(lastPaidFee.billingEndDate || lastPaidFee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-2xl mb-2">✅</div>
                  <p className="text-[12px] text-slate-400 font-semibold text-emerald-400">All fees paid!</p>
                  {lastPaidFee && (lastPaidFee.billingEndDate || lastPaidFee.dueDate) && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Fees Paid Till: <span className="text-[var(--text-primary)] font-semibold">{new Date(lastPaidFee.billingEndDate || lastPaidFee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}</span>
                    </p>
                  )}
                  {!lastPaidFee && <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">You&apos;re all caught up</p>}
                </div>
              )}
            </div>
            {pendingFee && (
              <button
                onClick={() => handlePayFee(pendingFee)}
                disabled={actionLoading || pendingFee.status === 'submitted'}
                className={`mt-4 w-full py-2 rounded-xl text-[12px] font-semibold
                border transition-all disabled:opacity-50
                ${pendingFee.status === 'submitted' 
                  ? 'bg-indigo-500/5 border-indigo-500/10 text-indigo-400/50 cursor-not-allowed'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20'
                }`}
              >
                {actionLoading ? 'Processing...' : pendingFee.status === 'submitted' ? 'Payment Submitted' : 'Pay Now'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ DESK PICKER MODAL ═══ */}
      {showDeskPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-primary)] border border-[var(--card-border)] p-5 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold">Pick a Desk</h2>
              <button onClick={() => setShowDeskPicker(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-lg">✕</button>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
              {desks.map((d) => (
                <button
                  key={d._id}
                  disabled={d.isOccupied || actionLoading}
                  onClick={() => handleCheckIn(d._id)}
                  className={`
                    p-3 rounded-xl text-center text-xs font-bold transition-all
                    ${d.isOccupied
                      ? 'bg-red-500/10 border border-red-500/20 text-red-400/50 cursor-not-allowed'
                      : 'bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 cursor-pointer'
                    }
                  `}
                >
                  {d.deskNumber}
                </button>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500/30 border border-emerald-500/50" /> Available</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/30 border border-red-500/50" /> Occupied</span>
            </div>
          </div>
        </div>
      )}
      {/* ═══ PAYMENT MODAL ═══ */}
      {showPaymentModal && selectedFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--bg-primary)] border border-[var(--card-border)] p-6 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest">Pay Fee</h2>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                disabled={actionLoading}
              >✕</button>
            </div>

            <div className="text-center space-y-4">
              <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--card-border)]">
                <p className="text-[11px] text-[var(--text-secondary)] uppercase font-bold tracking-wider mb-1">Total Amount</p>
                <p className="text-3xl font-black">₹{selectedFee.amount}</p>
              </div>

              {/* QR Code */}
              <div className="p-4 bg-white rounded-2xl mx-auto w-fit">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=devphicx@upi&pn=SmartLibrary&am=${selectedFee.amount}&cu=INR&tn=Fee_${selectedFee._id}`)}`} 
                  alt="UPI QR Code"
                  className="w-40 h-40"
                />
              </div>

              <div className="space-y-1">
                <p className="text-[12px] font-bold">UPI ID: <span className="text-indigo-400">devphicx@upi</span></p>
                <p className="text-[10px] text-[var(--text-secondary)]">Scan QR or use the ID to pay via any UPI app</p>
              </div>

              {/* Deep Link Button */}
              <a 
                href={`upi://pay?pa=devphicx@upi&pn=SmartLibrary&am=${selectedFee.amount}&cu=INR&tn=Fee_${selectedFee._id}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white text-black text-sm font-bold hover:bg-slate-200 transition-all"
              >
                📱 Open UPI App
              </a>

              <div className="pt-2 border-t border-white/[0.05] space-y-3 text-left">
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">After Payment</p>
                <input 
                  type="text"
                  placeholder="Enter Transaction ID (Optional)"
                  id="txnIdInput"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-indigo-500 outline-none transition-all"
                />
                <button
                  onClick={() => handleConfirmPayment(document.getElementById('txnIdInput').value)}
                  disabled={actionLoading}
                  className="w-full py-3 rounded-2xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                >
                  {actionLoading ? 'Submitting...' : '✅ I have paid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
