const Message = require('../models/Message');
const Group = require('../models/Group');
const User = require('../models/User');

// Helper to check group access
const checkGroupAccess = async (groupId, user) => {
  const group = await Group.findById(groupId);
  if (!group) return { allowed: false, message: 'Group not found.' };

  if (user.role === 'admin') return { allowed: true, group };

  if (user.role === 'teacher') {
    const isAssigned = group.teachers.some(t => t.toString() === user._id.toString());
    if (!isAssigned) return { allowed: false, message: 'Access denied to this group.' };
    return { allowed: true, group };
  }

  if (user.role === 'student') {
    const inGroups = Array.isArray(user.groups) && user.groups.some(g => g.toString() === groupId.toString());
    const inPrimary = user.group && user.group.toString() === groupId.toString();
    if (!inGroups && !inPrimary) {
      return { allowed: false, message: 'Access denied to this group.' };
    }
    return { allowed: true, group };
  }

  return { allowed: false, message: 'Access denied.' };
};

// @desc    Get messages for a group
// @route   GET /api/chat/:groupId/messages
// @access  Protected
exports.getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const { allowed, message } = await checkGroupAccess(req.params.groupId, req.user);

    if (!allowed) {
      return res.status(403).json({ success: false, message });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({
      group: req.params.groupId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Return in ascending order for display
    const total = await Message.countDocuments({ group: req.params.groupId, isDeleted: false });

    res.status(200).json({
      success: true,
      total,
      messages: messages.reverse(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Delete a message
// @route   DELETE /api/chat/messages/:messageId
// @access  Protected (own messages or admin)
exports.deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });

    const canDelete = req.user.role === 'admin' || msg.sender.toString() === req.user._id.toString();
    if (!canDelete) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message.' });
    }

    msg.isDeleted = true;
    msg.content = '[Message deleted]';
    await msg.save();

    res.status(200).json({ success: true, message: 'Message deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get total message count (for admin dashboard)
// @route   GET /api/chat/stats/total
// @access  Admin only
exports.getTotalMessages = async (req, res) => {
  try {
    const total = await Message.countDocuments({ isDeleted: false });
    res.status(200).json({ success: true, totalMessages: total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
