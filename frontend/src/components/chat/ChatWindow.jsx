import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket, initSocket } from '../../utils/socket';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { formatTime, formatDate, getInitials, getRoleBubbleColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const TypingIndicator = ({ typers }) => {
  if (typers.length === 0) return null;
  const names = typers.map(t => t.name).join(', ');
  return (
    <div className="flex items-end gap-2 px-4 pb-2">
      <div className="w-7 h-7 rounded-full bg-surface-200 flex items-center justify-center flex-shrink-0">
        <span className="text-xs text-surface-500">...</span>
      </div>
      <div className="bg-white border border-surface-200 rounded-2xl rounded-bl-sm px-4 py-2.5">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce-dot" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
        <p className="text-xs text-surface-400 mt-0.5">{names} typing...</p>
      </div>
    </div>
  );
};

const MessageBubble = ({ msg, isOwn, onDelete, canDelete }) => {
  const [hovered, setHovered] = useState(false);

  const getBubbleClass = () => {
    if (isOwn) return 'message-bubble-self';
    if (msg.senderRole === 'admin') return 'message-bubble-admin';
    return 'message-bubble-other';
  };

  return (
    <div
      className={`flex items-end gap-2 group ${isOwn ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className={`w-7 h-7 rounded-full ${getRoleBubbleColor(msg.senderRole)} flex items-center justify-center flex-shrink-0 mb-0.5`}>
          <span className="text-white text-xs font-bold">{getInitials(msg.senderName)}</span>
        </div>
      )}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-xs lg:max-w-md`}>
        {/* Sender name (for non-self messages) */}
        {!isOwn && (
          <span className="text-xs font-semibold text-surface-500 mb-1 px-1 capitalize">
            {msg.senderName} · {msg.senderRole}
          </span>
        )}

        <div className="relative flex items-end gap-2">
          {/* Delete btn (left of own messages) */}
          {isOwn && canDelete && hovered && !msg.isDeleted && (
            <button
              onClick={() => onDelete(msg._id)}
              className="p-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          <div className={getBubbleClass()}>
            {msg.isDeleted ? (
              <p className="italic opacity-60 text-xs">[Message deleted]</p>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            )}
          </div>
        </div>

        <span className="text-xs text-surface-400 mt-1 px-1">{formatTime(msg.createdAt)}</span>
      </div>
    </div>
  );
};

const DateDivider = ({ date }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-surface-200" />
    <span className="text-xs font-semibold text-surface-400 px-3 py-1 bg-surface-100 rounded-full">{date}</span>
    <div className="flex-1 h-px bg-surface-200" />
  </div>
);

export default function ChatWindow({ group }) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typers, setTypers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socket = getSocket();

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Load message history
  useEffect(() => {
    if (!group?._id) return;
    setLoading(true);
    api.get(`/chat/${group._id}/messages?limit=80`)
      .then(res => {
        setMessages(res.data.messages || []);
        setTimeout(() => scrollToBottom(false), 100);
      })
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoading(false));
  }, [group?._id]);

  // Socket events
  useEffect(() => {
    if (!socket || !group?._id) return;

    socket.emit('group:join', { groupId: group._id });

    const handleMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(scrollToBottom, 50);
    };

    const handleTypingStart = ({ userId, name, role }) => {
      if (userId === user._id) return;
      setTypers(prev => {
        if (prev.find(t => t.userId === userId)) return prev;
        return [...prev, { userId, name, role }];
      });
    };

    const handleTypingStop = ({ userId }) => {
      setTypers(prev => prev.filter(t => t.userId !== userId));
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, isDeleted: true, content: '[Message deleted]' } : m
      ));
    };

    const handleOnlineUsers = (users) => setOnlineUsers(users);

    socket.on('group:message', handleMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('online:users', handleOnlineUsers);

    return () => {
      socket.emit('group:leave', { groupId: group._id });
      socket.off('group:message', handleMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('online:users', handleOnlineUsers);
    };
  }, [socket, group?._id, user._id]);

  const handleSend = () => {
    const content = newMsg.trim();
    if (!content || sending) return;

    setSending(true);
    socket.emit('group:message', { groupId: group._id, content });
    socket.emit('typing:stop', { groupId: group._id });
    setNewMsg('');
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = (e) => {
    setNewMsg(e.target.value);
    if (socket && group?._id) {
      socket.emit('typing:start', { groupId: group._id });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', { groupId: group._id });
      }, 2000);
    }
  };

  const handleDelete = (messageId) => {
    if (socket && group?._id) {
      socket.emit('message:delete', { messageId, groupId: group._id });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const dateKey = formatDate(msg.createdAt);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-surface-50">
      {/* Chat header */}
      <div className="bg-white border-b border-surface-200 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-surface-900 text-sm">{group?.name}</p>
          <p className="text-xs text-surface-500">{group?.students?.length || 0} students · {group?.teachers?.length || 0} teachers</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex gap-2">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 bg-primary-400 rounded-full animate-bounce-dot" style={{ animationDelay: `${i*0.15}s` }} />
              ))}
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-surface-600">No messages yet</p>
            <p className="text-xs text-surface-400 mt-1">Be the first to say something!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <DateDivider date={date} />
              <div className="space-y-3">
                {msgs.map(msg => (
                  <MessageBubble
                    key={msg._id}
                    msg={msg}
                    isOwn={msg.sender?.toString() === user._id?.toString() || msg.sender === user._id}
                    onDelete={handleDelete}
                    canDelete={user.role === 'admin' || msg.sender?.toString() === user._id?.toString()}
                  />
                ))}
              </div>
            </div>
          ))
        )}
        <TypingIndicator typers={typers} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-surface-200 px-4 py-3">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              className="input-field resize-none min-h-[44px] max-h-32 py-3 pr-4 leading-relaxed"
              placeholder={`Message ${group?.name}...`}
              value={newMsg}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={!socket}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!newMsg.trim() || !socket}
            className="btn-primary px-4 py-3 flex-shrink-0 disabled:opacity-40"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-surface-400 mt-1.5">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
