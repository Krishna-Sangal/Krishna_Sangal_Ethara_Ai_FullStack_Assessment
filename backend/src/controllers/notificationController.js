const Notification = require('../models/Notification');

// @desc    Get current user's notifications
// @route   GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort('-createdAt')
      .limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark notification(s) as read
// @route   PATCH /api/notifications
const markAsRead = async (req, res, next) => {
  try {
    const { ids } = req.body; // optional array of IDs
    if (ids && ids.length > 0) {
      await Notification.updateMany({ _id: { $in: ids }, user: req.user._id }, { read: true });
    } else {
      await Notification.updateMany({ user: req.user._id }, { read: true });
    }
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markAsRead, deleteNotification };
