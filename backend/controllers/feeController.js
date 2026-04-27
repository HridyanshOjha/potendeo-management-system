const FeeStructure = require('../models/FeeStructure');

const DEFAULT_SEGMENTS = [
  { segment: 'Class 1-5',        order: 1 },
  { segment: 'Class 6-8',        order: 2 },
  { segment: 'Class 9-10',       order: 3 },
  { segment: 'Class 11-12',      order: 4 },
  { segment: 'Competitive Exams',order: 5 },
];

const DEFAULT_TUITION_TYPES = {
  onlineTuition:   { min: 200, max: 2000, recommended: 500,  note: 'Starting from ₹200/hr for school classes' },
  homeTuition:     { min: 300, max: 1500, recommended: 800,  note: 'Typically ₹300–₹1500/hr' },
  competitiveExam: { min: 400, max: 2000, recommended: 1000, note: '₹400–₹2000/hr depending on level' },
};

// @desc    Get fee structure
// @route   GET /api/fees
// @access  Protected
exports.getFeeStructure = async (req, res) => {
  try {
    let feeStructure = await FeeStructure.findOne({ isPublished: true }).sort({ createdAt: -1 });

    if (!feeStructure) {
      feeStructure = await FeeStructure.create({
        segments: DEFAULT_SEGMENTS.map(s => ({
          ...s,
          oneToOne:     { min: 200, max: 2000, recommended: 800 },
          groupTuition: { min: 150, max: 1500, recommended: 500 },
        })),
        tuitionTypes: DEFAULT_TUITION_TYPES,
        lastUpdatedBy: null,
      });
    }

    // Back-fill tuitionTypes if missing (old records)
    if (!feeStructure.tuitionTypes) {
      feeStructure.tuitionTypes = DEFAULT_TUITION_TYPES;
      await feeStructure.save();
    }

    res.status(200).json({ success: true, feeStructure });
  } catch (error) {
    console.error('getFeeStructure error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Update fee structure
// @route   PUT /api/fees
// @access  Admin only
exports.updateFeeStructure = async (req, res) => {
  try {
    const { segments, currency, notes, tuitionTypes } = req.body;

    if (!segments || !Array.isArray(segments)) {
      return res.status(400).json({ success: false, message: 'Segments array is required.' });
    }

    // Validate each segment
    for (const seg of segments) {
      if (!seg.segment || !DEFAULT_SEGMENTS.find(d => d.segment === seg.segment)) {
        return res.status(400).json({ success: false, message: `Invalid segment: ${seg.segment}` });
      }
      if (!seg.oneToOne || !seg.groupTuition) {
        return res.status(400).json({ success: false, message: `Segment "${seg.segment}" is missing fee data.` });
      }

      // Coerce to numbers
      seg.oneToOne.min         = Number(seg.oneToOne.min)         || 0;
      seg.oneToOne.max         = Number(seg.oneToOne.max)         || 0;
      seg.oneToOne.recommended = Number(seg.oneToOne.recommended) || 0;
      seg.groupTuition.min         = Number(seg.groupTuition.min)         || 0;
      seg.groupTuition.max         = Number(seg.groupTuition.max)         || 0;
      seg.groupTuition.recommended = Number(seg.groupTuition.recommended) || 0;
    }

    // Enforce correct order
    const orderedSegments = segments
      .map(seg => ({
        ...seg,
        order: DEFAULT_SEGMENTS.find(d => d.segment === seg.segment).order,
      }))
      .sort((a, b) => a.order - b.order);

    let feeStructure = await FeeStructure.findOne({ isPublished: true });

    if (feeStructure) {
      feeStructure.segments     = orderedSegments;
      feeStructure.currency     = currency || feeStructure.currency || 'INR';
      if (notes !== undefined)  feeStructure.notes = notes;
      if (tuitionTypes)         feeStructure.tuitionTypes = tuitionTypes;
      feeStructure.lastUpdatedBy = req.user._id;
      await feeStructure.save();
    } else {
      feeStructure = await FeeStructure.create({
        segments: orderedSegments,
        currency: currency || 'INR',
        notes,
        tuitionTypes: tuitionTypes || DEFAULT_TUITION_TYPES,
        lastUpdatedBy: req.user._id,
      });
    }

    res.status(200).json({ success: true, message: 'Fee structure updated.', feeStructure });
  } catch (error) {
    console.error('updateFeeStructure error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};
