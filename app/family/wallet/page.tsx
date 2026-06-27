"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
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
  Lock
} from "lucide-react";

interface Transaction {
  id: string;
  type: "deposit" | "payment" | "refund";
  amount: number;
  date: Date;
  descriptionAr: string;
  descriptionEn: string;
  status: "success" | "pending" | "failed";
}

export default function FamilyWalletDashboard() {
  const t = useTranslations("wallet");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [balance, setBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "TXN_001",
      type: "refund",
      amount: 150,
      date: new Date(Date.now() - 3600 * 24 * 1000 * 3), // 3 days ago
      descriptionAr: "مبلغ مسترد لإلغاء زيارة",
      descriptionEn: "Refund for cancelled visit",
      status: "success"
    },
    {
      id: "TXN_002",
      type: "payment",
      amount: 440,
      date: new Date(Date.now() - 3600 * 24 * 1000 * 5), // 5 days ago
      descriptionAr: "دفع مقابل حجز رعاية منزلية",
      descriptionEn: "Payment for home care booking",
      status: "success"
    },
    {
      id: "TXN_003",
      type: "deposit",
      amount: 1000,
      date: new Date(Date.now() - 3600 * 24 * 1000 * 8), // 8 days ago
      descriptionAr: "شحن رصيد المحفظة عبر بطاقة مدى",
      descriptionEn: "Wallet recharge via Mada card",
      status: "success"
    }
  ]);

  // Charging Modal state
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeAmount, setChargeAmount] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  
  const [submittingCharge, setSubmittingCharge] = useState(false);
  const [chargeSuccess, setChargeSuccess] = useState(false);
  const [chargeError, setChargeError] = useState<string | null>(null);

  const fetchWalletBalance = async () => {
    try {
      setLoadingBalance(true);
      const res = await api.get("/family/wallet");
      if (res.data?.data) {
        setBalance(res.data.data.walletBalance || 0);
      }
    } catch (err) {
      console.error("Error fetching wallet balance:", err);
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const handleChargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeAmount || Number(chargeAmount) <= 0) {
      setChargeError(isRtl ? "يرجى إدخال مبلغ صحيح لشحن الرصيد" : "Please enter a valid amount");
      return;
    }
    if (!cardNumber || cardNumber.length < 15) {
      setChargeError(isRtl ? "يرجى إدخال رقم بطاقة صحيح" : "Please enter a valid card number");
      return;
    }

    try {
      setSubmittingCharge(true);
      setChargeError(null);
      const amountNum = Number(chargeAmount);

      const res = await api.post("/family/wallet/topup", { amount: amountNum });
      if (res.data?.data) {
        setBalance(res.data.data.walletBalance);
        
        // Add to local transactions list
        const newTxn: Transaction = {
          id: `TXN_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          type: "deposit",
          amount: amountNum,
          date: new Date(),
          descriptionAr: "شحن رصيد المحفظة عبر بوابة الدفع الإلكتروني",
          descriptionEn: "Wallet recharge via secure checkout",
          status: "success"
        };
        setTransactions((prev) => [newTxn, ...prev]);
        setChargeSuccess(true);
        setTimeout(() => {
          setShowChargeModal(false);
          setChargeSuccess(false);
          setChargeAmount("");
          setCardNumber("");
          setCardExpiry("");
          setCardCvv("");
        }, 2000);
      }
    } catch (err: any) {
      setChargeError(err.response?.data?.message || err.message || "Failed to process charge");
    } finally {
      setSubmittingCharge(false);
    }
  };

  if (loadingBalance) {
    return (
      <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-[#1f8a8a] animate-spin mb-4" />
        <p className="text-[#3e4949] font-medium">{isRtl ? "جاري تحميل محفظتك الرقمية..." : "Loading digital wallet..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand text-[#1b1c1c] pb-16">
      {/* Upper Header Banner */}
      <div className="bg-gradient-to-r from-[#006767] via-[#1f8a8a] to-[#aeedd5]/50 text-white py-12 px-6 shadow-md relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="bg-white/20 text-[#aeedd5] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md">
              {isRtl ? "المدفوعات الآمنة" : "Secure Payments"}
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
                  {balance.toFixed(2)} <span className="text-sm font-semibold">{t("sar")}</span>
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

            {/* Quick security notice */}
            <div className="bg-[#f6f3f2]/60 border border-[#bdc9c8]/30 rounded-3xl p-5 flex items-start gap-3">
              <Lock className="w-5 h-5 text-[#1f8a8a] shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs text-[#3e4949]">
                <h4 className="font-bold">{isRtl ? "حماية وتشفير عالي" : "Highly encrypted escrow"}</h4>
                <p className="leading-relaxed">
                  {isRtl 
                    ? "تخضع محفظتك لسياسات أمان مشددة، ويتم حجز مبالغ طلبات العمل كضمان حتى الانتهاء من رعاية ذويكم."
                    : "Funds are securely locked in escrow and only released after companion service days are completed."}
                </p>
              </div>
            </div>
          </div>

          {/* Ledger History List */}
          <div className="lg:col-span-8 bg-white border border-[#eae7e7] rounded-3xl p-6 md:p-8 shadow-soft space-y-6">
            <div className="flex items-center gap-2 border-b border-[#bdc9c8]/20 pb-4">
              <History className="w-5 h-5 text-[#1f8a8a]" />
              <h2 className="text-lg font-bold text-[#1b1c1c]">{t("ledgerHistory")}</h2>
            </div>

            <div className="space-y-4">
              {transactions.map((txn) => {
                const isDeposit = txn.type === "deposit" || txn.type === "refund";
                
                return (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-4 bg-[#f6f3f2]/30 border border-[#bdc9c8]/20 rounded-2xl hover:bg-white hover:border-[#bdc9c8] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isDeposit 
                          ? "bg-emerald-50 text-emerald-600" 
                          : "bg-rose-50 text-rose-600"
                      }`}>
                        {isDeposit ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1b1c1c]">
                          {isRtl ? txn.descriptionAr : txn.descriptionEn}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#3e4949]/70">
                          <span>{txn.id}</span>
                          <span>•</span>
                          <span>{txn.date.toLocaleDateString(isRtl ? "ar-EG" : "en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-start md:text-end space-y-1">
                      <div className={`text-base font-bold font-stitch-display ${isDeposit ? "text-emerald-600" : "text-rose-600"}`}>
                        {isDeposit ? "+" : "-"}{txn.amount.toFixed(2)} {t("sar")}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        {t("success")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Charge Balance Modal (mock) */}
      {showChargeModal && (
        <div className="fixed inset-0 bg-[#1b1c1c]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleChargeSubmit}
            className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 shadow-soft relative animate-in fade-in zoom-in-95 duration-200"
          >
            <div>
              <h3 className="text-xl font-bold text-[#1f8a8a]">{t("addFunds")}</h3>
              <p className="text-xs text-[#3e4949] mt-1">
                {isRtl 
                  ? "اشحن محفظتك ببطاقة مدى أو الفيزا للتمكن من إرسال طلبات الرعاية فوراً." 
                  : "Top-up balance via our secured payment processor to post requests immediately."}
              </p>
            </div>

            {chargeError && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs flex items-start gap-2.5 shadow-soft">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                <span>{chargeError}</span>
              </div>
            )}

            {chargeSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-sm font-bold text-center flex flex-col items-center justify-center gap-2">
                <CheckCircle className="w-8 h-8 text-emerald-600 animate-bounce" />
                {t("walletCharged")}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Charge Amount */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#3e4949]" htmlFor="charge_amount">
                    {t("chargeAmount")} ({t("sar")}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="charge_amount"
                    type="number"
                    min={10}
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                    placeholder="100.00"
                    required
                    className="w-full h-12 bg-[#f6f3f2]/50 border border-[#bdc9c8] rounded-2xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all font-bold"
                  />
                </div>

                {/* Card Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#3e4949]" htmlFor="card_number">
                    {t("cardNumber")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#3e4949]/70">
                      credit_card
                    </span>
                    <input
                      id="card_number"
                      type="text"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setCardNumber(val);
                      }}
                      placeholder="4000 1234 5678 9010"
                      required
                      className="w-full h-12 bg-[#f6f3f2]/50 border border-[#bdc9c8] rounded-2xl pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Exp & CVV row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#3e4949]" htmlFor="card_expiry">
                      {t("expiryDate")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="card_expiry"
                      type="text"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      required
                      className="w-full h-12 bg-[#f6f3f2]/50 border border-[#bdc9c8] rounded-2xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all text-center font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#3e4949]" htmlFor="card_cvv">
                      {t("cvv")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="card_cvv"
                      type="password"
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setCardCvv(val);
                      }}
                      placeholder="***"
                      required
                      className="w-full h-12 bg-[#f6f3f2]/50 border border-[#bdc9c8] rounded-2xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all text-center font-mono"
                    />
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowChargeModal(false)}
                    className="px-5 py-3 bg-[#f6f3f2] hover:bg-[#bdc9c8]/25 text-[#3e4949] font-bold text-xs rounded-xl cursor-pointer"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCharge}
                    className="px-6 py-3 bg-[#1f8a8a] hover:bg-[#0d8282] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    {submittingCharge ? (
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
        </div>
      )}
    </div>
  );
}
