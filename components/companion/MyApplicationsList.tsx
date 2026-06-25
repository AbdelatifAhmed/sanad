"use client";

import React, { useState, useEffect } from "react";
import { getMyProposals, ProposalDetail } from "@/lib/api/proposal.api";
import ApplicationCard from "./ApplicationCard";
import { 
  Loader2, ChevronLeft, ChevronRight, X, Calendar, Clock, MapPin, 
  User, Coins, FileText, Briefcase, Award, CheckCircle2, AlertCircle, MessageSquare
} from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export default function MyApplicationsList() {
  const locale = useLocale();
  const router = useRouter();

  const [proposals, setProposals] = useState<ProposalDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(""); // "" represents "All"
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });
  const [selectedProposal, setSelectedProposal] = useState<ProposalDetail | null>(null);

  // Fetch companion proposals
  const fetchProposals = async () => {
    try {
      setLoading(true);
      const res = await getMyProposals({ 
        page, 
        limit: 6, 
        status: statusFilter || undefined 
      });
      if (res && res.data) {
        setProposals(res.data.proposals || []);
        setStats(res.data.stats || { total: 0, pending: 0, accepted: 0, rejected: 0 });
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error("Failed to load proposals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [page, statusFilter]);

  // Handle Tab Click
  const handleTabChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1); // Reset page to 1 on tab filter change
  };

  // Navigate to chat
  const handleMessageFamily = (familyId?: string) => {
    if (familyId) {
      router.push(`/companion/messages?chatWith=${familyId}`);
    } else {
      router.push(`/companion/messages`);
    }
  };

  // Helper translations mappings
  const t = {
    title: locale === "ar" ? "طلبات التقديم" : "My Applications",
    subtitle: locale === "ar" ? "تتبع وإدارة طلبات الرعاية التي قدمتها وتحديثات حالتها." : "Track and manage your submitted care applications and status updates.",
    totalApps: locale === "ar" ? "إجمالي الطلبات" : "Total Applications",
    pending: locale === "ar" ? "قيد الانتظار" : "Pending",
    accepted: locale === "ar" ? "مقبول" : "Accepted",
    rejected: locale === "ar" ? "مرفوض" : "Rejected",
    allTab: locale === "ar" ? "كل الطلبات" : "All Applications",
    noProposals: locale === "ar" ? "لم تقم بتقديم أي عرض عمل حتى الآن." : "You haven't submitted any job proposals yet.",
    browseJobs: locale === "ar" ? "تصفح طلبات العمل" : "Browse Job Requests",
    pageOf: locale === "ar" ? "صفحة {page} من {pages}" : "Page {page} of {pages}",
    detailsTitle: locale === "ar" ? "تفاصيل طلب التقديم" : "Application Details",
    jobDetails: locale === "ar" ? "تفاصيل العمل" : "Job Details",
    yourProposal: locale === "ar" ? "العرض الخاص بك" : "Your Proposal",
    proposedRate: locale === "ar" ? "السعر المعروض" : "Proposed Rate",
    originalBudget: locale === "ar" ? "ميزانية العائلة" : "Family Budget",
    coverLetter: locale === "ar" ? "خطاب التعريف (الملخص)" : "Cover Letter / Pitch",
    schedule: locale === "ar" ? "مواعيد العمل" : "Schedule",
    workingDays: locale === "ar" ? "أيام العمل" : "Working Days",
    workingHours: locale === "ar" ? "ساعات العمل" : "Working Hours",
    duration: locale === "ar" ? "مدة العمل" : "Duration",
    weeks: locale === "ar" ? "أسابيع" : "weeks",
    address: locale === "ar" ? "العنوان بالتفصيل" : "Readable Address",
    location: locale === "ar" ? "الموقع" : "Location",
    serviceType: locale === "ar" ? "نوع الخدمة" : "Service Type",
    description: locale === "ar" ? "تفاصيل الحالة" : "Case Description",
  };

  // Map service type names
  const getServiceTypeName = (type: string) => {
    const mapping: Record<string, string> = {
      elderly_care: locale === "ar" ? "رعاية كبار السن" : "Elderly Care",
      child_care: locale === "ar" ? "رعاية الأطفال" : "Child Care",
      home_nursing: locale === "ar" ? "تمريض منزلي" : "Home Nursing",
      physical_therapy: locale === "ar" ? "علاج طبيعي" : "Physical Therapy",
      companionship: locale === "ar" ? "مرافقة" : "Companionship",
    };
    return mapping[type] || type;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 py-8">
      
      {/* TITLE & HEADER */}
      <div>
        <h1 className="text-4xl font-extrabold text-stitch-primary mb-2">
          {t.title}
        </h1>
        <p className="text-gray-600 text-lg">
          {t.subtitle}
        </p>
      </div>

      {/* STATS SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Stats Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[120px]">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            {t.totalApps}
          </span>
          <span className="text-4xl font-black text-stitch-primary mt-2">
            {String(stats.total).padStart(2, "0")}
          </span>
        </div>

        {/* Pending Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[120px]">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            {t.pending}
          </span>
          <span className="text-4xl font-black text-amber-600 mt-2">
            {String(stats.pending).padStart(2, "0")}
          </span>
        </div>

        {/* Accepted Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[120px]">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            {t.accepted}
          </span>
          <span className="text-4xl font-black text-teal-600 mt-2">
            {String(stats.accepted).padStart(2, "0")}
          </span>
        </div>

        {/* Rejected Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[120px]">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            {t.rejected}
          </span>
          <span className="text-4xl font-black text-red-600 mt-2">
            {String(stats.rejected).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8 -mb-px">
          {/* All */}
          <button
            onClick={() => handleTabChange("")}
            className={`py-4 px-1 font-bold text-sm border-b-2 transition-all ${
              statusFilter === ""
                ? "border-stitch-primary text-stitch-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.allTab}
          </button>
          
          {/* Pending */}
          <button
            onClick={() => handleTabChange("pending")}
            className={`py-4 px-1 font-bold text-sm border-b-2 transition-all ${
              statusFilter === "pending"
                ? "border-stitch-primary text-stitch-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.pending}
          </button>

          {/* Accepted */}
          <button
            onClick={() => handleTabChange("accepted")}
            className={`py-4 px-1 font-bold text-sm border-b-2 transition-all ${
              statusFilter === "accepted"
                ? "border-stitch-primary text-stitch-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.accepted}
          </button>

          {/* Rejected */}
          <button
            onClick={() => handleTabChange("rejected")}
            className={`py-4 px-1 font-bold text-sm border-b-2 transition-all ${
              statusFilter === "rejected"
                ? "border-stitch-primary text-stitch-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.rejected}
          </button>
        </div>
      </div>

      {/* GRID LISTING OR LOADING */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-stitch-primary" />
        </div>
      ) : proposals.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {proposals.map((proposal) => (
            <ApplicationCard
              key={proposal._id}
              proposal={proposal}
              onViewRequest={() => setSelectedProposal(proposal)}
              onMessage={() => handleMessageFamily(proposal.jobPostId?.familyId?._id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200/60 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-6">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-800">{t.noProposals}</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              {locale === "ar"
                ? "ابدأ بتصفح طلبات العمل المتاحة في منطقتك وقدم عروضك لتتمكن من العمل."
                : "Start browsing open job requests in your city and submit pitches to match with families."}
            </p>
          </div>
          <button
            onClick={() => router.push("/companion/requests")}
            className="px-6 py-3 bg-stitch-primary hover:bg-stitch-primary-container text-white font-bold rounded-xl transition-colors text-sm shadow-sm"
          >
            {t.browseJobs}
          </button>
        </div>
      )}

      {/* PAGINATION */}
      {!loading && proposals.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-8">
          {/* Prev */}
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }).map((_, index) => {
            const pageNum = index + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-10 h-10 font-bold rounded-xl text-sm transition-all ${
                  page === pageNum
                    ? "bg-stitch-primary text-white"
                    : "border border-gray-100 hover:bg-gray-50 text-gray-600"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Next */}
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}

      {/* APPLICATION DETAILS SIDE MODAL OVERLAY */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto relative shadow-2xl border border-gray-100 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header / Close button */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  {t.detailsTitle}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 leading-snug">
                  {selectedProposal.jobPostId?.title}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedProposal(null)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Case Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-stitch-primary" /> {t.jobDetails}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block">{t.serviceType}</span>
                  <span className="font-bold text-gray-700 text-sm">{getServiceTypeName(selectedProposal.jobPostId?.serviceType)}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block">{t.originalBudget}</span>
                  <span className="font-bold text-gray-700 text-sm">{locale === "ar" ? `$${selectedProposal.jobPostId?.budgetPerHour}/ساعة` : `$${selectedProposal.jobPostId?.budgetPerHour}/hour`}</span>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <span className="text-xs text-gray-400 block">{t.location}</span>
                  <span className="font-bold text-gray-700 text-sm flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    {selectedProposal.jobPostId?.location?.readableAddress || selectedProposal.jobPostId?.location?.city}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-gray-400 block">{t.description}</span>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  {selectedProposal.jobPostId?.description}
                </p>
              </div>
            </div>

            {/* Working Schedule */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-stitch-primary" /> {t.schedule}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-gray-100 p-5 rounded-2xl">
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block">{t.workingDays}</span>
                  <span className="font-bold text-gray-700 text-xs">
                    {selectedProposal.jobPostId?.schedule?.workingDays.join(", ")}
                  </span>
                </div>
                <div className="space-y-1 border-t sm:border-t-0 sm:border-l sm:border-r border-gray-100 pt-3 sm:pt-0 sm:px-4">
                  <span className="text-xs text-gray-400 block">{t.workingHours}</span>
                  <span className="font-bold text-gray-700 text-xs flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {selectedProposal.jobPostId?.schedule?.startTime} - {selectedProposal.jobPostId?.schedule?.endTime}
                  </span>
                </div>
                <div className="space-y-1 border-t sm:border-t-0 pt-3 sm:pt-0 sm:pl-4">
                  <span className="text-xs text-gray-400 block">{t.duration}</span>
                  <span className="font-bold text-gray-700 text-xs">
                    {selectedProposal.jobPostId?.schedule?.durationInWeeks} {t.weeks}
                  </span>
                </div>
              </div>
            </div>

            {/* Proposal Pitch & Rates */}
            <div className="space-y-4 border-t border-gray-100 pt-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-stitch-primary" /> {t.yourProposal}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stitch-primary/[0.03] border border-stitch-primary/10 p-5 rounded-2xl">
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block">{t.proposedRate}</span>
                  <span className="font-extrabold text-stitch-primary text-lg">
                    {locale === "ar" ? `$${selectedProposal.proposedRate}/ساعة` : `$${selectedProposal.proposedRate}/hr`}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block">
                    {locale === "ar" ? "حالة الطلب" : "Application Status"}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full uppercase mt-1 ${
                    selectedProposal.status === "accepted" ? "bg-teal-50 text-teal-700 border border-teal-100" :
                    selectedProposal.status === "rejected" ? "bg-red-50 text-red-700 border border-red-100" :
                    "bg-amber-50 text-amber-700 border border-amber-100"
                  }`}>
                    {selectedProposal.status === "accepted" && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {selectedProposal.status === "rejected" && <AlertCircle className="w-3.5 h-3.5" />}
                    {selectedProposal.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-gray-400 block">{t.coverLetter}</span>
                <p className="text-sm text-gray-600 leading-relaxed bg-[#FCF9F6] p-5 rounded-2xl border border-gray-100/50 whitespace-pre-line">
                  {selectedProposal.coverLetter}
                </p>
              </div>
            </div>

            {/* View Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setSelectedProposal(null)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
              >
                {locale === "ar" ? "إغلاق" : "Close"}
              </button>
              {selectedProposal.status !== "rejected" && (
                <button
                  onClick={() => {
                    setSelectedProposal(null);
                    handleMessageFamily(selectedProposal.jobPostId?.familyId?._id);
                  }}
                  className="flex-1 py-3 px-4 bg-stitch-primary hover:bg-stitch-primary-container text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  {locale === "ar" ? "مراسلة العائلة" : "Message Family"}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
