import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import Topbar from '../../components/shared/Topbar';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import api from '../../utils/api';
import { getRoleColor, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'student', phone: '' };

export default function AdminUsers() {
  const { setMobileOpen } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', user: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, type: '', user: null });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const res = await api.get(`/users?${params}`);
      setUsers(res.data.users);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal({ open: true, mode: 'create', user: null });
  };

  const openEdit = (user) => {
    setForm({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '' });
    setModal({ open: true, mode: 'edit', user });
  };

  const closeModal = () => setModal({ open: false, mode: 'create', user: null });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await api.post('/users', form);
        toast.success('User created successfully');
      } else {
        const payload = { name: form.name, email: form.email, phone: form.phone };
        if (form.password) payload.password = form.password;
        await api.put(`/users/${modal.user._id}`, payload);
        toast.success('User updated successfully');
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    setConfirmLoading(true);
    try {
      await api.patch(`/users/${confirm.user._id}/toggle-status`);
      toast.success(`User ${confirm.user.isActive ? 'disabled' : 'enabled'}`);
      fetchUsers();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setConfirmLoading(false);
      setConfirm({ open: false, type: '', user: null });
    }
  };

  const handleDelete = async () => {
    setConfirmLoading(true);
    try {
      await api.delete(`/users/${confirm.user._id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setConfirmLoading(false);
      setConfirm({ open: false, type: '', user: null });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Topbar
        title="User Management"
        subtitle="Manage teachers and students"
        setMobileOpen={setMobileOpen}
        actions={<button className="btn-primary" onClick={openCreate}>+ Add User</button>}
      />

      <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            className="input-field flex-1"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="input-field sm:w-40" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="table-wrapper">
            <table className="table-base">
              <thead className="table-head">
                <tr>
                  <th className="table-th">User</th>
                  <th className="table-th">Role</th>
                  <th className="table-th hidden md:table-cell">Phone</th>
                  <th className="table-th hidden lg:table-cell">Joined</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="table-td"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl skeleton" /><div className="space-y-1.5"><div className="h-3 w-28 skeleton rounded" /><div className="h-2.5 w-36 skeleton rounded" /></div></div></td>
                    {[1,2,3,4,5].map(j => <td key={j} className="table-td"><div className="h-3 w-16 skeleton rounded" /></td>)}
                  </tr>
                )) : users.length === 0 ? (
                  <tr><td colSpan={6} className="table-td text-center py-12 text-surface-400">No users found.</td></tr>
                ) : users.map(user => (
                  <tr key={user._id} className="hover:bg-surface-50 transition-colors">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-600 text-xs font-bold">{user.name?.slice(0,2).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-surface-900 text-sm">{user.name}</p>
                          <p className="text-xs text-surface-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td"><span className={`badge capitalize ${getRoleColor(user.role)}`}>{user.role}</span></td>
                    <td className="table-td hidden md:table-cell text-surface-500">{user.phone || '—'}</td>
                    <td className="table-td hidden lg:table-cell text-surface-500">{formatDate(user.createdAt)}</td>
                    <td className="table-td">
                      <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <button className="btn-ghost p-2" onClick={() => openEdit(user)} title="Edit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                          className={`btn-ghost p-2 ${user.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                          onClick={() => setConfirm({ open: true, type: 'toggle', user })}
                          title={user.isActive ? 'Disable' : 'Enable'}
                        >
                          {user.isActive ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          )}
                        </button>
                        <button className="btn-ghost p-2 text-red-500 hover:bg-red-50" onClick={() => setConfirm({ open: true, type: 'delete', user })} title="Delete">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modal.open} onClose={closeModal} title={modal.mode === 'create' ? 'Create New User' : 'Edit User'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="form-label">Full Name *</label>
            <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" required />
          </div>
          <div>
            <label className="form-label">Email Address *</label>
            <input type="email" className="input-field" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" required />
          </div>
          <div>
            <label className="form-label">{modal.mode === 'create' ? 'Password *' : 'New Password (leave blank to keep)'}</label>
            <input type="password" className="input-field" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" required={modal.mode === 'create'} minLength={6} />
          </div>
          {modal.mode === 'create' && (
            <div>
              <label className="form-label">Role *</label>
              <select className="input-field" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
          )}
          <div>
            <label className="form-label">Phone</label>
            <input type="tel" className="input-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              {saving ? 'Saving...' : modal.mode === 'create' ? 'Create User' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm toggle */}
      <ConfirmDialog
        open={confirm.open && confirm.type === 'toggle'}
        onClose={() => setConfirm({ open: false, type: '', user: null })}
        onConfirm={handleToggleStatus}
        loading={confirmLoading}
        title={confirm.user?.isActive ? 'Disable User' : 'Enable User'}
        message={`Are you sure you want to ${confirm.user?.isActive ? 'disable' : 'enable'} ${confirm.user?.name}?`}
        confirmText={confirm.user?.isActive ? 'Disable' : 'Enable'}
        danger={confirm.user?.isActive}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={confirm.open && confirm.type === 'delete'}
        onClose={() => setConfirm({ open: false, type: '', user: null })}
        onConfirm={handleDelete}
        loading={confirmLoading}
        title="Delete User"
        message={`Are you sure you want to permanently delete ${confirm.user?.name}? This action cannot be undone.`}
        confirmText="Delete"
        danger
      />
    </div>
  );
}
