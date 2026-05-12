import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiPlus, HiFolderOpen, HiMagnifyingGlass, HiEllipsisVertical, HiTrash, HiPencil } from 'react-icons/hi2';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import ProjectModal from '../components/modals/ProjectModal';
import ConfirmModal from '../components/modals/ConfirmModal';

function ProjectCard({ project, onEdit, onDelete, isAdmin }) {
  const progress = project.taskCount > 0
    ? Math.round((project.completedCount / project.taskCount) * 100) : 0;

  const statusColors = {
    active: 'bg-emerald-500/20 text-emerald-400',
    completed: 'bg-blue-500/20 text-blue-400',
    'on-hold': 'bg-amber-500/20 text-amber-400',
    archived: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${project.color}22`, border: `1px solid ${project.color}44` }}>
            <HiFolderOpen className="w-5 h-5" style={{ color: project.color }} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm leading-tight">{project.title}</h3>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[project.status] || statusColors.active}`}>
              {project.status}
            </span>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(project)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <HiPencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(project)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors">
              <HiTrash className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{project.description}</p>
      )}

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>{project.completedCount}/{project.taskCount} tasks</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-navy-600 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: project.color || '#6366F1' }}
          />
        </div>
      </div>

      {/* Members */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {project.members?.slice(0, 4).map((m) => (
            <div key={m._id} title={m.name}
              className="w-6 h-6 rounded-full border-2 border-navy-700 bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-[9px] font-bold">
              {m.name?.charAt(0).toUpperCase()}
            </div>
          ))}
          {project.members?.length > 4 && (
            <div className="w-6 h-6 rounded-full border-2 border-navy-700 bg-navy-600 flex items-center justify-center text-slate-400 text-[9px]">
              +{project.members.length - 4}
            </div>
          )}
        </div>
        <Link
          to={`/projects/${project._id}`}
          className="text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors"
        >
          View →
        </Link>
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.projects);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleSave = async (formData) => {
    try {
      if (editProject) {
        await api.put(`/projects/${editProject._id}`, formData);
        toast.success('Project updated!');
      } else {
        await api.post('/projects', formData);
        toast.success('Project created!');
      }
      setShowModal(false);
      setEditProject(null);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/projects/${deleteTarget._id}`);
      toast.success('Project deleted');
      setDeleteTarget(null);
      fetchProjects();
    } catch { toast.error('Failed to delete project'); }
  };

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Projects</h2>
          <p className="text-slate-400 text-sm">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="input-field pl-9 w-52 h-10 text-sm"
            />
          </div>
          {isAdmin && (
            <button
              onClick={() => { setEditProject(null); setShowModal(true); }}
              className="btn-primary flex items-center gap-2 h-10"
            >
              <HiPlus className="w-4 h-4" />
              New Project
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <HiFolderOpen className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No projects found</p>
          {isAdmin && <p className="text-slate-500 text-sm mt-1">Create your first project to get started</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <ProjectCard
              key={p._id}
              project={p}
              isAdmin={isAdmin}
              onEdit={(proj) => { setEditProject(proj); setShowModal(true); }}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {showModal && (
        <ProjectModal
          project={editProject}
          onClose={() => { setShowModal(false); setEditProject(null); }}
          onSave={handleSave}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Project"
          message={`Delete "${deleteTarget.title}" and all its tasks? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          danger
        />
      )}
    </div>
  );
}
