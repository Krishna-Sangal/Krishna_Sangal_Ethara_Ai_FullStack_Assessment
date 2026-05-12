import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HiXMark } from 'react-icons/hi2';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#38BDF8', '#8B5CF6', '#EC4899', '#14B8A6'];
const STATUS_OPTS = ['active', 'on-hold', 'completed', 'archived'];

export default function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    title: project?.title || '',
    description: project?.description || '',
    color: project?.color || '#6366F1',
    status: project?.status || 'active',
    dueDate: project?.dueDate ? project.dueDate.slice(0, 10) : '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><HiXMark className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Project Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Website Redesign" className="input-field" required minLength={3} maxLength={80} />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Project overview..." className="input-field resize-none h-24" maxLength={500} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                {STATUS_OPTS.map((s) => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input-field" />
            </div>
          </div>

          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-lg transition-all duration-150 ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-navy-700 scale-110' : 'hover:scale-105'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
