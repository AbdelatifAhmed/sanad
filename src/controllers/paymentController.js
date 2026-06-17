const mongoose = require("mongoose");
const Booking = require("../models/booking.schema");
const Payment = require("../models/payment.schema");
const { sendNotification } = require("../services/notificationService");
const messages = require("../utils/messages");

const payBooking = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { id } = req.params;
    const { paymentMethod } = req.body;

    if (!paymentMethod || !["cash", "card", "wallet"].includes(paymentMethod)) {
      return res.status(400).json({
        status: "fail",
        message: messages.payment.invalidPaymentMethod[lang],
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        status: "fail",
        message: messages.review.bookingNotFound[lang],
      });
    }

    if (booking.familyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "fail",
        message: messages.review.unauthorizedReview[lang],
      });
    }

    if (booking.status !== "approved") {
      return res.status(400).json({
        status: "fail",
        message: messages.payment.bookingNotApproved[lang],
      });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        status: "fail",
        message: messages.payment.alreadyPaid[lang],
      });
    }

    const basePrice = booking.totalHours * booking.hourlyRateAtBooking;
    const adminFee = basePrice * 0.10;
    const totalAmount = basePrice + adminFee;

    const transactionId = "txn_" + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Create payment transaction log
    const payment = await Payment.create({
      bookingId: booking._id,
      familyId: booking.familyId,
      companionId: booking.companionId,
      amount: basePrice,
      adminFee,
      totalAmount,
      paymentMethod,
      status: "paid",
      transactionId,
    });

    // Update booking payment info
    booking.paymentStatus = "paid";
    booking.paymentMethod = paymentMethod;
    await booking.save();

    // Notify Companion
    await sendNotification(
      booking.companionId,
      req.user._id,
      lang === "en" ? "Booking Payment Received" : "تم استلام دفعة الحجز",
      lang === "en" 
        ? `The booking has been successfully paid by the family. Your earnings: EGP ${basePrice.toFixed(2)}`
        : `تم دفع قيمة الحجز بنجاح من قبل العائلة. أرباحك المقدرة: ${basePrice.toFixed(2)} جنيه مصري`,
      "payment",
      req.io
    );

    return res.status(200).json({
      status: "success",
      message: messages.payment.successPaid[lang],
      data: {
        payment,
        booking,
      },
    });
  } catch (error) {
    console.error("Error in payBooking:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message,
    });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    let filter = {};
    if (req.user.role === "family") {
      filter.familyId = req.user._id;
    } else if (req.user.role === "companion") {
      filter.companionId = req.user._id;
    } else {
      return res.status(403).json({
        status: "fail",
        message: messages.common.forbidden[lang],
      });
    }

    const total = await Payment.countDocuments(filter);
    const payments = await Payment.find(filter)
      .populate("bookingId", "startDate endDate totalPrice totalHours")
      .populate("familyId", "name email phone")
      .populate("companionId", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: "success",
      message: messages.payment.paymentDetailsRetrieved[lang],
      results: payments.length,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: {
        payments,
      },
    });
  } catch (error) {
    console.error("Error in getMyPayments:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message,
    });
  }
};

const getAdminPayments = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const total = await Payment.countDocuments();
    const payments = await Payment.find()
      .populate("bookingId", "startDate endDate totalPrice")
      .populate("familyId", "name email")
      .populate("companionId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate sum of total fees
    const financialStats = await Payment.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalAdminFees: { $sum: "$adminFee" },
          totalCompanionPayouts: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = financialStats[0] || {
      totalRevenue: 0,
      totalAdminFees: 0,
      totalCompanionPayouts: 0,
      count: 0,
    };

    return res.status(200).json({
      status: "success",
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: {
        payments,
        stats: {
          totalRevenue: stats.totalRevenue,
          totalAdminFees: stats.totalAdminFees,
          totalCompanionPayouts: stats.totalCompanionPayouts,
          successfulPaymentsCount: stats.count,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAdminPayments:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message,
    });
  }
};

const releasePayout = async function (req, res) {
    try {
      const lang = req.lang || 'en';
      const bookingId = req.params.id;

      const payment = await Payment.findOne({ bookingId });
      if (!payment) {
        return res.status(404).json({ status: 'fail', message: messages.payment.paymentNotFound[lang] });
      }

      if (payment.status !== 'paid') {
        return res.status(400).json({ status: 'fail', message: messages.payment.paymentNotSettled[lang] });
      }

      if (payment.payoutReleased) {
        return res.status(400).json({ status: 'fail', message: messages.payment.alreadyReleased[lang] });
      }

      payment.payoutReleased = true;
      payment.payoutTransactionId = 'payout_' + Math.random().toString(36).substr(2, 9).toUpperCase();
      payment.payoutDate = new Date();
      await payment.save();

      if (typeof sendNotification === 'function') {
        await sendNotification(
          payment.companionId,
          req.user._id,
          lang === 'en' ? 'Payout Released' : 'تم صرف المبلغ',
          lang === 'en'
            ? `Your payout for booking ${bookingId} has been released.`
            : `تم صرف أجر الحجز ${bookingId}.`,
          'payment',
          req.io
        );
      }

      return res.status(200).json({ status: 'success', message: messages.payment.payoutReleased[lang], data: { payment } });
    } catch (error) {
      console.error('Error releasing payout:', error);
      return res.status(500).json({ status: 'error', message: messages.common.serverError[req.lang || 'en'], error: error.message });
    }
  }

module.exports = {
  payBooking,
  getMyPayments,
  getAdminPayments,
  releasePayout
};
