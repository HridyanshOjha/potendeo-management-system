import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import Topbar from '../../components/shared/Topbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { classSegmentColors, getPriorityColor, truncate, formatRelative } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { setMobileOpen } = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/groups/my-groups'),
      api.get('/announcements?limit=3'),
    ]).then(([groupRes, annRes]) => {
      const groups = groupRes.data.groups;
      setGroup(groups[0] || null);
      setAnnouncements(annRes.data.announcements || []);
    }).catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const PRIORITY_ICONS = { urgent: '🚨', high: '🔴', normal: '📢', low: '📝' };

  return (
    <div className="flex flex-col h-full">
      <Topbar title="My Dashboard" subtitle={`Welcome, ${user?.name}`} setMobileOpen={setMobileOpen} />
      <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">

        {/* Group Card */}
        <div>
          <h2 className="page-title mb-3">My Group</h2>
          {loading ? <div className="card h-40 skeleton" /> : !group ? (
            <div className="card flex flex-col items-center py-12 text-center">
              <span className="text-4xl mb-3">📚</span>
              <p className="font-semibold text-surface-600">Not assigned to a group yet</p>
              <p className="text-sm text-surface-400 mt-1">Contact your admin to be assigned to a group</p>
            </div>
          ) : (
            <div className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-display font-bold text-surface-900">{group.name}</h3>
                  {group.subject && <p className="text-surface-500 mt-0.5">{group.subject}</p>}
                </div>
                {group.classSegment && <span className={`badge ${classSegmentColors[group.classSegment] || 'badge-gray'}`}>{group.classSegment}</span>}
              </div>
              {group.description && <p className="text-sm text-surface-600 mb-4">{group.description}</p>}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-surface-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-display font-bold text-surface-900">{group.teachers?.length || 0}</p>
                  <p className="text-xs text-surface-500 mt-0.5">Teachers</p>
                </div>
                <div className="bg-surface-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-display font-bold text-surface-900">{group.students?.length || 0}</p>
                  <p className="text-xs text-surface-500 mt-0.5">Students</p>
                </div>
              </div>
              {group.schedule && (
                <div className="flex items-center gap-2 text-sm text-surface-500 mb-4">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {group.schedule}
                </div>
              )}
              {group.teachers?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Teachers</p>
                  <div className="flex flex-wrap gap-2">
                    {group.teachers.map(t => (
                      <span key={t._id} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <button className="btn-primary w-full justify-center" onClick={() => navigate('/student/chat')}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                Open Group Chat
              </button>
            </div>
          )}
        </div>

        {/* Recent Announcements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="page-title">Recent Announcements</h2>
            <button className="btn-ghost text-sm" onClick={() => navigate('/student/announcements')}>View all →</button>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2].map(i => <div key={i} className="card h-20 skeleton" />)}</div>
          ) : announcements.length === 0 ? (
            <div className="card flex items-center justify-center py-10 text-center">
              <p className="text-sm text-surface-400">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {announcements.map(a => (
                <div key={a._id} className="card p-4 flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{PRIORITY_ICONS[a.priority]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-surface-900 truncate">{a.title}</p>
                      <span className={`badge border text-xs capitalize flex-shrink-0 ${getPriorityColor(a.priority)}`}>{a.priority}</span>
                    </div>
                    <p className="text-xs text-surface-500">{truncate(a.content, 80)}</p>
                    <p className="text-xs text-surface-400 mt-1">{formatRelative(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
