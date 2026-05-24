const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.schema");
const AppError = require("../utiles/AppError");
const catchAsync = AppError.catchAsync;

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

const userResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password || !phone || !role) {
    throw new AppError("All fields are required.", 400);
  }

  const nameTrimmed = name.trim();
  const emailNormalized = email.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(emailNormalized)) {
    throw new AppError("Invalid email format.", 400);
  }

  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters.", 400);
  }

  const allowedRoles = ["admin", "family", "companion"];

  if (!allowedRoles.includes(role)) {
    throw new AppError("Invalid role.", 400);
  }

  const existingUser = await User.findOne({
    email: emailNormalized,
  });

  if (existingUser) {
    throw new AppError("Email is already registered.", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: nameTrimmed,
    email: emailNormalized,
    passwordHash,
    phone: phone.trim(),
    role,
  });

  const token = generateToken(user);

  return res.status(201).json({
    token,
    user: userResponse(user),
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const emailNormalized = email.trim().toLowerCase();

  const user = await User.findOne({
    email: emailNormalized,
  });

  if (!user) {
    throw new AppError("Invalid credentials.", 401);
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    throw new AppError("Invalid credentials.", 401);
  }

  const token = generateToken(user);

  return res.status(200).json({
    token,
    user: userResponse(user),
  });
});
