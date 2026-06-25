const mongoose = require("mongoose");
const crypto = require("crypto");
const Booking = require("../models/booking.schema");
const Payment = require("../models/payment.schema");
const JobPost = require("../models/jobPost.schema");
const Proposal = require("../models/proposal.schema");
const CompanionDebt = require("../models/companionDebt.schema");
const { sendNotification } = require("../services/notificationService");
const messages = require("../utils/messages");

/**
 * ============================================================================
 * SCENARIO 1: Success Payment Flow (نجاح عملية الدفع)
 * ============================================================================
 * When family accepts proposal and selects payment method:
 * - Creates Payment record (status: pending)
 * - Returns paymentURL or opens payment modal
 * - After gateway webhook confirmation:
 *   - Updates Payment to status: paid
 *   - Updates Booking to status: approved
 *   - Updates JobPost to status: filled
 *   - Rejects all other proposals for this job
 *   - Notifies companion in real-time
 */
const initiatePayment = async (req, res) => {
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

    // Booking must be in pending_payment state
    if (booking.status !== "pending_payment") {
      return res.status(400).json({
        status: "fail",
        message: messages.payment.bookingNotInPaymentState[lang],
      });
    }

    const basePrice = booking.totalHours * booking.hourlyRateAtBooking;
    const adminFee = basePrice * 0.1;
    const totalAmount = basePrice + adminFee;

    const transactionId =
      "txn_" + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Create payment record with pending status
    const payment = await Payment.create({
      bookingId: booking._id,
      familyId: booking.familyId,
      companionId: booking.companionId,
      amount: basePrice,
      adminFee,
      totalAmount,
      paymentMethod,
      status: "pending",
      transactionId,
    });

    // For CASH payments, process immediately (no gateway)
    if (paymentMethod === "cash") {
      return res.status(200).json({
        status: "success",
        message:
          lang === "en"
            ? "Cash payment confirmed. Service will start now."
            : "تم تأكيد الدفع النقدي. ستبدأ الخدمة الآن.",
        data: {
          payment,
          booking,
          paymentUrl: null,
          isCashPayment: true,
        },
      });
    }

    // For card/wallet, return payment gateway URL (Stripe/Paymob integration point)
    const paymentUrl = `${process.env.PAYMENT_GATEWAY_URL || "https://gateway.example.com"}/checkout?transactionId=${transactionId}&amount=${totalAmount}`;

    return res.status(200).json({
      status: "success",
      message: messages.payment.paymentInitiated[lang],
      data: {
        payment,
        paymentUrl,
        isCashPayment: false,
      },
    });
  } catch (error) {
    console.error("Error initiating payment:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message,
    });
  }
};

/**
 * ============================================================================
 * SCENARIO 1 + SCENARIO 5: Payment Success Webhook Handler
 * ============================================================================
 * Called by Stripe/Paymob after successful payment
 * Executes atomic transaction:
 * - Update Payment.status = paid
 * - Update Booking.status = approved
 * - Update JobPost.status = filled (if applicable)
 * - Reject other proposals
 * - Track admin fee as debt if cash payment
 */
