"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  useJobPostById,
  useProposalsForJob,
  useUpdateProposalStatus,
  useFamilyElderlyProfiles,
  useDeleteJobPost,
} from "@/lib/hooks";
import type { Proposal, JobPost } from "@/types";

// Import decoupled sub-components
import { JobStatusBadge } from "@/components/family/job-posts/details/Badges";
import ConfirmModal from "@/components/family/job-posts/details/ConfirmModal";
import Toast from "@/components/family/job-posts/details/Toast";
import PageSkeleton from "@/components/family/job-posts/details/Skeleton";
import Timeline from "@/components/family/job-posts/details/Timeline";
import AssignedCaregiverBanner from "@/components/family/job-posts/details/AssignedCaregiverBanner";
import ProposalCard from "@/components/family/job-posts/details/ProposalCard";
import EmptyApplications from "@/components/family/job-posts/details/EmptyApplications";
import RequestInfoCard from "@/components/family/job-posts/details/RequestInfoCard";

export default function FamilyRequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.requestId as string;
  const t = useTranslations("jobPostDetails");
  const locale = useLocale();

  // Data fetching
  const { data: jobPost, isLoading: jobLoading, error: jobError, refetch: refetchJob } = useJobPostById(requestId);
  const { data: proposalsData, isLoading: proposalsLoading, error: proposalsError, refetch: refetchProposals } = useProposalsForJob(requestId);
  const { execute: updateStatus, isLoading: updating } = useUpdateProposalStatus();
  const { execute: deleteJob, isLoading: deleting } = useDeleteJobPost();
  const { data: profilesData } = useFamilyElderlyProfiles();

  // Modal and toast states
  const [acceptTarget, setAcceptTarget] = useState<Proposal | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Proposal | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; visible: boolean }>({
    message: "",
    type: "success",
    visible: false,
  });

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3500);
  }, []);

  const handleConfirmDelete = async () => {
    if (!requestId) return;
    try {
      await deleteJob(requestId);
      showToast(t("toastDeleted"), "success");
      setIsDeleteModalOpen(false);
      setTimeout(() => {
        router.push("/family/job-posts");
      }, 1200);
    } catch (err: any) {
      console.error(err);
      const statusCode = err?.response?.status;
      let msg: string;
      if (statusCode === 404) {
        msg = locale === "ar" 
          ? "هذا الطلب لم يعد موجوداً بالفعل." 
          : "This request no longer exists. It may have already been deleted.";
      } else if (statusCode === 403) {
        msg = locale === "ar"
          ? "ليست لديك الصلاحية لحذف هذا الطلب."
          : "You do not have permission to delete this request.";
      } else {
        msg = err.response?.data?.message || t("pleaseTryAgain");
      }
      showToast(msg, "error");
      setIsDeleteModalOpen(false);
    }
  };

  const handleConfirmAccept = async () => {
    if (!acceptTarget) return;
    try {
      await updateStatus(acceptTarget._id, { status: "accepted" });
      const others = proposals.filter((p) => p._id !== acceptTarget._id && p.status === "pending");
      await Promise.allSettled(others.map((p) => updateStatus(p._id, { status: "rejected" })));
      await Promise.all([refetchJob(), refetchProposals()]);
      showToast(t("toastAccepted"), "success");
    } catch {
      showToast(t("toastFailedAccept"), "error");
    } finally {
      setAcceptTarget(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    try {
      await updateStatus(rejectTarget._id, { status: "rejected" });
      await refetchProposals();
      showToast(t("toastRejected"), "success");
    } catch {
      showToast(t("toastFailedReject"), "error");
    } finally {
      setRejectTarget(null);
    }
  };

  const handleViewProfile = (proposal: Proposal) => {
    const companionId =
      typeof proposal.companionId === "object"
        ? (proposal.companionId as any)._id
        : proposal.companionId;
    router.push(`/family/companions/${companionId}`);
  };

  const handleMessage = (proposal?: Proposal) => {
    if (proposal?._id) {
      router.push(`/family/messages?proposalId=${proposal._id}`);
    } else if (acceptedProposal?._id) {
      router.push(`/family/messages?proposalId=${acceptedProposal._id}`);
    } else {
      router.push("/family/messages");
    }
  };

  if (jobLoading) return <PageSkeleton />;

  if (jobError || !jobPost) {
    return (
      <div className="max-w-6xl mx-auto">
        <Link href="/family/job-posts" className="flex items-center gap-1.5 text-[#1f8a8a] font-semibold text-sm hover:underline mb-6">
          <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_back</span>
          {t("backBtn")}
        </Link>
        <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          <div>
            <p className="font-bold text-sm">{t("failedLoad")}</p>
            <p className="text-xs mt-0.5">{jobError?.response?.data?.message ?? t("pleaseTryAgain")}</p>
            <button onClick={refetchJob} className="mt-2 text-xs font-bold underline cursor-pointer">{t("retry")}</button>
          </div>
        </div>
      </div>
    );
  }

  const job: JobPost = jobPost;
  const beneficiaries = profilesData?.beneficiaries || [];
  const beneficiary = beneficiaries.find((b: any) => b._id === job.beneficiaryId) || null;

  const proposals: Proposal[] = Array.isArray(proposalsData?.proposals)
    ? proposalsData.proposals
    : Array.isArray(proposalsData)
    ? proposalsData
    : [];

  const acceptedProposal = proposals.find((p) => p.status === "accepted") ?? null;
  const pendingProposals = proposals.filter((p) => p.status === "pending");
  const rejectedProposals = proposals.filter((p) => p.status === "rejected");
  const orderedProposals = [...pendingProposals, ...rejectedProposals];
  const totalApplications = proposals.length;

  const formatShortDate = (iso?: string | Date | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso as string).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return String(iso);
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <Link
          href="/family/job-posts"
          className="flex items-center gap-1.5 text-[#1f8a8a] font-semibold text-sm hover:underline w-fit"
        >
          <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_back</span>
          {t("backBtn")}
        </Link>

        {/* ── Header ── */}
        <section className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1b1c1c] truncate">
              {job.title || t("requestInfo")}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <JobStatusBadge status={job.status} />
              <span className="text-[#3e4949] text-sm flex items-center gap-1 border-l border-[#bdc9c8] pl-3 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-3">
                <span className="material-symbols-outlined text-base">group</span>
                {t("applicationsCount", { count: totalApplications })}
              </span>
              <span className="text-[#3e4949] text-sm flex items-center gap-1 border-l border-[#bdc9c8] pl-3 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-3">
                <span className="material-symbols-outlined text-base">calendar_today</span>
                {t("created")}: {formatShortDate(job.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/family/job-posts/edit/${job._id}`}
              className="flex items-center gap-2 border border-[#1f8a8a] text-[#1f8a8a] px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#d1eeee]/30 transition-all"
            >
              {t("editBtn")}
            </Link>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 active:scale-95 transition-all cursor-pointer"
            >
              {t("deleteBtn")}
            </button>
          </div>
        </section>

        {/* ── Info Cards Grid ── */}
        <RequestInfoCard job={job} beneficiary={beneficiary} />

        {/* ── Timeline ── */}
        <Timeline
          jobStatus={job.status}
          proposalsCount={proposals.length}
          hasAssignedCaregiver={!!acceptedProposal}
        />

        {/* ── Applications Section ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#1b1c1c] text-xl">
              {t("caregiverApps", { count: totalApplications })}
            </h2>
          </div>

          {/* Assigned Caregiver Banner */}
          {acceptedProposal && (
            <AssignedCaregiverBanner
              proposal={acceptedProposal}
              onMessage={handleMessage}
              onViewProfile={() => handleViewProfile(acceptedProposal)}
            />
          )}

          {/* Proposals Error */}
          {proposalsError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
              <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              <div>
                <p className="text-sm font-semibold">{t("failedLoadApps")}</p>
                <p className="text-xs mt-0.5">
                  {proposalsError?.response?.data?.message || proposalsError?.message || String(proposalsError)}
                </p>
                <button onClick={refetchProposals} className="mt-2 text-xs font-bold underline cursor-pointer">{t("retry")}</button>
              </div>
            </div>
          )}

          {/* Proposals Loading */}
          {proposalsLoading && (
            <div className="space-y-4 animate-pulse">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#eae7e7] p-6 h-40" />
              ))}
            </div>
          )}

          {/* Empty */}
          {!proposalsLoading && !proposalsError && proposals.length === 0 && (
            <EmptyApplications />
          )}

          {/* List */}
          {!proposalsLoading && orderedProposals.length > 0 && (
            <div className="space-y-4">
              {orderedProposals.map((proposal) => (
                <ProposalCard
                  key={proposal._id}
                  proposal={proposal}
                  hasAccepted={!!acceptedProposal}
                  onAccept={setAcceptTarget}
                  onReject={setRejectTarget}
                  onViewProfile={handleViewProfile}
                  onMessage={handleMessage}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Modals ── */}
      <ConfirmModal
        isOpen={!!acceptTarget}
        title={t("confirmAcceptTitle")}
        confirmLabel={t("yesAccept")}
        confirmClassName="bg-[#1f8a8a] text-white hover:bg-[#0d8282]"
        isLoading={updating}
        onConfirm={handleConfirmAccept}
        onCancel={() => setAcceptTarget(null)}
      >
        {acceptTarget && (() => {
          const durationInWeeks = job?.schedule?.durationInWeeks || 1;
          const workingDays = job?.schedule?.workingDays || [];
          const startTime = job?.schedule?.startTime || "00:00";
          const endTime = job?.schedule?.endTime || "00:00";

          const [startHour, startMin] = startTime.split(':').map(Number);
          const [endHour, endMin] = endTime.split(':').map(Number);
          let hoursPerDay = (endHour + endMin/60) - (startHour + startMin/60);
          if (hoursPerDay <= 0) {
            hoursPerDay += 24;
          }
          const totalHours = hoursPerDay * workingDays.length * durationInWeeks;

          const proposedRate = acceptTarget.proposedRate || 0;
          const basePrice = proposedRate * totalHours;
          const adminFee = basePrice * 0.10;
          const totalPrice = basePrice + adminFee;

          const budgetPerHour = job?.budgetPerHour || 0;
          const initialBasePrice = budgetPerHour * totalHours;
          const initialAdminFee = initialBasePrice * 0.10;
          const initialTotalPrice = initialBasePrice + initialAdminFee;

          const difference = totalPrice - initialTotalPrice;

          return (
            <div className="mt-3 space-y-4 text-right" dir={locale === "ar" ? "rtl" : "ltr"}>
              <p className="text-sm text-[#3e4949]">
                {locale === "ar" 
                  ? "أنت على وشك قبول عرض المرافق لبدء الخدمة. يرجى مراجعة تفاصيل التكلفة أدناه:" 
                  : "You are about to accept the caregiver's proposal. Please review the pricing details below:"}
              </p>

              <div className="bg-[#f6f3f2] p-4 rounded-xl border border-[#eae7e7] space-y-2 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-[#3e4949]">{locale === "ar" ? "سعر الساعة المقترح:" : "Proposed Hourly Rate:"}</span>
                  <span className="font-bold">{proposedRate} {locale === "ar" ? "ج.م" : "EGP"}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-[#3e4949]">{locale === "ar" ? "إجمالي ساعات العمل المجدولة:" : "Total Scheduled Hours:"}</span>
                  <span className="font-bold">{totalHours} {locale === "ar" ? "ساعة" : "hrs"}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-[#3e4949]">{locale === "ar" ? "التكلفة الأساسية للخدمة:" : "Base Service Cost:"}</span>
                  <span className="font-bold">{basePrice.toFixed(2)} {locale === "ar" ? "ج.م" : "EGP"}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-[#3e4949]">{locale === "ar" ? "رسوم الخدمة الإدارية (10%):" : "Platform Admin Fee (10%):"}</span>
                  <span className="font-bold">{adminFee.toFixed(2)} {locale === "ar" ? "ج.م" : "EGP"}</span>
                </div>
                <div className="border-t border-[#bdc9c8] pt-2 flex justify-between font-extrabold text-[#1f8a8a] text-sm">
                  <span>{locale === "ar" ? "إجمالي التكلفة المطلوبة للحجز:" : "Total Escrow Amount:"}</span>
                  <span>{totalPrice.toFixed(2)} {locale === "ar" ? "ج.م" : "EGP"}</span>
                </div>
              </div>

              {/* Budget Comparison Alerts */}
              {difference > 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 shrink-0 text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  <div className="text-right">
                    <span className="font-bold">
                      {locale === "ar" ? "هذا العرض أعلى من ميزانيتك المقترحة!" : "This proposal is above your initial budget!"}
                    </span>
                    <p className="mt-0.5">
                      {locale === "ar" 
                        ? `الفارق هو +${difference.toFixed(2)} ج.م إجمالياً (+${(proposedRate - budgetPerHour).toFixed(2)} ج.م/ساعة).`
                        : `The difference is +${difference.toFixed(2)} EGP in total (+${(proposedRate - budgetPerHour).toFixed(2)} EGP/hr).`}
                    </p>
                  </div>
                </div>
              ) : difference < 0 ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[#1f8a8a] text-xs flex items-start gap-2">
                  <span className="material-symbols-outlined text-emerald-600 shrink-0 text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <div className="text-right">
                    <span className="font-bold">
                      {locale === "ar" ? "هذا العرض يوفر لك المال!" : "This proposal saves you money!"}
                    </span>
                    <p className="mt-0.5">
                      {locale === "ar"
                        ? `العرض أقل بـ ${Math.abs(difference).toFixed(2)} ج.م إجمالياً من ميزانيتك المقترحة.`
                        : `The proposal is ${Math.abs(difference).toFixed(2)} EGP lower than your proposed budget.`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-start gap-2">
                  <span className="material-symbols-outlined text-blue-600 shrink-0 text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                  <div className="text-right">
                    <span className="font-bold">
                      {locale === "ar" ? "السعر مطابق تماماً لميزانيتك المقترحة!" : "This proposal matches your budget!"}
                    </span>
                    <p className="mt-0.5">
                      {locale === "ar"
                        ? "العرض يطابق ميزانيتك المقترحة تماماً بسعر الساعة."
                        : "The proposal rate perfectly matches your requested budget."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </ConfirmModal>

      <ConfirmModal
        isOpen={!!rejectTarget}
        title={t("confirmRejectTitle")}
        message={t("confirmRejectMsg")}
        confirmLabel={t("reject")}
        confirmClassName="bg-red-600 text-white hover:bg-red-700"
        isLoading={updating}
        onConfirm={handleConfirmReject}
        onCancel={() => setRejectTarget(null)}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title={t("confirmDeleteTitle")}
        message={t("confirmDeleteMsg")}
        confirmLabel={t("deleteConfirm")}
        confirmClassName="bg-red-600 text-white hover:bg-red-700"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* ── Toast ── */}
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </>
  );
}
