import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import Topbar from '../../components/shared/Topbar';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import api from '../../utils/api';
import { formatRelative, getPriorityColor, truncate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY_FORM = { title: '', content: '', priority: 'normal', targetAudience: 'all', tags: '' };

export default function AdminAnnouncements() {
  const { setMobileOpen } = useOutletContext();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', item: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, item: null });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements?limit=50');
      setAnnouncements(res.data.announcements);
    } catch { toast.error('Failed to load announcements'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'create', item: null }); };
  const openEdit = (item) => {
    setForm({ title: item.title, content: item.content, priority: item.priority, targetAudience: item.targetAudience, tags: item.tags?.join(', ') || '' });
    setModal({ open: true, mode: 'edit', item });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
      if (modal.mode === 'create') { await api.post('/announcements', payload); toast.success('Announcement created'); }
      else { await api.put(`/announcements/${modal.item._id}`, payload); toast.success('Announcement updated'); }
      setModal({ open: false, mode: 'create', item: null });
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setConfirmLoading(true);
    try { await api.delete(`/announcements/${confirm.item._id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Delete failed'); }
    finally { setConfirmLoading(false); setConfirm({ open: false, item: null }); }
  };

  const PRIORITY_ICONS = { urgent: '🚨', high: '🔴', normal: '📢', low: '📝' };

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Announcements" subtitle="Broadcast messages to users" setMobileOpen={setMobileOpen}
        actions={<button className="btn-primary" onClick={openCreate}>+ New Announcement</button>} />

      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="card h-28 skeleton" />)}</div>
        ) : announcements.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <span className="text-4xl mb-3">📢</span>
            <p className="text-lg font-semibold text-surface-600">No announcements yet</p>
            <p className="text-sm text-surface-400 mt-1">Create your first announcement</p>
            <button className="btn-primary mt-4" onClick={openCreate}>Create Announcement</button>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a._id} className="card p-5 hover:shadow-card-hover transition-all duration-200">
                <div className="flex items-start gap-4">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{PRIORITY_ICONS[a.priority] || '📢'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-display font-semibold text-surface-900">{a.title}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`badge border capitalize ${getPriorityColor(a.priority)}`}>{a.priority}</span>
                        <span className="badge-gray capitalize">{a.targetAudience}</span>
                      </div>
                    </div>
                    <p className="text-sm text-surface-600 mb-2">{truncate(a.content, 120)}</p>
                    <div className="flex items-center gap-3 text-xs text-surface-400">
                      <span>By <span className="font-medium text-surface-600">{a.authorName}</span></span>
                      <span>·</span>
                      <span>{formatRelative(a.createdAt)}</span>
                      <span>·</span>
                      <span>{a.readBy?.length || 0} read</span>
                    </div>
                    {a.tags?.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {a.tags.map(tag => <span key={tag} className="badge-gray text-xs">{tag}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button className="btn-ghost p-2" onClick={() => setViewItem(a)} title="View">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    <button className="btn-ghost p-2" onClick={() => openEdit(a)} title="Edit">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button className="btn-ghost p-2 text-red-500 hover:bg-red-50" onClick={() => setConfirm({ open: true, item: a })} title="Delete">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit */}
      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: 'create', item: null })} title={modal.mode === 'create' ? 'New Announcement' : 'Edit Announcement'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="form-label">Title *</label><input className="input-field" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" required /></div>
          <div><label className="form-label">Content *</label><textarea className="input-field" rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your announcement..." required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Priority</label>
              <select className="input-field" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="form-label">Target Audience</label>
              <select className="input-field" value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}>
                <option value="all">All Users</option>
                <option value="teachers">Teachers Only</option>
                <option value="students">Students Only</option>
              </select>
            </div>
          </div>
          <div><label className="form-label">Tags (comma separated)</label><input className="input-field" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="exam, holiday, important" /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModal({ open: false, mode: 'create', item: null })}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>{saving ? 'Saving...' : 'Save Announcement'}</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={viewItem?.title || ''} size="lg">
        {viewItem && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <span className={`badge border capitalize ${getPriorityColor(viewItem.priority)}`}>{viewItem.priority} priority</span>
              <span className="badge-gray capitalize">{viewItem.targetAudience}</span>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-surface-700 whitespace-pre-wrap leading-relaxed">{viewItem.content}</p>
            </div>
            <div className="text-xs text-surface-400 pt-2 border-t border-surface-100">
              Posted by <span className="font-medium">{viewItem.authorName}</span> · {formatRelative(viewItem.createdAt)} · {viewItem.readBy?.length || 0} people read this
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, item: null })} onConfirm={handleDelete} loading={confirmLoading}
        title="Delete Announcement" message={`Delete "${confirm.item?.title}"?`} confirmText="Delete" danger />
    </div>
  );
}
