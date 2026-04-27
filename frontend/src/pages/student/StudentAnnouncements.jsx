import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import Topbar from '../../components/shared/Topbar';
import Modal from '../../components/shared/Modal';
import api from '../../utils/api';
import { getPriorityColor, formatDateTime, formatRelative, truncate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const PRIORITY_ICONS  = { urgent: '🚨', high: '🔴', normal: '📢', low: '📝' };
const PRIORITY_ORDER  = { urgent: 0, high: 1, normal: 2, low: 3 };

export default function StudentAnnouncements() {
  const { setMobileOpen } = useOutletContext();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [viewItem, setViewItem]   = useState(null);
  const [filter, setFilter]       = useState('all');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements?limit=50');
      setAnnouncements(res.data.announcements || []);
    } catch { toast.error('Failed to load announcements'); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleOpen = async (a) => {
    setViewItem(a);
    if (!a.isRead) {
      try {
        await api.patch(`/announcements/${a._id}/read`);
        setAnnouncements(prev => prev.map(x => x._id === a._id ? { ...x, isRead: true } : x));
      } catch {}
    }
  };

  const filtered = announcements
    .filter(a => filter === 'all' || a.priority === filter)
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99));

  const unreadCount = announcements.filter(a => !a.isRead).length;

  return (
    <div className="flex flex-col h-full">
      <Topbar
        title="Announcements"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'urgent', 'high', 'normal', 'low'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                filter === f
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'
              }`}
            >
              {f === 'all' ? `All (${announcements.length})` : `${PRIORITY_ICONS[f]} ${f}`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="card h-24 skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <span className="text-5xl mb-3">📭</span>
            <p className="text-lg font-semibold text-surface-600">No announcements</p>
            <p className="text-sm text-surface-400 mt-1">
              {filter === 'all' ? 'Nothing to show yet.' : `No ${filter} priority announcements.`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((a, idx) => (
              <button
                key={a._id}
                onClick={() => handleOpen(a)}
                className={`w-full text-left card p-4 hover:shadow-card-hover transition-all duration-200 animate-fade-in ${
                  !a.isRead ? 'border-l-4 border-l-primary-500' : ''
                }`}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{PRIORITY_ICONS[a.priority]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <p className={`text-sm font-semibold truncate flex-1 ${!a.isRead ? 'text-surface-900' : 'text-surface-700'}`}>
                        {a.title}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!a.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0" />
                        )}
                        <span className={`badge border capitalize text-xs ${getPriorityColor(a.priority)}`}>
                          {a.priority}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-surface-500 line-clamp-2">{truncate(a.content, 100)}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-surface-400">
                      <span>{a.authorName}</span>
                      <span>·</span>
                      <span>{formatRelative(a.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={viewItem?.title || ''} size="lg">
        {viewItem && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className={`badge border capitalize ${getPriorityColor(viewItem.priority)}`}>
                {PRIORITY_ICONS[viewItem.priority]} {viewItem.priority} priority
              </span>
              <span className="badge-gray capitalize">{viewItem.targetAudience} users</span>
            </div>

            <div className="bg-surface-50 rounded-xl p-4 border border-surface-200">
              <p className="text-sm text-surface-800 whitespace-pre-wrap leading-relaxed">
                {viewItem.content}
              </p>
            </div>

            {viewItem.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {viewItem.tags.map(tag => (
                  <span key={tag} className="badge-gray text-xs">#{tag}</span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-surface-400 pt-1 border-t border-surface-100">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Posted by <span className="font-medium text-surface-600">{viewItem.authorName}</span></span>
              <span>·</span>
              <span>{formatDateTime(viewItem.createdAt)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
