"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "../../../lib/services/api";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  CreditCard,
  History,
  TrendingUp,
  ShieldCheck,
  X
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Initialize Stripe Publishable Key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_51Pxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
);

interface Transaction {
  _id: string;
  type: "deposit" | "payment" | "refund" | "payout";
  amount: number;
  createdAt: string;
  descriptionAr: string;
  descriptionEn: string;
  status: "pending" | "completed" | "failed";
  bookingId?: {
    _id: string;
    status: "pending" | "pending_payment" | "approved" | "active" | "completed" | "cancelled";
    startDate: string;
    endDate: string;
    companionId: {
      _id: string;
      name: string;
      avatar?: any;
    } | null;
    jobPostId: {
      _id: string;
      title: string;
    } | null;
    schedule?: Array<{
      _id: string;
      date: string;
      startTime: string;
      endTime: string;
      checkOutTime?: string | null;
      payoutReleased?: boolean;
      payoutAmount?: number;
    }> | null;
  } | null;
}

function StripeChargeForm({
  onSuccess,
  onClose,
  isRtl,
  t,
  prefilledAmount,
  bookingId,
}: {
  onSuccess: (amount: number) => void;
  onClose: () => void;
  isRtl: boolean;
  t: any;
  prefilledAmount?: string;
  bookingId?: string | null;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [chargeAmount, setChargeAmount] = useState(prefilledAmount || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const amountNum = Number(chargeAmount);
    if (!chargeAmount || amountNum <= 0) {
      setError(isRtl ? "يرجى إدخال مبلغ صحيح لشحن الرصيد" : "Please enter a valid amount");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 1. Create PaymentIntent in backend
      const res = await api.post("/family/wallet/topup", { amount: amountNum, bookingId: bookingId || undefined });
      const { clientSecret } = res.data?.data || {};

      if (!clientSecret) {
        throw new Error("Failed to initialize payment gateway session");
      }

      // 2. Confirm card payment with Stripe Elements
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;

      const stripeResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (stripeResult.error) {
        throw new Error(stripeResult.error.message || "Payment verification failed");
      }

      if (stripeResult.paymentIntent?.status === "succeeded") {
        setSuccess(true);
        setTimeout(() => {
          onSuccess(amountNum);
        }, 1500);
      } else {
        throw new Error("Payment was not authorized");
      }
    } catch (err: any) {
      console.error("Top-up processing error:", err);
      setError(err.response?.data?.message || err.message || "Failed to process card payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {success ? (
        <div className="py-8 text-center space-y-3">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-[#1b1c1c]">
            {isRtl ? "تمت عملية الشحن بنجاح!" : "Wallet Charged Successfully!"}
          </h3>
          <p className="text-xs text-[#3e4949]/70">
            {isRtl ? "سيتم تحديث رصيدك بالكامل خلال لحظات." : "Your balance is being updated."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#3e4949]" htmlFor="charge_amount">
              {t("chargeAmount")} ({t("egp")}) <span className="text-rose-500">*</span>
            </label>
            <input
              id="charge_amount"
              type="number"
              min={10}
              value={chargeAmount}
              onChange={(e) => setChargeAmount(e.target.value)}
              placeholder="100.00"
              required
              disabled={submitting || !!bookingId}
              className="w-full h-12 bg-[#f6f3f2]/50 border border-[#bdc9c8] rounded-2xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all font-bold"
            />
          </div>

          {/* Card element from Stripe */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#3e4949]">
              {t("cardNumber")} & {t("expiryDate")} & {t("cvv")} <span className="text-rose-500">*</span>
            </label>
            <div className="w-full bg-[#f6f3f2]/50 border border-[#bdc9c8] rounded-2xl p-4 min-h-[48px] focus-within:ring-2 focus-within:ring-[#1f8a8a]/20 focus-within:border-[#1f8a8a] transition-all">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "14px",
                      color: "#1b1c1c",
                      "::placeholder": {
                        color: "#3e4949a0",
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-[#eae7e7]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-3 bg-[#f6f3f2] hover:bg-[#bdc9c8]/25 text-[#3e4949] font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={submitting || !stripe}
              className="px-6 py-3 bg-[#1f8a8a] hover:bg-[#0d8282] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {t("confirmPayment")}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

export default function FamilyWalletDashboard() {
  const t = useTranslations("wallet");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const searchParams = useSearchParams();
  const router = useRouter();
  const amountParam = searchParams ? searchParams.get("amount") : null;
  const bookingIdParam = searchParams ? searchParams.get("bookingId") : null;

  const [balance, setBalance] = useState<number>(0);
  const [heldBalance, setHeldBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showChargeModal, setShowChargeModal] = useState(false);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletRes, txnsRes] = await Promise.all([
        api.get("/family/wallet"),
        api.get("/family/wallet/transactions")
      ]);

      if (walletRes.data?.data) {
        setBalance(walletRes.data.data.walletBalance || 0);
        setHeldBalance(walletRes.data.data.heldBalance || 0);
      }
      if (txnsRes.data?.data?.transactions) {
        setTransactions(txnsRes.data.data.transactions);
      }
    } catch (err) {
      console.error("Error fetching wallet balance or transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    if (amountParam && bookingIdParam) {
      setShowChargeModal(true);
    }
  }, [amountParam, bookingIdParam]);

  const handleChargeSuccess = async (amount: number) => {
    setShowChargeModal(false);
    await fetchWalletData();
    if (bookingIdParam) {
      router.push(`/family/bookings/${bookingIdParam}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-[#1f8a8a] animate-spin mb-4" />
        <p className="text-[#3e4949] font-medium">{isRtl ? "جاري تحميل محفظتك الرقمية..." : "Loading digital wallet..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand text-[#1b1c1c] pb-16" dir={isRtl ? "rtl" : "ltr"}>
      {/* Upper Header Banner */}
      <div className={`${isRtl ? "bg-gradient-to-l" : "bg-gradient-to-r"} from-[#006767] via-[#1f8a8a] to-[#aeedd5]/50 text-white py-12 px-6 shadow-md relative overflow-hidden`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className={`space-y-2 ${isRtl ? "text-right" : "text-left"}`}>
            <span className="bg-white/20 text-[#aeedd5] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md">
              {isRtl ? "المدفوعات الآمنة عبر Stripe" : "Secure Payments via Stripe"}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold font-stitch-display">{t("title")}</h1>
            <p className="text-white/80 text-sm max-w-xl">{t("subtitle")}</p>
          </div>
        </div>
        <div className="absolute -bottom-8 -right-8 w-44 h-44 rounded-full bg-white/10" />
        <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-white/10" />
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Balance card & quick options */}
          <div className="lg:col-span-4 space-y-6">
            <div className="relative rounded-3xl overflow-hidden shadow-soft border border-[#eae7e7] bg-white p-6 md:p-8 space-y-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#aeedd5]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1f8a8a]/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[#1f8a8a]" />
                </div>
                <h3 className="font-bold text-[#1b1c1c] text-sm uppercase tracking-wider">{t("currentBalance")}</h3>
              </div>

              <div>
                <div className="text-3xl md:text-4xl font-bold text-[#1f8a8a] tracking-tight font-stitch-display">
                  {balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-semibold">{t("egp")}</span>
                </div>
                <p className="text-xs text-[#3e4949]/70 mt-1">
                  {isRtl ? "رصيدك جاهز للاستخدام الفوري لطلب الخدمات" : "Available balance for immediate booking escrow"}
                </p>
              </div>

              <button
                onClick={() => setShowChargeModal(true)}
                className="w-full h-14 bg-[#1f8a8a] hover:bg-[#0d8282] text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                {t("addFunds")}
              </button>
            </div>

            {/* Held Escrow Balance Card */}
            <div className="relative rounded-3xl overflow-hidden shadow-soft border border-[#eae7e7] bg-white p-6 md:p-8 space-y-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-550/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-amber-600 animate-pulse" />
                </div>
                <h3 className="font-bold text-[#1b1c1c] text-sm uppercase tracking-wider">
                  {isRtl ? "الرصيد المحجوز" : "Held Balance (Escrow)"}
                </h3>
              </div>

              <div>
                <div className="text-3xl md:text-4xl font-bold text-amber-650 tracking-tight font-stitch-display">
                  {heldBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-semibold">{t("egp")}</span>
                </div>
                <p className="text-xs text-[#3e4949]/70 mt-1">
                  {isRtl 
                    ? "المبالغ المحجوزة للخدمات القائمة وتحت التنفيذ حالياً" 
                    : "Funds locked securely for active/approved bookings"}
                </p>
              </div>
            </div>
          </div>

          {/* Transactions list */}
          <div className="lg:col-span-8 bg-white border border-[#eae7e7] shadow-soft rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-[#eae7e7]">
              <History className="w-5 h-5 text-[#1f8a8a]" />
              <h3 className="font-bold text-[#1b1c1c] text-base">{t("paymentHistory")}</h3>
            </div>

            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((txn) => {
                  const dateStr = new Date(txn.createdAt).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const isDeposit = txn.type === "deposit" || txn.type === "refund";
                  const statusColors = {
                    completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
                    pending: "bg-amber-50 text-amber-700 border-amber-100",
                    failed: "bg-rose-50 text-rose-700 border-rose-100",
                  };

                  const displayDescription = txn.bookingId?.jobPostId?.title
                    ? (isRtl ? `دفع لحجز الطلب: ${txn.bookingId.jobPostId.title}` : `Payment for: ${txn.bookingId.jobPostId.title}`)
                    : (isRtl ? txn.descriptionAr : txn.descriptionEn);

                  let subDetailText = "";
                  if (txn.bookingId) {
                    const companionName = txn.bookingId.companionId?.name;
                    const schedule = txn.bookingId.schedule || [];
                    const releasedAmount = schedule
                      .filter((slot: any) => slot.payoutReleased)
                      .reduce((sum: number, slot: any) => sum + (slot.payoutAmount || 0), 0);
                    const totalShifts = schedule.length;
                    const completedShifts = schedule.filter((slot: any) => slot.checkOutTime).length;

                    if (txn.bookingId.status === "completed" || (releasedAmount > 0 && releasedAmount >= Math.abs(txn.amount))) {
                      subDetailText = isRtl 
                        ? `تم تحويل كامل المبلغ للمرافق: ${companionName || "المرافق"}` 
                        : `Fully released to companion: ${companionName || "Companion"}`;
                    } else if (txn.bookingId.status === "cancelled") {
                      subDetailText = isRtl ? "تم الإلغاء والاسترداد" : "Cancelled & refunded";
                    } else if (releasedAmount > 0) {
                      subDetailText = isRtl 
                        ? `تم تحويل ${releasedAmount.toFixed(0)} ج.م للمرافق (${completedShifts}/${totalShifts} زيارات)` 
                        : `${releasedAmount.toFixed(0)} EGP released to companion (${completedShifts}/${totalShifts} visits)`;
                    } else {
                      subDetailText = isRtl 
                        ? `محجوز بالكامل في الضمان (المرافق: ${companionName || "مجدول"})` 
                        : `Fully held in escrow (Companion: ${companionName || "Scheduled"})`;
                    }
                  }

                  return (
                    <div
                      key={txn._id}
                      className="flex items-center justify-between p-4 bg-[#fbfaf7] border border-[#eae7e7] rounded-2xl hover:shadow-soft transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isDeposit ? "bg-emerald-50 text-emerald-600" : "bg-[#1f8a8a]/10 text-[#1f8a8a]"
                          }`}
                        >
                          {isDeposit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div className="space-y-0.5 text-right">
                          <h4 className="font-bold text-[#1b1c1c] text-sm">
                            {displayDescription}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#3e4949]/70">
                            <span>{dateStr}</span>
                            <span className="text-[#eae7e7]">|</span>
                            <span className={`px-1.5 py-0.5 rounded border text-[10px] uppercase font-bold ${
                              txn.bookingId?.status === "cancelled"
                                ? "bg-rose-50 text-rose-700 border-rose-100"
                                : statusColors[txn.status]
                            }`}>
                              {txn.bookingId?.status === "cancelled"
                                ? isRtl
                                  ? "مسترد / ملغي"
                                  : "REFUNDED"
                                : isRtl
                                  ? txn.status === "completed"
                                    ? "مكتمل"
                                    : txn.status === "failed"
                                      ? "فشل"
                                      : "قيد الانتظار"
                                  : txn.status}
                            </span>
                            {subDetailText && (
                              <>
                                <span className="text-[#eae7e7]">|</span>
                                <span className={`font-semibold text-[10px] ${
                                  txn.bookingId?.status === "completed"
                                    ? "text-emerald-700"
                                    : txn.bookingId?.status === "cancelled"
                                    ? "text-rose-700 font-bold"
                                    : "text-amber-700"
                                }`}>
                                  {subDetailText}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`font-mono font-bold text-sm ${isDeposit ? "text-emerald-600" : "text-[#1b1c1c]"}`}>
                        {isDeposit ? "+" : "-"} {Math.abs(txn.amount).toFixed(2)} {t("egp")}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-[#3e4949]/50 text-sm bg-[#fbfaf7]/50 border border-dashed border-[#eae7e7] rounded-3xl space-y-2">
                <Wallet className="w-12 h-12 mx-auto text-[#bdc9c8] opacity-50" />
                <p>{isRtl ? "لا توجد أي معاملات سابقة بعد." : "No transactions recorded yet."}</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Charge Wallet Modal */}
      {showChargeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-[#eae7e7] w-full max-w-md rounded-3xl p-6 md:p-8 space-y-6 shadow-premium relative">
            <div className="flex items-center justify-between border-b border-[#eae7e7] pb-4">
              <h3 className="text-lg font-bold text-[#1b1c1c] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#1f8a8a]" />
                {isRtl ? "شحن رصيد المحفظة عبر Stripe" : "Secure Wallet Recharge"}
              </h3>
              <button
                onClick={() => setShowChargeModal(false)}
                className="p-1 hover:bg-[#f6f3f2] rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5 text-[#3e4949]" />
              </button>
            </div>

            <Elements stripe={stripePromise}>
              <StripeChargeForm
                onSuccess={handleChargeSuccess}
                onClose={() => setShowChargeModal(false)}
                isRtl={isRtl}
                t={t}
                prefilledAmount={amountParam || undefined}
                bookingId={bookingIdParam}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
}
