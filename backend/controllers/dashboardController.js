const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const Announcement = require('../models/Announcement');

// @desc    Get admin dashboard stats
// @route   GET /api/dashboard/stats
// @access  Admin only
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      activeTeachers,
      totalGroups,
      activeGroups,
      totalMessages,
      totalAnnouncements,
      recentUsers,
      recentMessages,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'teacher', isActive: true }),
      Group.countDocuments({}),
      Group.countDocuments({ isActive: true }),
      Message.countDocuments({ isDeleted: false }),
      Announcement.countDocuments({ isActive: true }),
      User.find({ role: { $ne: 'admin' } })
        .select('name email role isActive createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      Message.find({ isDeleted: false })
        .select('senderName senderRole content group createdAt')
        .populate('group', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // Group by class segment stats
    const groupsBySegment = await Group.aggregate([
      { $group: { _id: '$classSegment', count: { $sum: 1 } } },
    ]);

    // Users created per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, role: { $ne: 'admin' } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            role: '$role',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          totalStudents,
          activeStudents,
          inactiveStudents: totalStudents - activeStudents,
          totalTeachers,
          activeTeachers,
          inactiveTeachers: totalTeachers - activeTeachers,
        },
        groups: {
          total: totalGroups,
          active: activeGroups,
          bySegment: groupsBySegment,
        },
        messages: { total: totalMessages },
        announcements: { active: totalAnnouncements },
        recentUsers,
        recentMessages,
        userGrowth,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