const handlePaymentWebhook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const lang = req.lang || "en";
    const { transactionId, status, webhookId } = req.body;

    // HMAC Signature verification if webhook secret is configured
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers["x-signature"];
      if (!signature) {
        await session.abortTransaction();
        return res.status(401).json({
          status: "fail",
          message: "Missing signature header.",
        });
      }

      const hmac = crypto.createHmac("sha256", webhookSecret);
      hmac.update(JSON.stringify(req.body));
      const expectedSignature = hmac.digest("hex");

      if (signature !== expectedSignature) {
        await session.abortTransaction();
        return res.status(401).json({
          status: "fail",
          message: "Invalid webhook signature.",
        });
      }
    }

    if (!transactionId || status !== "success") {
      await session.abortTransaction();
      return res.status(400).json({
        status: "fail",
        message: messages.payment.invalidWebhook[lang],
      });
    }

    // Find payment record
    const payment = await Payment.findOne({ transactionId }).session(session);
    if (!payment) {
      await session.abortTransaction();
      return res.status(404).json({
        status: "fail",
        message: messages.payment.paymentNotFound[lang],
      });
    }

    // Update payment to paid
    payment.status = "paid";
    payment.webhookId = webhookId;
    await payment.save({ session });

    // Get booking
    const booking = await Booking.findById(payment.bookingId).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({
        status: "fail",
        message: messages.review.bookingNotFound[lang],
      });
    }

    // Update booking status
    booking.status = "approved";
    booking.paymentStatus = "paid";
    booking.paymentMethod = payment.paymentMethod;
    await booking.save({ session });

    // If this booking is from a JobPost, update job status and reject other proposals
    if (booking.jobPostId) {
      const jobPost = await JobPost.findById(booking.jobPostId).session(
        session,
      );
      if (jobPost) {
        jobPost.status = "filled";
        await jobPost.save({ session });

        // Reject all other pending proposals for this job
        await Proposal.updateMany(
          {
            jobPostId: booking.jobPostId,
            companionId: { $ne: booking.companionId },
            status: "pending",
          },
          { status: "rejected" },
          { session },
        );
      }
    }

    // SCENARIO 5: If cash payment, record admin fee as debt
    if (payment.paymentMethod === "cash") {
      let companionDebt = await CompanionDebt.findOne({
        companionId: payment.companionId,
      }).session(session);
      if (!companionDebt) {
        const debtArray = await CompanionDebt.create(
          [
            {
              companionId: payment.companionId,
              totalDebt: 0,
              debtHistory: [],
            },
          ],
          { session },
        );
        companionDebt = debtArray[0];
      }

      companionDebt.totalDebt += payment.adminFee;
      companionDebt.debtHistory.push({
        bookingId: booking._id,
        paymentId: payment._id,
        amount: payment.adminFee,
        reason: "cash_payment_admin_fee",
        recordedAt: new Date(),
      });
      await companionDebt.save({ session });
      payment.debtRecorded = true;
      await payment.save({ session });
    }

    await session.commitTransaction();

    // Send real-time notification to companion
    try {
      await sendNotification(
        payment.companionId,
        req.user?._id || "system",
        lang === "en" ? "Booking Confirmed & Paid" : "تم تأكيد الحجز والدفع",
        lang === "en"
          ? `Payment confirmed! You can now start communication with the family.`
          : `تم تأكيد الدفع! يمكنك الآن بدء التواصل مع العائلة.`,
        "payment",
        req.io,
      );
    } catch (err) {
      console.error("Failed to send webhook notification:", err.message);
    }

    return res.status(200).json({
      status: "success",
      message: messages.payment.paymentConfirmed[lang],
      data: { payment, booking },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error handling payment webhook:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

/**
 * ============================================================================
 * SCENARIO 2: Failed / Abandoned Payment Flow (فشل الدفع)
 * ============================================================================
 * Called by gateway webhook or cron job if timeout:
 * - Updates Payment.status = failed or abandoned
 * - Rolls back: Booking stays pending_payment
 * - JobPost stays open
 * - Proposals remain pending
 * - Notifies family of failure
 */
const handlePaymentFailure = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const lang = req.lang || "en";
    const { transactionId, reason } = req.body;

    const payment = await Payment.findOne({ transactionId }).session(session);
    if (!payment) {
      await session.abortTransaction();
      return res.status(404).json({
        status: "fail",
        message: messages.payment.paymentNotFound[lang],
      });
    }

    // Update payment status to failed
    payment.status = "failed";
    await payment.save({ session });

    // Booking stays in pending_payment (no change, no rollback needed)
    // JobPost stays open
    // Proposals stay pending

    await session.commitTransaction();

    // Notify family
    try {
      await sendNotification(
        payment.familyId,
        "system",
        lang === "en" ? "Payment Failed" : "فشل الدفع",
        lang === "en"
          ? `Payment failed: ${reason || "Unknown error"}. Please try again.`
          : `فشل الدفع: ${reason || "خطأ غير معروف"}. يرجى المحاولة مجددا.`,
        "payment",
        req.io,
      );
    } catch (err) {
      console.error("Failed to notify family of payment failure:", err.message);
    }

    return res.status(200).json({
      status: "success",
      message: messages.payment.paymentFailed[lang],
      data: { payment },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error handling payment failure:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

/**
 * ============================================================================
 * SCENARIO 3: Cancellation & Refund Flow (الإلغاء والاسترجاع)
 * ============================================================================
 * Family initiates cancellation before service starts:
 * - Checks booking constraints (must be approved/paid, no check-in)
 * - Calls refund API to gateway
 * - Updates Payment.status = refunded
 * - Updates Booking.status = cancelled
 * - Re-opens JobPost and reactivates proposals
 */
const refundBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const lang = req.lang || "en";
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(id).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({
        status: "fail",
        message: messages.review.bookingNotFound[lang],
      });
    }

    if (booking.familyId.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({
        status: "fail",
        message: messages.review.unauthorizedReview[lang],
      });
    }

    // Booking must be approved and paid
    if (booking.status !== "approved" || booking.paymentStatus !== "paid") {
      await session.abortTransaction();
      return res.status(400).json({
        status: "fail",
        message: messages.payment.refundNotEligible[lang],
      });
    }

    // Check-in must not have occurred
    const hasCheckedIn = booking.schedule.some((s) => s.checkInTime);
    if (hasCheckedIn) {
      await session.abortTransaction();
      return res.status(400).json({
        status: "fail",
        message: messages.payment.refundTooLate[lang],
      });
    }

    // Find and update payment
    const payment = await Payment.findOne({ bookingId: booking._id }).session(
      session,
    );
    if (!payment) {
      await session.abortTransaction();
      return res.status(404).json({
        status: "fail",
        message: messages.payment.paymentNotFound[lang],
      });
    }

    // Call refund API (placeholder - integrate real gateway)
    const refundTransactionId =
      "refund_" + Math.random().toString(36).substr(2, 9).toUpperCase();

    payment.status = "refunded";
    payment.refundStatus = "completed";
    payment.refundTransactionId = refundTransactionId;
    payment.refundDate = new Date();
    payment.refundReason = reason || "Family cancellation";
    await payment.save({ session });

    // Update booking
    booking.status = "cancelled";
    booking.paymentStatus = "refunded";
    await booking.save({ session });

    // Re-open JobPost if applicable
    if (booking.jobPostId) {
      const jobPost = await JobPost.findById(booking.jobPostId).session(
        session,
      );
      if (jobPost) {
        jobPost.status = "open";
        await jobPost.save({ session });

        // Reactivate proposals (set rejected back to pending)
        await Proposal.updateMany(
          { jobPostId: booking.jobPostId, status: "rejected" },
          { status: "pending" },
          { session },
        );
      }
    }

    await session.commitTransaction();

    // Notify companion
    try {
      await sendNotification(
        booking.companionId,
        req.user._id,
        lang === "en"
          ? "Booking Cancelled & Refunded"
          : "تم إلغاء واسترجاع الحجز",
        lang === "en"
          ? `The booking has been cancelled and payment refunded to the family.`
          : `تم إلغاء الحجز واسترجاع المبلغ للعائلة.`,
        "payment",
        req.io,
      );
    } catch (err) {
      console.error("Failed to notify companion of refund:", err.message);
    }

    return res.status(200).json({
      status: "success",
      message: messages.payment.refundSuccess[lang],
      data: { payment, booking },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error refunding booking:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

/**
 * ============================================================================
 * SCENARIO 4: Payout Completion (تقفيل الخدمة وتحويل الأرباح)
 * ============================================================================
 * After check-out, release companion earnings:
 * - Mark Payment.payoutReleased = true
 * - Record payoutTransactionId and payoutDate
 * - Transfer funds to companion (placeholder - integrate real wallet/transfer API)
 */
const releasePayout = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const bookingId = req.params.id;

    const payment = await Payment.findOne({ bookingId });
    if (!payment) {
      return res
        .status(404)
        .json({
          status: "fail",
          message: messages.payment.paymentNotFound[lang],
        });
    }

    if (payment.status !== "paid") {
      return res
        .status(400)
        .json({
          status: "fail",
          message: messages.payment.paymentNotSettled[lang],
        });
    }

    if (payment.payoutReleased) {
      return res
        .status(400)
        .json({
          status: "fail",
          message: messages.payment.alreadyReleased[lang],
        });
    }

    payment.payoutReleased = true;
    payment.payoutTransactionId =
      "payout_" + Math.random().toString(36).substr(2, 9).toUpperCase();
    payment.payoutDate = new Date();
    await payment.save();

    // TODO: Integrate real payout API (e.g., bank transfer, wallet top-up)
    // For now, just record the release

    if (typeof sendNotification === "function") {
      await sendNotification(
        payment.companionId,
        req.user._id,
        lang === "en" ? "Payout Released" : "تم صرف المبلغ",
        lang === "en"
          ? `Your payout for booking has been released. Available balance: $${payment.amount.toFixed(2)}`
          : `تم صرف أجرك. الرصيد المتاح: $${payment.amount.toFixed(2)}`,
        "payment",
        req.io,
      );
    }

    return res.status(200).json({
      status: "success",
      message: messages.payment.payoutReleased[lang],
      data: { payment },
    });
  } catch (error) {
    console.error("Error releasing payout:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message,
    });
  }
};

/**
 * ============================================================================
 * SCENARIO 5: Companion Debt Tracking (تتبع ديون المرافقين)
 * ============================================================================
 * Get companion debt ledger and payment history
 */
const getCompanionDebtLedger = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const companionId = req.user._id;

    const debt = await CompanionDebt.findOne({ companionId });
    if (!debt) {
      return res.status(200).json({
        status: "success",
        data: {
          companionId,
          totalDebt: 0,
          status: "active",
          debtHistory: [],
        },
      });
    }

    return res.status(200).json({
      status: "success",
      data: debt,
    });
  } catch (error) {
    console.error("Error fetching debt ledger:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message,
    });
  }
};

