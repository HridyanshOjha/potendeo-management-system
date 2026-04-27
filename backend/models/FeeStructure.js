const mongoose = require('mongoose');

const feeRangeSchema = new mongoose.Schema({
  min:         { type: Number, required: true, min: 0, default: 0 },
  max:         { type: Number, required: true, min: 0, default: 0 },
  recommended: { type: Number, required: true, min: 0, default: 0 },
}, { _id: false });

const feeSegmentSchema = new mongoose.Schema({
  segment: {
    type: String,
    enum: ['Class 1-5', 'Class 6-8', 'Class 9-10', 'Class 11-12', 'Competitive Exams'],
    required: true,
  },
  order:        { type: Number, required: true },
  oneToOne:     feeRangeSchema,
  groupTuition: feeRangeSchema,
  isActive:     { type: Boolean, default: true },
  notes:        { type: String, trim: true, maxlength: 500 },
}, { _id: false });

// Tuition type card schema (matches screenshot: Online / Home / Competitive)
const tuitionTypeSchema = new mongoose.Schema({
  min:         { type: Number, default: 0 },
  max:         { type: Number, default: 0 },
  recommended: { type: Number, default: 0 },
  note:        { type: String, default: '' },
}, { _id: false });

const feeStructureSchema = new mongoose.Schema({
  version:  { type: Number, default: 1 },
  segments: [feeSegmentSchema],

  // Tuition type pricing (displayed as cards like in the screenshot)
  tuitionTypes: {
    onlineTuition:   { type: tuitionTypeSchema, default: () => ({ min: 200, max: 2000, recommended: 500,  note: 'Starting from ₹200/hr for school classes' }) },
    homeTuition:     { type: tuitionTypeSchema, default: () => ({ min: 300, max: 1500, recommended: 800,  note: 'Typically ₹300–₹1500/hr' }) },
    competitiveExam: { type: tuitionTypeSchema, default: () => ({ min: 400, max: 2000, recommended: 1000, note: '₹400–₹2000/hr depending on level' }) },
  },

  currency:      { type: String, default: 'INR' },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublished:   { type: Boolean, default: true },
  effectiveFrom: { type: Date, default: Date.now },
  notes:         { type: String, trim: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
