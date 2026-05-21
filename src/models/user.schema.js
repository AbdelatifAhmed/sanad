const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'الاسم مطلوب بالكامل'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'البريد الإلكتروني مطلوب'],
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: [true, 'كلمة المرور مطلوبة']
    },
    phone: {
      type: String,
      required: [true, 'رقم الهاتف مطلوب'],
      trim: true
    },
    role: {
      type: String,
      enum: ['family', 'companion', 'admin'],
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);