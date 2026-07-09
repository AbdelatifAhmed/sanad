"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useFamilyCareRequests } from "@/lib/hooks";
import { JobPost } from "@/lib/types/care-request";
import { useTranslations, useLocale } from "next-intl";
import RequestCard from "@/components/family/job-posts/RequestCard";
import Skeleton from "@/components/family/job-posts/Skeleton";
import EmptyState from "@/components/family/job-posts/EmptyState";
import StatsStrip from "@/components/family/job-posts/StatsStrip";
import Pagination from "@/components/shared/Pagination";

export default function FamilyRequestsPage() {
  const tList = useTranslations("jobPostsList");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const { data, isLoading, error, refetch } = useFamilyCareRequests();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const jobs: JobPost[] = Array.isArray(data?.jobPosts)
    ? data.jobPosts
    : Array.isArray(data)
    ? data
    : [];

  const totalPages = Math.ceil(jobs.length / ITEMS_PER_PAGE);
  const paginatedJobs = jobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-5xl w-full mx-auto space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1b1c1c]">{tList("title")}</h1>
        </div>
        <Link
          href="/family/job-posts/new"
          className="flex items-center gap-2 px-5 py-3 bg-[#1f8a8a] text-white font-bold text-sm rounded-xl hover:bg-[#0d8282] transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>
          {tList("postNewRequest")}
        </Link>
      </div>

      {/* Stats strip */}
      <StatsStrip jobs={jobs} isLoading={isLoading} />

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          <div>
            <p className="text-sm font-semibold">{tList("failedLoad")}</p>
            <p className="text-xs mt-0.5">{error?.response?.data?.message ?? tList("pleaseTryAgain")}</p>
            <button onClick={refetch} className="mt-2 text-xs font-bold underline cursor-pointer">{tList("retry")}</button>
          </div>
        </div>
      )}

      {/* Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && jobs.length === 0 && <EmptyState />}

      {/* List */}
      {!isLoading && jobs.length > 0 && (
        <div className="space-y-6">
          <div className="space-y-4">
            {paginatedJobs.map((job) => <RequestCard key={job._id} job={job} />)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-4 flex justify-center">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
