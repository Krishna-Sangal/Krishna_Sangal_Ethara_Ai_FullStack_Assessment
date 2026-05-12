import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, Title,
} from 'chart.js';
import {
  HiFolderOpen, HiClipboardDocumentList, HiCheckCircle, HiExclamationCircle,
  HiUserGroup, HiArrowTrendingUp, HiClock,
} from 'react-icons/hi2';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const PRIORITY_COLORS = { high: '#F43F5E', medium: '#F59E0B', low: '#10B981' };
const STATUS_COLORS = { todo: '#6366F1', 'in-progress': '#F59E0B', completed: '#10B981' };

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value ?? '—'}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center`} style={{ background: `${color}22` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}

function PriorityBadge({ priority }) {
  const colors = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
  return <span className={`badge ${colors[priority] || 'badge-todo'}`}>{priority}</span>;
}

function StatusBadge({ status, dueDate }) {
  const isOverdue = dueDate && isPast(new Date(dueDate)) && status !== 'completed';
  if (isOverdue) return <span className="badge-overdue">Overdue</span>;
  const map = { todo: 'badge-todo', 'in-progress': 'badge-in-progress', completed: 'badge-completed' };
  return <span className={`badge ${map[status] || 'badge-todo'}`}>{status.replace('-', ' ')}</span>;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => setData(res.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const { stats, recentTasks = [], projectProgress = [], statusBreakdown = [] } = data || {};

  const doughnutData = {
    labels: statusBreakdown.map((s) => s.label),
    datasets: [{
      data: statusBreakdown.map((s) => s.value),
      backgroundColor: statusBreakdown.map((s) => s.color),
      borderColor: 'transparent',
      borderWidth: 0,
    }],
  };

  const barData = {
    labels: projectProgress.map((p) => p.title.slice(0, 15)),
    datasets: [{
      label: 'Progress %',
      data: projectProgress.map((p) => p.progress),
      backgroundColor: projectProgress.map((p) => p.color || '#6366F1'),
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94A3B8', font: { family: 'Inter' } } } },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      x: { ticks: { color: '#64748B' }, grid: { color: '#1E293B' } },
      y: { ticks: { color: '#64748B' }, grid: { color: '#1E293B' }, max: 100 },
    },
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}! 👋
        </h2>
        <p className="text-slate-400 text-sm mt-1">Here's what's happening with your projects today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={HiFolderOpen} label="Total Projects" value={stats?.totalProjects} color="#6366F1" />
        <StatCard icon={HiClipboardDocumentList} label="Total Tasks" value={stats?.totalTasks} color="#38BDF8" />
        <StatCard icon={HiCheckCircle} label="Completed" value={stats?.completedTasks} color="#10B981" sub={`${stats?.completionRate}% completion rate`} />
        <StatCard icon={HiExclamationCircle} label="Overdue" value={stats?.overdueTasks} color="#F43F5E" />
        {user?.role === 'admin' && (
          <StatCard icon={HiUserGroup} label="Team Members" value={stats?.totalUsers} color="#F59E0B" />
        )}
        <StatCard icon={HiArrowTrendingUp} label="In Progress" value={stats?.inProgressTasks} color="#818CF8" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doughnut */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Task Status Breakdown</h3>
          <div className="h-52">
            <Doughnut data={doughnutData} options={{ ...chartOptions, cutout: '65%' }} />
          </div>
        </div>

        {/* Bar */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Project Progress</h3>
          <div className="h-52">
            {projectProgress.length > 0 ? (
              <Bar data={barData} options={barOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                No projects yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Tasks + Project Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Recent Tasks</h3>
            <Link to="/tasks" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No tasks yet</p>
            ) : (
              recentTasks.map((task) => (
                <div key={task._id} className="flex items-start gap-3 p-3 rounded-xl bg-navy-800/60 hover:bg-navy-800 transition-colors">
                  <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: STATUS_COLORS[task.status] || '#6366F1' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {task.project && (
                        <span className="text-xs text-slate-500">{task.project.title}</span>
                      )}
                      {task.dueDate && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <HiClock className="w-3 h-3" />
                          {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={task.status} dueDate={task.dueDate} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Project Progress */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Project Progress</h3>
            <Link to="/projects" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-4">
            {projectProgress.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No projects yet</p>
            ) : (
              projectProgress.map((p) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-slate-200 truncate max-w-[180px]">{p.title}</p>
                    <span className="text-xs font-semibold text-slate-400">{p.progress}%</span>
                  </div>
                  <div className="h-2 bg-navy-600 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.progress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ background: p.color || '#6366F1' }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{p.completed}/{p.total} tasks</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
