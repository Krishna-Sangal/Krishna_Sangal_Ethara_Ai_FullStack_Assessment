import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { HiPlus, HiArrowLeft, HiTrash, HiClock, HiChatBubbleLeft, HiPencil, HiUserPlus, HiXMark } from 'react-icons/hi2';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import TaskModal from '../components/modals/TaskModal';
import ConfirmModal from '../components/modals/ConfirmModal';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#6366F1' },
  { id: 'in-progress', label: 'In Progress', color: '#F59E0B' },
  { id: 'completed', label: 'Completed', color: '#10B981' },
];

const PRIORITY_ICONS = { high: '🔴', medium: '🟡', low: '🟢' };

function TaskCard({ task, index, isAdmin, onEdit, onDelete, onClick }) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';
  return (
    <Draggable draggableId={task._id} index={index} isDragDisabled={!isAdmin}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`glass-card p-4 mb-3 cursor-pointer group transition-all duration-200 ${snapshot.isDragging ? 'shadow-2xl scale-105 rotate-1' : 'hover:border-white/10'}`}
          onClick={() => onClick(task)}
        >
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs">{PRIORITY_ICONS[task.priority]} {task.priority}</span>
            {isAdmin && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => onEdit(task)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-white">
                  <HiPencil className="w-3 h-3" />
                </button>
                <button onClick={() => onDelete(task)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400">
                  <HiTrash className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <p className="text-sm font-semibold text-white leading-snug mb-2">{task.title}</p>
          {task.description && <p className="text-xs text-slate-500 line-clamp-2 mb-2">{task.description}</p>}
          {task.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/20">{tag}</span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              {task.dueDate && (
                <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                  <HiClock className="w-3 h-3" />{format(new Date(task.dueDate), 'MMM d')}
                </span>
              )}
              {task.comments?.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <HiChatBubbleLeft className="w-3 h-3" />{task.comments.length}
                </span>
              )}
            </div>
            {task.assignee ? (
              <div title={task.assignee.name} className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-[9px] font-bold">
                {task.assignee.name?.charAt(0).toUpperCase()}
              </div>
            ) : <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-600" />}
          </div>
        </div>
      )}
    </Draggable>
  );
}

