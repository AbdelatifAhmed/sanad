"use client";

import React from "react";
import { useLocale } from "next-intl";
import { Star } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";

interface ReviewItem {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  familyId: {
    _id: string;
    name: string;
    avatar?: any;
  } | null;
}

interface CompanionReviewsProps {
  reviews: ReviewItem[];
}

export default function CompanionReviews({ reviews }: CompanionReviewsProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : "5.0";

  // Render stars helper
  const renderStars = (rating: number, size = 16) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => {
          const filled = i < Math.round(rating);
          return (
            <Star
              key={i}
              size={size}
              className={`${
                filled ? "text-amber-500 fill-amber-500" : "text-gray-200"
              }`}
            />
          );
        })}
      </div>
    );
  };

  const getInitials = (name: string): string => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-sand-high shadow-soft space-y-6 text-[#1c1c1a]" dir={isRtl ? "rtl" : "ltr"}>
      {/* Title & Summary Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-5 border-b border-sand-high">
        <div>
          <h2 className="font-display text-xl font-bold text-[#012d1d]">
            {isRtl ? "تقييمات العائلات" : "Family Reviews"}
          </h2>
          <p className="text-xs text-[#3e4949]/70 mt-1">
            {isRtl
              ? `آراء وتقييمات العائلات التي تعاملت مع المرافق (${totalReviews} تقييم)`
              : `Feedback from families who booked this companion (${totalReviews} reviews)`}
          </p>
        </div>

        {totalReviews > 0 && (
          <div className="flex items-center gap-3 bg-sand-low px-4 py-2.5 rounded-2xl border border-sand-high w-fit">
            <span className="text-3xl font-extrabold text-[#012d1d] font-stitch-display">
              {averageRating}
            </span>
            <div className="space-y-0.5">
              {renderStars(Number(averageRating), 14)}
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                {isRtl ? "متوسط التقييم" : "Average Rating"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      {totalReviews === 0 ? (
        <div className="py-12 text-center text-[#3e4949]/50 text-sm bg-sand-low/30 border border-dashed border-sand-high rounded-2xl space-y-2">
          <Star className="w-8 h-8 mx-auto text-gray-300" />
          <p>{isRtl ? "لا توجد تقييمات لهذا المرافق بعد." : "No reviews for this companion yet."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) => {
            const familyName = review.familyId?.name || (isRtl ? "عضو مجتمع سند" : "Sanad Member");
            const avatarUrl = getAvatarUrl(review.familyId?.avatar);
            const reviewDate = new Date(review.createdAt).toLocaleDateString(
              locale === "ar" ? "ar-EG" : "en-US",
              { year: "numeric", month: "long" }
            );

            return (
              <div
                key={review._id}
                className="bg-[#fbfaf7] border border-sand-high/70 p-5 rounded-2xl hover:shadow-soft transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Family Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={familyName}
                          className="w-10 h-10 rounded-full object-cover border border-sand-high shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-stitch-primary/10 text-stitch-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {getInitials(familyName)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-[#012d1d]">{familyName}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{reviewDate}</p>
                      </div>
                    </div>
                    {renderStars(review.rating, 12)}
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-xs text-[#3e4949]/90 leading-relaxed font-medium">
                      "{review.comment}"
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
