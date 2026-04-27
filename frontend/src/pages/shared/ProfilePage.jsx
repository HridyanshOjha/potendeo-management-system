import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { getInitials, formatDateTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ROLE_GRADIENT = {
  admin:   'from-violet-600 to-primary-600',
  teacher: 'from-blue-600 to-primary-600',
  student: 'from-emerald-600 to-teal-600',
};

const ROLE_LABEL = { admin: 'Administrator', teacher: 'Teacher', student: 'Student' };

export default function ProfilePage({ onClose }) {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const studentGroups = (user?.role === 'student')
    ? (Array.isArray(user?.groups) && user.groups.length > 0 ? user.groups : (user?.group ? [user.group] : []))
    : [];

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name:  user?.name  || '',
    phone: user?.phone || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await api.put(`/users/${user._id}`, profileForm);
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setPwSaving(false);
    }
  };

  const PasswordInput = ({ label, fieldKey, placeholder }) => (
    <div>
      <label className="form-label">{label}</label>
      <div className="relative">
        <input
          type={showPw[fieldKey] ? 'text' : 'password'}
          className="input-field pr-11"
          placeholder={placeholder}
          value={pwForm[fieldKey === 'current' ? 'currentPassword' : fieldKey === 'new' ? 'newPassword' : 'confirmPassword']}
          onChange={e => setPwForm(f => ({
            ...f,
            [fieldKey === 'current' ? 'currentPassword' : fieldKey === 'new' ? 'newPassword' : 'confirmPassword']: e.target.value,
          }))}
          required
        />
        <button
          type="button"
          onClick={() => setShowPw(p => ({ ...p, [fieldKey]: !p[fieldKey] }))}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
        >
          {showPw[fieldKey] ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col max-h-[90vh]">
      {/* Avatar header */}
      <div className={`bg-gradient-to-br ${ROLE_GRADIENT[user?.role]} p-6 text-white rounded-t-2xl`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 border-2 border-white/30">
            <span className="text-white text-xl font-bold">{getInitials(user?.name)}</span>
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">{user?.name}</h2>
            <p className="text-white/80 text-sm">{user?.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 bg-white/20 rounded-lg text-xs font-semibold">
              {ROLE_LABEL[user?.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200 bg-white px-4">
        {[
          { key: 'profile', label: 'Profile' },
          { key: 'security', label: 'Security' },
          { key: 'info', label: 'Account Info' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ── Profile Tab ── */}
        {tab === 'profile' && (
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="form-label">Full Name</label>
              <input
                className="input-field"
                value={profileForm.name}
                onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <input
                className="input-field bg-surface-50 cursor-not-allowed"
                value={user?.email}
                disabled
                title="Email cannot be changed"
              />
              <p className="text-xs text-surface-400 mt-1">Email address cannot be changed. Contact admin if needed.</p>
            </div>
            <div>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="input-field"
                value={profileForm.phone}
                onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={profileSaving}>
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        )}

        {/* ── Security Tab ── */}
        {tab === 'security' && (
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Choose a strong password with at least 6 characters.
            </div>

            <PasswordInput label="Current Password" fieldKey="current" placeholder="Your current password" />
            <PasswordInput label="New Password" fieldKey="new" placeholder="New password (min 6 chars)" />
            <PasswordInput label="Confirm New Password" fieldKey="confirm" placeholder="Confirm new password" />

            <button type="submit" className="btn-primary w-full justify-center" disabled={pwSaving}>
              {pwSaving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        )}

        {/* ── Account Info Tab ── */}
        {tab === 'info' && (
          <div className="space-y-4">
            {[
              { label: 'User ID', value: user?._id },
              { label: 'Role', value: ROLE_LABEL[user?.role] },
              { label: 'Account Status', value: user?.isActive ? 'Active ✅' : 'Disabled ❌' },
              { label: 'Member Since', value: user?.createdAt ? formatDateTime(user.createdAt) : '—' },
              { label: 'Last Login', value: user?.lastSeen ? formatDateTime(user.lastSeen) : '—' },
              ...(user?.role === 'student' && studentGroups.length > 0 ? [{
                label: studentGroups.length > 1 ? 'Groups' : 'Group',
                value: studentGroups
                  .map(g => (typeof g === 'string' ? g : (g?.name || g?._id || String(g))))
                  .join(', '),
              }] : []),
              ...(user?.role === 'teacher' ? [{ label: 'Groups Assigned', value: user?.assignedGroups?.length || 0 }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0">
                <span className="text-sm text-surface-500 font-medium">{label}</span>
                <span className="text-sm text-surface-900 font-semibold text-right max-w-[60%] truncate">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
