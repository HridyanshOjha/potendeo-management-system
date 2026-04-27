const Announcement = require('../models/Announcement');

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Admin only
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, targetAudience, targetGroups, priority, expiresAt, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    const announcement = await Announcement.create({
      title,
      content,
      author: req.user._id,
      authorName: req.user.name,
      targetAudience: targetAudience || 'all',
      targetGroups: targetGroups || [],
      priority: priority || 'normal',
      expiresAt: expiresAt || null,
      tags: tags || [],
    });

    res.status(201).json({ success: true, message: 'Announcement created.', announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Protected
exports.getAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    // Filter by audience for non-admins
    if (req.user.role !== 'admin') {
      query.$or = [
        { targetAudience: 'all' },
        { targetAudience: req.user.role === 'teacher' ? 'teachers' : 'students' },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Announcement.countDocuments(query),
    ]);

    // Add read status
    const announcementsWithRead = announcements.map(a => ({
      ...a.toObject(),
      isRead: a.readBy.includes(req.user._id),
    }));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      announcements: announcementsWithRead,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Mark announcement as read
// @route   PATCH /api/announcements/:id/read
// @access  Protected
exports.markAsRead = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    if (!announcement.readBy.includes(req.user._id)) {
      announcement.readBy.push(req.user._id);
      await announcement.save();
    }

    res.status(200).json({ success: true, message: 'Marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Admin only
exports.updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    const { title, content, priority, isActive, expiresAt, targetAudience, tags } = req.body;

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (priority) announcement.priority = priority;
    if (isActive !== undefined) announcement.isActive = isActive;
    if (expiresAt !== undefined) announcement.expiresAt = expiresAt;
    if (targetAudience) announcement.targetAudience = targetAudience;
    if (tags) announcement.tags = tags;

    await announcement.save();

    res.status(200).json({ success: true, message: 'Announcement updated.', announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Admin only
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    await announcement.deleteOne();
    res.status(200).json({ success: true, message: 'Announcement deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
