import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Modal from './Modal';
import ProfilePage from '../../pages/shared/ProfilePage';
import toast from 'react-hot-toast';
import { getInitials } from '../../utils/helpers';

const Icons = {
  dashboard: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>,
  users: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  groups: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  fees: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  announcements: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  chat: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  logout: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  profile: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  menu: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  close: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
};

const NAV_ITEMS = {
  admin: [
    { label: 'Dashboard',      path: '/admin',               icon: 'dashboard',     end: true },
    { label: 'Users',          path: '/admin/users',         icon: 'users' },
    { label: 'Groups',         path: '/admin/groups',        icon: 'groups' },
    { label: 'Fee Structure',  path: '/admin/fees',          icon: 'fees' },
    { label: 'Announcements',  path: '/admin/announcements', icon: 'announcements' },
    { label: 'Group Chat',     path: '/admin/chat',          icon: 'chat' },
  ],
  teacher: [
    { label: 'Dashboard', path: '/teacher',      icon: 'dashboard', end: true },
    { label: 'Group Chat', path: '/teacher/chat', icon: 'chat' },
  ],
  student: [
    { label: 'Dashboard',     path: '/student',               icon: 'dashboard',     end: true },
    { label: 'Group Chat',    path: '/student/chat',          icon: 'chat' },
    { label: 'Fee Structure', path: '/student/fees',          icon: 'fees' },
    { label: 'Announcements', path: '/student/announcements', icon: 'announcements' },
  ],
};

const ROLE_GRADIENTS = {
  admin:   'from-violet-600 to-primary-600',
  teacher: 'from-blue-600 to-primary-600',
  student: 'from-emerald-600 to-teal-600',
};

const ROLE_ICON_BG = {
  admin:   'bg-violet-100 text-violet-600',
  teacher: 'bg-blue-100 text-blue-600',
  student: 'bg-emerald-100 text-emerald-600',
};

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = NAV_ITEMS[user?.role] || [];
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    try { await logout(); } catch {}
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-surface-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${ROLE_GRADIENTS[user?.role]} flex items-center justify-center shadow-primary flex-shrink-0`}>
            <span className="text-white font-display font-bold text-base">P</span>
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-surface-900 text-sm leading-tight truncate">PDO Education</p>
            <p className="text-xs text-surface-500 capitalize">{user?.role} Portal</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Menu</p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={() => setMobileOpen?.(false)}
            className={({ isActive }) =>
              isActive
                ? 'sidebar-item-active flex'
                : 'sidebar-item flex'
            }
          >
            <span className="flex-shrink-0">{Icons[item.icon]}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-3 border-t border-surface-100 space-y-1 flex-shrink-0">
        {/* User card — click to open profile */}
        <button
          onClick={() => setProfileOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-150 group"
        >
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${ROLE_GRADIENTS[user?.role]} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white text-xs font-bold">{getInitials(user?.name)}</span>
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-semibold text-surface-900 truncate leading-tight">{user?.name}</p>
            <p className="text-xs text-surface-500 truncate">{user?.email}</p>
          </div>
          <svg className="w-4 h-4 text-surface-400 group-hover:text-surface-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          {Icons.logout}
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface-50 border-r border-surface-200 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-surface-500 hover:bg-surface-100 z-10"
            >
              {Icons.close}
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Profile Modal */}
      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="My Profile" size="md">
        <ProfilePage onClose={() => setProfileOpen(false)} />
      </Modal>
    </>
  );
}

export { Icons };
