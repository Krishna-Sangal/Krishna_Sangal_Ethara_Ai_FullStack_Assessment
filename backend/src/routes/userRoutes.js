const express = require('express');
const { getUsers, getUser, updateUserRole, deactivateUser } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id/role', adminOnly, updateUserRole);
router.delete('/:id', adminOnly, deactivateUser);

module.exports = router;
