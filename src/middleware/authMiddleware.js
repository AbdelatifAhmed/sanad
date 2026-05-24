const jwt = require("jsonwebtoken");
const User = require("../models/user.schema");
const AppError = require("../utiles/AppError");
const catchAsync = AppError.catchAsync;

const authenticate = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) return next(new AppError("Authentication required.", 401));

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const msg =
      err.name === "TokenExpiredError"
        ? "Your token has expired! Please log in again."
        : "Invalid token. Please log in again!";
    return next(new AppError(msg, 401));
  }

  const user = await User.findById(decoded.id).select("-passwordHash");
  if (!user) return next(new AppError("Invalid authentication token.", 401));

  req.user = user;
  next();
});

module.exports = { authenticate };