function TaskDetailModal({ task, onClose, onComment }) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';

  const submitComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try { await onComment(task._id, comment); setComment(''); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-bold text-white pr-4">{task.title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl shrink-0">✕</button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`badge ${task.status === 'todo' ? 'badge-todo' : task.status === 'in-progress' ? 'badge-in-progress' : 'badge-completed'}`}>{task.status.replace('-', ' ')}</span>
          <span className={`badge ${task.priority === 'high' ? 'badge-high' : task.priority === 'medium' ? 'badge-medium' : 'badge-low'}`}>{task.priority}</span>
          {isOverdue && <span className="badge-overdue">Overdue</span>}
        </div>
        {task.description && <p className="text-sm text-slate-300 mb-4 leading-relaxed">{task.description}</p>}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          {task.assignee && <div><p className="text-slate-500 text-xs mb-1">Assignee</p><p className="text-slate-200 font-medium">{task.assignee.name}</p></div>}
          {task.dueDate && <div><p className="text-slate-500 text-xs mb-1">Due Date</p><p className={`font-medium ${isOverdue ? 'text-red-400' : 'text-slate-200'}`}>{format(new Date(task.dueDate), 'MMM d, yyyy')}</p></div>}
          {task.project && <div><p className="text-slate-500 text-xs mb-1">Project</p><p className="text-slate-200 font-medium">{task.project.title}</p></div>}
        </div>
        <div className="border-t border-white/5 pt-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Comments ({task.comments?.length || 0})</h4>
          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
            {task.comments?.length === 0 && <p className="text-slate-500 text-sm">No comments yet.</p>}
            {task.comments?.map((c) => (
              <div key={c._id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {c.author?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-300">{c.author?.name}</span>
                    <span className="text-[10px] text-slate-500">{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." className="input-field flex-1 text-sm py-2" onKeyDown={(e) => e.key === 'Enter' && submitComment()} />
            <button onClick={submitComment} disabled={submitting || !comment.trim()} className="btn-primary px-4 py-2 text-sm">Post</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTask, setViewTask] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [memberToAdd, setMemberToAdd] = useState('');

  const fetchData = async () => {
    try {
      const requests = [
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`),
      ];
      if (isAdmin) requests.push(api.get('/users'));
      const [projRes, taskRes, usersRes] = await Promise.all(requests);
      setProject(projRes.data.project);
      setTasks(taskRes.data.tasks);
      if (isAdmin) setAllUsers(usersRes.data.users);
    } catch { toast.error('Failed to load project'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const getColumnTasks = (status) => tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;
    const newStatus = destination.droppableId;
    setTasks((prev) => prev.map((t) => t._id === draggableId ? { ...t, status: newStatus } : t));
    try {
      await api.put(`/tasks/${draggableId}`, { status: newStatus });
      toast.success(`Moved to ${COLUMNS.find((c) => c.id === newStatus)?.label}`);
    } catch { fetchData(); toast.error('Failed to update task'); }
  };

  const handleSaveTask = async (formData) => {
    try {
      if (editTask) { await api.put(`/tasks/${editTask._id}`, formData); toast.success('Task updated!'); }
      else { await api.post('/tasks', { ...formData, project: id }); toast.success('Task created!'); }
      setShowTaskModal(false); setEditTask(null); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save task'); }
  };

  const handleDeleteTask = async () => {
    try { await api.delete(`/tasks/${deleteTarget._id}`); toast.success('Task deleted'); setDeleteTarget(null); fetchData(); }
    catch { toast.error('Failed to delete task'); }
  };

  const handleComment = async (taskId, text) => {
    try {
      const { data } = await api.post(`/tasks/${taskId}/comments`, { text });
      setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, comments: [...(t.comments || []), data.comment] } : t));
      setViewTask((prev) => prev ? { ...prev, comments: [...(prev.comments || []), data.comment] } : prev);
      toast.success('Comment added!');
    } catch { toast.error('Failed to add comment'); }
  };

  const handleAddMember = async () => {
    if (!memberToAdd) return;
    try {
      const { data } = await api.post(`/projects/${id}/members`, { userId: memberToAdd });
      setProject(data.project);
      setMemberToAdd('');
      toast.success('Member added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const { data } = await api.delete(`/projects/${id}/members/${memberId}`);
      setProject(data.project);
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const availableUsers = allUsers.filter((u) =>
    u._id !== project?.owner?._id && !project?.members?.some((m) => m._id === u._id)
  );

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to="/projects" className="text-slate-400 hover:text-white"><HiArrowLeft className="w-5 h-5" /></Link>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ background: project?.color }} />
              <h2 className="text-xl font-bold text-white">{project?.title}</h2>
            </div>
            <p className="text-slate-400 text-sm ml-6">{project?.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex -space-x-2">
            {project?.members?.slice(0, 5).map((m) => (
              <div key={m._id} title={m.name} className="w-8 h-8 rounded-full border-2 border-navy-700 bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {m.name?.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          {isAdmin && (
            <button onClick={() => { setEditTask(null); setShowTaskModal(true); }} className="btn-primary flex items-center gap-2">
              <HiPlus className="w-4 h-4" />Add Task
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="glass-card p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Project Members</h3>
              <p className="text-xs text-slate-500 mt-1">{project?.members?.length || 0} member{project?.members?.length === 1 ? '' : 's'}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select value={memberToAdd} onChange={(e) => setMemberToAdd(e.target.value)} className="input-field h-10 text-sm min-w-48">
                <option value="">Select a member</option>
                {availableUsers.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
              <button onClick={handleAddMember} disabled={!memberToAdd} className="btn-primary h-10 flex items-center justify-center gap-2">
                <HiUserPlus className="w-4 h-4" />Add Member
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {project?.members?.map((m) => (
              <span key={m._id} className="inline-flex items-center gap-2 rounded-lg bg-navy-700 px-3 py-1.5 text-xs text-slate-200">
                {m.name}
                <button onClick={() => handleRemoveMember(m._id)} className="text-slate-500 hover:text-red-400">
                  <HiXMark className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-5 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTasks = getColumnTasks(col.id);
            return (
              <div key={col.id} className="flex-shrink-0 w-80">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-3 h-3 rounded-full" style={{ background: col.color }} />
                  <span className="font-semibold text-sm text-slate-300">{col.label}</span>
                  <span className="ml-auto bg-navy-700 text-slate-400 text-xs font-semibold px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      className={`min-h-32 rounded-2xl p-3 transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-navy-800/40'}`}>
                      {colTasks.map((task, index) => (
                        <TaskCard key={task._id} task={task} index={index} isAdmin={isAdmin}
                          onEdit={(t) => { setEditTask(t); setShowTaskModal(true); }}
                          onDelete={setDeleteTarget} onClick={setViewTask} />
                      ))}
                      {provided.placeholder}
                      {isAdmin && (
                        <button onClick={() => { setEditTask(null); setShowTaskModal(true); }}
                          className="w-full flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm py-2 px-3 rounded-xl hover:bg-white/5 transition-colors">
                          <HiPlus className="w-4 h-4" />Add task
                        </button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {showTaskModal && <TaskModal task={editTask} projectId={id} users={allUsers} onClose={() => { setShowTaskModal(false); setEditTask(null); }} onSave={handleSaveTask} />}
      {deleteTarget && <ConfirmModal title="Delete Task" message={`Delete "${deleteTarget.title}"? This cannot be undone.`} onConfirm={handleDeleteTask} onCancel={() => setDeleteTarget(null)} danger />}
      {viewTask && <TaskDetailModal task={viewTask} onClose={() => setViewTask(null)} onComment={handleComment} />}
    </div>
  );
}
