const express = require('express');
const router = express.Router();
const {
  createGroup,
  getAllGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  assignTeacher,
  removeTeacher,
  assignStudent,
  removeStudent,
  getMyGroups,
} = require('../controllers/groupController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

// All roles can see their groups
router.get('/my-groups', getMyGroups);
router.get('/:id', getGroup);

// Admin only routes
router.use(restrictTo('admin'));
router.route('/').get(getAllGroups).post(createGroup);
router.route('/:id').put(updateGroup).delete(deleteGroup);
router.post('/:id/assign-teacher', assignTeacher);
router.delete('/:id/remove-teacher/:teacherId', removeTeacher);
router.post('/:id/assign-student', assignStudent);
router.delete('/:id/remove-student/:studentId', removeStudent);

module.exports = router;
