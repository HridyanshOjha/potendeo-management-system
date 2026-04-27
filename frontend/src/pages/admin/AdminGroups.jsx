import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import Topbar from '../../components/shared/Topbar';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import api from '../../utils/api';
import { classSegmentColors } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CLASS_SEGMENTS = ['Class 1-5', 'Class 6-8', 'Class 9-10', 'Class 11-12', 'Competitive Exams'];
const EMPTY_FORM = { name: '', description: '', subject: '', classSegment: '', maxStudents: 50, schedule: '' };

export default function AdminGroups() {
  const { setMobileOpen } = useOutletContext();
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', group: null });
  const [assignModal, setAssignModal] = useState({ open: false, type: '', group: null });
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, group: null });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/groups');
      setGroups(res.data.groups);
    } catch { toast.error('Failed to load groups'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const fetchUsersForAssign = async (type) => {
    try {
      const res = await api.get(`/users?role=${type}&limit=200`);
      if (type === 'teacher') setTeachers(res.data.users);
      else setStudents(res.data.users);
    } catch { toast.error(`Failed to load ${type}s`); }
  };

  const openAssign = async (type, group) => {
    await fetchUsersForAssign(type);
    setSelectedId('');
    setAssignModal({ open: true, type, group });
  };

  const handleAssign = async () => {
    if (!selectedId) { toast.error('Please select a user'); return; }
    setSaving(true);
    try {
      if (assignModal.type === 'teacher') {
        await api.post(`/groups/${assignModal.group._id}/assign-teacher`, { teacherId: selectedId });
        toast.success('Teacher assigned');
      } else {
        await api.post(`/groups/${assignModal.group._id}/assign-student`, { studentId: selectedId });
        toast.success('Student assigned');
      }
      setAssignModal({ open: false, type: '', group: null });
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assign failed');
    } finally { setSaving(false); }
  };

  const handleRemoveMember = async (groupId, userId, type) => {
    try {
      if (type === 'teacher') await api.delete(`/groups/${groupId}/remove-teacher/${userId}`);
      else await api.delete(`/groups/${groupId}/remove-student/${userId}`);
      toast.success(`${type === 'teacher' ? 'Teacher' : 'Student'} removed`);
      fetchGroups();
    } catch { toast.error('Remove failed'); }
  };

  const openCreate = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'create', group: null }); };
  const openEdit = (g) => { setForm({ name: g.name, description: g.description || '', subject: g.subject || '', classSegment: g.classSegment || '', maxStudents: g.maxStudents, schedule: g.schedule || '' }); setModal({ open: true, mode: 'edit', group: g }); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') { await api.post('/groups', form); toast.success('Group created'); }
      else { await api.put(`/groups/${modal.group._id}`, form); toast.success('Group updated'); }
      setModal({ open: false, mode: 'create', group: null });
      fetchGroups();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setConfirmLoading(true);
    try { await api.delete(`/groups/${confirm.group._id}`); toast.success('Group deleted'); fetchGroups(); }
    catch { toast.error('Delete failed'); }
    finally { setConfirmLoading(false); setConfirm({ open: false, group: null }); }
  };

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Group Management" subtitle="Create and manage learning groups" setMobileOpen={setMobileOpen}
        actions={<button className="btn-primary" onClick={openCreate}>+ Create Group</button>} />

      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="card h-48 skeleton" />)}
          </div>
        ) : groups.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <p className="text-lg font-semibold text-surface-600">No groups yet</p>
            <p className="text-sm text-surface-400 mt-1">Create your first group to get started</p>
            <button className="btn-primary mt-4" onClick={openCreate}>Create Group</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {groups.map(g => (
              <div key={g._id} className="card flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-display font-semibold text-surface-900">{g.name}</h3>
                      {g.subject && <p className="text-xs text-surface-500 mt-0.5">{g.subject}</p>}
                    </div>
                    {g.classSegment && (
                      <span className={`badge text-xs flex-shrink-0 ${classSegmentColors[g.classSegment] || 'badge-gray'}`}>{g.classSegment}</span>
                    )}
                  </div>
                  {g.description && <p className="text-sm text-surface-500 mb-3">{g.description}</p>}
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-surface-600">
                      <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      <span className="font-semibold text-surface-900">{g.teachers?.length}</span> teachers
                    </span>
                    <span className="flex items-center gap-1.5 text-surface-600">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      <span className="font-semibold text-surface-900">{g.students?.length}</span> / {g.maxStudents}
                    </span>
                  </div>

                  {/* Expandable members */}
                  {expanded === g._id && (
                    <div className="mt-4 space-y-3 animate-fade-in">
                      <div>
                        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Teachers</p>
                        {g.teachers?.length === 0 ? <p className="text-xs text-surface-400">No teachers assigned</p> : (
                          <div className="space-y-1">
                            {g.teachers.map(t => (
                              <div key={t._id} className="flex items-center justify-between">
                                <span className="text-sm text-surface-700">{t.name}</span>
                                <button className="text-red-400 hover:text-red-600 p-1" onClick={() => handleRemoveMember(g._id, t._id, 'teacher')}>
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Students</p>
                        {g.students?.length === 0 ? <p className="text-xs text-surface-400">No students assigned</p> : (
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {g.students.map(s => (
                              <div key={s._id} className="flex items-center justify-between">
                                <span className="text-sm text-surface-700">{s.name}</span>
                                <button className="text-red-400 hover:text-red-600 p-1" onClick={() => handleRemoveMember(g._id, s._id, 'student')}>
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-surface-100 px-5 py-3 flex flex-wrap gap-2">
                  <button className="btn-ghost text-xs py-1.5 px-2.5 text-blue-600 hover:bg-blue-50" onClick={() => openAssign('teacher', g)}>+ Teacher</button>
                  <button className="btn-ghost text-xs py-1.5 px-2.5 text-emerald-600 hover:bg-emerald-50" onClick={() => openAssign('student', g)}>+ Student</button>
                  <button className="btn-ghost text-xs py-1.5 px-2.5" onClick={() => setExpanded(expanded === g._id ? null : g._id)}>
                    {expanded === g._id ? 'Hide' : 'Members'}
                  </button>
                  <button className="btn-ghost text-xs py-1.5 px-2.5" onClick={() => openEdit(g)}>Edit</button>
                  <button className="btn-ghost text-xs py-1.5 px-2.5 text-red-500 hover:bg-red-50" onClick={() => setConfirm({ open: true, group: g })}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: 'create', group: null })} title={modal.mode === 'create' ? 'Create Group' : 'Edit Group'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="form-label">Group Name *</label><input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Science Batch A" required /></div>
          <div><label className="form-label">Subject</label><input className="input-field" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" /></div>
          <div>
            <label className="form-label">Class Segment</label>
            <select className="input-field" value={form.classSegment} onChange={e => setForm(f => ({ ...f, classSegment: e.target.value }))}>
              <option value="">Select segment</option>
              {CLASS_SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="form-label">Description</label><textarea className="input-field" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." /></div>
          <div><label className="form-label">Max Students</label><input type="number" className="input-field" value={form.maxStudents} onChange={e => setForm(f => ({ ...f, maxStudents: parseInt(e.target.value) }))} min={1} max={500} /></div>
          <div><label className="form-label">Schedule</label><input className="input-field" value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} placeholder="e.g. Mon, Wed, Fri 4–6 PM" /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setModal({ open: false, mode: 'create', group: null })}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>{saving ? 'Saving...' : modal.mode === 'create' ? 'Create Group' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal open={assignModal.open} onClose={() => setAssignModal({ open: false, type: '', group: null })} title={`Assign ${assignModal.type === 'teacher' ? 'Teacher' : 'Student'} to ${assignModal.group?.name}`} size="sm">
        <div className="space-y-4">
          <select className="input-field" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            <option value="">Select {assignModal.type}...</option>
            {(assignModal.type === 'teacher' ? teachers : students).map(u => (
              <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
            ))}
          </select>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setAssignModal({ open: false, type: '', group: null })}>Cancel</button>
            <button className="btn-primary flex-1 justify-center" onClick={handleAssign} disabled={saving}>{saving ? 'Assigning...' : 'Assign'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, group: null })} onConfirm={handleDelete} loading={confirmLoading}
        title="Delete Group" message={`Delete "${confirm.group?.name}"? All member assignments will be removed.`} confirmText="Delete" danger />
    </div>
  );
}
