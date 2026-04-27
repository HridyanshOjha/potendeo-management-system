const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');

// @desc    Create a new user (teacher or student)
// @route   POST /api/users
// @access  Admin only
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
    }

    if (!['teacher', 'student'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be either teacher or student.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone: phone || '',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully.`,
      user,
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Admin only
exports.getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (role && ['teacher', 'student', 'admin'].includes(role)) {
      query.role = role;
    } else {
      query.role = { $ne: 'admin' }; // Don't show admins by default
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('group', 'name classSegment')
        .populate('groups', 'name classSegment')
        .populate('assignedGroups', 'name classSegment')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Admin only
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('group', 'name description classSegment')
      .populate('groups', 'name description classSegment')
      .populate('assignedGroups', 'name description classSegment');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin only
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // If password is being updated
    if (password) {
      user.password = password;
    }

    Object.assign(user, updateData);
    await user.save();

    res.status(200).json({ success: true, message: 'User updated successfully.', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Toggle user active status
// @route   PATCH /api/users/:id/toggle-status
// @access  Admin only
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot modify admin status.' });
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'enabled' : 'disabled'} successfully.`,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin only
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete admin.' });
    }

    // Remove from groups
    if (user.role === 'student') {
      await Group.updateMany({ students: user._id }, { $pull: { students: user._id } });
    }
    if (user.role === 'teacher') {
      await Group.updateMany({ teachers: user._id }, { $pull: { teachers: user._id } });
    }

    await user.deleteOne();

    res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get stats summary
// @route   GET /api/users/stats
// @access  Admin only
exports.getStats = async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalGroups] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'teacher', isActive: true }),
      Group.countDocuments({ isActive: true }),
    ]);

    res.status(200).json({
      success: true,
      stats: { totalStudents, totalTeachers, totalGroups },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
