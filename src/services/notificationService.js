const Notification = require("../models/notification.schema.js");

const sendNotification = async (
  recipientId,
  senderId,
  title,
  message,
  type,
) => {
  try {
    const newNotification = await Notification.create({
      recipientId,
      senderId,
      title,
      message,
      type,
      isRead: false,
    });

    if (global.io) {
      global.io
        .to(recipientId.toString())
        .emit("new_notification", newNotification);
    }

    return newNotification;
  } catch (error) {
    console.error("Failed to process and trigger notification:", error.message);
  }
};

module.exports = { sendNotification };
