"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useJobPostById, useProposalsForJob, useUpdateProposalStatus, useFamilyElderlyProfiles } from "@/lib/hooks";
import type { JobPost, Proposal } from "@/types";

function getEndDate(startIso?: string | Date | null, weeks?: number) {
  if (!startIso || !weeks) return "—";
  try {
    const d = new Date(startIso as string);
    d.setDate(d.getDate() + weeks * 7);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}


// ─── Helpers ─────────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, string> = {
  elderly_care: "Elderly Care",
  child_care: "Child Care",
  home_nursing: "Home Nursing",
  physical_therapy: "Physical Therapy",
  companionship: "Companion Care",
};

function formatDate(iso?: string | Date | null) {
  if (!iso) return "—";
  try {
    return new Date(iso as string).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(iso);
  }
}

function formatShortDate(iso?: string | Date | null) {
  if (!iso) return "—";
  try {
    return new Date(iso as string).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(iso);
  }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function JobStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    open:   { label: "Open",     bg: "bg-emerald-50",   text: "text-emerald-700", dot: "bg-emerald-500" },
    filled: { label: "Filled",   bg: "bg-blue-50",      text: "text-blue-700",   dot: "bg-blue-500" },
    closed: { label: "Closed",   bg: "bg-[#f0eded]",    text: "text-[#3e4949]",  dot: "bg-[#bdc9c8]" },
  };
  const s = map[status] ?? map.open;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      Status: {s.label}
    </span>
  );
}

function ProposalStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    pending:  { label: "Pending Review", bg: "bg-[#ebe1d4]", text: "text-[#615b51]" },
    accepted: { label: "Accepted",       bg: "bg-green-100", text: "text-green-800" },
    rejected: { label: "Rejected",       bg: "bg-red-100",   text: "text-red-800" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

// ─── Confirmation Modal ────────────────────────────────────────────────────────

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmClassName?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmClassName = "bg-[#1f8a8a] text-white hover:bg-[#0d8282]",
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-[#eae7e7] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#1f8a8a]/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#1f8a8a]">help</span>
          </div>
          <div>
            <h3 className="font-bold text-[#1b1c1c] text-base">{title}</h3>
            <p className="text-sm text-[#3e4949] mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 border border-[#bdc9c8] text-[#3e4949] py-2.5 rounded-xl font-semibold text-sm hover:bg-[#f0eded] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 ${confirmClassName}`}
          >
            {isLoading ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string;
  type: "success" | "error";
  visible: boolean;
}

function Toast({ message, type, visible }: ToastProps) {
  if (!visible) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl font-semibold text-sm transition-all duration-300 ${
        type === "success"
          ? "bg-[#1f8a8a] text-white"
          : "bg-red-600 text-white"
      }`}
    >
      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
        {type === "success" ? "check_circle" : "error"}
      </span>
      {message}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="h-4 w-32 bg-[#f0eded] rounded-lg" />
      <div className="h-8 w-72 bg-[#f0eded] rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#eae7e7] p-6 h-40" />
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-[#eae7e7] p-6 h-52" />
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

const TIMELINE_STAGES = [
  { key: "created",   label: "Request Created",        icon: "assignment" },
  { key: "applied",   label: "Applications Received",  icon: "group" },
  { key: "assigned",  label: "Caregiver Assigned",      icon: "verified" },
  { key: "started",   label: "Service Started",         icon: "play_circle" },
  { key: "completed", label: "Completed",               icon: "task_alt" },
];

function getTimelineStage(jobStatus: string, hasApplications: boolean): number {
  if (jobStatus === "closed") return 4;
  if (jobStatus === "filled") return 2;
  if (hasApplications) return 1;
  return 0;
}

function Timeline({ jobStatus, hasApplications }: { jobStatus: string; hasApplications: boolean }) {
  const activeIndex = getTimelineStage(jobStatus, hasApplications);
  return (
    <div className="bg-white rounded-2xl border border-[#eae7e7] p-6">
      <h3 className="font-bold text-[#1b1c1c] text-base mb-6">Request Progress</h3>
      <div className="relative">
        {/* connector line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-[#f0eded]" style={{ zIndex: 0 }} />
        <div
          className="absolute top-5 left-5 h-0.5 bg-[#1f8a8a] transition-all duration-700"
          style={{ width: `${(activeIndex / (TIMELINE_STAGES.length - 1)) * (100 - 8)}%`, zIndex: 1 }}
        />
        <div className="flex justify-between relative" style={{ zIndex: 2 }}>
          {TIMELINE_STAGES.map((stage, idx) => {
            const done = idx <= activeIndex;
            const current = idx === activeIndex;
            return (
              <div key={stage.key} className="flex flex-col items-center gap-2 w-1/5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    done
                      ? current
                        ? "bg-[#1f8a8a] border-[#1f8a8a] ring-4 ring-[#1f8a8a]/20"
                        : "bg-[#1f8a8a] border-[#1f8a8a]"
                      : "bg-white border-[#bdc9c8]"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-sm ${done ? "text-white" : "text-[#bdc9c8]"}`}
                    style={{ fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {stage.icon}
                  </span>
                </div>
                <p className={`text-[10px] font-semibold text-center leading-tight ${done ? "text-[#1f8a8a]" : "text-[#bdc9c8]"}`}>
                  {stage.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Assigned Caregiver Banner ─────────────────────────────────────────────────

function AssignedCaregiverBanner({
  proposal,
  onMessage,
  onViewProfile,
}: {
  proposal: Proposal;
  onMessage: () => void;
  onViewProfile: () => void;
}) {
  const companion = typeof proposal.companionId === "object" ? proposal.companionId : null;
  const name: string = companion ? (companion as any).name ?? "Caregiver" : "Caregiver";
  const avatar: string | null = companion ? (companion as any).avatar ?? null : null;
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <article className="bg-[#d1eeee]/30 border-2 border-[#1f8a8a] rounded-2xl overflow-hidden">
      {/* Header banner */}
      <div className="bg-[#1f8a8a] text-white px-6 py-2.5 flex items-center justify-between">
        <span className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
            verified
          </span>
          Assigned Caregiver
        </span>
        {proposal.createdAt && (
          <span className="text-xs opacity-80">Selected on {formatShortDate(proposal.createdAt as any)}</span>
        )}
      </div>

      {/* Body */}
      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
        {/* Avatar */}
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-24 h-24 rounded-2xl object-cover shrink-0 border-2 border-[#1f8a8a] shadow-sm"
          />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-[#d1eeee] flex items-center justify-center shrink-0 border-2 border-[#1f8a8a] shadow-sm">
            <span className="text-2xl font-bold text-[#1f8a8a]">{initials}</span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 text-center md:text-left space-y-1.5">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h4 className="text-xl font-bold text-[#1b1c1c]">{name}</h4>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold w-fit mx-auto md:mx-0">
              ACCEPTED
            </span>
          </div>
          <p className="text-[#3e4949] font-medium">
            {(companion as any)?.companionType === "specialized" ? "Specialist Caregiver" : "General Caregiver"}
            {(companion as any)?.bio ? ` · ${(companion as any).bio.slice(0, 60)}…` : ""}
          </p>
          <div className="flex items-center gap-4 justify-center md:justify-start">
            {((companion as any)?.averageRating ?? (companion as any)?.rating) && (
              <span className="flex items-center gap-1 text-sm font-semibold">
                <span className="material-symbols-outlined text-yellow-500 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                {(((companion as any).averageRating ?? (companion as any).rating) as number).toFixed(1)}
              </span>
            )}
            <span className="text-[#3e4949] text-sm">
              Rate: {proposal.proposedRate} SAR/hr
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={onMessage}
            className="flex items-center justify-center gap-2 bg-[#1f8a8a] text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-[#0d8282] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">chat</span>
            Message Caregiver
          </button>
          <button
            onClick={onViewProfile}
            className="flex items-center justify-center gap-2 border border-[#1f8a8a] text-[#1f8a8a] px-6 py-3 rounded-xl font-bold hover:bg-[#d1eeee]/30 transition-all"
          >
            <span className="material-symbols-outlined text-base">person</span>
            View Profile
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Proposal Card ─────────────────────────────────────────────────────────────

interface ProposalCardProps {
  proposal: Proposal;
  onAccept: (p: Proposal) => void;
  onReject: (p: Proposal) => void;
  onViewProfile: (p: Proposal) => void;
  onMessage: (p: Proposal) => void;
}

function ProposalCard({ proposal, onAccept, onReject, onViewProfile, onMessage }: ProposalCardProps) {
  const companion = typeof proposal.companionId === "object" ? (proposal.companionId as any) : null;
  const name: string = companion?.name ?? (proposal.companionId as string) ?? "Caregiver";
  const avatar: string | null = companion?.avatar ?? null;
  // The proposal controller enriches companionId with `averageRating`; fall back to `rating` for safety
  const rating: number = companion?.averageRating ?? companion?.rating ?? 0;
  const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  const isRejected = proposal.status === "rejected";
  const isAccepted = proposal.status === "accepted";

  return (
    <article
      className={`bg-white rounded-2xl shadow-sm border border-[#eae7e7] overflow-hidden transition-all group hover:shadow-md hover:-translate-y-0.5 ${
        isRejected ? "opacity-60 grayscale" : ""
      }`}
    >
      <div className="p-5 md:p-6 flex flex-col lg:flex-row gap-5">
        {/* Left: Profile & Stats */}
        <div className="flex flex-row lg:flex-col gap-4 items-center lg:items-start lg:w-52 shrink-0 border-b lg:border-b-0 lg:border-r border-[#eae7e7]/60 pb-4 lg:pb-0 lg:pr-5">
          <div className="relative shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-20 h-20 rounded-2xl object-cover border border-[#eae7e7]"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#d1eeee] flex items-center justify-center border border-[#eae7e7]">
                <span className="text-xl font-bold text-[#1f8a8a]">{initials}</span>
              </div>
            )}
            {companion?.verificationStatus === "verified" && (
              <span className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md border border-[#eae7e7]">
                <span className="material-symbols-outlined text-[#1f8a8a] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </span>
            )}
          </div>

          <div className="flex-1 lg:w-full">
            <div className="flex items-center gap-1 mb-1">
              <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-bold text-[#1b1c1c]">{rating > 0 ? rating.toFixed(1) : "New"}</span>
              {companion?.reviewCount > 0 && (
                <span className="text-[#3e4949] text-xs">({companion.reviewCount})</span>
              )}
            </div>
            <p className="text-[#3e4949] text-sm">
              {companion?.specialization && companion.specialization !== "none"
                ? companion.specialization.replace(/_/g, " ")
                : companion?.companionType === "specialized"
                ? "Specialist"
                : "General"}{" "}
              Caregiver
            </p>
            <div className="mt-3 p-2.5 bg-[#d1eeee]/30 rounded-xl border border-[#1f8a8a]/20">
              <p className="text-[10px] text-[#1f8a8a] font-bold uppercase tracking-wider">Proposed Rate</p>
              <p className="text-[#1f8a8a] font-bold text-xl">
                {proposal.proposedRate}
                <span className="text-sm font-medium"> SAR/hr</span>
              </p>
            </div>
          </div>
        </div>

        {/* Middle: Details & Proposal */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap justify-between items-start gap-2">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h4 className="font-bold text-[#1b1c1c] text-lg">{name}</h4>
                <ProposalStatusBadge status={proposal.status} />
              </div>
              {companion?.bio && (
                <p className="text-[#3e4949] text-sm mt-1 line-clamp-1">{companion.bio}</p>
              )}
            </div>
            {proposal.createdAt && (
              <span className="text-xs text-[#3e4949]/60">
                Applied {formatShortDate(proposal.createdAt as any)}
              </span>
            )}
          </div>

          {/* Cover Letter */}
          {proposal.coverLetter && (
            <div className="bg-[#f6f3f2] p-4 rounded-xl border border-[#eae7e7]/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#1f8a8a] text-sm">format_quote</span>
                <p className="text-xs font-bold text-[#1f8a8a] uppercase tracking-widest">Proposal Message</p>
              </div>
              <p className="text-[#3e4949] italic text-sm leading-relaxed line-clamp-3">
                "{proposal.coverLetter}"
              </p>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        {!isRejected && (
          <div className="lg:w-48 shrink-0 flex flex-col gap-2 justify-center pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[#eae7e7]/40 lg:pl-5">
            {!isAccepted && (
              <button
                onClick={() => onAccept(proposal)}
                className="w-full bg-[#1f8a8a] text-white py-2.5 rounded-xl font-bold shadow-md hover:bg-[#0d8282] active:scale-95 transition-all"
              >
                Accept Application
              </button>
            )}
            <button
              onClick={() => onViewProfile(proposal)}
              className="w-full border border-[#bdc9c8] text-[#1b1c1c] py-2.5 rounded-xl font-bold hover:bg-[#f0eded] transition-all"
            >
              View Profile
            </button>
            <button
              onClick={() => onMessage(proposal)}
              className="w-full border border-[#bdc9c8] text-[#1b1c1c] py-2.5 rounded-xl font-bold hover:bg-[#f0eded] flex items-center justify-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              Message
            </button>
            {!isAccepted && (
              <button
                onClick={() => onReject(proposal)}
                className="w-full text-red-600 text-sm font-bold hover:bg-red-50 py-2 rounded-xl transition-colors mt-1"
              >
                Reject Application
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyApplications() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-[#eae7e7]">
      <div className="w-20 h-20 bg-[#1f8a8a]/10 rounded-full flex items-center justify-center mb-5">
        <span className="material-symbols-outlined text-[#1f8a8a]" style={{ fontSize: "40px", fontVariationSettings: "'FILL' 1" }}>
          group
        </span>
      </div>
      <h3 className="text-lg font-bold text-[#1b1c1c] mb-2">No caregivers have applied yet.</h3>
      <p className="text-sm text-[#3e4949] max-w-sm">
        Once caregivers discover your request, their applications will appear here.
      </p>
      <Link
        href="/family/requests"
        className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#1f8a8a] hover:underline"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Back to My Requests
      </Link>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FamilyRequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.requestId as string;

  // Data
  const { data: jobPost, isLoading: jobLoading, error: jobError, refetch: refetchJob } = useJobPostById(requestId);
  const { data: proposalsData, isLoading: proposalsLoading, error: proposalsError, refetch: refetchProposals } = useProposalsForJob(requestId);
  const { execute: updateStatus, isLoading: updating } = useUpdateProposalStatus();
  const { data: profilesData } = useFamilyElderlyProfiles();

  // Modal state
  const [acceptTarget, setAcceptTarget] = useState<Proposal | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Proposal | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; visible: boolean }>({
    message: "",
    type: "success",
    visible: false,
  });

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  }, []);

  // Derived data
  const job: JobPost | null = jobPost ?? null;
  const beneficiaries = profilesData?.beneficiaries || [];
  const beneficiary = job ? beneficiaries.find((b: any) => b._id === job.beneficiaryId) : null;

  const proposals: Proposal[] = Array.isArray(proposalsData?.proposals)
    ? proposalsData.proposals
    : Array.isArray(proposalsData)
    ? proposalsData
    : [];

  const acceptedProposal = proposals.find((p) => p.status === "accepted") ?? null;
  const pendingProposals = proposals.filter((p) => p.status === "pending");
  const rejectedProposals = proposals.filter((p) => p.status === "rejected");
  const orderedProposals = [...pendingProposals, ...rejectedProposals];

  // ── Accept ──

  const handleConfirmAccept = async () => {
    if (!acceptTarget) return;
    try {
      // 1. Accept selected
      await updateStatus(acceptTarget._id, { status: "accepted" });
      // 2. Reject all other pending
      const others = proposals.filter((p) => p._id !== acceptTarget._id && p.status === "pending");
      await Promise.allSettled(others.map((p) => updateStatus(p._id, { status: "rejected" })));
      // 3. Refresh
      await Promise.all([refetchJob(), refetchProposals()]);
      showToast("Caregiver accepted successfully!", "success");
    } catch {
      showToast("Failed to accept application. Please try again.", "error");
    } finally {
      setAcceptTarget(null);
    }
  };

  // ── Reject ──

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    try {
      await updateStatus(rejectTarget._id, { status: "rejected" });
      await refetchProposals();
      showToast("Application rejected.", "success");
    } catch {
      showToast("Failed to reject application. Please try again.", "error");
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

  const handleMessage = (_: Proposal) => {
    router.push("/family/messages");
  };

  // ─── Loading / Error ───────────────────────────────────────────────────────

  if (jobLoading) return <PageSkeleton />;

  if (jobError || !job) {
    return (
      <div className="max-w-6xl mx-auto">
        <Link href="/family/requests" className="flex items-center gap-1.5 text-[#1f8a8a] font-semibold text-sm hover:underline mb-6">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to My Requests
        </Link>
        <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          <div>
            <p className="font-bold text-sm">Failed to load request details</p>
            <p className="text-xs mt-0.5">{jobError?.response?.data?.message ?? "Please try again."}</p>
            <button onClick={refetchJob} className="mt-2 text-xs font-bold underline">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const serviceLabel = SERVICE_LABELS[job.serviceType] ?? job.serviceType;
  const totalApplications = proposals.length;

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <Link
          href="/family/requests"
          className="flex items-center gap-1.5 text-[#1f8a8a] font-semibold text-sm hover:underline w-fit"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to My Requests
        </Link>

        {/* ── Header ── */}
        <section className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1b1c1c]">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <JobStatusBadge status={job.status} />
              <span className="text-[#3e4949] text-sm flex items-center gap-1 border-l border-[#bdc9c8] pl-3">
                <span className="material-symbols-outlined text-base">group</span>
                {totalApplications} Application{totalApplications !== 1 ? "s" : ""}
              </span>
              <span className="text-[#3e4949] text-sm flex items-center gap-1 border-l border-[#bdc9c8] pl-3">
                <span className="material-symbols-outlined text-base">calendar_today</span>
                Created: {formatShortDate(job.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/family/requests/new`}
              className="flex items-center gap-2 border border-[#1f8a8a] text-[#1f8a8a] px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#d1eeee]/30 transition-all"
            >
              Edit Request
            </Link>
          </div>
        </section>

        {/* ── Info Cards Grid ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Request Details */}
          <div className="bg-white p-6 rounded-2xl border border-[#eae7e7] flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#d1eeee]/50 flex items-center justify-center text-[#1f8a8a]">
                <span className="material-symbols-outlined">assignment</span>
              </div>
              <h3 className="font-bold text-[#1b1c1c] text-base">Request Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">Request ID</p>
                <code className="text-xs font-mono bg-[#f6f3f2] px-2 py-1 rounded text-[#1f8a8a] font-semibold">{job._id}</code>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">Care Type</p>
                  <p className="font-semibold text-[#1f8a8a] text-sm">{serviceLabel}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">Preferred Gender</p>
                  <p className="font-semibold text-[#1b1c1c] text-sm capitalize">{(job as any).preferredCaregiverGender || "No Preference"}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">Preferred Experience Level</p>
                <p className="font-semibold text-[#1b1c1c] text-sm capitalize">{(job as any).preferredExperienceLevel || "Any Experience Level"}</p>
              </div>

              {job.requiredSkills?.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-2">Required Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(job.requiredSkills as any[]).map((skill: any, i: number) => (
                      <span
                        key={i}
                        className="bg-[#eae7e7] text-[#1b1c1c] px-2.5 py-1 rounded-full text-xs font-medium"
                      >
                        {typeof skill === "string" ? skill : skill?.nameEn ?? skill?.nameAr ?? skill?.name ?? "Skill"}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {job.description && (
                <div>
                  <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">Description</p>
                  <p className="text-sm text-[#3e4949] leading-relaxed whitespace-pre-line">{job.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* 2. Elderly Information */}
          <div className="bg-white p-6 rounded-2xl border border-[#eae7e7] flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#aeedd5]/50 flex items-center justify-center text-[#2c6956]">
                <span className="material-symbols-outlined">elderly</span>
              </div>
              <h3 className="font-bold text-[#1b1c1c] text-base">Elderly Information</h3>
            </div>

            {beneficiary ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">Elderly Profile ID</p>
                  <code className="text-xs font-mono bg-[#f6f3f2] px-2 py-1 rounded text-[#2c6956] font-semibold">{beneficiary._id}</code>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">Name</p>
                    <p className="font-semibold text-[#1b1c1c] text-sm">{beneficiary.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">Relationship</p>
                    <p className="font-semibold text-[#1b1c1c] text-sm">
                      {beneficiary.relationship || (beneficiary.category === 'elderly' ? 'Parent / Grandparent' : 'Family Member')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">Age</p>
                    <p className="font-semibold text-[#1b1c1c] text-sm">{beneficiary.age} years old</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">Gender</p>
                    <p className="font-semibold text-[#1b1c1c] text-sm capitalize">{beneficiary.gender}</p>
                  </div>
                </div>

                {beneficiary.conditionDetails && (
                  <div>
                    <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">Care Needs Summary</p>
                    <p className="text-sm text-[#3e4949] leading-relaxed bg-[#f6f3f2]/40 p-3 rounded-xl border border-[#eae7e7]/50 whitespace-pre-line">{beneficiary.conditionDetails}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-[#3e4949]">
                <span className="material-symbols-outlined text-3xl opacity-40 mb-2">person_off</span>
                <p className="text-sm font-semibold">No profile linked or failed to load profile details</p>
                <p className="text-xs opacity-70 mt-1">Profile ID: {job.beneficiaryId}</p>
              </div>
            )}
          </div>

          {/* 3. Schedule & Location */}
          <div className="bg-white p-6 rounded-2xl border border-[#eae7e7] flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#aeedd5]/50 flex items-center justify-center text-[#2c6956]">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <h3 className="font-bold text-[#1b1c1c] text-base">Schedule &amp; Location</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-2.5">
                  <span className="material-symbols-outlined text-[#3e4949] text-lg shrink-0 mt-0.5">calendar_today</span>
                  <div>
                    <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest">Start Date</p>
                    <p className="text-sm font-semibold text-[#1b1c1c]">{formatShortDate(job.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="material-symbols-outlined text-[#3e4949] text-lg shrink-0 mt-0.5">event_busy</span>
                  <div>
                    <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest">End Date</p>
                    <p className="text-sm font-semibold text-[#1b1c1c]">{getEndDate(job.createdAt, job.schedule?.durationInWeeks)}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="material-symbols-outlined text-[#3e4949] text-lg shrink-0 mt-0.5">calendar_month</span>
                <div>
                  <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest">Working Days</p>
                  <p className="text-sm font-semibold text-[#1b1c1c]">{job.schedule?.workingDays?.join(", ") || "—"}</p>
                  <p className="text-xs text-[#3e4949]/70">Duration: {job.schedule?.durationInWeeks ?? "—"} weeks</p>
                </div>
              </div>

              {(job.schedule?.startTime || job.schedule?.endTime) && (
                <div className="flex gap-2.5">
                  <span className="material-symbols-outlined text-[#3e4949] text-lg shrink-0 mt-0.5">timer</span>
                  <div>
                    <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest">Working Hours &amp; Timing</p>
                    <p className="text-sm font-semibold text-[#1b1c1c]">{job.schedule.startTime} – {job.schedule.endTime}</p>
                  </div>
                </div>
              )}

              {job.location && (
                <div className="flex gap-2.5 pt-2 border-t border-[#eae7e7]/60">
                  <span className="material-symbols-outlined text-[#3e4949] text-lg shrink-0 mt-0.5">location_on</span>
                  <div className="space-y-1">
                    <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest">Location / Address</p>
                    {job.location.readableAddress && (
                      <p className="text-sm font-semibold text-[#1b1c1c]">{job.location.readableAddress}</p>
                    )}
                    <p className="text-xs text-[#3e4949]/70">
                      {[job.location.city, job.location.governorate].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Budget & Pricing */}
          <div className="bg-[#d1eeee]/30 p-6 rounded-2xl border border-[#1f8a8a]/20 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1f8a8a] flex items-center justify-center text-white">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <h3 className="font-bold text-[#1b1c1c] text-base">Budget &amp; Pricing</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-xl border border-[#1f8a8a]/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest">Hourly Rate</p>
                  <p className="text-lg font-bold text-[#1f8a8a]">{job.budgetPerHour} SAR</p>
                </div>
                <span className="material-symbols-outlined text-[#1f8a8a] opacity-80">sell</span>
              </div>
              
              <div className="p-4 bg-white rounded-xl border border-[#1f8a8a]/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest">Total Duration</p>
                  <p className="text-lg font-bold text-[#1b1c1c]">{job.schedule?.durationInWeeks ?? "—"} Weeks</p>
                </div>
                <span className="material-symbols-outlined text-[#3e4949] opacity-80">timelapse</span>
              </div>

              {(() => {
                const [sh, sm] = (job.schedule?.startTime || "0:0").split(":").map(Number);
                const [eh, em] = (job.schedule?.endTime || "0:0").split(":").map(Number);
                const diff = (eh * 60 + em) - (sh * 60 + sm);
                const dailyHours = diff > 0 ? diff / 60 : 0;
                const daysPerWeek = job.schedule?.workingDays?.length || 0;
                const weeklyHours = dailyHours * daysPerWeek;
                const totalHours = weeklyHours * (job.schedule?.durationInWeeks || 0);
                const totalBudget = totalHours * job.budgetPerHour;

                return (
                  <div className="p-4 bg-[#1f8a8a] rounded-xl text-white flex items-center justify-between shadow-md">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Estimated Cost</p>
                      <p className="text-lg font-bold">{totalBudget > 0 ? `${totalBudget.toLocaleString()} SAR` : "Flexible"}</p>
                    </div>
                    <span className="material-symbols-outlined text-white opacity-90">calculate</span>
                  </div>
                );
              })()}
            </div>
          </div>
        </section>

        {/* ── Timeline ── */}
        <Timeline jobStatus={job.status} hasApplications={proposals.length > 0} />

        {/* ── Applications Section ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#1b1c1c] text-xl">
              Caregiver Applications ({totalApplications})
            </h2>
          </div>

          {/* Assigned Caregiver Banner */}
          {acceptedProposal && (
            <AssignedCaregiverBanner
              proposal={acceptedProposal}
              onMessage={() => handleMessage(acceptedProposal)}
              onViewProfile={() => handleViewProfile(acceptedProposal)}
            />
          )}

          {/* Proposals Error */}
          {proposalsError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
              <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              <div>
                <p className="text-sm font-semibold">Failed to load applications</p>
                <p className="text-xs mt-0.5">
                  {proposalsError?.response?.data?.message || proposalsError?.message || String(proposalsError)}
                </p>
                <button onClick={refetchProposals} className="mt-2 text-xs font-bold underline">Retry</button>
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
        title="Accept Application"
        message="Are you sure you want to assign this caregiver to this request? All other pending applications will be automatically rejected."
        confirmLabel="Yes, Accept"
        confirmClassName="bg-[#1f8a8a] text-white hover:bg-[#0d8282]"
        isLoading={updating}
        onConfirm={handleConfirmAccept}
        onCancel={() => setAcceptTarget(null)}
      />

      <ConfirmModal
        isOpen={!!rejectTarget}
        title="Reject Application"
        message="Are you sure you want to reject this application?"
        confirmLabel="Reject"
        confirmClassName="bg-red-600 text-white hover:bg-red-700"
        isLoading={updating}
        onConfirm={handleConfirmReject}
        onCancel={() => setRejectTarget(null)}
      />

      {/* ── Toast ── */}
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </>
  );
}
