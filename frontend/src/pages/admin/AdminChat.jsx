import React, { useState, useEffect } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import Topbar from '../../components/shared/Topbar';
import ChatWindow from '../../components/chat/ChatWindow';
import api from '../../utils/api';
import { classSegmentColors } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function AdminChat() {
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
        } else if (res.data.groups.length > 0) {
          setSelectedGroup(res.data.groups[0]);
          navigate(`/admin/chat/${res.data.groups[0]._id}`, { replace: true });
        }
      })
      .catch(() => toast.error('Failed to load groups'))
      .finally(() => setLoading(false));
  }, [groupId]);

  const selectGroup = (g) => {
    setSelectedGroup(g);
    navigate(`/admin/chat/${g._id}`);
  };

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Group Chat" subtitle="Monitor all group conversations" setMobileOpen={setMobileOpen} />
      <div className="flex flex-1 overflow-hidden">
        {/* Group list sidebar */}
        <div className="w-64 border-r border-surface-200 bg-white flex flex-col flex-shrink-0 overflow-y-auto">
          <div className="px-3 py-3 border-b border-surface-100">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">All Groups ({groups.length})</p>
          </div>
          {loading ? (
            <div className="p-3 space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
          ) : groups.length === 0 ? (
            <div className="p-4 text-center text-sm text-surface-400">No groups yet</div>
          ) : (
            <div className="p-2 space-y-1">
              {groups.map(g => (
                <button
                  key={g._id}
                  onClick={() => selectGroup(g)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 ${selectedGroup?._id === g._id ? 'bg-primary-50 border border-primary-200' : 'hover:bg-surface-50'}`}
                >
                  <p className={`text-sm font-semibold truncate ${selectedGroup?._id === g._id ? 'text-primary-700' : 'text-surface-800'}`}>{g.name}</p>
                  <p className="text-xs text-surface-500 truncate mt-0.5">{g.students?.length || 0} students</p>
                  {g.classSegment && (
                    <span className={`badge text-xs mt-1 ${classSegmentColors[g.classSegment] || 'badge-gray'}`}>{g.classSegment}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-hidden">
          {selectedGroup ? (
            <ChatWindow group={selectedGroup} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-20 h-20 rounded-3xl bg-surface-100 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <p className="text-lg font-display font-semibold text-surface-600">Select a group to start chatting</p>
              <p className="text-sm text-surface-400 mt-1">Choose a group from the sidebar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
