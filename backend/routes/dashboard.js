const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);
router.get('/stats', restrictTo('admin'), getDashboardStats);

module.exports = router;
