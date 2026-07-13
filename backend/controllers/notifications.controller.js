const Notification = require("../models/Notification");

/**
 * Create one notification
 */
const createNotification = async (userId, type, message, extra = {}) => {
  try {
  
    await Notification.create({
      userId,
      type,
      message,
      read: false,
      ...extra,
    });

    
  } catch (err) {
    console.error("Notification Error:", err);
  }
};

/**
 * Create notifications for multiple users
 */
const createNotificationBatch = async (
  userIds,
  type,
  message,
  extra = {}
) => {
  try {
    if (!userIds.length) return;

    const notifications = userIds.map((userId) => ({
      userId,
      type,
      message,
      read: false,
      ...extra,
    }));

    await Notification.insertMany(notifications);
  } catch (err) {
    console.error("createNotificationBatch error:", err.message);
  }
};

/**
 * Get logged in user's notifications
 */
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.uid,
    }).sort({ createdAt: -1 });

    res.json({ notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
};

/**
 * Mark one notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification)
      return res.status(404).json({
        error: "Notification not found",
      });

    if (notification.userId !== req.user.uid)
      return res.status(403).json({
        error: "Not authorized",
      });

    notification.read = true;

    await notification.save();

    res.json({
      message: "Marked as read",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        userId: req.user.uid,
        read: false,
      },
      {
        $set: {
          read: true,
        },
      }
    );

    res.json({
      message: "All marked as read",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
}
const upsertDownloadNotification = async (userId, docId, title) => {
  try {
    const existing = await Notification.findOne({
      userId,
      docId,
      type: "download",
      read: false,
    });

    if (existing) {
      existing.count += 1;
      existing.message = `${existing.count} people downloaded your document "${title}"`;
      await existing.save();
    
    } else {
      await Notification.create({
        userId,
        type: "download",
        message: `Someone downloaded your document "${title}"`,
        docId,
        read: false,
        count: 1,
      });
      
    }
  } catch (err) {
    console.error("upsertDownloadNotification error:", err.message);
  }
};

/**
 * Delete one notification
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification)
      return res.status(404).json({ error: "Notification not found" });

    if (notification.userId !== req.user.uid)
      return res.status(403).json({ error: "Not authorized" });

    await notification.deleteOne();

    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete multiple notifications at once
 */
const deleteNotificationsBulk = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No notification IDs provided" });
    }

    await Notification.deleteMany({
      _id: { $in: ids },
      userId: req.user.uid, // only deletes notifications owned by this user
    });

    res.json({ message: "Notifications deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


module.exports = {
  createNotification,
  createNotificationBatch,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  upsertDownloadNotification,
  deleteNotification,    
  deleteNotificationsBulk,
};