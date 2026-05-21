const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  category: { 
    type: String, 
    enum: ['elderly', 'special_needs'],
    required: true 
  },
  conditionDetails: { type: String, required: true }, // الحالة العامة (شرح غير طبي)
  interests: [{ type: String }] // اهتمامات المستفيد (مثال: روايات نجيب محفوظ، شطرنج، سياسة)
});

const familySchema = new mongoose.Schema(
  {
    familyId: { // الحساب الأساسي الذي يتكلم في الشات ويدفع (الأبناء/الأقارب)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    address: {
      city: { type: String, required: true },
      area: { type: String, required: true },
      fullAddress: { type: String, required: true }
    },
    beneficiaries: [beneficiarySchema] // مصفوفة تدعم إضافة أكثر من مستفيد للحساب الواحد
  },
  { timestamps: true }
);

module.exports = mongoose.model('Family', familySchema);