/**
 * Get payment history with filtering
 */
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
      .populate("bookingId", "startDate endDate totalPrice totalHours status")
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

/**
 * Admin view all payments with financial stats
 */
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

    // Calculate financial stats
    const stats = await Payment.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalAdminFees: { $sum: "$adminFee" },
          totalCompanionPayouts: { $sum: "$amount" },
          successfulPayments: { $sum: 1 },
        },
      },
    ]);

    const financialStats = stats[0] || {
      totalRevenue: 0,
      totalAdminFees: 0,
      totalCompanionPayouts: 0,
      successfulPayments: 0,
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
        financialStats,
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

const confirmCashPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const lang = req.lang || "en";
    const { bookingId } = req.body;
    const companionId = req.user._id;

    if (!bookingId) {
      await session.abortTransaction();
      return res.status(400).json({
        status: "fail",
        message:
          lang === "en" ? "Booking ID is required." : "معرف الحجز مطلوب.",
      });
    }

    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({
        status: "fail",
        message: messages.review.bookingNotFound[lang],
      });
    }

    if (booking.companionId.toString() !== companionId.toString()) {
      await session.abortTransaction();
      return res.status(403).json({
        status: "fail",
        message:
          lang === "en"
            ? "Not authorized to confirm cash for this booking."
            : "غير مصرح لك بتأكيد الدفع النقدي لهذا الحجز.",
      });
    }

    if (booking.paymentMethod !== "cash") {
      await session.abortTransaction();
      return res.status(400).json({
        status: "fail",
        message:
          lang === "en"
            ? "This booking is not set to cash payment."
            : "هذا الحجز غير مخصص للدفع النقدي.",
      });
    }

    if (booking.status !== "pending_payment") {
      await session.abortTransaction();
      return res.status(400).json({
        status: "fail",
        message: messages.payment.bookingNotInPaymentState[lang],
      });
    }

    let payment = await Payment.findOne({ bookingId: booking._id }).session(
      session,
    );
    if (!payment) {
      const basePrice = booking.totalHours * booking.hourlyRateAtBooking;
      const adminFee = basePrice * 0.1;
      const totalAmount = basePrice + adminFee;
      const transactionId =
        "txn_" + Math.random().toString(36).substr(2, 9).toUpperCase();

      payment = new Payment({
        bookingId: booking._id,
        familyId: booking.familyId,
        companionId: booking.companionId,
        amount: basePrice,
        adminFee,
        totalAmount,
        paymentMethod: "cash",
        status: "pending",
        transactionId,
      });
    }

    if (payment.status === "paid") {
      await session.abortTransaction();
      return res.status(400).json({
        status: "fail",
        message:
          lang === "en"
            ? "Payment already confirmed."
            : "تم تأكيد الدفع بالفعل.",
      });
    }

    payment.status = "paid";
    await payment.save({ session });

    booking.status = "approved";
    booking.paymentStatus = "paid";
    await booking.save({ session });

    let companionDebt = await CompanionDebt.findOne({
      companionId: booking.companionId,
    }).session(session);
    if (!companionDebt) {
      const debtArray = await CompanionDebt.create(
        [
          {
            companionId: booking.companionId,
            totalDebt: 0,
            debtHistory: [],
          },
        ],
        { session },
      );
      companionDebt = debtArray[0];
    }

    companionDebt.totalDebt += payment.adminFee;
    companionDebt.debtHistory.push({
      bookingId: booking._id,
      paymentId: payment._id,
      amount: payment.adminFee,
      reason: "cash_payment_admin_fee",
      recordedAt: new Date(),
    });
    await companionDebt.save({ session });
    payment.debtRecorded = true;
    await payment.save({ session });

    await session.commitTransaction();

    try {
      await sendNotification(
        booking.familyId,
        companionId,
        lang === "en"
          ? "Cash Payment Confirmed"
          : "تم تأكيد استلام المبلغ نقداً",
        lang === "en"
          ? `The companion has confirmed receiving the cash payment. Your booking is now approved.`
          : `أكد المرافق استلام المبلغ نقداً. تم قبول الحجز الخاص بك الآن.`,
        "payment",
        req.io,
      );
    } catch (err) {
      console.error(
        "Failed to send cash confirmation notification:",
        err.message,
      );
    }

    return res.status(200).json({
      status: "success",
      message:
        lang === "en"
          ? "Cash payment successfully confirmed."
          : "تم تأكيد الدفع النقدي بنجاح.",
      data: { payment, booking },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error confirming cash payment:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

const settleCompanionDebt = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const lang = req.lang || "en";
    const companionId = req.user._id;
    const { amount, transactionRef } = req.body;

    if (!amount || !transactionRef) {
      await session.abortTransaction();
      return res.status(400).json({
        status: "fail",
        message: messages.booking.missingFields[lang] || "Amount and transaction reference are required.",
      });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        status: "fail",
        message: "Invalid settlement amount",
      });
    }

    let companionDebt = await CompanionDebt.findOne({ companionId }).session(session);
    if (!companionDebt) {
      await session.abortTransaction();
      return res.status(404).json({
        status: "fail",
        message: "No outstanding platform fees found.",
      });
    }

    const existingPayment = await Payment.findOne({ transactionId: transactionRef.trim() }).session(session);
    if (existingPayment) {
      await session.abortTransaction();
      return res.status(400).json({
        status: "fail",
        message: lang === "en" ? "This transaction reference has already been submitted." : "تم تقديم كود المعاملة هذا من قبل.",
      });
    }

    const payment = new Payment({
      bookingId: null,
      familyId: null,
      companionId,
      amount: 0,
      adminFee: numericAmount,
      totalAmount: numericAmount,
      paymentMethod: "wallet",
      status: "pending",
      transactionId: transactionRef.trim(),
    });
    await payment.save({ session });

    companionDebt.debtHistory.push({
      paymentId: payment._id,
      amount: -numericAmount,
      reason: `vodafone_cash_settlement_pending (Ref: ${transactionRef.trim()})`,
      recordedAt: new Date(),
      settled: false,
    });
    await companionDebt.save({ session });

    await session.commitTransaction();

    return res.status(200).json({
      status: "success",
      message: lang === "en"
        ? "Vodafone Cash settlement reference submitted successfully. Waiting for admin approval."
        : "تم تقديم طلب سداد الديون عبر فودافون كاش بنجاح. بانتظار مراجعة الإدارة.",
      data: { payment },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error settling companion debt:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

module.exports = {
  initiatePayment,
  handlePaymentWebhook,
  handlePaymentFailure,
  refundBooking,
  releasePayout,
  getCompanionDebtLedger,
  getMyPayments,
  getAdminPayments,
  confirmCashPayment,
  settleCompanionDebt,
};
