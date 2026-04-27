import React, { useState, useEffect } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import Topbar from '../../components/shared/Topbar';
import ChatWindow from '../../components/chat/ChatWindow';
import api from '../../utils/api';
import { classSegmentColors } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function TeacherChat() {
  const { setMobileOpen } = useOutletContext();
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/groups/my-groups')
      .then(res => {
        setGroups(res.data.groups);
        if (groupId) {
          const found = res.data.groups.find(g => g._id === groupId);
          if (found) setSelectedGroup(found);
          else if (res.data.groups.length > 0) {
            setSelectedGroup(res.data.groups[0]);
            navigate(`/teacher/chat/${res.data.groups[0]._id}`, { replace: true });
          }
        } else if (res.data.groups.length > 0) {
          setSelectedGroup(res.data.groups[0]);
          navigate(`/teacher/chat/${res.data.groups[0]._id}`, { replace: true });
        }
      })
      .catch(() => toast.error('Failed to load groups'))
      .finally(() => setLoading(false));
  }, [groupId]);

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Group Chat" subtitle="Communicate with your students" setMobileOpen={setMobileOpen} />
      <div className="flex flex-1 overflow-hidden">
        {groups.length > 1 && (
          <div className="w-56 border-r border-surface-200 bg-white flex flex-col flex-shrink-0 overflow-y-auto">
            <div className="px-3 py-3 border-b border-surface-100">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">My Groups</p>
            </div>
            <div className="p-2 space-y-1">
              {groups.map(g => (
                <button
                  key={g._id}
                  onClick={() => { setSelectedGroup(g); navigate(`/teacher/chat/${g._id}`); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${selectedGroup?._id === g._id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-surface-50'}`}
                >
                  <p className={`text-sm font-semibold truncate ${selectedGroup?._id === g._id ? 'text-blue-700' : 'text-surface-800'}`}>{g.name}</p>
                  <p className="text-xs text-surface-500 mt-0.5">{g.students?.length} students</p>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          {selectedGroup ? (
            <ChatWindow group={selectedGroup} />
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <span className="text-4xl mb-3">💬</span>
              <p className="text-lg font-semibold text-surface-600">No groups assigned</p>
              <p className="text-sm text-surface-400 mt-1">Contact admin to be assigned to a group</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
