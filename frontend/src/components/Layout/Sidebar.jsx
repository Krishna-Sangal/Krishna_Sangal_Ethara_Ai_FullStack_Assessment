import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiSparkles,
  HiChartBar,
  HiFolderOpen,
  HiUserGroup,
  HiBell,
  HiUser,
  HiArrowRightOnRectangle,
  HiChevronLeft,
  HiChevronRight,
} from 'react-icons/hi2';
import { HiOutlineClipboardList } from 'react-icons/hi';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: HiChartBar, label: 'Dashboard' },
  { to: '/projects', icon: HiFolderOpen, label: 'Projects' },
  { to: '/tasks', icon: HiOutlineClipboardList, label: 'Tasks' },
  { to: '/team', icon: HiUserGroup, label: 'Team' },
  { to: '/notifications', icon: HiBell, label: 'Notifications' },
  { to: '/profile', icon: HiUser, label: 'Profile' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/auth');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="h-full bg-navy-800 border-r border-white/5 flex flex-col shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center shrink-0">
          <HiSparkles className="w-5 h-5 text-primary-400" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="font-bold text-lg text-white whitespace-nowrap"
            >
              TeamFlow
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User + Collapse */}
      <div className="p-3 border-t border-white/5 space-y-1">
        {/* User info */}
        <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-semibold text-white truncate max-w-[120px]">{user?.name}</p>
                <p className="text-xs text-primary-400 capitalize">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? 'justify-center px-2' : ''
            }`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <HiArrowRightOnRectangle className="w-5 h-5 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`sidebar-link w-full text-slate-500 hover:text-slate-300 ${collapsed ? 'justify-center px-2' : ''
            }`}
        >
          {collapsed ? (
            <HiChevronRight className="w-4 h-4" />
          ) : (
            <>
              <HiChevronLeft className="w-4 h-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
