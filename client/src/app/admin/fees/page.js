'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getAllFees, createFee, updateFee, getAllStudents } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';

export default function FeesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [fees, setFees] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ userId: '', amount: '', type: 'monthly', dueDate: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Search State ──
  const [studentSearch, setStudentSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ── Fetch Suggestions ──
  useEffect(() => {
    if (studentSearch.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await getAllStudents(studentSearch);
        setSuggestions(res.data.students || []);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  // ── Close suggestions on click outside ──
  useEffect(() => {
    const handleClick = () => setShowSuggestions(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadFees();
  }, [user, filter]);

  async function loadFees() {
    try {
      const res = await getAllFees(filter);
      setFees(res.data.payments);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      await createFee(form);
      setShowCreate(false);
      setForm({ userId: '', amount: '', type: 'monthly', dueDate: '' });
      setStudentSearch('');
      loadFees();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkPaid(id) {
    try {
      await updateFee(id, 'paid');
      loadFees();
    } catch (err) {
      setError(err.message);
    }
  }

  // Listen for header button event
  useEffect(() => {
    const handler = () => setShowCreate(true);
    window.addEventListener('open-create-fee', handler);
    return () => window.removeEventListener('open-create-fee', handler);
  }, []);

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {['', 'pending', 'submitted', 'paid', 'overdue'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all
              ${filter === f
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                : 'bg-[var(--card-border)]/20 text-[var(--text-secondary)] border border-[var(--card-border)]/30 hover:bg-[var(--card-border)]/40'
              }
            `}
          >
            {f === '' ? t('all') : t(f)}
          </button>
        ))}
        <span className="text-[11px] text-[var(--text-secondary)]/60 ml-1">{total} {t('records')}</span>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Fees Table */}
      <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--card-border)]">
              <th className="text-left py-3 px-4 font-medium">{t('student_label')}</th>
              <th className="text-left py-3 px-4 font-medium">{t('type')}</th>
              <th className="text-right py-3 px-4 font-medium">{t('amount')}</th>
              <th className="text-center py-3 px-4 font-medium">{t('due_date')}</th>
              <th className="text-center py-3 px-4 font-medium">{t('status')}</th>
              <th className="text-center py-3 px-4 font-medium">{t('action')}</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((f) => (
              <tr key={f._id} className="border-b border-[var(--card-border)]/30 hover:bg-[var(--card-border)]/20 transition-colors group">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--card-border)] flex items-center justify-center text-[10px] text-[var(--text-secondary)] font-bold">
                      {f.user?.name?.charAt(0) || '?'}
                    </div>
                    <span className="">{f.user?.name || '—'}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-[var(--text-secondary)] capitalize">{t(f.type)}</td>
                <td className="py-3 px-4 text-right font-mono font-semibold">₹{f.amount}</td>
                <td className="py-3 px-4 text-center text-[var(--text-secondary)]">
                  {new Date(f.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`
                      inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider
                      ${f.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        f.status === 'overdue' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        f.status === 'submitted' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse' :
                         'bg-amber-500/10 text-amber-400 border border-amber-500/20'}
                    `}>
                      {t(f.status)}
                    </span>
                    {f.submittedAt && (
                      <span className="text-[9px] text-[var(--text-secondary)]">
                        {t('at')}: {new Date(f.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  {(f.status === 'pending' || f.status === 'overdue' || f.status === 'submitted') && (
                    <button
                      onClick={() => handleMarkPaid(f._id)}
                      className="opacity-0 group-hover:opacity-100 px-2.5 py-1 rounded-lg
                        bg-emerald-500/10 border border-emerald-500/30 text-emerald-400
                        text-[10px] font-semibold hover:bg-emerald-500/20 transition-all"
                    >
                      ✓ {t('paid_mark')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {fees.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-[var(--text-secondary)] text-xs">{t('no_records_found')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-primary)] border border-[var(--card-border)] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold">{t('create_fee_entry')}</h2>
              <button onClick={() => setShowCreate(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-lg transition-colors">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="relative">
                <label className="block text-[11px] text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider font-medium">Student Name</label>
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setShowSuggestions(true);
                      if (!e.target.value) setForm({ ...form, userId: '' });
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="input-glass !bg-[var(--bg-primary)] !rounded-xl text-[13px] w-full"
                    placeholder={t('search_placeholder')}
                    required
                  />
                  {form.userId && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-lg border border-emerald-500/20">
                      {t('id_selected')}
                    </span>
                  )}
                </div>

                  <div className="absolute z-[60] left-0 right-0 mt-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--card-border)] shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                    {suggestions.map((s) => (
                      <div
                        key={s._id}
                        onClick={() => {
                          setForm({ ...form, userId: s._id });
                          setStudentSearch(s.name);
                          setShowSuggestions(false);
                        }}
                        className="p-3 hover:bg-[var(--card-border)]/50 cursor-pointer border-b border-[var(--card-border)]/30 last:border-0 transition-colors"
                      >
                        <p className="text-[13px] font-semibold">{s.name}</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">{s.phone}</p>
                      </div>
                    ))}
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider font-medium">Amount (₹)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="input-glass !bg-[var(--bg-secondary)] !rounded-xl text-[13px]"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider font-medium">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="input-glass !bg-[var(--bg-secondary)] !rounded-xl text-[13px]"
                  >
                    <option value="monthly">{t('monthly')}</option>
                    <option value="daily">{t('daily')}</option>
                    <option value="deposit">{t('deposit')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider font-medium">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="input-glass !bg-[var(--bg-secondary)] !rounded-xl text-[13px]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl text-[13px] font-semibold
                  bg-gradient-to-r from-indigo-500 to-purple-600 text-white
                  hover:shadow-lg hover:shadow-indigo-500/25 transition-all
                  disabled:opacity-50"
              >
                {actionLoading ? t('creating') : t('create_fee')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
