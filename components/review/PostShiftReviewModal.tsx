"use client";

import React, { useState, useEffect } from "react";
import { Star, X, Loader2, MessageSquare, Heart } from "lucide-react";
import { useLocale } from "next-intl";
import { api } from "../../lib/services/api";

interface PostShiftReviewModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  reviewDetails?: { rating: number; comment?: string } | null;
}

export const PostShiftReviewModal: React.FC<PostShiftReviewModalProps> = ({
  bookingId,
  isOpen,
  onClose,
  onSuccess,
  reviewDetails,
}) => {
  const locale = useLocale();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const isAr = locale === "ar";
  const isReadOnly = !!reviewDetails;

  useEffect(() => {
    if (reviewDetails) {
      setRating(reviewDetails.rating);
      setComment(reviewDetails.comment || "");
    } else {
      setRating(5);
      setComment("");
    }
  }, [reviewDetails, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (rating < 1 || rating > 5) {
      setError(isAr ? "يرجى تحديد تقييم بين 1 و 5 نجوم." : "Please select a rating between 1 and 5.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const res = await api.post("/reviews", {
        bookingId,
        rating,
        comment,
      });

      if (res.data) {
        setSuccess(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      console.error("Error submitting review:", err);
      setError(err.response?.data?.error || err.message || (isAr ? "فشل إرسال التقييم" : "Failed to submit review"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={isAr ? "rtl" : "ltr"}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm"
        onClick={() => {
          if (!isLoading && !success) onClose();
        }}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white border border-stitch-outline/20 rounded-3xl w-full max-w-md p-6 overflow-hidden shadow-premium transition-all text-right">
        {/* Subtle glow background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-stitch-primary/5 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        {!isLoading && !success && (
          <button 
            onClick={onClose}
            className={`absolute top-4 p-1.5 bg-sand-low hover:bg-sand-high rounded-full border border-stitch-outline/20 transition-all text-stitch-on-surface-variant hover:text-stitch-on-surface ${
              isAr ? "left-4" : "right-4"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {success ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center text-stitch-primary">
              <Heart className="w-8 h-8 fill-stitch-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-stitch-on-surface">
                {isAr ? "تم تسجيل تقييمك بنجاح!" : "Review Submitted!"}
              </h3>
              <p className="text-xs text-stitch-on-surface-variant/80">
                {isAr 
                  ? "شكراً لتقييمك. تعليقاتكم تساعدنا في تحسين جودة خدمات الرعاية المقدمة." 
                  : "Thank you for rating your companion. Your feedback helps improve care quality."}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={`space-y-1 ${isAr ? "text-right" : "text-left"}`}>
              <span className="text-xs font-semibold text-stitch-primary uppercase tracking-widest">
                {isReadOnly ? (isAr ? "تقييمك المسجل" : "Your Submitted Review") : (isAr ? "شاركنا تجربتك" : "Share Your Experience")}
              </span>
              <h3 className="text-xl font-extrabold text-stitch-on-surface">
                {isReadOnly ? (isAr ? "مراجعة تفاصيل التقييم" : "View Review Details") : (isAr ? "تقييم أداء المرافق" : "Review Your Companion")}
              </h3>
              <p className="text-xs text-stitch-on-surface-variant/80">
                {isReadOnly 
                  ? (isAr ? "تفاصيل التقييم والتعليق المسجلة لهذه الخدمة." : "The rating and feedback registered for this care shift.")
                  : (isAr ? "كيف تقيم أداء وسلوك المرافق الصحي خلال فترة تقديم الخدمة؟" : "How would you rate the companion's performance during this shift?")}
              </p>
            </div>

            {error && (
              <div className={`p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-650 text-xs ${isAr ? "text-right" : "text-left"}`}>
                {error}
              </div>
            )}

            {/* Stars Rating Selector */}
            <div className="flex flex-col items-center py-4 space-y-2">
              <div className="flex items-center space-x-1.5 space-x-reverse">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => !isReadOnly && setRating(star)}
                    onMouseEnter={() => !isReadOnly && setHoverRating(star)}
                    onMouseLeave={() => !isReadOnly && setHoverRating(null)}
                    className={`p-1 transition-transform ${isReadOnly ? "cursor-default animate-none" : "active:scale-90"}`}
                  >
                    <Star 
                      className={`w-10 h-10 transition-colors ${
                        (hoverRating !== null ? star <= hoverRating : star <= rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-semibold text-stitch-on-surface-variant/75">
                {rating === 5 ? (isAr ? "ممتاز (5/5)" : "Excellent (5/5)") :
                 rating === 4 ? (isAr ? "جيد جداً (4/5)" : "Good (4/5)") :
                 rating === 3 ? (isAr ? "مقبول (3/5)" : "Average (3/5)") :
                 rating === 2 ? (isAr ? "ضعيف (2/5)" : "Below Average (2/5)") : 
                 (isAr ? "سيء جداً (1/5)" : "Poor (1/5)")}
              </span>
            </div>

            {/* Comment Area */}
            <div className="space-y-2">
              <label className={`text-xs font-bold text-stitch-on-surface-variant uppercase tracking-wider flex items-center gap-2 ${
                isAr ? "justify-start flex-row-reverse" : "justify-start"
              }`}>
                <MessageSquare className="w-3.5 h-3.5 text-stitch-outline" />
                <span>{isAr ? "التعليق والتقييم" : "Feedback & Comment"}</span>
              </label>
              <textarea
                value={comment}
                disabled={isReadOnly}
                onChange={(e) => setComment(e.target.value)}
                placeholder={isAr 
                  ? "ما الذي تميز به المرافق؟ هل هناك أي نقاط تقترح تحسينها؟" 
                  : "What did the companion do well? Any areas of improvement?"}
                maxLength={1000}
                rows={4}
                className={`w-full bg-sand-low border border-stitch-outline/30 focus:border-stitch-primary/50 focus:ring-1 focus:ring-stitch-primary/50 rounded-xl px-4 py-3 text-sm text-stitch-on-surface placeholder-stitch-on-surface-variant/50 focus:outline-none transition-all resize-none text-right ${isReadOnly ? "opacity-85 cursor-not-allowed bg-slate-50/50" : ""}`}
              />
            </div>

            {/* Submit Button */}
            {isReadOnly ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 bg-slate-200 hover:bg-slate-300 text-stitch-on-surface font-bold rounded-2xl shadow-soft transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer border border-slate-350"
              >
                <span>{isAr ? "إغلاق" : "Close"}</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-stitch-primary hover:bg-stitch-primary/95 text-white font-bold rounded-2xl shadow-soft hover:shadow-premium active:scale-98 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>{isAr ? "تقديم التقييم والتعليق" : "Submit Feedback"}</span>
                )}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
