'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getNotifications } from '@/lib/api';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Students', href: '/admin/students', icon: '👥' },
  { label: 'Occupancy', href: '/admin/occupancy', icon: '🗺️' },
  { label: 'Fees', href: '/admin/fees', icon: '💰' },
  { label: 'Leaderboard', href: '/admin/leaderboard', icon: '🏆' },
  { label: 'Analytics', href: '/admin/analytics', icon: '📈' },
];

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Notifications State ──
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, loading, router]);

  // ── Poll notifications every 30s ──
  const fetchNotifications = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const lastSeen = localStorage.getItem('slms_notif_seen') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const res = await getNotifications(lastSeen);
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      // silently fail — notifications are non-critical
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── Click outside to close dropdown ──
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function markAllRead() {
    localStorage.setItem('slms_notif_seen', new Date().toISOString());
    setUnreadCount(0);
    setNotifOpen(false);
  }

  function timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#080b16]">
      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] flex flex-col
        bg-[#0c1029]/95 backdrop-blur-xl border-r border-white/[0.06]
        transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="px-6 pt-7 pb-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/25">
              S
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white tracking-tight">SLMS</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium
                  transition-all duration-200 relative
                  ${active
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }
                `}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
                )}
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
              {user.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500">Admin</p>
            </div>
            <button
              onClick={logout}
              className="text-slate-500 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 lg:px-6
          bg-[#080b16]/80 backdrop-blur-xl border-b border-white/[0.06]">
          {/* Mobile Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h2 className="text-sm font-semibold text-slate-200 hidden lg:block">
            {NAV_ITEMS.find((n) => n.href === pathname)?.label || 'Dashboard'}
          </h2>

          <div className="flex items-center gap-3">
            {/* New Fee button — only on fees page */}
            {pathname === '/admin/fees' && (
              <button
                onClick={() => window.dispatchEvent(new Event('open-create-fee'))}
                className="px-3 py-1.5 rounded-xl text-[12px] font-semibold flex items-center gap-1.5
                  bg-gradient-to-r from-indigo-500 to-purple-600 text-white
                  hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                New Fee
              </button>
            )}

            {/* ── Notification Bell + Dropdown ── */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center
                    rounded-full bg-red-500 text-white text-[9px] font-bold leading-none
                    animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-[340px] max-h-[420px]
                  rounded-2xl bg-[#0f1328] border border-white/[0.08]
                  shadow-2xl shadow-black/40 overflow-hidden z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <h3 className="text-[13px] font-semibold text-slate-200">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="overflow-y-auto max-h-[360px]">
                    {notifications.length > 0 ? (
                      notifications.map((n, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.03]
                            hover:bg-white/[0.02] transition-colors"
                        >
                          <span className="text-sm mt-0.5 shrink-0">{n.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-slate-300 leading-relaxed">{n.text}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5">{timeAgo(n.time)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-10 text-center">
                        <div className="text-2xl mb-2">🔔</div>
                        <p className="text-[12px] text-slate-500">No new notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <a href="/admin/profile" className="flex items-center gap-2 pl-3 border-l border-white/[0.06] cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold">
                {user.name?.charAt(0) || 'A'}
              </div>
              <span className="text-xs text-slate-300 font-medium hidden sm:block">{user.name}</span>
            </a>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-5 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
