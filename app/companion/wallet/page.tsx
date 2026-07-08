"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "../../../lib/services/api";
import { useTranslations, useLocale } from "next-intl";
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Send,
  Link2,
  History,
  X,
  BadgeDollarSign,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface WalletTransaction {
  _id: string;
  type: "payout" | "debt" | "refund" | "deposit";
  amount: number;
  status: "completed" | "pending" | "failed";
  createdAt: string;
  descriptionAr: string;
  descriptionEn: string;
  transactionId?: string;
  bookingId?: {
    _id: string;
    jobPostId?: { title: string } | null;
  } | null;
}

// ─── Payout Modal ────────────────────────────────────────────────────────────
function PayoutModal({
  availableBalance,
  onClose,
  onSuccess,
}: {
  availableBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("companionWallet");
  const [amount, setAmount] = useState(availableBalance.toFixed(2));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const amountNum = parseFloat(amount) || 0;
  const isValidAmount = amountNum > 0 && amountNum <= availableBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount) return;
    try {
      setSubmitting(true);
      setError(null);
      await api.post("/payments/companion/payout", { amount: amountNum });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1800);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || t("modalTitle")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-stitch-outline/10 w-full max-w-md rounded-3xl p-6 md:p-8 space-y-6 shadow-premium relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stitch-outline/10 pb-4">
          <h3 className="text-lg font-bold text-stitch-on-surface flex items-center gap-2">
            <BadgeDollarSign className="w-5 h-5 text-stitch-primary" />
            {t("modalTitle")}
          </h3>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 hover:bg-sand-low rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5 text-stitch-on-surface-variant" />
          </button>
        </div>

        {success ? (
          <div className="py-10 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-stitch-on-surface">
              {t("modalSuccessTitle")}
            </h3>
            <p className="text-sm text-stitch-on-surface-variant/70">
              {t("modalSuccessDesc")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
            {/* Available balance info */}
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-stitch-on-surface-variant">
                {t("modalAvailable")}
              </span>
              <span className="text-lg font-black text-stitch-primary font-mono">
                EGP {availableBalance.toFixed(2)}
              </span>
            </div>

            {/* Amount input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stitch-on-surface-variant block">
                {t("modalAmountLabel")}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={availableBalance}
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError(null);
                  }}
                  placeholder="0.00"
                  required
                  disabled={submitting}
                  className="flex-1 h-12 bg-sand-low border border-stitch-outline/30 rounded-2xl px-4 text-sm font-bold text-stitch-on-surface focus:ring-2 focus:ring-stitch-primary/20 focus:border-stitch-primary outline-none transition-all text-left"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setAmount(availableBalance.toFixed(2))}
                  disabled={submitting}
                  className="px-4 h-12 bg-stitch-primary/10 hover:bg-stitch-primary/15 text-stitch-primary font-bold text-xs rounded-2xl transition-all whitespace-nowrap border border-stitch-primary/20 cursor-pointer disabled:opacity-50"
                >
                  {t("modalWithdrawAll")}
                </button>
              </div>
              {amountNum > availableBalance && (
                <p className="text-xs text-rose-500 font-semibold">
                  المبلغ المدخل يتجاوز رصيدك المتاح
                </p>
              )}
            </div>

            {/* Warning note */}
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                سيتم تحويل المبلغ المحدد لحسابك البنكي المرتبط عبر Stripe. قد
                تستغرق العملية 1–3 أيام عمل.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-xs text-rose-700">{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2 border-t border-stitch-outline/10">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-5 py-3 bg-sand-low hover:bg-sand-high text-stitch-on-surface font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 transition-all"
              >
                {t("modalCancel")}
              </button>
              <button
                type="submit"
                disabled={submitting || !isValidAmount}
                className="px-6 py-3 bg-stitch-primary hover:bg-stitch-primary/90 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {submitting ? t("modalSubmitting") : t("modalConfirm")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Main page content ───────────────────────────────────────────────────────
function WalletContent() {
  const t = useTranslations("companionWallet");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  // Wallet data
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeTransfersActive, setStripeTransfersActive] = useState(false);
  const [stripeOnboardingIncomplete, setStripeOnboardingIncomplete] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  // Alert from sidebar redirect
  const stripeSetup = searchParams.get("stripe_setup");

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [debtRes, txnsRes] = await Promise.all([
        api.get("/payments/companion/debt"),
        api.get("/payments/me?limit=50"),
      ]);

      if (debtRes.data?.data) {
        const d = debtRes.data.data;
        setWalletBalance(d.walletBalance || 0);
        setStripeConnected(!!d.stripeConnectId);
        setStripeTransfersActive(!!d.stripeTransfersActive);
        setStripeOnboardingIncomplete(!!d.stripeOnboardingIncomplete);
      }

      // Collect transactions from both possible shapes
      let txns: WalletTransaction[] = [];
      const txData = txnsRes.data?.data;
      if (txData?.payments) txns = txData.payments;
      else if (txData?.bookings) txns = txData.bookings;
      else if (Array.isArray(txData)) txns = txData;

      setTransactions(txns);

      // Sum completed payout (bank withdrawals) from transaction list
      const withdrawn = txns
        .filter((t) => t.type === "payout" && t.status === "completed" && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      setTotalWithdrawn(withdrawn);
    } catch (err: any) {
      console.error("Failed to load wallet data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    if (stripeSetup === "success") {
      setActionSuccess(t("stripeSetupSuccess"));
      const url = new URL(window.location.href);
      url.searchParams.delete("stripe_setup");
      router.replace(url.pathname);
    } else if (stripeSetup === "refresh") {
      setActionError(t("stripeSetupCancelled"));
      const url = new URL(window.location.href);
      url.searchParams.delete("stripe_setup");
      router.replace(url.pathname);
    }
  }, [stripeSetup, router]);

  const handleConnectStripe = async () => {
    try {
      setSubmitting(true);
      setActionError(null);
      const res = await api.post("/payments/companion/stripe-connect");
      if (res.data?.data?.url) {
        window.location.href = res.data.data.url;
      } else {
        throw new Error("Failed to generate onboarding URL.");
      }
    } catch (err: any) {
      setActionError(
        err.response?.data?.message || err.message || "فشل في تفعيل ربط الحساب البنكي."
      );
      setSubmitting(false);
    }
  };

  const handleManageStripe = async () => {
    try {
      setSubmitting(true);
      setActionError(null);
      const res = await api.post("/payments/companion/stripe-login");
      if (res.data?.data?.url) {
        window.location.href = res.data.data.url;
      } else {
        throw new Error("Failed to generate dashboard login URL.");
      }
    } catch (err: any) {
      setActionError(
        err.response?.data?.message || err.message || "فشل في فتح لوحة تحكم البنك."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayoutSuccess = async () => {
    setShowPayoutModal(false);
    setActionSuccess(t("modalSuccessTitle"));
    await fetchWalletData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-stitch-primary animate-spin mb-4" />
        <p className="text-stitch-on-surface-variant/80 font-medium">
          {t("loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand text-stitch-on-surface pb-16" dir="rtl">

      {/* ─── Banner Header ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-l from-[#006767] via-[#1f8a8a] to-[#aeedd5]/50 text-white py-12 px-6 shadow-md relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-right">
            <span className="bg-white/20 text-[#aeedd5] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md">
              {t("headerBadge")}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold font-stitch-display">
              {t("headerTitle")}
            </h1>
            <p className="text-white/80 text-sm max-w-xl">
              {t("headerSubtitle")}
            </p>
          </div>
        </div>
        <div className="absolute -bottom-8 -left-8 w-44 h-44 rounded-full bg-white/10" />
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/10" />
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8 space-y-6">

        {/* ─── System Alerts ──────────────────────────────────────────────── */}

        {actionError && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-650 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="ms-auto cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {actionSuccess && (
          <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl text-stitch-primary text-sm flex items-start gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{actionSuccess}</span>
            <button onClick={() => setActionSuccess(null)} className="ms-auto cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ─── Main Grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Balance cards + action */}
          <div className="lg:col-span-4 space-y-6">

            {/* Card 1: Available Balance */}
            <div className="relative rounded-3xl overflow-hidden shadow-soft border border-stitch-outline/10 bg-white p-6 md:p-8 space-y-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-stitch-primary/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stitch-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-stitch-primary" />
                </div>
                <h3 className="font-bold text-stitch-on-surface text-sm uppercase tracking-wider">
                  {t("availableBalance")}
                </h3>
              </div>

              <div>
                <div className="text-3xl md:text-4xl font-bold text-stitch-primary tracking-tight font-stitch-display">
                  {walletBalance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  <span className="text-sm font-semibold">EGP</span>
                </div>
                <p className="text-xs text-stitch-on-surface-variant/70 mt-1">
                  {t("pendingDesc")}
                </p>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                {!stripeConnected ? (
                  // State 1: No Stripe account yet
                  <>
                    <button
                      onClick={handleConnectStripe}
                      disabled={submitting}
                      className="w-full h-14 bg-[#1f8a8a] hover:bg-[#0d8282] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Link2 className="w-5 h-5" />
                      )}
                      {t("linkBankBtn")}
                    </button>
                    <p className="text-xs text-stitch-on-surface-variant/50 text-center">
                      {t("incompleteSetupDesc")}
                    </p>
                  </>
                ) : !stripeTransfersActive ? (
                  // State 2: Account created but onboarding not complete
                  <>
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-amber-800">
                            {t("incompleteSetupAlert")}
                          </p>
                          <p className="text-xs text-amber-700/80 leading-relaxed">
                            {t("incompleteSetupDesc")}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleConnectStripe}
                        disabled={submitting}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Link2 className="w-4 h-4" />
                        )}
                        {t("completeBankSetupBtn")}
                      </button>
                    </div>
                    <button
                      onClick={handleManageStripe}
                      disabled={submitting}
                      className="w-full h-12 bg-sand-low hover:bg-sand-high text-stitch-on-surface border border-stitch-outline/20 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Link2 className="w-4 h-4 text-stitch-primary" />
                      )}
                      {t("manageBankBtn")}
                    </button>
                  </>
                ) : (
                  // State 3: Fully active — can withdraw
                  <>
                    <button
                      onClick={() => setShowPayoutModal(true)}
                      disabled={walletBalance <= 0 || submitting}
                      className="w-full h-14 bg-stitch-primary hover:bg-stitch-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-5 h-5" />
                      {t("payoutBtn")}
                    </button>
                    <button
                      onClick={handleManageStripe}
                      disabled={submitting}
                      className="w-full h-12 bg-sand-low hover:bg-sand-high text-stitch-on-surface border border-stitch-outline/20 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Link2 className="w-4 h-4 text-stitch-primary" />
                      )}
                      {t("manageBankBtn")}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Card 2: Total Withdrawn */}
            <div className="relative rounded-3xl overflow-hidden shadow-soft border border-stitch-outline/10 bg-white p-6 md:p-8 space-y-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-stitch-on-surface text-sm uppercase tracking-wider">
                  {t("totalWithdrawn")}
                </h3>
              </div>

              <div>
                <div className="text-3xl md:text-4xl font-bold text-emerald-600 tracking-tight font-stitch-display">
                  {totalWithdrawn.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  <span className="text-sm font-semibold">EGP</span>
                </div>
                <p className="text-xs text-stitch-on-surface-variant/70 mt-1">
                  {t("pendingDesc")}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Transaction History */}
          <div className="lg:col-span-8 bg-white border border-stitch-outline/10 shadow-soft rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-stitch-outline/10">
              <History className="w-5 h-5 text-stitch-primary" />
              <h3 className="font-bold text-stitch-on-surface text-base">
                {t("paymentHistoryTitle")}
              </h3>
            </div>

            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((txn, idx) => {
                  const isIncoming = txn.amount > 0;
                  const dateStr = new Date(txn.createdAt).toLocaleDateString(
                    locale === "ar" ? "ar-EG" : "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );

                  const statusColors: Record<string, string> = {
                    completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
                    pending: "bg-amber-50 text-amber-700 border-amber-100",
                    failed: "bg-rose-50 text-rose-700 border-rose-100",
                  };

                  const typeLabels: Record<string, string> = {
                    payout: isIncoming ? t("transactionTypeDeposit") : t("transactionTypePayout"),
                    debt: t("transactionTypeDebt"),
                    refund: t("transactionTypeRefund"),
                    deposit: t("transactionTypeDeposit"),
                  };

                  const statusLabel =
                    txn.status === "completed"
                      ? t("statusCompleted")
                      : txn.status === "pending"
                        ? t("statusPending")
                        : t("statusFailed");

                  const description =
                    locale === "ar"
                      ? txn.descriptionAr || typeLabels[txn.type] || txn.type
                      : txn.descriptionEn || typeLabels[txn.type] || txn.type;

                  return (
                    <div
                      key={txn._id || idx}
                      className="flex items-center justify-between p-4 bg-sand/30 border border-stitch-outline/10 rounded-2xl hover:shadow-soft transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isIncoming
                              ? "bg-stitch-primary/10 text-stitch-primary"
                              : "bg-sand-high text-stitch-on-surface-variant"
                          }`}
                        >
                          {isIncoming ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div className="space-y-0.5 text-right">
                          <h4 className="font-bold text-stitch-on-surface text-sm">
                            {description}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-stitch-on-surface-variant/70">
                            <span className="font-mono">{dateStr}</span>
                            <span className="text-stitch-outline/40">|</span>
                            <span
                              className={`px-1.5 py-0.5 rounded border text-[10px] uppercase font-bold ${
                                statusColors[txn.status] ||
                                "bg-sand-low text-stitch-on-surface-variant border-stitch-outline/20"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`font-mono font-bold text-sm whitespace-nowrap ${
                          isIncoming ? "text-stitch-primary" : "text-stitch-on-surface"
                        }`}
                      >
                        {isIncoming ? "+" : "-"} {Math.abs(txn.amount).toFixed(2)} EGP
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-stitch-on-surface-variant/50 text-sm bg-sand/30 border border-dashed border-stitch-outline/20 rounded-3xl space-y-3">
                <Wallet className="w-12 h-12 mx-auto text-stitch-outline/40" />
                <p>{t("noTransactions")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Payout Modal ──────────────────────────────────────────────────── */}
      {showPayoutModal && (
        <PayoutModal
          availableBalance={walletBalance}
          onClose={() => setShowPayoutModal(false)}
          onSuccess={handlePayoutSuccess}
        />
      )}
    </div>
  );
}

// ─── Page wrapper with Suspense ──────────────────────────────────────────────
export default function CompanionWallet() {
  const t = useTranslations("companionWallet");
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-6">
          <Loader2 className="w-12 h-12 text-stitch-primary animate-spin mb-4" />
          <p className="text-stitch-on-surface-variant/80 font-medium">
            {t("loading")}
          </p>
        </div>
      }
    >
      <WalletContent />
    </Suspense>
  );
}
