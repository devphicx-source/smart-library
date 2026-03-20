'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getAnalytics } from '@/lib/api';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    getAnalytics()
      .then((res) => setData(res.data))
      .catch(console.error);
  }, [user]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  const { chart, summary } = data;
  const maxSessions = Math.max(...chart.map((d) => d.sessions), 1);
  const maxHours = Math.max(...chart.map((d) => d.hours), 1);

  const summaryCards = [
    { label: 'Total Students', value: summary.totalStudents, icon: '👥', color: 'from-blue-500 to-cyan-500' },
    { label: 'Active Students', value: summary.activeStudents, icon: '✅', color: 'from-emerald-500 to-green-500' },
    { label: 'Avg Streak', value: summary.avgStreak, icon: '🔥', color: 'from-amber-500 to-orange-500' },
    { label: 'Max Streak', value: summary.maxStreak, icon: '🏆', color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-[#0f1328]/80 border border-white/[0.06] p-4 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.color} opacity-60`} />
            <div className="text-xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold text-white">{card.value}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1 uppercase tracking-wider">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Peak Day Highlight */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-4 flex items-center gap-4">
        <div className="text-2xl">📊</div>
        <div>
          <p className="text-sm font-semibold text-slate-200">
            Peak Day: <span className="text-indigo-400">{summary.peakDay}</span>
          </p>
          <p className="text-[11px] text-slate-500">{summary.peakSessions} sessions recorded — busiest day in the last 7 days</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Sessions Bar Chart */}
        <div className="rounded-2xl bg-[#0f1328]/80 border border-white/[0.06] p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">📈 Daily Sessions (7 days)</h3>
          <div className="flex items-end gap-2 h-36">
            {chart.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-400 font-semibold">{day.sessions}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-500 min-h-[4px]"
                  style={{ height: `${(day.sessions / maxSessions) * 100}%` }}
                />
                <span className="text-[9px] text-slate-600 mt-1">{day.label.split(',')[0]?.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Study Hours Bar Chart */}
        <div className="rounded-2xl bg-[#0f1328]/80 border border-white/[0.06] p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">⏱️ Daily Study Hours (7 days)</h3>
          <div className="flex items-end gap-2 h-36">
            {chart.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-400 font-semibold">{day.hours}h</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500 min-h-[4px]"
                  style={{ height: `${(day.hours / maxHours) * 100}%` }}
                />
                <span className="text-[9px] text-slate-600 mt-1">{day.label.split(',')[0]?.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="rounded-2xl bg-[#0f1328]/80 border border-white/[0.06] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
              <th className="text-left py-3 px-4 font-medium">Day</th>
              <th className="text-center py-3 px-4 font-medium">Sessions</th>
              <th className="text-center py-3 px-4 font-medium">Unique Students</th>
              <th className="text-center py-3 px-4 font-medium">Study Hours</th>
              <th className="text-left py-3 px-4 font-medium">Activity</th>
            </tr>
          </thead>
          <tbody>
            {chart.map((day) => (
              <tr key={day.date} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-4 text-slate-200 font-medium">{day.label}</td>
                <td className="py-3 px-4 text-center font-mono text-white font-semibold">{day.sessions}</td>
                <td className="py-3 px-4 text-center text-slate-400">{day.students}</td>
                <td className="py-3 px-4 text-center font-mono text-emerald-400">{day.hours}h</td>
                <td className="py-3 px-4">
                  <div className="w-full bg-white/[0.04] rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((day.sessions / maxSessions) * 100, 100)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
