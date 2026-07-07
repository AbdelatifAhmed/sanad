const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "الاسم مطلوب بالكامل"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "البريد الإلكتروني مطلوب"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, "كلمة المرور مطلوبة"],
    },
    phone: {
      type: String,
      required: [true, "رقم الهاتف مطلوب"],
      trim: true,
    },
    role: {
      type: String,
      enum: ["family", "companion", "admin"],
      required: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    location: {
      geo: {
        type: { type: String, default: "Point" },
        coordinates: { type: [Number] }, // [longitude, latitude]
      },
      readableAddress: { type: String }, 
      city: { type: String }, 
      governorate: { type: String },
    },
    avatar: {
      url: { type: String, trim: true },
      public_id: { type: String, trim: true }
    },
    // Presence tracking
    isOnline: { type: Boolean, default: false },
    lastSeen:  { type: Date,    default: null  },

    resetPasswordOtp: {
      type: String,
    },
    resetPasswordOtpExpires: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
  },
  { timestamps: true },
);

userSchema.virtual('companionProfile', {
  ref: 'Companion',         
  localField: '_id',         
  foreignField: 'userId',   
  justOne: true             
});

userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("User", userSchema);
