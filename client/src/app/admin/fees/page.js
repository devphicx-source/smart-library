'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getAllFees, createFee, updateFee } from '@/lib/api';

export default function FeesPage() {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ userId: '', amount: '', type: 'monthly', dueDate: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

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
        {['', 'pending', 'paid', 'overdue'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all
              ${filter === f
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                : 'bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:bg-white/[0.06]'
              }
            `}
          >
            {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="text-[11px] text-slate-600 ml-1">{total} records</span>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Fees Table */}
      <div className="rounded-2xl bg-[#0f1328]/80 border border-white/[0.06] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
              <th className="text-left py-3 px-4 font-medium">Student</th>
              <th className="text-left py-3 px-4 font-medium">Type</th>
              <th className="text-right py-3 px-4 font-medium">Amount</th>
              <th className="text-center py-3 px-4 font-medium">Due Date</th>
              <th className="text-center py-3 px-4 font-medium">Status</th>
              <th className="text-center py-3 px-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((f) => (
              <tr key={f._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                      {f.user?.name?.charAt(0) || '?'}
                    </div>
                    <span className="text-slate-200">{f.user?.name || '—'}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-400 capitalize">{f.type}</td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-white">₹{f.amount}</td>
                <td className="py-3 px-4 text-center text-slate-400">
                  {new Date(f.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`
                    inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider
                    ${f.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      f.status === 'overdue' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'}
                  `}>
                    {f.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {f.status !== 'paid' && (
                    <button
                      onClick={() => handleMarkPaid(f._id)}
                      className="opacity-0 group-hover:opacity-100 px-2.5 py-1 rounded-lg
                        bg-emerald-500/10 border border-emerald-500/30 text-emerald-400
                        text-[10px] font-semibold hover:bg-emerald-500/20 transition-all"
                    >
                      ✓ Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {fees.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-slate-600 text-xs">No records found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0f1328] border border-white/[0.08] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-slate-200">Create Fee Entry</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white text-lg transition-colors">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider font-medium">Student User ID</label>
                <input
                  type="text"
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  className="input-glass !bg-[#080b16] !rounded-xl text-[13px]"
                  placeholder="MongoDB ObjectId"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider font-medium">Amount (₹)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="input-glass !bg-[#080b16] !rounded-xl text-[13px]"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider font-medium">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="input-glass !bg-[#080b16] !rounded-xl text-[13px]"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="daily">Daily</option>
                    <option value="deposit">Deposit</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5 uppercase tracking-wider font-medium">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="input-glass !bg-[#080b16] !rounded-xl text-[13px]"
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
                {actionLoading ? 'Creating...' : 'Create Fee'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
