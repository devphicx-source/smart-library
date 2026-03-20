'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { getAllStudents, createStudent } from '@/lib/api';

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Add Student State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('+91');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadStudents();
  }, [user, debouncedSearch]);

  async function loadStudents() {
    try {
      const res = await getAllStudents(debouncedSearch);
      setStudents(res.data.students);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddStudent(e) {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    try {
      await createStudent({ name: newName, phone: newPhone });
      setShowAddModal(false);
      setNewName('');
      setNewPhone('+91');
      loadStudents();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-[13px]
                bg-[#0f1328]/80 border border-white/[0.06] text-slate-200
                placeholder-slate-600 outline-none focus:border-indigo-500/40
                transition-all"
            />
          </div>
          <span className="text-[11px] text-slate-600 font-medium">{total} students</span>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-[12px] font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <span>＋</span> Add Student
        </button>
      </div>

      {/* Students Table */}
      <div className="rounded-2xl bg-[#0f1328]/80 border border-white/[0.06] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
              <th className="text-left py-3 px-4 font-medium">Student</th>
              <th className="text-center py-3 px-4 font-medium">Streak</th>
              <th className="text-center py-3 px-4 font-medium">Best Streak</th>
              <th className="text-center py-3 px-4 font-medium">Study Hours</th>
              <th className="text-center py-3 px-4 font-medium">Status</th>
              <th className="text-center py-3 px-4 font-medium">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-[11px] text-indigo-400 font-bold">
                      {s.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{s.name}</p>
                      <p className="text-[11px] text-slate-500">{s.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-amber-400 font-semibold">🔥 {s.currentStreak}</span>
                </td>
                <td className="py-3 px-4 text-center text-slate-400">
                  {s.longestStreak}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="font-mono font-semibold text-white">{s.totalStudyHours}h</span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`
                    inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold
                    ${s.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                    }
                  `}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-[12px] text-slate-500">
                  {s.lastActiveDate
                    ? new Date(s.lastActiveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
                    : '—'
                  }
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-slate-600 text-xs">No students found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0f1328] border border-white/[0.08] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Add New Student</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Kumar"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:border-indigo-500/50 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5 ml-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+919988776655"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:border-indigo-500/50 outline-none transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                >
                  {isSubmitting ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
