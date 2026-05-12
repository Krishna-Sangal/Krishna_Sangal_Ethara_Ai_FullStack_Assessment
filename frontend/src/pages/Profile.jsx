import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HiUser, HiLockClosed, HiCheck } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', profileForm);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSavingProfile(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setSavingPw(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSavingPw(false); }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Profile Settings</h2>
        <p className="text-slate-400 text-sm">Manage your account information</p>
      </div>

      {/* Avatar preview */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-bold text-white">{user?.name}</p>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <span className={`inline-flex items-center mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${user?.role === 'admin' ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-700 text-slate-300'}`}>
            {user?.role}
          </span>
        </div>
      </motion.div>

      {/* Profile Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2 mb-5">
          <HiUser className="w-5 h-5 text-primary-400" />Profile Information
        </h3>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} placeholder="Your name" className="input-field" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input value={user?.email} disabled className="input-field opacity-50 cursor-not-allowed" />
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2">
            {savingProfile ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <HiCheck className="w-4 h-4" />}
            Save Changes
          </button>
        </form>
      </motion.div>

      {/* Password Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2 mb-5">
          <HiLockClosed className="w-5 h-5 text-primary-400" />Change Password
        </h3>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} placeholder="••••••••" className="input-field" required />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="Min 8 chars" className="input-field" required />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} placeholder="Repeat new password" className="input-field" required />
          </div>
          <button type="submit" disabled={savingPw} className="btn-primary flex items-center gap-2">
            {savingPw ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <HiLockClosed className="w-4 h-4" />}
            Update Password
          </button>
        </form>
      </motion.div>
    </div>
  );
}
