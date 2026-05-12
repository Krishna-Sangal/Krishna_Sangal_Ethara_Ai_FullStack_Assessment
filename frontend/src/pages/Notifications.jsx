import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HiBell, HiCheck, HiTrash } from 'react-icons/hi2';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api/axios';

const TYPE_ICONS = { task_assigned: '📋', task_updated: '✏️', comment_added: '💬', project_invite: '📁', task_overdue: '⚠️' };

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications').then(({ data }) => setNotifications(data.notifications)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.patch('/notifications');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('All marked as read');
  };

  const deleteNotif = async (id) => {
    await api.delete(`/notifications/${id}`);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Notifications</h2>
          <p className="text-slate-400 text-sm">{notifications.filter((n) => !n.read).length} unread</p>
        </div>
        {notifications.length > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm flex items-center gap-2">
            <HiCheck className="w-4 h-4" />Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <HiBell className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <motion.div key={n._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className={`glass-card p-4 flex items-start gap-3 group transition-all ${!n.read ? 'border-primary-500/20 bg-primary-500/5' : ''}`}>
              <span className="text-xl shrink-0">{TYPE_ICONS[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 leading-relaxed">{n.message}</p>
                <p className="text-xs text-slate-500 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-primary-400 shrink-0 mt-2" />}
              <button onClick={() => deleteNotif(n._id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all">
                <HiTrash className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
