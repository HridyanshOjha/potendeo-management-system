const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Group name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  subject: {
    type: String,
    trim: true,
  },
  classSegment: {
    type: String,
    enum: ['Class 1-5', 'Class 6-8', 'Class 9-10', 'Class 11-12', 'Competitive Exams'],
  },
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  maxStudents: {
    type: Number,
    default: 50,
  },
  schedule: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for student count
groupSchema.virtual('studentCount').get(function () {
  return this.students ? this.students.length : 0;
});

// Virtual for teacher count
groupSchema.virtual('teacherCount').get(function () {
  return this.teachers ? this.teachers.length : 0;
});

module.exports = mongoose.model('Group', groupSchema);
