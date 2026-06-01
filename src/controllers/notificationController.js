const Notification = require("../models/notification.schema");

const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 50, skip = 0 } = req.query;

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const skipNum = Math.max(parseInt(skip) || 0, 0);

    const notificationsPromise = Notification.find({
      recipientId: userId,
    })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skipNum)
      .lean();

    const [notifications, totalCount, unreadCount] = await Promise.all([
      notificationsPromise,
      Notification.countDocuments({
        recipientId: userId,
      }),
      Notification.countDocuments({
        recipientId: userId,
        isRead: false,
      }),
    ]);

    return res.status(200).json({
      notifications,
      pagination: {
        total: totalCount,
        limit: limitNum,
        skip: skipNum,
        hasMore: skipNum + limitNum < totalCount,
      },
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        error: "Invalid user ID",
      });
    }

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipientId: userId,
      },
      {
        $set: { isRead: true },
      },
      {
        new: true,
      },
    );

    if (!notification) {
      return res.status(404).json({
        error: "Notification not found or access denied",
      });
    }

    return res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        error: "Invalid notification ID",
      });
    }

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      {
        recipientId: userId,
        isRead: false,
      },
      {
        $set: { isRead: true },
      },
    );

    return res.status(200).json({
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        error: "Invalid user ID",
      });
    }

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
