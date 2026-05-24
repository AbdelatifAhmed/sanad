const AppError = require("../utils/AppError");

const authorizeRoles =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required.", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError("Access denied. Insufficient permissions.", 403),
      );
    }

    next();
  };

const isAdmin = authorizeRoles("admin");
const isFamily = authorizeRoles("family");
const isCompanion = authorizeRoles("companion");

module.exports = {
  authorizeRoles,
  isAdmin,
  isFamily,
  isCompanion,
};
