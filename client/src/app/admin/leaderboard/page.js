'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getLeaderboard } from '@/lib/api';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    getLeaderboard(50)
      .then((res) => setData(res.data))
      .catch(console.error);
  }, [user]);

  const medalColors = [
    'from-amber-400 to-yellow-500 shadow-amber-500/30',
    'from-slate-300 to-slate-400 shadow-slate-400/20',
    'from-amber-600 to-amber-700 shadow-amber-700/20',
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Podium — Top 3 */}
      {data.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 items-end">
          {/* 2nd place */}
          <div className="rounded-2xl bg-[#0f1328]/80 border border-white/[0.06] p-5 text-center pt-8">
            <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${medalColors[1]} flex items-center justify-center text-white text-lg font-bold shadow-lg mb-3`}>
              2
            </div>
            <p className="font-semibold text-slate-200 text-sm">{data[1].name}</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs">
              <span className="text-amber-400 font-semibold">🔥 {data[1].currentStreak}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{data[1].totalStudyHours}h</span>
            </div>
          </div>

          {/* 1st place */}
          <div className="rounded-2xl bg-[#0f1328]/80 border border-amber-500/20 p-5 text-center pt-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 to-yellow-500" />
            <div className="text-2xl mb-2">👑</div>
            <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${medalColors[0]} flex items-center justify-center text-white text-xl font-bold shadow-lg mb-3`}>
              1
            </div>
            <p className="font-bold text-white text-base">{data[0].name}</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-sm">
              <span className="text-amber-400 font-bold">🔥 {data[0].currentStreak}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300 font-semibold">{data[0].totalStudyHours}h</span>
            </div>
          </div>

          {/* 3rd place */}
          <div className="rounded-2xl bg-[#0f1328]/80 border border-white/[0.06] p-5 text-center pt-10">
            <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${medalColors[2]} flex items-center justify-center text-white text-lg font-bold shadow-lg mb-3`}>
              3
            </div>
            <p className="font-semibold text-slate-200 text-sm">{data[2].name}</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs">
              <span className="text-amber-400 font-semibold">🔥 {data[2].currentStreak}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{data[2].totalStudyHours}h</span>
            </div>
          </div>
        </div>
      )}

      {/* Full Table */}
      <div className="rounded-2xl bg-[#0f1328]/80 border border-white/[0.06] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
              <th className="text-center py-3 px-4 font-medium w-16">Rank</th>
              <th className="text-left py-3 px-4 font-medium">Student</th>
              <th className="text-center py-3 px-4 font-medium">Current Streak</th>
              <th className="text-center py-3 px-4 font-medium">Best Streak</th>
              <th className="text-center py-3 px-4 font-medium">Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry, i) => (
              <tr
                key={entry.rank}
                className={`
                  border-b border-white/[0.03] transition-colors
                  ${i < 3 ? 'bg-white/[0.02] hover:bg-white/[0.04]' : 'hover:bg-white/[0.02]'}
                `}
              >
                <td className="py-3 px-4 text-center">
                  {i < 3 ? (
                    <span className={`
                      inline-flex w-7 h-7 rounded-lg items-center justify-center text-xs font-bold
                      ${i === 0 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        i === 1 ? 'bg-slate-400/10 text-slate-300 border border-slate-400/20' :
                        'bg-amber-700/15 text-amber-600 border border-amber-700/20'}
                    `}>
                      {entry.rank}
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono">#{entry.rank}</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-[11px] text-indigo-400 font-bold">
                      {entry.name?.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-200">{entry.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-amber-400 font-semibold">🔥 {entry.currentStreak}</span>
                </td>
                <td className="py-3 px-4 text-center text-slate-400">{entry.longestStreak}</td>
                <td className="py-3 px-4 text-center">
                  <span className="font-mono font-semibold text-white">{entry.totalStudyHours}h</span>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-slate-600 text-xs">No data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
