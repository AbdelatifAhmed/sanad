const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const crypto = require("crypto");
const User = require("../models/user.schema");
const Companion = require("../models/companion.schema");
const Family = require("../models/family.schema");
const messages = require("../utils/messages");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/token");

const userResponse = (user, profileRecord = null) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar || null,
    location: user.location || null, 
    
    ...(user.role === 'companion' && {
      companionId: profileRecord ? profileRecord._id : null,
      verificationStatus: profileRecord ? profileRecord.verificationStatus : "pending"
    }),
    
    ...(user.role === 'family' && {
      familyId: profileRecord ? profileRecord._id : null
    })
  };
};
exports.register = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const lang = req.lang || "en";
    const { name, email, password, phone, role, location, companionData, familyData } = req.body;

    if (!name || !email || !password || !phone || !role) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: messages.auth.requiredFields[lang] });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: messages.auth.invalidEmail[lang] });
    }

    // Password must be at least 8 chars, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: messages.auth.weakPassword[lang] });
    }

    if (!location || !location.geo || !location.geo.coordinates) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: messages.auth.locationRequired[lang] });
    }

    const emailNormalized = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: emailNormalized }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ message: messages.auth.emailRegistered[lang] });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await User.create(
      [{
        name: name.trim(),
        email: emailNormalized,
        passwordHash,
        phone: phone.trim(),
        role,
        location 
      }],
      { session }
    );

    let profileRecord = null;

    if (role === 'companion') {
      [profileRecord] = await Companion.create(
        [{
          userId: newUser._id,
          companionType: companionData.companionType,
          specialization: companionData.specialization || "none",
          bio: companionData.bio,
          hourlyRate: companionData.hourlyRate,
          skills: companionData.skills || [],
          hobbies: companionData.hobbies || [],
          availability: companionData.availability || [],
          documents: companionData.documents
        }],
        { session }
      );
    } else if (role === 'family') {
      [profileRecord] = await Family.create(
        [{
          familyId: newUser._id,
          address: familyData.address,
          beneficiaries: familyData.beneficiaries
        }],
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      accessToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        role: newUser.role,
        location: newUser.location 
      },
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Global Register with Location Error:", err);
    return res.status(500).json({ message: messages.common.serverError[req.lang || "en"] });
  }
};

exports.login = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: messages.auth.requiredFields[lang],
      });
    }

    const emailNormalized = email.trim().toLowerCase();

    const user = await User.findOne({
      email: emailNormalized,
    });

    if (!user) {
      return res.status(401).json({
        message: messages.auth.invalidCredentials[lang],
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({
        message: messages.auth.invalidCredentials[lang],
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        message: messages.auth.banned[lang],
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
    return res.status(500).json({ message: messages.common.serverError[req.lang || "en"] });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: messages.auth.invalidToken[lang] });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || user.isBanned) {
      return res.status(401).json({ message: messages.auth.invalidToken[lang] });
    }

    const accessToken = generateAccessToken(user);

    return res.status(200).json({
      accessToken,
      user: userResponse(user),
    });
  } catch (err) {
    return res.status(401).json({ message: messages.auth.invalidToken[req.lang || "en"] });
  }
};

exports.logout = (req, res) => {
  const lang = req.lang || "en";
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.status(200).json({ message: messages.auth.logoutSuccess[lang] });
};

exports.forgotPassword = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: messages.auth.requiredFields[lang] });
    }

    const emailNormalized = email.trim().toLowerCase();
    const user = await User.findOne({ email: emailNormalized });
    if (!user) {
      return res.status(200).json({ message: messages.auth.passwordResetCodeSent[lang] });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    user.resetPasswordOtp = otpHash;
    user.resetPasswordOtpExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    console.log(`[PASS_RESET_OTP] Email: ${emailNormalized} | Code: ${otp}`);

    return res.status(200).json({
      message: messages.auth.passwordResetCodeSent[lang],
      ...(process.env.NODE_ENV !== "production" && { devOtp: otp })
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: messages.common.serverError[req.lang || "en"] });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: messages.auth.requiredFields[lang] });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: messages.auth.weakPassword[lang] });
    }

    const emailNormalized = email.trim().toLowerCase();
    const user = await User.findOne({ email: emailNormalized });
    if (!user || !user.resetPasswordOtp) {
      return res.status(400).json({ message: messages.auth.invalidOtp[lang] });
    }

    const otpHash = crypto.createHash("sha256").update(otp.trim()).digest("hex");
    if (user.resetPasswordOtp !== otpHash || user.resetPasswordOtpExpires < new Date()) {
      return res.status(400).json({ message: messages.auth.invalidOtp[lang] });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();

    return res.status(200).json({ message: messages.auth.passwordResetSuccess[lang] });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: messages.common.serverError[req.lang || "en"] });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: messages.auth.requiredFields[lang] });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: messages.auth.weakPassword[lang] });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: messages.common.notFound[lang] });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: messages.auth.incorrectCurrentPassword[lang] });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({ message: messages.auth.passwordChangedSuccess[lang] });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: messages.common.serverError[req.lang || "en"] });
  }
};