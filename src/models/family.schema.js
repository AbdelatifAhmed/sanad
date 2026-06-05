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
  conditionDetails: { type: String, required: true },
  interests: [{ type: String }]
});

const familySchema = new mongoose.Schema(
  {
    familyId: {
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
    beneficiaries: [beneficiarySchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Family', familySchema);
