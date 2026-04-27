import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icons } from './Sidebar';
import { getRoleColor } from '../../utils/helpers';

export default function Topbar({ title, subtitle, setMobileOpen, actions }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-surface-200 px-4 lg:px-6 py-3.5 flex items-center gap-4">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen?.(true)}
        className="lg:hidden p-2 rounded-lg text-surface-600 hover:bg-surface-100 flex-shrink-0"
      >
        {Icons.menu}
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        {title && <h1 className="text-lg font-display font-semibold text-surface-900 truncate">{title}</h1>}
        {subtitle && <p className="text-xs text-surface-500 truncate">{subtitle}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {actions}

        {/* Role badge */}
        <span className={`hidden sm:inline-flex badge capitalize text-xs font-semibold ${getRoleColor(user?.role)}`}>
          {user?.role}
        </span>
      </div>
    </header>
  );
}
