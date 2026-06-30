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

  const handleMessage = () => {
    router.push("/family/messages");
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
        message={t("confirmAcceptMsg")}
        confirmLabel={t("yesAccept")}
        confirmClassName="bg-[#1f8a8a] text-white hover:bg-[#0d8282]"
        isLoading={updating}
        onConfirm={handleConfirmAccept}
        onCancel={() => setAcceptTarget(null)}
      />

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
