const Notification = require("../models/notification.schema");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 15, page = 1, unreadOnly } = req.query;

    const limitNum = Math.min(Math.max(parseInt(limit) || 15, 1), 100);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

    const filter = { recipientId: userId };
    if (unreadOnly === "true") filter.isRead = false;

    const [notifications, totalCount, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate("senderId", "name avatar role")
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip(skip)
        .lean(),
      Notification.countDocuments({ recipientId: userId }),
      Notification.countDocuments({ recipientId: userId, isRead: false }),
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        notifications,
        unreadCount,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
          hasMore: pageNum * limitNum < totalCount,
        }
      }
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid notification ID" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientId: userId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true },
    );

    if (!notification) {
      return res
        .status(404)
        .json({ error: "Notification not found or access denied" });
    }

    return res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const result = await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true, readAt: now } },
    );

    return res.status(200).json({
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid notification ID" });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipientId: userId,
    });

    if (!notification) {
      return res
        .status(404)
        .json({ error: "Notification not found or access denied" });
    }

    return res
      .status(200)
      .json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.deleteMany({ recipientId: userId });

    return res.status(200).json({
      message: "All notifications deleted",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const createNotification = async ({
  recipientId,
  title,
  message,
  type,
  relatedId = null,
  relatedModel = null,
}) => {
  const notification = new Notification({
    recipientId,
    title,
    message,
    type,
    relatedId,
    relatedModel,
  });
  return notification.save();
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification,
};
