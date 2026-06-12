const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.schema");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/token");

// 🌟 تحسين الاستجابة لترجع البيانات المهمة للـ Zustand Store والـ UI
const userResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar || null, // مهم جداً لعرض صورة اليوزر في الـ Navbar فوراً
});

exports.register = async (req, res) => {
  try {
    // 🌟 استلام الـ role من الفرونت إند لأن عندنا نوعين من المستخدمين
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({
        message: "All fields are required, including role.",
      });
    }

    const nameTrimmed = name.trim();
    const emailNormalized = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNormalized)) {
      return res.status(400).json({
        message: "Invalid email format.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }


    if (!['family', 'companion'].includes(role)) {
      return res.status(400).json({
        message: "Invalid account type. Role must be either 'family' or 'companion'.",
      });
    }

    const existingUser = await User.findOne({
      email: emailNormalized,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: nameTrimmed,
      email: emailNormalized,
      passwordHash,
      phone: phone.trim(),
      role,
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false, 
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      accessToken,
      user: userResponse(user),
    });
  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const emailNormalized = email.trim().toLowerCase();

    const user = await User.findOne({
      email: emailNormalized,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        message: "Your account has been banned. Access denied.",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      accessToken,
      user: userResponse(user),
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || user.isBanned) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = generateAccessToken(user);

    return res.status(200).json({
      accessToken,
    });
  } catch (err) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.status(200).json({ message: "Logged out" });
};