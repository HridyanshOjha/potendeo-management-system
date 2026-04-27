const Group = require('../models/Group');
const User = require('../models/User');

// @desc    Create group
// @route   POST /api/groups
// @access  Admin only
exports.createGroup = async (req, res) => {
  try {
    const { name, description, subject, classSegment, maxStudents, schedule } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Group name is required.' });
    }

    const existing = await Group.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Group with this name already exists.' });
    }

    const group = await Group.create({
      name,
      description,
      subject,
      classSegment,
      maxStudents: maxStudents || 50,
      schedule,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Group created successfully.', group });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get all groups
// @route   GET /api/groups
// @access  Admin only
exports.getAllGroups = async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const groups = await Group.find(query)
      .populate('teachers', 'name email')
      .populate('students', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, total: groups.length, groups });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get single group
// @route   GET /api/groups/:id
// @access  Protected
exports.getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('teachers', 'name email phone')
      .populate('students', 'name email phone');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    // Access control: teachers and students can only access their own groups
    if (req.user.role === 'teacher') {
      const isAssigned = group.teachers.some(t => t._id.toString() === req.user._id.toString());
      if (!isAssigned) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }
    if (req.user.role === 'student') {
      const inGroups = Array.isArray(req.user.groups) && req.user.groups.some(g => g.toString() === req.params.id);
      const inPrimary = req.user.group && req.user.group.toString() === req.params.id;
      if (!inGroups && !inPrimary) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    res.status(200).json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Update group
// @route   PUT /api/groups/:id
// @access  Admin only
exports.updateGroup = async (req, res) => {
  try {
    const { name, description, subject, classSegment, maxStudents, schedule, isActive } = req.body;

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (subject !== undefined) group.subject = subject;
    if (classSegment) group.classSegment = classSegment;
    if (maxStudents) group.maxStudents = maxStudents;
    if (schedule !== undefined) group.schedule = schedule;
    if (isActive !== undefined) group.isActive = isActive;

    await group.save();
    const updated = await Group.findById(group._id)
      .populate('teachers', 'name email')
      .populate('students', 'name email');

    res.status(200).json({ success: true, message: 'Group updated.', group: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Assign teacher to group
// @route   POST /api/groups/:id/assign-teacher
// @access  Admin only
exports.assignTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;

    const [group, teacher] = await Promise.all([
      Group.findById(req.params.id),
      User.findById(teacherId),
    ]);

    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    // Check if already assigned
    if (group.teachers.includes(teacherId)) {
      return res.status(400).json({ success: false, message: 'Teacher already assigned to this group.' });
    }

    group.teachers.push(teacherId);
    await group.save();

    // Update teacher's assignedGroups
    if (!teacher.assignedGroups.includes(req.params.id)) {
      teacher.assignedGroups.push(req.params.id);
      await teacher.save({ validateBeforeSave: false });
    }

    const updated = await Group.findById(group._id)
      .populate('teachers', 'name email')
      .populate('students', 'name email');

    res.status(200).json({ success: true, message: 'Teacher assigned successfully.', group: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Remove teacher from group
// @route   DELETE /api/groups/:id/remove-teacher/:teacherId
// @access  Admin only
exports.removeTeacher = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

    group.teachers = group.teachers.filter(t => t.toString() !== req.params.teacherId);
    await group.save();

    // Update teacher's assignedGroups
    await User.findByIdAndUpdate(req.params.teacherId, {
      $pull: { assignedGroups: req.params.id },
    });

    const updated = await Group.findById(group._id)
      .populate('teachers', 'name email')
      .populate('students', 'name email');

    res.status(200).json({ success: true, message: 'Teacher removed from group.', group: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Assign student to group
// @route   POST /api/groups/:id/assign-student
// @access  Admin only
exports.assignStudent = async (req, res) => {
  try {
    const { studentId } = req.body;

    const [group, student] = await Promise.all([
      Group.findById(req.params.id),
      User.findById(studentId),
    ]);

    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const alreadyInGroup =
      (student.group && student.group.toString() === req.params.id) ||
      (Array.isArray(student.groups) && student.groups.some(g => g.toString() === req.params.id));
    if (alreadyInGroup) {
      return res.status(400).json({ success: false, message: 'Student already in this group.' });
    }

    // Backward-compat: if legacy `group` exists, ensure it's represented in `groups`
    if (student.group && (!Array.isArray(student.groups) || !student.groups.some(g => g.toString() === student.group.toString()))) {
      student.groups = Array.isArray(student.groups) ? student.groups : [];
      student.groups.push(student.group);
    }

    // Add to new group
    if (!group.students.includes(studentId)) {
      group.students.push(studentId);
      await group.save();
    }

    student.groups = Array.isArray(student.groups) ? student.groups : [];
    student.groups.push(req.params.id);
    if (!student.group) student.group = req.params.id; // keep legacy primary group for UI/backward compat
    await student.save({ validateBeforeSave: false });

    const updated = await Group.findById(group._id)
      .populate('teachers', 'name email')
      .populate('students', 'name email');

    res.status(200).json({ success: true, message: 'Student assigned to group.', group: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Remove student from group
// @route   DELETE /api/groups/:id/remove-student/:studentId
// @access  Admin only
exports.removeStudent = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

    group.students = group.students.filter(s => s.toString() !== req.params.studentId);
    await group.save();

    const student = await User.findById(req.params.studentId);
    if (student) {
      student.groups = Array.isArray(student.groups) ? student.groups.filter(g => g.toString() !== req.params.id) : [];
      if (student.group && student.group.toString() === req.params.id) {
        student.group = student.groups.length > 0 ? student.groups[0] : null;
      }
      await student.save({ validateBeforeSave: false });
    }

    const updated = await Group.findById(group._id)
      .populate('teachers', 'name email')
      .populate('students', 'name email');

    res.status(200).json({ success: true, message: 'Student removed from group.', group: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Delete group
// @route   DELETE /api/groups/:id
// @access  Admin only
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

    // Remove group reference from students
    await User.updateMany({ group: req.params.id }, { $set: { group: null } });
    await User.updateMany({ groups: req.params.id }, { $pull: { groups: req.params.id } });
    // Remove group from teachers
    await User.updateMany({ assignedGroups: req.params.id }, { $pull: { assignedGroups: req.params.id } });

    await group.deleteOne();
    res.status(200).json({ success: true, message: 'Group deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get teacher's assigned groups
// @route   GET /api/groups/my-groups
// @access  Teacher
exports.getMyGroups = async (req, res) => {
  try {
    let groups;
    if (req.user.role === 'admin') {
      groups = await Group.find({})
        .populate('teachers', 'name email')
        .populate('students', 'name email')
        .sort({ name: 1 });
    } else if (req.user.role === 'teacher') {
      groups = await Group.find({ teachers: req.user._id })
        .populate('teachers', 'name email')
        .populate('students', 'name email')
        .sort({ name: 1 });
    } else {
      // Student
      const student = await User.findById(req.user._id).populate({
        path: 'groups',
        populate: [
          { path: 'teachers', select: 'name email' },
          { path: 'students', select: 'name email' },
        ],
      });

      if (student?.groups?.length) {
        groups = student.groups;
      } else if (student?.group) {
        const legacy = await Group.findById(student.group)
          .populate('teachers', 'name email')
          .populate('students', 'name email');
        groups = legacy ? [legacy] : [];
      } else {
        groups = [];
      }
    }

    res.status(200).json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
