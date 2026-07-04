const mongoose = require("mongoose");
const crypto = require("crypto");
const Booking = require("../models/booking.schema");
const Payment = require("../models/payment.schema");
const JobPost = require("../models/jobPost.schema");
const Proposal = require("../models/proposal.schema");
const CompanionDebt = require("../models/companionDebt.schema");
const Family = require("../models/family.schema");
const Companion = require("../models/companion.schema");
const WalletTransaction = require("../models/walletTransaction.schema");
const stripeService = require("../services/stripeService");
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

    if (!paymentMethod || !["card", "wallet"].includes(paymentMethod)) {
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

    // For WALLET payment, check balance and deduct
    if (paymentMethod === "wallet") {
      const familyProfile = await Family.findOne({ familyId: req.user._id });
      if (!familyProfile || (familyProfile.walletBalance || 0) < totalAmount) {
        return res.status(400).json({
          status: "fail",
          message: lang === "en"
            ? "Insufficient wallet balance. Please top up your wallet."
            : "رصيد المحفظة غير كافٍ. يرجى شحن محفظتك أولاً.",
        });
      }

      // Deduct balance and create database records
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        familyProfile.walletBalance -= totalAmount;
        await familyProfile.save({ session });

        const transactionId = "txn_" + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        const payment = await Payment.create([{
          bookingId: booking._id,
          familyId: booking.familyId,
          companionId: booking.companionId,
          amount: basePrice,
          adminFee,
          totalAmount,
          paymentMethod: "wallet",
          status: "paid",
          transactionId,
        }], { session });

        booking.status = "approved";
        booking.paymentStatus = "paid";
        booking.paymentMethod = "wallet";
        await booking.save({ session });

        if (booking.jobPostId) {
          const jobPost = await JobPost.findById(booking.jobPostId).session(session);
          if (jobPost) {
            jobPost.status = "assigned";
            await jobPost.save({ session });

            await Proposal.updateMany(
              {
                jobPostId: booking.jobPostId,
                companionId: { $ne: booking.companionId },
                status: "pending",
              },
              { status: "rejected" },
              { session }
            );
          }
        }

        await WalletTransaction.create([{
          userId: req.user._id,
          bookingId: booking._id,
          amount: -totalAmount,
          type: "payment",
          status: "completed",
          transactionId,
          descriptionAr: "دفع مقابل حجز رعاية منزلية من المحفظة",
          descriptionEn: "Payment for home care booking via Wallet",
        }], { session });

        await session.commitTransaction();

        // Send real-time notification
        try {
          await sendNotification(
            booking.companionId,
            req.user._id,
            lang === "en" ? "Booking Confirmed & Paid" : "تم تأكيد الحجز والدفع",
            lang === "en"
              ? `Payment confirmed! You can now start communication with the family.`
              : `تم تأكيد الدفع! يمكنك الآن بدء التواصل مع العائلة.`,
            "payment",
            req.io
          );
        } catch (err) {
          console.error("Failed to send notification:", err.message);
        }

        return res.status(200).json({
          status: "success",
          message: lang === "en"
            ? "Payment completed successfully using wallet balance."
            : "تم إتمام الدفع بنجاح باستخدام رصيد المحفظة.",
          data: {
            payment: payment[0],
            booking,
            isCashPayment: false,
            isWalletPayment: true,
          },
        });

      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    }


    // For CARD payment, create Stripe PaymentIntent
    if (paymentMethod === "card") {
      try {
        const paymentIntent = await stripeService.createPaymentIntent(totalAmount, "egp", {
          bookingId: booking._id.toString(),
          type: "booking_payment",
        });

        const payment = await Payment.create({
          bookingId: booking._id,
          familyId: booking.familyId,
          companionId: booking.companionId,
          amount: basePrice,
          adminFee,
          totalAmount,
          paymentMethod: "card",
          status: "pending",
          transactionId: paymentIntent.id,
          stripePaymentIntentId: paymentIntent.id,
        });

        return res.status(200).json({
          status: "success",
          message: messages.payment.paymentInitiated[lang],
          data: {
            payment,
            clientSecret: paymentIntent.client_secret,
            transactionId: paymentIntent.id,
            isCashPayment: false,
          },
        });
      } catch (err) {
        console.error("Stripe Card payment initiation error:", err);
        return res.status(500).json({
          status: "error",
          message: lang === "en" ? "Stripe service connection failed" : "فشل الاتصال بخدمة Stripe",
          error: err.message,
        });
      }
    }
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
    let event = req.body;

    // Verify Stripe signature if header is present
    const signature = req.headers["stripe-signature"];
    if (signature && process.env.STRIPE_WEBHOOK_SECRET) {
      try {
        event = stripeService.verifyWebhookSignature(
          req.rawBody || JSON.stringify(req.body),
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        await session.abortTransaction();
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    }

    // 1. Process Stripe Webhook Event
    if (event.type) {
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const { userId, type, bookingId } = paymentIntent.metadata || {};

        if (type === "topup" && userId) {
          // Process Wallet top-up
          const familyProfile = await Family.findOne({ familyId: userId }).session(session);
          if (familyProfile) {
            const topupAmount = paymentIntent.amount / 100;
            familyProfile.walletBalance = (familyProfile.walletBalance || 0) + topupAmount;
            await familyProfile.save({ session });

            // Update transaction status
            await WalletTransaction.findOneAndUpdate(
              { transactionId: paymentIntent.id },
              { status: "completed" },
              { session }
            );

            await session.commitTransaction();

            // Send notification to family
            try {
              await sendNotification(
                userId,
                null,
                lang === "en" ? "Wallet Charged Successfully" : "تم شحن المحفظة بنجاح",
                lang === "en"
                  ? `Your wallet has been topped up with $${topupAmount.toFixed(2)}.`
                  : `تم شحن محفظتك بمبلغ $${topupAmount.toFixed(2)}.`,
                "payment",
                req.io
              );
            } catch (err) {
              console.error("Failed to send topup notification:", err.message);
            }

            return res.status(200).json({ status: "success", message: "Topup completed" });
          }
        }

        if (type === "booking_topup_and_pay" && userId && bookingId) {
          const familyProfile = await Family.findOne({ familyId: userId }).session(session);
          const booking = await Booking.findById(bookingId).session(session);

          if (familyProfile && booking) {
            const topupAmount = paymentIntent.amount / 100;
            
            // 1. Credit wallet (top-up)
            familyProfile.walletBalance = (familyProfile.walletBalance || 0) + topupAmount;
            await familyProfile.save({ session });

            // 2. Complete topup transaction record
            await WalletTransaction.findOneAndUpdate(
              { transactionId: paymentIntent.id },
              { status: "completed" },
              { session }
            );

            // 3. Process Wallet Payment
            const basePrice = booking.totalHours * booking.hourlyRateAtBooking;
            const adminFee = basePrice * 0.1;
            const totalAmount = basePrice + adminFee;

            if (familyProfile.walletBalance >= totalAmount) {
              // Deduct wallet balance
              familyProfile.walletBalance -= totalAmount;
              await familyProfile.save({ session });

              // Create payment record
              await Payment.create([{
                bookingId: booking._id,
                familyId: booking.familyId,
                companionId: booking.companionId,
                amount: basePrice,
                adminFee,
                totalAmount,
                paymentMethod: "wallet",
                status: "paid",
                transactionId: paymentIntent.id,
              }], { session });

              // Update booking
              booking.status = "approved";
              booking.paymentStatus = "paid";
              booking.paymentMethod = "wallet";
              await booking.save({ session });

              // Assign job post
              if (booking.jobPostId) {
                const jobPost = await JobPost.findById(booking.jobPostId).session(session);
                if (jobPost) {
                  jobPost.status = "assigned";
                  await jobPost.save({ session });

                  await Proposal.updateMany(
                    {
                      jobPostId: booking.jobPostId,
                      companionId: { $ne: booking.companionId },
                      status: "pending",
                    },
                    { status: "rejected" },
                    { session }
                  );
                }
              }

              // Create debit transaction record
              await WalletTransaction.create([{
                userId,
                bookingId: booking._id,
                amount: -totalAmount,
                type: "payment",
                status: "completed",
                transactionId: "pay_" + paymentIntent.id,
                descriptionAr: "دفع مقابل حجز رعاية منزلية من المحفظة (شحن وتلقائي)",
                descriptionEn: "Payment for home care booking via Wallet (Auto Top-up & Pay)",
              }], { session });

              await session.commitTransaction();

              // Send notifications
              try {
                await sendNotification(
                  userId,
                  null,
                  lang === "en" ? "Wallet Charged Successfully" : "تم شحن المحفظة بنجاح",
                  lang === "en"
                    ? `Your wallet has been topped up with $${topupAmount.toFixed(2)}.`
                    : `تم شحن محفظتك بمبلغ $${topupAmount.toFixed(2)}.`,
                  "payment",
                  req.io
                );

                await sendNotification(
                  booking.companionId,
                  userId,
                  lang === "en" ? "Booking Confirmed & Paid" : "تم تأكيد الحجز والدفع",
                  lang === "en"
                    ? `Payment confirmed! You can now start communication with the family.`
                    : `تم تأكيد الدفع! يمكنك الآن بدء التواصل مع العائلة.`,
                  "payment",
                  req.io
                );
              } catch (err) {
                console.error("Failed to send notification:", err.message);
              }

              return res.status(200).json({ status: "success", message: "Booking topup and pay completed" });
            } else {
              await session.commitTransaction();
              return res.status(200).json({ status: "success", message: "Topup completed but booking unpaid due to insufficient funds" });
            }
          }
        }

        if (type === "booking_payment" && bookingId) {
          // Process Booking Payment
          const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id }).session(session);
          if (payment && payment.status !== "paid") {
            payment.status = "paid";
            await payment.save({ session });

            const booking = await Booking.findById(payment.bookingId).session(session);
            if (booking) {
              booking.status = "approved";
              booking.paymentStatus = "paid";
              await booking.save({ session });

              if (booking.jobPostId) {
                const jobPost = await JobPost.findById(booking.jobPostId).session(session);
                if (jobPost) {
                  jobPost.status = "assigned";
                  await jobPost.save({ session });

                  await Proposal.updateMany(
                    {
                      jobPostId: booking.jobPostId,
                      companionId: { $ne: booking.companionId },
                      status: "pending",
                    },
                    { status: "rejected" },
                    { session }
                  );
                }
              }

              // Create debit transaction record
              await WalletTransaction.create([{
                userId: booking.familyId,
                bookingId: booking._id,
                amount: -payment.totalAmount,
                type: "payment",
                status: "completed",
                transactionId: paymentIntent.id,
                descriptionAr: "دفع مقابل حجز رعاية منزلية عبر البطاقة",
                descriptionEn: "Payment for home care booking via Card",
              }], { session });

              await session.commitTransaction();

              // Send notification to companion
              try {
                await sendNotification(
                  booking.companionId,
                  booking.familyId,
                  lang === "en" ? "Booking Confirmed & Paid" : "تم تأكيد الحجز والدفع",
                  lang === "en"
                    ? `Payment confirmed! You can now start communication with the family.`
                    : `تم تأكيد الدفع! يمكنك الآن بدء التواصل مع العائلة.`,
                  "payment",
                  req.io
                );
              } catch (err) {
                console.error("Failed to send notification:", err.message);
              }

              return res.status(200).json({ status: "success", message: "Booking payment completed" });
            }
          }
        }
      }

      await session.abortTransaction();
      return res.status(200).json({ status: "ignored", message: "Event ignored" });
    }

    // 2. Fallback to manual payload processing for testing/mock calls
    const { transactionId, status, webhookId } = event;
    if (!transactionId || status !== "success") {
      await session.abortTransaction();
      return res.status(400).json({
        status: "fail",
        message: messages.payment.invalidWebhook[lang],
      });
    }

    const payment = await Payment.findOne({ transactionId }).session(session);
    if (!payment) {
      await session.abortTransaction();
      return res.status(404).json({
        status: "fail",
        message: messages.payment.paymentNotFound[lang],
      });
    }

    if (payment.status === "paid") {
      await session.commitTransaction();
      return res.status(200).json({ status: "success", message: "Already paid" });
    }

    payment.status = "paid";
    payment.webhookId = webhookId;
    await payment.save({ session });

    const booking = await Booking.findById(payment.bookingId).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({
        status: "fail",
        message: messages.review.bookingNotFound[lang],
      });
    }

    booking.status = "approved";
    booking.paymentStatus = "paid";
    await booking.save({ session });

    if (booking.jobPostId) {
      const jobPost = await JobPost.findById(booking.jobPostId).session(session);
      if (jobPost) {
        jobPost.status = "assigned";
        await jobPost.save({ session });

        await Proposal.updateMany(
          {
            jobPostId: booking.jobPostId,
            companionId: { $ne: booking.companionId },
            status: "pending",
          },
          { status: "rejected" },
          { session }
        );
      }
    }

    await session.commitTransaction();
    return res.status(200).json({ status: "success", message: "Payment processed" });

  } catch (error) {
    await session.abortTransaction();
    console.error("Webhook processing error:", error);
    return res.status(500).json({ status: "error", message: error.message });
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

    const companion = await Companion.findOne({ userId: companionId });
    const debt = await CompanionDebt.findOne({ companionId });

    return res.status(200).json({
      status: "success",
      data: {
        companionId,
        totalDebt: debt ? debt.totalDebt : 0,
        status: debt ? debt.status : "active",
        debtHistory: debt ? debt.debtHistory : [],
        walletBalance: companion ? (companion.walletBalance || 0) : 0,
        stripeConnectId: companion ? companion.stripeConnectId : null,
      },
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

const connectCompanionStripe = async (req, res) => {
  try {
    const lang = req.lang || "en";
    
    // Find companion profile
    let companion = await Companion.findOne({ userId: req.user._id });
    if (!companion) {
      return res.status(404).json({
        status: "fail",
        message: lang === "en" ? "Companion profile not found" : "لم يتم العثور على ملف المرافق.",
      });
    }

    // 1. Create Connected Account if not exist
    if (!companion.stripeConnectId) {
      const account = await stripeService.createConnectedAccount(req.user.email, req.user.name);
      companion.stripeConnectId = account.id;
      await companion.save({ validateBeforeSave: false });
    }

    // 2. Create Onboarding Link
    const returnUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/companion/wallet?stripe_setup=success`;
    const refreshUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/companion/wallet?stripe_setup=refresh`;
    
    const onboardingUrl = await stripeService.createAccountOnboardingLink(
      companion.stripeConnectId,
      returnUrl,
      refreshUrl
    );

    return res.status(200).json({
      status: "success",
      data: {
        url: onboardingUrl,
      },
    });
  } catch (error) {
    console.error("Error creating Stripe Connect onboarding link:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message,
    });
  }
};

const requestCompanionPayout = async (req, res) => {
  try {
    const lang = req.lang || "en";
    
    const companion = await Companion.findOne({ userId: req.user._id });
    if (!companion) {
      return res.status(404).json({
        status: "fail",
        message: lang === "en" ? "Companion profile not found" : "لم يتم العثور على ملف المرافق.",
      });
    }

    if (!companion.stripeConnectId) {
      return res.status(400).json({
        status: "fail",
        message: lang === "en"
          ? "Please connect your Stripe bank account first."
          : "يرجى ربط حسابك البنكي بـ Stripe أولاً.",
      });
    }

    const amountToPayout = companion.walletBalance || 0;
    if (amountToPayout <= 0) {
      return res.status(400).json({
        status: "fail",
        message: lang === "en" ? "No earnings available for payout." : "لا يوجد عوائد متاحة للسحب حالياً.",
      });
    }

    // Deduct balance and trigger transfer
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      companion.walletBalance = 0;
      await companion.save({ session, validateBeforeSave: false });

      const transactionId = "payout_" + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      // Perform Stripe transfer
      await stripeService.releasePayoutToCompanion(companion.stripeConnectId, amountToPayout, "egp");

      // Record transaction
      await WalletTransaction.create([{
        userId: req.user._id,
        amount: -amountToPayout,
        type: "payout",
        status: "completed",
        transactionId,
        descriptionAr: "سحب الأرباح تلقائياً للحساب البنكي عبر Stripe",
        descriptionEn: "Automatic bank payout via Stripe Connect",
      }], { session });

      await session.commitTransaction();

      return res.status(200).json({
        status: "success",
        message: lang === "en"
          ? `Payout of $${amountToPayout.toFixed(2)} initiated successfully to your bank account.`
          : `تم تحويل مبلغ $${amountToPayout.toFixed(2)} بنجاح لحسابك البنكي.`,
        data: {
          amount: amountToPayout,
        },
      });

    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error("Error processing companion payout:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message,
    });
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
  settleCompanionDebt,
  connectCompanionStripe,
  requestCompanionPayout,
};
