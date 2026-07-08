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
    phone: user.phone || "",
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

    // Password must be at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
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
      path: "/",
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
      path: "/",
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
    path: "/",
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

exports.updateProfile = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { name, email, phone, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: messages.common.notFound[lang] || "User not found." });
    }

    if (name !== undefined) user.name = name.trim();

    if (email !== undefined) {
      const emailNormalized = email.trim().toLowerCase();
      if (emailNormalized !== user.email) {
        // Check if email already exists
        const existing = await User.findOne({ email: emailNormalized });
        if (existing) {
          return res.status(409).json({ message: messages.auth.emailRegistered[lang] });
        }
        user.email = emailNormalized;
      }
    }

    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar;

    const updatedUser = await user.save();

    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully.",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        location: updatedUser.location
      }
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    return res.status(500).json({ message: messages.common.serverError[req.lang || "en"] });
  }
};

exports.deleteAccount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const lang = req.lang || "en";
    const userId = req.user._id;

    // Find user to check role
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: messages.common.notFound[lang] || "User not found" });
    }

    // Delete role-specific profile
    if (user.role === "companion") {
      await Companion.findOneAndDelete({ userId }).session(session);
    } else if (user.role === "family") {
      await Family.findOneAndDelete({ familyId: userId }).session(session);
    }

    // Delete user record
    await User.findByIdAndDelete(userId).session(session);

    await session.commitTransaction();
    session.endSession();

    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      status: "success",
      message: messages.auth.accountDeleted[lang] || "Account deleted successfully.",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Delete Account Error:", err);
    return res.status(500).json({ message: messages.common.serverError[req.lang || "en"] });
  }
};

const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || "542081770205-vt7vuo4u66v9rlphbjj3fn7m073pcugr.apps.googleusercontent.com"
);

exports.googleLogin = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const lang = req.lang || "en";
    const { idToken, accessToken: googleAccessToken, role: preferredRole } = req.body;

    if (!idToken && !googleAccessToken) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Google ID Token or Access Token is required." });
    }

    let googleId, email, name, picture;

    if (idToken) {
      let ticket;
      try {
        ticket = await googleClient.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID || "542081770205-vt7vuo4u66v9rlphbjj3fn7m073pcugr.apps.googleusercontent.com",
        });
        const payload = ticket.getPayload();
        googleId = payload.sub;
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
      } catch (err) {
        console.error("Google ID Token verification failed:", err);
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Invalid Google ID Token." });
      }
    } else {
      // Fetch from userinfo endpoint
      try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleAccessToken}`);
        if (!response.ok) {
          throw new Error("Failed to fetch userinfo from Google API");
        }
        const data = await response.json();
        googleId = data.sub;
        email = data.email;
        name = data.name;
        picture = data.picture;
      } catch (err) {
        console.error("Google Access Token verification failed:", err);
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Invalid Google Access Token." });
      }
    }

    const emailNormalized = email.trim().toLowerCase();

    let user = await User.findOne({
      $or: [{ googleId }, { email: emailNormalized }],
    }).session(session);

    let isNewUser = false;
    let role = preferredRole || "family";
    if (role !== "family" && role !== "companion") {
      role = "family";
    }

    if (!user) {
      isNewUser = true;

      // Generate a secure random password and hash it
      const randomPassword = Math.random().toString(36).slice(-10) + "A1!#$";
      const generatedPasswordHash = await bcrypt.hash(randomPassword, 12);

      // Register a new user
      const [newCreatedUser] = await User.create(
        [{
          name: name || "Google User",
          email: emailNormalized,
          googleId,
          role,
          avatar: picture ? { url: picture } : undefined,
          passwordHash: generatedPasswordHash,
        }],
        { session }
      );
      user = newCreatedUser;

      // Create profile record
      if (role === "companion") {
        await Companion.create(
          [{
            userId: user._id,
            companionType: "other",
            specialization: "none",
            bio: "Registered via Google Sign-In",
            hourlyRate: 0,
            skills: [],
            hobbies: [],
            availability: [],
            documents: [],
          }],
          { session }
        );
      } else {
        await Family.create(
          [{
            familyId: user._id,
            address: {},
            beneficiaries: [],
          }],
          { session }
        );
      }
    } else {
      // User exists. Update googleId if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && (!user.avatar || !user.avatar.url)) {
          user.avatar = { url: picture };
        }
        await user.save({ session });
      }

      if (user.isBanned) {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({
          message: messages.auth.banned[lang],
        });
      }
    }

    await session.commitTransaction();
    session.endSession();

    // Fetch profileRecord for userResponse
    let profileRecord = null;
    if (user.role === "companion") {
      profileRecord = await Companion.findOne({ userId: user._id });
    } else if (user.role === "family") {
      profileRecord = await Family.findOne({ familyId: user._id });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      accessToken,
      user: userResponse(user, profileRecord),
      isNewUser,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Google Login Error:", err);
    return res.status(500).json({ message: messages.common.serverError[req.lang || "en"] });
  }
};

exports.googleSignIn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const lang = req.lang || "en";
    const { idToken, accessToken: googleAccessToken, role: preferredRole } = req.body;

    if (!idToken && !googleAccessToken) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Google ID Token or Access Token is required." });
    }

    let googleId, email, name, picture;

    if (idToken) {
      let ticket;
      try {
        ticket = await googleClient.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID || "542081770205-vt7vuo4u66v9rlphbjj3fn7m073pcugr.apps.googleusercontent.com",
        });
        const payload = ticket.getPayload();
        googleId = payload.sub;
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
      } catch (err) {
        console.error("Google ID Token verification failed:", err);
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Invalid Google ID Token." });
      }
    } else {
      try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleAccessToken}`);
        if (!response.ok) {
          throw new Error("Failed to fetch userinfo from Google API");
        }
        const data = await response.json();
        googleId = data.sub;
        email = data.email;
        name = data.name;
        picture = data.picture;
      } catch (err) {
        console.error("Google Access Token verification failed:", err);
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Invalid Google Access Token." });
      }
    }

    if (!email) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Google account did not return an email address." });
    }

    const emailNormalized = email.trim().toLowerCase();

    let user = await User.findOne({
      $or: [{ googleId }, { email: emailNormalized }],
    }).session(session);

    let isNewUser = false;
    let role = preferredRole || "family";
    if (role !== "family" && role !== "companion") {
      role = "family";
    }

    if (!user) {
      isNewUser = true;

      const randomPassword = Math.random().toString(36).slice(-10) + "A1!#$";
      const generatedPasswordHash = await bcrypt.hash(randomPassword, 12);

      const [newCreatedUser] = await User.create(
        [{
          name: name || "Google User",
          email: emailNormalized,
          googleId,
          role,
          avatar: picture ? { url: picture } : undefined,
          passwordHash: generatedPasswordHash,
        }],
        { session }
      );
      user = newCreatedUser;
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (picture && (!user.avatar || !user.avatar.url)) {
        user.avatar = { url: picture };
      }

      if (name && !user.name) {
        user.name = name;
      }

      await user.save({ session });

      if (user.isBanned) {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({
          message: messages.auth.banned[lang],
        });
      }
    }

    await session.commitTransaction();
    session.endSession();

    const profileRecord = user.role === "companion"
      ? await Companion.findOne({ userId: user._id })
      : user.role === "family"
      ? await Family.findOne({ familyId: user._id })
      : null;

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      accessToken,
      user: userResponse(user, profileRecord),
      isNewUser,
      needsProfileCompletion: !profileRecord,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Google Sign-In Error:", err);
    return res.status(500).json({ message: messages.common.serverError[req.lang || "en"] });
  }
};
