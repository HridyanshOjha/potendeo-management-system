const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: [5000, 'Content cannot exceed 5000 characters'],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  authorName: {
    type: String,
    required: true,
  },
  targetAudience: {
    type: String,
    enum: ['all', 'teachers', 'students', 'specific_groups'],
    default: 'all',
  },
  targetGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
  }],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  tags: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
});

// Index for efficient queries
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ isActive: 1, targetAudience: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
