const User = require('../models/User');

// @desc    Get all users (admin)
// @route   GET /api/users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort('name');
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user role (admin only)
// @route   PUT /api/users/:id/role
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc    Deactivate user (admin only)
// @route   DELETE /api/users/:id
const deactivateUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate yourself' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deactivated', user });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUser, updateUserRole, deactivateUser };
