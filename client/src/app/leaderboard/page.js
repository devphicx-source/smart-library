'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getLeaderboard } from '@/lib/api';

export default function StudentLeaderboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState([]);
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getLeaderboard(100)
      .then((res) => {
        setData(res.data);
        const me = res.data.find((e) => e.userId === user._id);
        setMyRank(me || null);
      })
      .catch(console.error);
  }, [user]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]"><div className="spinner" /></div>;
  }

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  const medalStyles = [
    { bg: 'from-amber-400 to-yellow-500', shadow: 'shadow-amber-500/30', border: 'border-amber-500/30', size: 'w-16 h-16 text-xl', height: 'pt-4' },
    { bg: 'from-slate-300 to-slate-400', shadow: 'shadow-slate-400/20', border: 'border-[var(--card-border)]', size: 'w-13 h-13 text-lg', height: 'pt-10' },
    { bg: 'from-amber-600 to-amber-700', shadow: 'shadow-amber-700/20', border: 'border-[var(--card-border)]', size: 'w-13 h-13 text-lg', height: 'pt-12' },
  ];

  // Reorder for podium: [2nd, 1st, 3rd]
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumStyles = top3.length >= 3 ? [medalStyles[1], medalStyles[0], medalStyles[2]] : medalStyles;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[var(--bg-primary)]/80 border-b border-[var(--card-border)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-border)] transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-sm font-bold">🏅 Leaderboard</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        {/* ═══ TOP 3 PODIUM ═══ */}
        {top3.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 items-end">
            {podiumOrder.map((entry, i) => {
              const style = podiumStyles[i];
              const isMe = entry.userId === user._id;
              return (
                <div
                  key={entry.rank}
                  className={`rounded-2xl bg-[var(--card-bg)] border ${style.border} p-4 ${style.height} text-center relative overflow-hidden
                    ${isMe ? 'ring-2 ring-indigo-500/40' : ''}
                  `}
                >
                  {/* Gold crown for #1 */}
                  {entry.rank === 1 && (
                    <div className="text-2xl mb-1">👑</div>
                  )}
                  {/* Medal badge */}
                  <div className={`${style.size} mx-auto rounded-2xl bg-gradient-to-br ${style.bg} flex items-center justify-center text-white font-bold shadow-lg ${style.shadow} mb-3`}>
                    {entry.rank}
                  </div>
                  <p className={`font-semibold truncate ${entry.rank === 1 ? 'text-[var(--text-primary)] text-[14px]' : 'text-[var(--text-secondary)] text-[13px]'}`}>
                    {entry.name}
                    {isMe && <span className="text-indigo-400 text-[10px] ml-1">(You)</span>}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2 text-xs">
                    <span className="text-amber-500 font-bold">🔥 {entry.currentStreak}</span>
                    <span className="text-[var(--text-secondary)]/50">·</span>
                    <span className="text-[var(--text-secondary)] font-medium font-mono">{entry.totalStudyHours}h</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ RANK 4+ TABLE ═══ */}
        {rest.length > 0 && (
          <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden">
            {rest.map((entry) => {
              const isMe = entry.userId === user._id;
              return (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-[var(--card-border)] last:border-0
                    transition-colors
                    ${isMe ? 'bg-indigo-500/8 border-l-2 border-l-indigo-500' : 'hover:bg-[var(--card-border)]/50'}
                  `}
                >
                  <span className="w-8 text-center text-[13px] font-mono text-[var(--text-secondary)]">
                    #{entry.rank}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-[11px] text-indigo-400 font-bold">
                    {entry.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">
                      {entry.name}
                      {isMe && <span className="text-indigo-400 text-[10px] ml-1">(You)</span>}
                    </p>
                  </div>
                  <span className="text-[12px] text-amber-400 font-semibold">🔥 {entry.currentStreak}</span>
                  <span className="text-[12px] text-[var(--text-secondary)] font-mono w-10 text-right">{entry.totalStudyHours}h</span>
                </div>
              );
            })}
          </div>
        )}

        {data.length === 0 && (
          <div className="text-center py-16">
            <div className="text-3xl mb-2">🏅</div>
            <p className="text-[var(--text-secondary)] text-sm">No leaderboard data yet</p>
          </div>
        )}
      </div>

      {/* ═══ STICKY BOTTOM: YOUR RANK ═══ */}
      {myRank && (
        <div className="fixed bottom-0 left-0 right-0 z-30
          bg-[var(--bg-secondary)]/95 backdrop-blur-xl border-t border-indigo-500/20
          shadow-[0_-4px_20px_rgba(99,102,241,0.1)]">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[12px] font-bold shadow-lg shadow-indigo-500/25">
              #{myRank.rank}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate">
                {myRank.name}
                <span className="text-indigo-400 text-[10px] ml-1.5 font-medium">Your Rank</span>
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">
                Best streak: {myRank.longestStreak || myRank.currentStreak} days
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-[14px] font-bold text-amber-500">🔥 {myRank.currentStreak}</p>
                <p className="text-[9px] text-[var(--text-secondary)] uppercase font-semibold">Streak</p>
              </div>
              <div className="text-center pl-3 border-l border-[var(--card-border)]">
                <p className="text-[14px] font-bold">{myRank.totalStudyHours}h</p>
                <p className="text-[9px] text-[var(--text-secondary)] uppercase font-semibold">Total</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
