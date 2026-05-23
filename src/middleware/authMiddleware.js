const jwt = require("jsonwebtoken");
const User = require("../models/user.schema");
const {
  authorizeRoles,
  isAdmin,
  isFamily,
  isCompanion,
} = require("./RoleMiddleware");

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-passwordHash");

    if (!user) {
      return res.status(401).json({ message: "Invalid authentication token." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

module.exports = {
  authenticate,
  authorizeRoles,
  isAdmin,
  isFamily,
  isCompanion,
};
