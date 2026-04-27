const express = require('express');
const router = express.Router();
const { getMessages, deleteMessage, getTotalMessages } = require('../controllers/chatController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.get('/stats/total', restrictTo('admin'), getTotalMessages);
router.get('/:groupId/messages', getMessages);
router.delete('/messages/:messageId', deleteMessage);

module.exports = router;
