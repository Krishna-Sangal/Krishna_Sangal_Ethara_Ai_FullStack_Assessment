import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HiMagnifyingGlass, HiAdjustmentsHorizontal, HiClipboardDocumentList, HiTrash, HiPencil, HiClock } from 'react-icons/hi2';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import TaskModal from '../components/modals/TaskModal';
import ConfirmModal from '../components/modals/ConfirmModal';

const STATUS_OPTS = ['all', 'todo', 'in-progress', 'completed'];
const PRIORITY_OPTS = ['all', 'high', 'medium', 'low'];

export default function Tasks() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [editTask, setEditTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (search) params.set('search', search);
      const [taskRes, userRes, projRes] = await Promise.all([
        api.get(`/tasks?${params}`),
        api.get('/users'),
        api.get('/projects'),
      ]);
      setTasks(taskRes.data.tasks);
      setAllUsers(userRes.data.users);
      setProjects(projRes.data.projects);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, [statusFilter, priorityFilter]);

  const handleSave = async (formData) => {
    try {
      if (editTask) { await api.put(`/tasks/${editTask._id}`, formData); toast.success('Task updated!'); }
      else { await api.post('/tasks', formData); toast.success('Task created!'); }
      setShowModal(false); setEditTask(null); fetchTasks();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save task'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/tasks/${deleteTarget._id}`); toast.success('Task deleted'); setDeleteTarget(null); fetchTasks(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleStatusChange = async (task, status) => {
    try { await api.put(`/tasks/${task._id}`, { status }); fetchTasks(); toast.success('Status updated!'); }
    catch { toast.error('Failed to update status'); }
  };

  const filtered = tasks.filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()));

  const statusBadge = (status, dueDate) => {
    const overdue = dueDate && isPast(new Date(dueDate)) && status !== 'completed';
    if (overdue) return <span className="badge-overdue">Overdue</span>;
    const map = { todo: 'badge-todo', 'in-progress': 'badge-in-progress', completed: 'badge-completed' };
    return <span className={`badge ${map[status]}`}>{status.replace('-', ' ')}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Tasks</h2>
          <p className="text-slate-400 text-sm">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="input-field pl-9 w-44 h-10 text-sm" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field h-10 text-sm w-36">
            {STATUS_OPTS.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.replace('-', ' ')}</option>)}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input-field h-10 text-sm w-36">
            {PRIORITY_OPTS.map((p) => <option key={p} value={p}>{p === 'all' ? 'All Priority' : p}</option>)}
          </select>
          {isAdmin && (
            <button onClick={() => { setEditTask(null); setShowModal(true); }} className="btn-primary h-10 flex items-center gap-2">
              + New Task
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <HiClipboardDocumentList className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No tasks found</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="text-xs font-semibold text-slate-400 px-5 py-3">Task</th>
                <th className="text-xs font-semibold text-slate-400 px-4 py-3 hidden md:table-cell">Project</th>
                <th className="text-xs font-semibold text-slate-400 px-4 py-3 hidden sm:table-cell">Assignee</th>
                <th className="text-xs font-semibold text-slate-400 px-4 py-3">Priority</th>
                <th className="text-xs font-semibold text-slate-400 px-4 py-3">Status</th>
                <th className="text-xs font-semibold text-slate-400 px-4 py-3 hidden lg:table-cell">Due Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => {
                const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';
                return (
                  <motion.tr key={task._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors group">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-slate-200 truncate max-w-[200px]">{task.title}</p>
                      {task.description && <p className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">{task.description}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {task.project && (
                        <span className="text-xs text-slate-400 bg-navy-700 px-2 py-1 rounded-lg">{task.project.title}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                            {task.assignee.name?.charAt(0)}
                          </div>
                          <span className="text-xs text-slate-300">{task.assignee.name}</span>
                        </div>
                      ) : <span className="text-xs text-slate-600">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${task.priority === 'high' ? 'badge-high' : task.priority === 'medium' ? 'badge-medium' : 'badge-low'}`}>{task.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select value={task.status} onChange={(e) => handleStatusChange(task, e.target.value)}
                        className="bg-transparent text-xs border-none outline-none cursor-pointer text-slate-300">
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                          <HiClock className="w-3.5 h-3.5" />{format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditTask(task); setShowModal(true); }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
                            <HiPencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(task)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400">
                            <HiTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <TaskModal task={editTask} users={allUsers} projects={projects} onClose={() => { setShowModal(false); setEditTask(null); }} onSave={handleSave} />}
      {deleteTarget && <ConfirmModal title="Delete Task" message={`Delete "${deleteTarget.title}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} danger />}
    </div>
  );
}
