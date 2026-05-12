const express = require('express');
const { body, param } = require('express-validator');
const {
  getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember,
} = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getProjects);

router.post(
  '/',
  adminOnly,
  [
    body('title').trim().isLength({ min: 3, max: 80 }).withMessage('Title must be 3-80 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color hex'),
    body('status').optional().isIn(['active', 'completed', 'on-hold', 'archived']).withMessage('Invalid status'),
    body('dueDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid date format'),
    body('members').optional().isArray().withMessage('Members must be an array'),
    body('members.*').optional().isMongoId().withMessage('Invalid member id'),
  ],
  validate,
  createProject
);

router.get('/:id', [param('id').isMongoId().withMessage('Invalid project id')], validate, getProject);
router.put(
  '/:id',
  adminOnly,
  [
    param('id').isMongoId().withMessage('Invalid project id'),
    body('title').optional().trim().isLength({ min: 3, max: 80 }).withMessage('Title must be 3-80 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color hex'),
    body('status').optional().isIn(['active', 'completed', 'on-hold', 'archived']).withMessage('Invalid status'),
    body('dueDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid date format'),
  ],
  validate,
  updateProject
);
router.delete('/:id', adminOnly, [param('id').isMongoId().withMessage('Invalid project id')], validate, deleteProject);

router.post(
  '/:id/members',
  adminOnly,
  [
    param('id').isMongoId().withMessage('Invalid project id'),
    body('userId').notEmpty().withMessage('userId is required').bail().isMongoId().withMessage('Invalid user id'),
  ],
  validate,
  addMember
);

router.delete(
  '/:id/members/:userId',
  adminOnly,
  [
    param('id').isMongoId().withMessage('Invalid project id'),
    param('userId').isMongoId().withMessage('Invalid user id'),
  ],
  validate,
  removeMember
);

module.exports = router;
