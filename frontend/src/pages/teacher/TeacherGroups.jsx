import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import Topbar from '../../components/shared/Topbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { classSegmentColors, getInitials } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function TeacherGroups() {
  const { setMobileOpen } = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    api.get('/groups/my-groups')
      .then(res => {
        setGroups(res.data.groups);
        if (res.data.groups.length > 0) setSelectedGroup(res.data.groups[0]);
      })
      .catch(() => toast.error('Failed to load groups'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full">
      <Topbar
        title="My Groups"
        subtitle={`${groups.length} group${groups.length !== 1 ? 's' : ''} assigned`}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex-1 overflow-hidden flex">
        {/* Group selector (left panel) */}
        {groups.length > 1 && (
          <div className="w-56 border-r border-surface-200 bg-white overflow-y-auto flex-shrink-0">
            <div className="p-2 space-y-1">
              {groups.map(g => (
                <button
                  key={g._id}
                  onClick={() => setSelectedGroup(g)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                    selectedGroup?._id === g._id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-surface-50'
                  }`}
                >
                  <p className={`text-sm font-semibold truncate ${selectedGroup?._id === g._id ? 'text-blue-700' : 'text-surface-800'}`}>
                    {g.name}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">{g.students?.length} students</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Detail panel */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <div key={i} className="card h-48 skeleton" />)}
            </div>
          ) : !selectedGroup ? (
            <div className="card flex flex-col items-center justify-center py-20 text-center">
              <span className="text-4xl mb-3">📚</span>
              <p className="text-lg font-semibold text-surface-600">No groups assigned</p>
              <p className="text-sm text-surface-400 mt-1">Contact admin to be assigned to a group.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Group info card */}
              <div className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-display font-bold text-surface-900">{selectedGroup.name}</h2>
                    {selectedGroup.subject && (
                      <p className="text-surface-500 mt-0.5">{selectedGroup.subject}</p>
                    )}
                  </div>
                  {selectedGroup.classSegment && (
                    <span className={`badge ${classSegmentColors[selectedGroup.classSegment] || 'badge-gray'}`}>
                      {selectedGroup.classSegment}
                    </span>
                  )}
                </div>

                {selectedGroup.description && (
                  <p className="text-sm text-surface-600 mb-4">{selectedGroup.description}</p>
                )}

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Students', value: selectedGroup.students?.length || 0, color: 'text-emerald-600' },
                    { label: 'Teachers', value: selectedGroup.teachers?.length || 0, color: 'text-blue-600' },
                    { label: 'Max',      value: selectedGroup.maxStudents || '∞',    color: 'text-surface-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-surface-50 rounded-xl p-3 text-center">
                      <p className={`text-xl font-display font-bold ${color}`}>{value}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {selectedGroup.schedule && (
                  <div className="flex items-center gap-2 text-sm text-surface-600 bg-surface-50 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {selectedGroup.schedule}
                  </div>
                )}
              </div>

              {/* Other teachers in the group */}
              {selectedGroup.teachers?.length > 1 && (
                <div className="card p-5">
                  <h3 className="font-display font-semibold text-surface-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Co-Teachers ({selectedGroup.teachers.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedGroup.teachers.map(t => (
                      <div key={t._id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                        t._id === user._id ? 'bg-blue-50 border-blue-200' : 'bg-surface-50 border-surface-200'
                      }`}>
                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-700 text-xs font-bold">{getInitials(t.name)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-surface-800 truncate">
                            {t.name}
                            {t._id === user._id && <span className="text-blue-600 ml-1">(You)</span>}
                          </p>
                          <p className="text-xs text-surface-500 truncate">{t.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Students list */}
              <div className="card p-5">
                <h3 className="font-display font-semibold text-surface-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Students ({selectedGroup.students?.length || 0})
                </h3>

                {selectedGroup.students?.length === 0 ? (
                  <p className="text-sm text-surface-400 py-4 text-center">No students assigned yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {selectedGroup.students.map((s, idx) => (
                      <div
                        key={s._id}
                        className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl border border-surface-200 animate-fade-in"
                        style={{ animationDelay: `${idx * 0.03}s` }}
                      >
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-700 text-xs font-bold">{getInitials(s.name)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-surface-800 truncate">{s.name}</p>
                          <p className="text-xs text-surface-500 truncate">{s.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="flex gap-3">
                <button
                  className="btn-primary flex-1 justify-center"
                  onClick={() => navigate(`/teacher/chat/${selectedGroup._id}`)}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Open Group Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
