const Message = require('../models/Message');
const Group = require('../models/Group');
const User = require('../models/User');

// Track online users: Map<userId, Set<socketId>>
const onlineUsers = new Map();

const checkGroupAccess = async (groupId, user) => {
  const group = await Group.findById(groupId);
  if (!group) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'teacher') {
    return group.teachers.some(t => t.toString() === user._id.toString());
  }
  if (user.role === 'student') {
    return user.group && user.group.toString() === groupId.toString();
  }
  return false;
};

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`✅ Socket connected: ${user.name} (${user.role}) [${socket.id}]`);

    // Track online users
    if (!onlineUsers.has(user._id.toString())) {
      onlineUsers.set(user._id.toString(), new Set());
    }
    onlineUsers.get(user._id.toString()).add(socket.id);

    // Broadcast online users to all
    io.emit('online:users', Array.from(onlineUsers.keys()));

    // ─────────────────────────────────────────────
    // JOIN GROUP ROOM
    // ─────────────────────────────────────────────
    socket.on('group:join', async ({ groupId }) => {
      try {
        const hasAccess = await checkGroupAccess(groupId, user);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to this group.' });
          return;
        }

        socket.join(`group:${groupId}`);
        console.log(`👥 ${user.name} joined group room: ${groupId}`);

        // Notify others in room
        socket.to(`group:${groupId}`).emit('user:joined', {
          userId: user._id,
          name: user.name,
          role: user.role,
        });

        socket.emit('group:joined', { groupId, message: 'Joined group successfully.' });
      } catch (error) {
        console.error('group:join error:', error);
        socket.emit('error', { message: 'Failed to join group.' });
      }
    });

    // ─────────────────────────────────────────────
    // LEAVE GROUP ROOM
    // ─────────────────────────────────────────────
    socket.on('group:leave', ({ groupId }) => {
      socket.leave(`group:${groupId}`);
      socket.to(`group:${groupId}`).emit('user:left', {
        userId: user._id,
        name: user.name,
      });
    });

    // ─────────────────────────────────────────────
    // SEND MESSAGE
    // ─────────────────────────────────────────────
    socket.on('group:message', async ({ groupId, content }) => {
      try {
        if (!content || !content.trim()) {
          socket.emit('error', { message: 'Message cannot be empty.' });
          return;
        }

        if (content.trim().length > 2000) {
          socket.emit('error', { message: 'Message too long (max 2000 characters).' });
          return;
        }

        const hasAccess = await checkGroupAccess(groupId, user);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied.' });
          return;
        }

        // Save message to DB
        const message = await Message.create({
          group: groupId,
          sender: user._id,
          senderName: user.name,
          senderRole: user.role,
          content: content.trim(),
          type: 'text',
        });

        const messageData = {
          _id: message._id,
          group: groupId,
          sender: user._id,
          senderName: user.name,
          senderRole: user.role,
          content: message.content,
          type: message.type,
          createdAt: message.createdAt,
          isDeleted: false,
        };

        // Broadcast to everyone in the group room (including sender)
        io.to(`group:${groupId}`).emit('group:message', messageData);
      } catch (error) {
        console.error('group:message error:', error);
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    // ─────────────────────────────────────────────
    // TYPING INDICATORS
    // ─────────────────────────────────────────────
    socket.on('typing:start', ({ groupId }) => {
      socket.to(`group:${groupId}`).emit('typing:start', {
        userId: user._id,
        name: user.name,
        role: user.role,
      });
    });

    socket.on('typing:stop', ({ groupId }) => {
      socket.to(`group:${groupId}`).emit('typing:stop', {
        userId: user._id,
        name: user.name,
      });
    });

    // ─────────────────────────────────────────────
    // DELETE MESSAGE (real-time)
    // ─────────────────────────────────────────────
    socket.on('message:delete', async ({ messageId, groupId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;

        const canDelete = user.role === 'admin' || msg.sender.toString() === user._id.toString();
        if (!canDelete) {
          socket.emit('error', { message: 'Cannot delete this message.' });
          return;
        }

        msg.isDeleted = true;
        msg.content = '[Message deleted]';
        await msg.save();

        io.to(`group:${groupId}`).emit('message:deleted', { messageId, groupId });
      } catch (error) {
        console.error('message:delete error:', error);
      }
    });

    // ─────────────────────────────────────────────
    // DISCONNECT
    // ─────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${user.name} [${socket.id}]`);

      const userSockets = onlineUsers.get(user._id.toString());
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(user._id.toString());
        }
      }

      // Update last seen
      User.findByIdAndUpdate(user._id, { lastSeen: Date.now() }).catch(console.error);

      io.emit('online:users', Array.from(onlineUsers.keys()));
    });
  });
};

module.exports = setupSocket;
