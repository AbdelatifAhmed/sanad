const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
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