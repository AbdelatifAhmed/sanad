"use client";

import Link from "next/link";
import { useLocale } from "next-intl";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams?: Record<string, string | string[] | undefined>;
  baseUrl?: string;
  onPageChange?: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  searchParams = {},
  baseUrl = "",
  onPageChange,
}: PaginationProps) {
  const locale = useLocale();

  const getHref = (pageNumber: number) => {
    if (onPageChange) return "#";
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, val]) => {
      if (val !== undefined && key !== "page") {
        if (Array.isArray(val)) {
          val.forEach((v) => params.append(key, v));
        } else {
          params.set(key, String(val));
        }
      }
    });
    params.set("page", String(pageNumber));
    return `${baseUrl}?${params.toString()}`;
  };

  const handleClick = (e: React.MouseEvent, pageNumber: number) => {
    if (onPageChange) {
      e.preventDefault();
      onPageChange(pageNumber);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "ellipsis", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "ellipsis", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2 pt-4 select-none">
      {/* Prev Arrow */}
      {currentPage > 1 ? (
        <Link
          href={getHref(currentPage - 1)}
          onClick={(e) => handleClick(e, currentPage - 1)}
          className="w-10 h-10 bg-white border border-stitch-outline/10 rounded-xl flex items-center justify-center text-stitch-on-surface hover:bg-gray-50 shadow-sm transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl rtl:rotate-180">chevron_left</span>
        </Link>
      ) : (
        <span className="w-10 h-10 bg-gray-50/50 border border-stitch-outline/5 rounded-xl flex items-center justify-center text-stitch-on-surface-variant/30 pointer-events-none">
          <span className="material-symbols-outlined text-xl rtl:rotate-180">chevron_left</span>
        </span>
      )}

      {/* Pages List */}
      {pages.map((page, idx) => {
        if (page === "ellipsis") {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="w-10 h-10 flex items-center justify-center text-stitch-on-surface-variant/50 font-semibold"
            >
              ...
            </span>
          );
        }

        const isActive = page === currentPage;
        return isActive ? (
          <span
            key={`page-${page}`}
            className="w-10 h-10 bg-[#005f56] text-white font-bold rounded-xl flex items-center justify-center shadow-sm cursor-default"
          >
            {page}
          </span>
        ) : (
          <Link
            key={`page-${page}`}
            href={getHref(page)}
            onClick={(e) => handleClick(e, page)}
            className="w-10 h-10 bg-white border border-stitch-outline/10 rounded-xl flex items-center justify-center text-stitch-on-surface-variant hover:bg-gray-50 shadow-sm font-semibold transition-colors cursor-pointer"
          >
            {page}
          </Link>
        );
      })}

      {/* Next Arrow */}
      {currentPage < totalPages ? (
        <Link
          href={getHref(currentPage + 1)}
          onClick={(e) => handleClick(e, currentPage + 1)}
          className="w-10 h-10 bg-white border border-stitch-outline/10 rounded-xl flex items-center justify-center text-stitch-on-surface hover:bg-gray-50 shadow-sm transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl rtl:rotate-180">chevron_right</span>
        </Link>
      ) : (
        <span className="w-10 h-10 bg-gray-50/50 border border-stitch-outline/5 rounded-xl flex items-center justify-center text-stitch-on-surface-variant/30 pointer-events-none">
          <span className="material-symbols-outlined text-xl rtl:rotate-180">chevron_right</span>
        </span>
      )}
    </div>
  );
}
