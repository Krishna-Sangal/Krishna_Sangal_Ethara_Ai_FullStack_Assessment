import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HiUserGroup, HiShieldCheck, HiUser, HiTrash } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import ConfirmModal from '../components/modals/ConfirmModal';

export default function Team() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.users);
    } catch { toast.error('Failed to load team'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      await api.put(`/users/${userId}/role`, { role });
      toast.success('Role updated!');
      fetchUsers();
    } catch { toast.error('Failed to update role'); }
  };

  const handleDeactivate = async () => {
    try {
      await api.delete(`/users/${deleteTarget._id}`);
      toast.success('User deactivated');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to deactivate'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Team Members</h2>
        <p className="text-slate-400 text-sm">{users.length} member{users.length !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <motion.div key={u._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5 hover:border-white/10 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm flex items-center gap-1.5">
                      {u.name}
                      {u._id === user._id && <span className="text-[10px] text-primary-400 bg-primary-500/20 px-1.5 py-0.5 rounded-full">You</span>}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                  </div>
                </div>
                {isAdmin && u._id !== user._id && (
                  <button onClick={() => setDeleteTarget(u)} className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all">
                    <HiTrash className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${u.role === 'admin' ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-700 text-slate-300'}`}>
                  {u.role === 'admin' ? <HiShieldCheck className="w-3.5 h-3.5" /> : <HiUser className="w-3.5 h-3.5" />}
                  {u.role}
                </div>
                {isAdmin && u._id !== user._id && (
                  <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    className="text-xs bg-navy-700 border border-white/10 text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500">
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
                <div className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} title={u.isActive ? 'Active' : 'Inactive'} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Deactivate User"
          message={`Deactivate ${deleteTarget.name}? They will no longer be able to log in.`}
          onConfirm={handleDeactivate}
          onCancel={() => setDeleteTarget(null)}
          danger
        />
      )}
    </div>
  );
}
