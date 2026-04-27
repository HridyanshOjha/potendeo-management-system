import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import Topbar from '../../components/shared/Topbar';
import StatCard from '../../components/shared/StatCard';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { classSegmentColors } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function TeacherDashboard() {
  const { setMobileOpen } = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/groups/my-groups')
      .then(res => setGroups(res.data.groups))
      .catch(() => toast.error('Failed to load groups'))
      .finally(() => setLoading(false));
  }, []);

  const totalStudents = groups.reduce((acc, g) => acc + (g.students?.length || 0), 0);

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Teacher Dashboard" subtitle={`Welcome, ${user?.name}`} setMobileOpen={setMobileOpen} />
      <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">

        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            label="My Groups" value={groups.length} sub="assigned groups" color="blue"
          />
          <StatCard
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
            label="Total Students" value={totalStudents} sub="across all groups" color="emerald"
          />
        </div>

        <div>
          <h2 className="page-title mb-4">My Assigned Groups</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2].map(i => <div key={i} className="card h-36 skeleton" />)}
            </div>
          ) : groups.length === 0 ? (
            <div className="card flex flex-col items-center py-16 text-center">
              <span className="text-4xl mb-3">📚</span>
              <p className="text-lg font-semibold text-surface-600">No groups assigned yet</p>
              <p className="text-sm text-surface-400 mt-1">Contact your admin to be assigned to a group</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map(g => (
                <div key={g._id} className="card-hover p-5" onClick={() => navigate(`/teacher/chat/${g._id}`)}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display font-semibold text-surface-900">{g.name}</h3>
                      {g.subject && <p className="text-xs text-surface-500 mt-0.5">{g.subject}</p>}
                    </div>
                    {g.classSegment && <span className={`badge text-xs ${classSegmentColors[g.classSegment] || 'badge-gray'}`}>{g.classSegment}</span>}
                  </div>
                  {g.description && <p className="text-sm text-surface-500 mb-3">{g.description}</p>}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-surface-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        {g.students?.length} students
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-primary-600 flex items-center gap-1">
                      Open Chat
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </span>
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
