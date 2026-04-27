import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Topbar from '../../components/shared/Topbar';
import StatCard from '../../components/shared/StatCard';
import api from '../../utils/api';
import { formatRelative, getRoleColor, truncate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const icons = {
  students: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  teachers: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  groups: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  messages: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
};

export default function AdminDashboard() {
  const { setMobileOpen } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setStats(res.data.stats))
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, []);

  const Skeleton = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="card p-6 h-24 skeleton" />)}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Dashboard" subtitle="Welcome back, Admin" setMobileOpen={setMobileOpen} />

      <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">
        {/* Stats Grid */}
        {loading ? <Skeleton /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={icons.students} label="Total Students" value={stats?.users.totalStudents} sub={`${stats?.users.activeStudents} active`} color="emerald" />
            <StatCard icon={icons.teachers} label="Total Teachers" value={stats?.users.totalTeachers} sub={`${stats?.users.activeTeachers} active`} color="blue" />
            <StatCard icon={icons.groups} label="Total Groups" value={stats?.groups.total} sub={`${stats?.groups.active} active`} color="violet" />
            <StatCard icon={icons.messages} label="Total Messages" value={stats?.messages.total} sub="across all groups" color="orange" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="card">
            <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
              <h2 className="font-display font-semibold text-surface-900">Recent Users</h2>
              <span className="badge-gray">Latest 5</span>
            </div>
            <div className="divide-y divide-surface-100">
              {loading ? [1,2,3].map(i => (
                <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl skeleton" />
                  <div className="flex-1 space-y-1.5"><div className="h-3 skeleton rounded w-32" /><div className="h-2.5 skeleton rounded w-24" /></div>
                </div>
              )) : stats?.recentUsers?.length === 0 ? (
                <p className="px-5 py-8 text-sm text-surface-400 text-center">No users yet</p>
              ) : stats?.recentUsers?.map(u => (
                <div key={u._id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-surface-500">{u.name?.slice(0,2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-800 truncate">{u.name}</p>
                    <p className="text-xs text-surface-400 truncate">{u.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`badge capitalize text-xs ${getRoleColor(u.role)}`}>{u.role}</span>
                    <span className={`text-xs ${u.isActive ? 'text-emerald-500' : 'text-red-400'}`}>{u.isActive ? 'Active' : 'Disabled'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Messages */}
          <div className="card">
            <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
              <h2 className="font-display font-semibold text-surface-900">Recent Messages</h2>
              <span className="badge-gray">Latest 5</span>
            </div>
            <div className="divide-y divide-surface-100">
              {loading ? [1,2,3].map(i => (
                <div key={i} className="px-5 py-3.5 flex gap-3">
                  <div className="flex-1 space-y-1.5"><div className="h-3 skeleton rounded w-40" /><div className="h-2.5 skeleton rounded w-28" /></div>
                </div>
              )) : stats?.recentMessages?.length === 0 ? (
                <p className="px-5 py-8 text-sm text-surface-400 text-center">No messages yet</p>
              ) : stats?.recentMessages?.map((m, i) => (
                <div key={i} className="px-5 py-3.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-surface-800">{m.senderName}</span>
                    <span className={`badge capitalize text-xs ${getRoleColor(m.senderRole)}`}>{m.senderRole}</span>
                    <span className="text-xs text-surface-400 ml-auto">{formatRelative(m.createdAt)}</span>
                  </div>
                  <p className="text-xs text-surface-500">{truncate(m.content, 70)}</p>
                  {m.group && <p className="text-xs text-primary-500 mt-0.5">in {m.group.name}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Groups by Segment */}
        {!loading && stats?.groups?.bySegment?.length > 0 && (
          <div className="card p-5">
            <h2 className="font-display font-semibold text-surface-900 mb-4">Groups by Segment</h2>
            <div className="flex flex-wrap gap-3">
              {stats.groups.bySegment.map(seg => (
                <div key={seg._id} className="flex items-center gap-2 px-4 py-2 bg-surface-50 rounded-xl border border-surface-200">
                  <span className="text-sm font-medium text-surface-700">{seg._id || 'Unassigned'}</span>
                  <span className="badge-primary">{seg.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
