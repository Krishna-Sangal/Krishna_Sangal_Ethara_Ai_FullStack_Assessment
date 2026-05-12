import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/tasks': 'My Tasks',
  '/team': 'Team',
  '/notifications': 'Notifications',
  '/profile': 'Profile',
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const pageTitle =
    Object.entries(pageTitles).find(([path]) => location.pathname.startsWith(path))?.[1] ||
    'TeamFlow';

  return (
    <div className="flex h-screen overflow-hidden bg-navy-900">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
