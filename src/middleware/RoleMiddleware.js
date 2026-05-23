const authorizeRoles =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient permissions." });
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
