"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useFamilyElderlyProfiles, useJobPostById, useUpdateJobPost } from "@/lib/hooks";
import EditJobPostForm from "@/components/family/job-posts/edit/EditJobPostForm";

export default function EditJobPostRoute() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const locale = useLocale();
  const isRtl = locale === "ar";

  const { data: jobData, isLoading: jobLoading } = useJobPostById(id);
  const { data: profileData, isLoading: profilesLoading } = useFamilyElderlyProfiles();
  const { execute: updateJob, isLoading: submitting } = useUpdateJobPost();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const beneficiaries = profileData?.beneficiaries ?? [];

  const handleSubmit = async (payload: any) => {
    setSubmitError(null);
    try {
      await updateJob(id, payload);
      router.push("/family/job-posts");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update job request.";
      setSubmitError(msg);
    }
  };

  const handleCancel = () => {
    router.push("/family/job-posts");
  };

  const isLoading = jobLoading || profilesLoading;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center" dir={isRtl ? "rtl" : "ltr"}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 w-1/3 mx-auto rounded-xl" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" dir={isRtl ? "rtl" : "ltr"}>
      <EditJobPostForm
        jobData={jobData}
        beneficiaries={beneficiaries}
        submitting={submitting}
        submitError={submitError}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
