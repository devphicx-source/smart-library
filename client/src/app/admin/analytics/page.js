'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getAnalytics } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
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
    { label: t('total_students_label'), value: summary.totalStudents, icon: '👥', color: 'from-blue-500 to-cyan-500' },
    { label: t('active_students'), value: summary.activeStudents, icon: '✅', color: 'from-emerald-500 to-green-500' },
    { label: t('avg_streak'), value: summary.avgStreak, icon: '🔥', color: 'from-amber-500 to-orange-500' },
    { label: t('max_streak'), value: summary.maxStreak, icon: '🏆', color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-4 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.color} opacity-60`} />
            <div className="text-xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-[11px] text-[var(--text-secondary)] font-medium mt-1 uppercase tracking-wider">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Peak Day Highlight */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-4 flex items-center gap-4">
        <div className="text-2xl">📊</div>
        <div>
          <p className="text-sm font-semibold">
            {t('peak_day')}: <span className="text-indigo-400">{summary.peakDay}</span>
          </p>
          <p className="text-[11px] text-[var(--text-secondary)]">{summary.peakSessions} {t('busiest_day_msg')}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Sessions Bar Chart */}
        <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-5">
          <h3 className="text-sm font-semibold mb-4">📈 {t('daily_sessions_7')}</h3>
          <div className="flex items-end gap-2 h-36">
            {chart.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-[var(--text-secondary)] font-semibold">{day.sessions}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-500 min-h-[4px]"
                  style={{ height: `${(day.sessions / maxSessions) * 100}%` }}
                />
                <span className="text-[9px] text-[var(--text-secondary)] mt-1 uppercase text-center">{day.label.split(',')[0]?.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Study Hours Bar Chart */}
        <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-5">
          <h3 className="text-sm font-semibold mb-4">⏱️ {t('daily_study_hours_7')}</h3>
          <div className="flex items-end gap-2 h-36">
            {chart.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-[var(--text-secondary)] font-semibold">{day.hours}h</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500 min-h-[4px]"
                  style={{ height: `${(day.hours / maxHours) * 100}%` }}
                />
                <span className="text-[9px] text-[var(--text-secondary)] mt-1 uppercase text-center">{day.label.split(',')[0]?.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--card-border)]">
              <th className="text-left py-3 px-4 font-medium">{t('day')}</th>
              <th className="text-center py-3 px-4 font-medium">{t('sessions')}</th>
              <th className="text-center py-3 px-4 font-medium">{t('unique_students')}</th>
              <th className="text-center py-3 px-4 font-medium">{t('study_hours')}</th>
              <th className="text-left py-3 px-4 font-medium">{t('activity')}</th>
            </tr>
          </thead>
          <tbody>
            {chart.map((day) => (
              <tr key={day.date} className="border-b border-[var(--card-border)]/30 hover:bg-[var(--card-border)]/20 transition-colors">
                <td className="py-3 px-4 font-medium">{day.label}</td>
                <td className="py-3 px-4 text-center font-mono font-semibold">{day.sessions}</td>
                <td className="py-3 px-4 text-center text-[var(--text-secondary)]">{day.students}</td>
                <td className="py-3 px-4 text-center font-mono text-emerald-500">{day.hours}h</td>
                <td className="py-3 px-4">
                  <div className="w-full bg-[var(--card-border)]/50 rounded-full h-1.5">
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
