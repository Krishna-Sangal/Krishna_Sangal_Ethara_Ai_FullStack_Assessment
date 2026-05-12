const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getTasks, createTask, getTask, updateTask, deleteTask, addComment, reorderTasks,
} = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get(
  '/',
  [
    query('project').optional().isMongoId().withMessage('Invalid project id'),
    query('status').optional().isIn(['todo', 'in-progress', 'completed']).withMessage('Invalid status'),
    query('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    query('assignee').optional().isMongoId().withMessage('Invalid assignee id'),
  ],
  validate,
  getTasks
);

router.post(
  '/',
  adminOnly,
  [
    body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description too long'),
    body('project').notEmpty().withMessage('Project is required').bail().isMongoId().withMessage('Invalid project id'),
    body('assignee').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid assignee id'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('status').optional().isIn(['todo', 'in-progress', 'completed']).withMessage('Invalid status'),
    body('dueDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid date format'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
  ],
  validate,
  createTask
);

router.put(
  '/reorder',
  [
    body('tasks').isArray({ min: 1 }).withMessage('Tasks must be a non-empty array'),
    body('tasks.*.id').isMongoId().withMessage('Invalid task id'),
    body('tasks.*.order').optional().isNumeric().withMessage('Invalid task order'),
    body('tasks.*.status').optional().isIn(['todo', 'in-progress', 'completed']).withMessage('Invalid status'),
  ],
  validate,
  reorderTasks
);

router.get('/:id', [param('id').isMongoId().withMessage('Invalid task id')], validate, getTask);
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid task id'),
    body('title').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description too long'),
    body('assignee').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid assignee id'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('status').optional().isIn(['todo', 'in-progress', 'completed']).withMessage('Invalid status'),
    body('dueDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid date format'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('order').optional().isNumeric().withMessage('Invalid task order'),
  ],
  validate,
  updateTask
);
router.delete('/:id', adminOnly, [param('id').isMongoId().withMessage('Invalid task id')], validate, deleteTask);

router.post(
  '/:id/comments',
  [
    param('id').isMongoId().withMessage('Invalid task id'),
    body('text').trim().notEmpty().withMessage('Comment text is required').isLength({ max: 1000 }).withMessage('Comment too long'),
  ],
  validate,
  addComment
);

module.exports = router;
