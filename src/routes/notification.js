const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticate } = require("../middleware/authMiddleware");

router.get("/", authenticate, notificationController.getUserNotifications);

router.patch(
  "/read-all",
  authenticate,
  notificationController.markAllNotificationsAsRead,
);

router.patch(
  "/:id/read",
  authenticate,
  notificationController.markNotificationAsRead,
);

router.delete(
  "/all",
  authenticate,
  notificationController.deleteAllNotifications,
);

router.delete("/:id", authenticate, notificationController.deleteNotification);

module.exports = router;
