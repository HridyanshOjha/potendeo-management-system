const express = require('express');
const router = express.Router();
const {
  createAnnouncement,
  getAnnouncements,
  markAsRead,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.get('/', getAnnouncements);
router.patch('/:id/read', markAsRead);

// Admin only
router.post('/', restrictTo('admin'), createAnnouncement);
router.put('/:id', restrictTo('admin'), updateAnnouncement);
router.delete('/:id', restrictTo('admin'), deleteAnnouncement);

module.exports = router;
