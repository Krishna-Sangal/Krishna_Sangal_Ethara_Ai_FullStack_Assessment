const express = require('express');
const { body } = require('express-validator');
const {
  getTasks, createTask, getTask, updateTask, deleteTask, addComment, reorderTasks,
} = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getTasks);

router.post(
  '/',
  adminOnly,
  [
    body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
    body('project').notEmpty().withMessage('Project is required'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  ],
  validate,
  createTask
);

router.put('/reorder', protect, reorderTasks);

router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', adminOnly, deleteTask);

router.post(
  '/:id/comments',
  [body('text').trim().notEmpty().withMessage('Comment text is required')],
  validate,
  addComment
);

module.exports = router;
