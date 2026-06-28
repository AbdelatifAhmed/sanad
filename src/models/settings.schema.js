const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      default: "Sanad Healthcare",
    },
    supportEmail: {
      type: String,
      default: "support@sanad.com",
    },
    contactNumber: {
      type: String,
      default: "+966 50 000 0000",
    },
    defaultLanguage: {
      type: String,
      default: "English (United Kingdom)",
    },
    timezone: {
      type: String,
      default: "(GMT+03:00) Riyadh, Saudi Arabia",
    },
    sessionTimeout: {
      type: Number,
      default: 30,
    },
    passwordPolicy: {
      minLength: { type: Number, default: 12 },
      requireSpecial: { type: Boolean, default: true },
      expiry90days: { type: Boolean, default: true },
    },
    twoFactorEnforced: {
      type: Boolean,
      default: true,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    newBookingAlerts: {
      type: Boolean,
      default: true,
    },
    lowCreditAlert: {
      type: Boolean,
      default: false,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    registrationToggle: {
      type: Boolean,
      default: true,
    },
    autoApprovalSettings: {
      type: Boolean,
      default: false,
    },
    platformFee: {
      type: Number,
      default: 15,
    },
    payoutSchedule: {
      type: String,
      default: "Bi-Weekly",
    },
    baseCurrency: {
      type: String,
      default: "SAR - Saudi Riyal",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
