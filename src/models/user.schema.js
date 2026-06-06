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
  },
  { timestamps: true },
);

// علاقة افتراضية بين المستخدم والمرافق المهني (Companion) لسهولة الوصول إلى بيانات المرافق من خلال المستخدم
// userSchema.virtual('companionProfile', {
//   ref: 'Companion',         
//   localField: '_id',         
//   foreignField: 'userId',   
//   justOne: true             
// });

// userSchema.set('toObject', { virtuals: true });
// userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("User", userSchema);
