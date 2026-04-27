import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Topbar from '../../components/shared/Topbar';
import ChatWindow from '../../components/chat/ChatWindow';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function StudentChat() {
  const { setMobileOpen } = useOutletContext();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/groups/my-groups')
      .then(res => {
        const groups = res.data.groups;
        setGroup(groups[0] || null);
      })
      .catch(() => toast.error('Failed to load group'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full">
      <Topbar
        title="Group Chat"
        subtitle={group ? `Chatting in ${group.name}` : 'No group assigned'}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-surface-500">Loading chat...</p>
            </div>
          </div>
        ) : !group ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 rounded-3xl bg-surface-100 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-xl font-display font-semibold text-surface-700">No group assigned yet</p>
            <p className="text-sm text-surface-400 mt-2 max-w-xs">
              You need to be assigned to a group before you can access the group chat.
              Contact your admin for assistance.
            </p>
          </div>
        ) : (
          <ChatWindow group={group} />
        )}
      </div>
    </div>
  );
}
