"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "../../../lib/services/api";
import { 
  Wallet, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  Send,
  ShieldAlert
} from "lucide-react";

function WalletContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  
  // Settle form inputs
  const [amount, setAmount] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  
  // Wallet metrics
  const [debtData, setDebtData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);

  // Alert from sidebar redirect
  const showNoShiftAlert = searchParams.get("noActiveShift") === "true";

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [debtRes, paymentsRes] = await Promise.all([
        api.get("/payments/companion/debt"),
        api.get("/payments/me?limit=20")
      ]);
      
      if (debtRes.data && debtRes.data.data) {
        setDebtData(debtRes.data.data);
      }
      if (paymentsRes.data && paymentsRes.data.data && paymentsRes.data.data.bookings) {
        setPayments(paymentsRes.data.data.bookings);
      } else if (paymentsRes.data && paymentsRes.data.data && paymentsRes.data.data.payments) {
        setPayments(paymentsRes.data.data.payments);
      } else if (paymentsRes.data && paymentsRes.data.data) {
        setPayments(paymentsRes.data.data);
      }
    } catch (err: any) {
      console.error("Failed to load wallet data:", err);
    } finally {
      setLoading(false);
    }
  };

  const stripeSetup = searchParams.get("stripe_setup");
  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    if (stripeSetup === "success") {
      setActionSuccess("تم ربط حسابك البنكي بـ Stripe بنجاح!");
      const url = new URL(window.location.href);
      url.searchParams.delete("stripe_setup");
      router.replace(url.pathname);
    } else if (stripeSetup === "refresh") {
      setActionError("انتهت صلاحية جلسة ربط الحساب. يرجى المحاولة مرة أخرى.");
      const url = new URL(window.location.href);
      url.searchParams.delete("stripe_setup");
      router.replace(url.pathname);
    }
  }, [stripeSetup, router]);

  const handleConnectStripe = async () => {
    try {
      setSubmitting(true);
      setActionError(null);
      setActionSuccess(null);
      const res = await api.post("/payments/companion/stripe-connect");
      if (res.data?.data?.url) {
        window.location.href = res.data.data.url;
      } else {
        throw new Error("Failed to generate onboarding URL.");
      }
    } catch (err: any) {
      console.error("Connect stripe error:", err);
      setActionError(err.response?.data?.message || err.message || "Failed to initiate onboarding.");
      setSubmitting(false);
    }
  };

  const handleRequestPayout = async () => {
    try {
      setSubmitting(true);
      setActionError(null);
      setActionSuccess(null);
      const res = await api.post("/payments/companion/payout");
      setActionSuccess(res.data?.message || "Payout processed successfully.");
      await fetchWalletData();
    } catch (err: any) {
      console.error("Payout request error:", err);
      setActionError(err.response?.data?.message || err.message || "Payout execution failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !transactionRef) return;
    
    try {
      setSubmitting(true);
      setActionError(null);
      setActionSuccess(null);
      
      const res = await api.post("/payments/companion/settle-debt", {
        amount: Number(amount),
        transactionRef
      });
      
      setActionSuccess(res.data?.message || "Submitted successfully.");
      setAmount("");
      setTransactionRef("");
      await fetchWalletData();
    } catch (err: any) {
      console.error("Settlement error:", err);
      setActionError(err.response?.data?.message || err.message || "Failed to submit reference.");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate earnings
  const availableEarnings = debtData?.walletBalance || 0;

  const pendingRelease = payments
    .filter(p => p.status === "pending" && p.companionId === debtData?.companionId)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalDebt = debtData?.totalDebt || 0;
  const isFrozenWarning = totalDebt >= 500;

  if (loading) {
    return (
      <div className="min-h-screen bg-sand text-stitch-on-surface flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-stitch-primary animate-spin mb-4" />
        <p className="text-stitch-on-surface-variant/80 font-medium">تحميل بيانات المحفظة والمدفوعات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-stitch-body p-4 text-right animate-fade-in" dir="rtl">
      
      {/* Alert if redirected due to no active shift */}
      {showNoShiftAlert && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-sm flex items-start space-x-3 space-x-reverse shadow-soft">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <div className="flex-1">
            <h4 className="font-bold">تنبيه النظام</h4>
            <p className="text-xs text-amber-800/80 mt-0.5">
              عذراً، ليس لديك أي مناوبة نشطة أو معتمدة حالياً للبدء فيها. تم تحويلك تلقائياً إلى صفحة المحفظة.
            </p>
          </div>
          <button 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete("noActiveShift");
              router.replace(url.pathname);
            }} 
            className="text-amber-700 hover:text-amber-900 font-bold text-xs self-center"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <span className="text-xs font-semibold text-stitch-primary uppercase tracking-widest block mb-1">البيانات المالية للمرافق</span>
        <h1 className="text-3xl font-stitch-display font-bold text-stitch-on-surface">محفظة العوائد والديون</h1>
      </div>

      {/* Freeze Warning */}
      {isFrozenWarning && (
        <div className="p-5 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4 text-red-600 shadow-soft">
          <ShieldAlert className="w-8 h-8 shrink-0 mt-0.5 text-red-500" />
          <div className="space-y-1">
            <h3 className="font-bold text-base">تحذير تجميد الحساب!</h3>
            <p className="text-xs text-red-650/80 leading-relaxed">
              لقد تجاوزت ديون المنصة الخاصة بك الحد المسموح به (500 جنيه مصري). يرجى سداد مستحقات المنصة لتجنب تجميد حسابك وحظر استقبال طلبات الرعاية الجديدة.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Available Earnings */}
        <div className="bg-white border border-stitch-outline/10 shadow-soft rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
          <div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-stitch-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-teal-50 rounded-2xl text-stitch-primary">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-stitch-primary bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">متاح للسحب</span>
            </div>
            <p className="text-xs text-stitch-on-surface-variant/80">إجمالي الأرباح المتاحة</p>
            <h2 className="text-3xl font-black text-stitch-on-surface mt-1 font-mono">EGP {availableEarnings.toFixed(2)}</h2>
          </div>

          <div className="mt-4 pt-3 border-t border-[#eae7e7]">
            {debtData?.stripeConnectId ? (
              <button
                onClick={handleRequestPayout}
                disabled={submitting || availableEarnings <= 0}
                className="w-full py-2.5 px-4 bg-stitch-primary text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stitch-primary/95 transition-all shadow-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>سحب الأرباح للحساب البنكي</span>
              </button>
            ) : (
              <button
                onClick={handleConnectStripe}
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-[#1f8a8a] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 hover:bg-[#0d8282] transition-all shadow-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                <span>ربط حساب البنك (Stripe)</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Platform Debt */}
        <div className={`border rounded-3xl p-6 relative overflow-hidden shadow-soft ${
          isFrozenWarning ? "bg-red-50/50 border-red-200" : "bg-white border-stitch-outline/10"
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${isFrozenWarning ? "bg-red-50 text-red-500" : "bg-sand-low text-stitch-on-surface-variant"}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              isFrozenWarning ? "bg-red-50 border-red-100 text-red-600" : "bg-sand-low border-stitch-outline/20 text-stitch-on-surface-variant"
            }`}>ديون المنصة</span>
          </div>
          <p className="text-xs text-stitch-on-surface-variant/80">مستحقات المنصة من الشفتات النقدية</p>
          <h2 className={`text-3xl font-black mt-1 font-mono ${isFrozenWarning ? "text-red-500" : "text-stitch-on-surface"}`}>EGP {totalDebt.toFixed(2)}</h2>
        </div>

        {/* Card 3: Next Scheduled Release */}
        <div className="bg-white border border-stitch-outline/10 shadow-soft rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-stitch-primary/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-teal-50 rounded-2xl text-stitch-primary">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-stitch-primary bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">أرباح معلقة</span>
          </div>
          <p className="text-xs text-stitch-on-surface-variant/80">عوائد قيد التأكيد (دفع إلكتروني)</p>
          <h2 className="text-3xl font-black text-stitch-on-surface mt-1 font-mono">EGP {pendingRelease.toFixed(2)}</h2>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Vodafone Cash Form */}
        <div className="lg:col-span-1 bg-white border border-stitch-outline/10 shadow-soft rounded-3xl p-6 md:p-8 space-y-6 h-fit">
          <div>
            <h3 className="text-lg font-bold text-stitch-on-surface">سداد رسوم ومستحقات المنصة</h3>
            <p className="text-xs text-stitch-on-surface-variant/80 mt-1 leading-relaxed">
              يرجى تحويل مبلغ السداد إلى محفظة فودافون كاش الرسمية للمنصة:
              <strong className="block text-stitch-primary font-mono text-sm mt-1">01012345678</strong>
              ثم قم بملء البيانات بالأسفل لتسجيل عملية السداد وتأكيدها.
            </p>
          </div>

          {actionError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl text-stitch-primary text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{actionSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSettleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stitch-on-surface-variant">مبلغ التحويل بالجنيه</label>
              <input 
                type="number" 
                required
                placeholder="مثال: 150"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full text-sm p-3 bg-sand-low border border-stitch-outline/30 focus:border-stitch-primary focus:ring-1 focus:ring-stitch-primary rounded-2xl outline-none text-stitch-on-surface placeholder-stitch-on-surface-variant/50 text-right"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stitch-on-surface-variant">رقم المعاملة / كود المرجع (Ref ID)</label>
              <input 
                type="text" 
                required
                placeholder="كود المعاملة المكون من أرقام وحروف"
                value={transactionRef}
                onChange={e => setTransactionRef(e.target.value)}
                className="w-full text-sm p-3 bg-sand-low border border-stitch-outline/30 focus:border-stitch-primary focus:ring-1 focus:ring-stitch-primary rounded-2xl outline-none text-stitch-on-surface placeholder-stitch-on-surface-variant/50 font-mono text-left"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !amount || !transactionRef}
              className="w-full py-3.5 bg-stitch-primary hover:bg-stitch-primary/95 text-white font-bold rounded-2xl shadow-soft hover:shadow-premium transition-all flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>تقديم إثبات التحويل</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Ledger Table */}
        <div className="lg:col-span-2 bg-white border border-stitch-outline/10 shadow-soft rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-stitch-on-surface">سجل المعاملات والديون</h3>
            <span className="text-xs text-stitch-on-surface-variant/50">آخر 20 معاملة</span>
          </div>

          <div className="overflow-x-auto">
            {debtData?.debtHistory && debtData.debtHistory.length > 0 ? (
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-stitch-outline/20 text-xs text-stitch-on-surface-variant/75 font-bold">
                    <th className="pb-3 pt-1">التاريخ</th>
                    <th className="pb-3 pt-1">السبب / الملاحظة</th>
                    <th className="pb-3 pt-1 text-left">القيمة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stitch-outline/10">
                  {debtData.debtHistory.map((item: any, idx: number) => {
                    const isPayment = item.amount < 0;
                    return (
                      <tr key={idx} className="text-xs text-stitch-on-surface-variant/90 hover:bg-sand-low/50">
                        <td className="py-4 font-mono">
                          {new Date(item.recordedAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-4">
                          {item.reason === "cash_payment_admin_fee" 
                            ? "خصم نسبة المنصة (حجز نقدي)" 
                            : item.reason.startsWith("vodafone_cash_settlement_pending")
                            ? `سداد مديونية معلق (بانتظار المراجعة)`
                            : item.reason}
                        </td>
                        <td className={`py-4 text-left font-bold font-mono ${isPayment ? "text-teal-650" : "text-red-500"}`}>
                          {isPayment ? "" : "+"}{item.amount.toFixed(2)} EGP
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-8 bg-sand-low rounded-2xl border border-dashed border-stitch-outline/20 text-center text-stitch-on-surface-variant/60 text-sm">
                لا توجد معاملات مسجلة في محفظتك حالياً.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

export default function CompanionWallet() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-sand text-stitch-on-surface flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-stitch-primary animate-spin mb-4" />
        <p className="text-stitch-on-surface-variant/80 font-medium">تحميل المحفظة...</p>
      </div>
    }>
      <WalletContent />
    </Suspense>
  );
}
