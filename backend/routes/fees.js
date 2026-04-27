const express = require('express');
const router = express.Router();
const { getFeeStructure, updateFeeStructure } = require('../controllers/feeController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.get('/', getFeeStructure);
router.put('/', restrictTo('admin'), updateFeeStructure);

module.exports = router;
