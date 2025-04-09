const Notification = require('../models/notificationModel');

// @desc    Get user notifications
// @route   GET /api/v1/notifications
// @access  Private
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 10, page = 1, readStatus } = req.query;
    
    const query = { userId };
    
    if (readStatus === 'read') {
      query.isRead = true;
    } else if (readStatus === 'unread') {
      query.isRead = false;
    }
    
    const count = await Notification.countDocuments(query);
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    res.json({
      notifications,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      count,
      unreadCount: await Notification.countDocuments({ userId, isRead: false }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id
// @access  Private
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if the notification belongs to the user
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this notification' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/mark-all-read
// @access  Private
const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if the notification belongs to the user
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this notification' });
    }
    
    await notification.remove();
    
    res.json({ message: 'Notification removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Helper function to create notifications (for internal use)
const createNotification = async (userId, title, message, type, relatedId, icon = null) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      relatedId,
      icon: icon || type,
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
}; 