import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HiBell, HiMagnifyingGlass, HiXMark } from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

export default function Topbar({ pageTitle }) {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
      setUnread(data.unreadCount);
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications');
      setUnread(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  return (
    <header className="h-16 bg-navy-800/80 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-6 shrink-0">
      {/* Page title */}
      <div>
        <h1 className="text-lg font-bold text-white">{pageTitle}</h1>
        <p className="text-xs text-slate-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setShowNotif(!showNotif); if (!showNotif) markAllRead(); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-navy-700 border border-white/5 hover:border-white/10 text-slate-400 hover:text-white transition-all"
          >
            <HiBell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-80 glass-card shadow-2xl border border-white/10 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <span className="font-semibold text-sm text-white">Notifications</span>
                  <button onClick={() => setShowNotif(false)} className="text-slate-500 hover:text-slate-300">
                    <HiXMark className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-8">No notifications</p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n._id}
                        className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${!n.read ? 'bg-primary-500/5' : ''}`}
                      >
                        <p className="text-xs text-slate-200 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <Link
                  to="/notifications"
                  onClick={() => setShowNotif(false)}
                  className="block text-center text-xs text-primary-400 hover:text-primary-300 py-3 border-t border-white/5 transition-colors"
                >
                  View all notifications
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white leading-none">{user?.name}</p>
            <p className="text-xs text-primary-400 capitalize mt-0.5">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
