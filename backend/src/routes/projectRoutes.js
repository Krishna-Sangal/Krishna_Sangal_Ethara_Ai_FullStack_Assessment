const express = require('express');
const { body } = require('express-validator');
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
  ],
  validate,
  createProject
);

router.get('/:id', getProject);
router.put('/:id', adminOnly, updateProject);
router.delete('/:id', adminOnly, deleteProject);

router.post(
  '/:id/members',
  adminOnly,
  [body('userId').notEmpty().withMessage('userId is required')],
  validate,
  addMember
);

router.delete('/:id/members/:userId', adminOnly, removeMember);

module.exports = router;
