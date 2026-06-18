const express = require("express");
const router = express.Router();
const { 
  initiatePayment, 
  handlePaymentWebhook, 
  handlePaymentFailure,
  refundBooking, 
  releasePayout,
  getCompanionDebtLedger,
  getMyPayments, 
  getAdminPayments 
} = require("../controllers/paymentController");
const { authenticate } = require("../middleware/authMiddleware");
const { isAdmin, isFamily, isCompanion } = require("../middleware/RoleMiddleware");

router.use(authenticate);

// ============================================================================
// SCENARIO 1: Initiate Payment (بدء عملية الدفع)
// ============================================================================
router.post("/:id/initiate", isFamily, initiatePayment);

// ============================================================================
// SCENARIO 1: Payment Success Webhook (استقبال تأكيد نجاح الدفع من البوابة)
// ============================================================================
router.post("/webhook/success", handlePaymentWebhook);

// ============================================================================
// SCENARIO 2: Payment Failure Webhook (استقبال فشل الدفع من البوابة)
// ============================================================================
router.post("/webhook/failure", handlePaymentFailure);

// ============================================================================
// SCENARIO 3: Refund Booking (إلغاء واسترجاع الحجز والمبلغ)
// ============================================================================
router.post("/:id/refund", isFamily, refundBooking);

// ============================================================================
// SCENARIO 4: Release Payout (صرف الأرباح للمرافق بعد انتهاء الخدمة)
// ============================================================================
router.post("/:id/release", isAdmin, releasePayout);

// ============================================================================
// SCENARIO 5: Get Companion Debt Ledger (الاستعلام عن ديون المرافق)
// ============================================================================
router.get("/companion/debt", isCompanion, getCompanionDebtLedger);

// Family/Companion get their own payments
router.get("/me", getMyPayments);

// Admin gets all payments/statistics
router.get("/admin", isAdmin, getAdminPayments);

module.exports = router;
