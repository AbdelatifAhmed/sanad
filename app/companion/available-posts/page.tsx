"use client";

import { useState } from "react";
import { useJobPostsForCompanions, useSendProposal } from "@/lib/hooks";
import { JobPost } from "@/types";

export default function AvailablePostsPage() {
  const { data: jobsData, isLoading: jobsLoading, refetch } = useJobPostsForCompanions();
  const { execute: submitProposal, isLoading: submitting } = useSendProposal();

  const jobs: JobPost[] = jobsData?.jobs || jobsData || [];

  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [proposedRate, setProposedRate] = useState<number | "">("");
  const [coverLetter, setCoverLetter] = useState("");
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleOpenProposal = (job: JobPost) => {
    setSelectedJob(job);
    setProposedRate(job.budgetPerHour || "");
    setCoverLetter("");
    setErrors({});
  };

  const handleCloseProposal = () => {
    setSelectedJob(null);
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    const errs: Record<string, string> = {};
    if (proposedRate === "" || Number(proposedRate) < 1) {
      errs.proposedRate = "الرجاء إدخال سعر ساعة صالح";
    }
    if (!coverLetter.trim() || coverLetter.trim().length < 20) {
      errs.coverLetter = "الرسالة يجب أن لا تقل عن 20 حرفاً لتوضيح مدى ملاءمتك للطلب";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      await submitProposal({
        jobPostId: selectedJob._id,
        proposedRate: Number(proposedRate),
        coverLetter: coverLetter.trim(),
      });
      showToast("تم إرسال عرضك بنجاح!", "success");
      handleCloseProposal();
      refetch();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "فشل إرسال العرض.";
      showToast(msg, "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4" dir="rtl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 left-5 z-50 flex items-center gap-3 p-4 rounded-xl shadow-lg border text-sm font-bold animate-fade-in ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span className="material-symbols-outlined">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <p>{toast.message}</p>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#1f8a8a] mb-2">الطلبات المتاحة</h1>
        <p className="text-sm text-[#3e4949]">تصفح طلبات الرعاية المنزلية المتاحة وقدم عروضك مباشرة للعائلات.</p>
      </div>

      {jobsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-[#eae7e7] space-y-4 animate-pulse">
              <div className="h-6 bg-gray-200 w-2/3 rounded-lg" />
              <div className="h-4 bg-gray-200 w-1/2 rounded-lg" />
              <div className="h-20 bg-gray-100 rounded-xl" />
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 w-20 rounded-full" />
                <div className="h-8 bg-gray-200 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-white rounded-3xl p-6 border border-[#eae7e7] shadow-soft hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-3">
                  <span className="px-3 py-1 bg-[#1f8a8a]/10 text-[#1f8a8a] text-xs font-bold rounded-full">
                    {job.serviceType === "elderly_care"
                      ? "رعاية كبار السن"
                      : job.serviceType === "companionship"
                      ? "مرافقة مسن"
                      : job.serviceType === "home_nursing"
                      ? "تمريض منزلي"
                      : job.serviceType === "physical_therapy"
                      ? "علاج طبيعي"
                      : "رعاية أطفال"}
                  </span>
                  <span className="text-lg font-extrabold text-[#1f8a8a]">
                    {job.budgetPerHour} ريال / ساعة
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#1b1c1c] mb-2">{job.title}</h3>
                <p className="text-sm text-[#3e4949] line-clamp-3 mb-4 leading-relaxed">
                  {job.description}
                </p>

                {/* Required Skills Badges */}
                {job.requiredSkills && job.requiredSkills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-[#1b1c1c] mb-2">المهارات المطلوبة:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.requiredSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-md border border-amber-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location and schedule details */}
                <div className="grid grid-cols-2 gap-3 text-xs text-[#3e4949] mb-4 bg-[#eae7e7]/30 p-3 rounded-2xl">
                  <div className="flex items-center gap-1.5 font-medium col-span-2">
                    <span className="material-symbols-outlined text-[#1f8a8a] text-sm">location_on</span>
                    <span>{job.location?.readableAddress || job.location?.city || "المنطقة"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-[#1f8a8a] text-sm">calendar_today</span>
                    <span>المدة: {job.schedule?.durationInWeeks} أسابيع</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-[#1f8a8a] text-sm">schedule</span>
                    <span>{job.schedule?.startTime} - {job.schedule?.endTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-[#1f8a8a] text-sm">wc</span>
                    <span>الجنس المفضل: {job.preferredGender === "male" ? "ذكر" : job.preferredGender === "female" ? "أنثى" : "لا يهم"}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenProposal(job)}
                className="w-full mt-4 h-12 bg-[#1f8a8a] text-white rounded-xl text-sm font-bold hover:bg-[#0d8282] transition-all flex items-center justify-center gap-2"
              >
                تقديم عرض سعر
                <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-10 bg-white rounded-3xl border border-[#eae7e7] text-center text-[#3e4949]">
          <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">feed</span>
          <p className="font-medium text-lg">لا توجد طلبات رعاية متاحة حالياً.</p>
        </div>
      )}

      {/* Proposal Overlay Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-[#eae7e7] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#bdc9c8]/30 pb-4 mb-4">
              <h2 className="text-2xl font-bold text-[#1f8a8a]">تقديم عرض على طلب العمل</h2>
              <button
                type="button"
                onClick={handleCloseProposal}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Locked TaskList & Gender preference */}
            <div className="space-y-4 mb-6 bg-[#eae7e7]/20 p-4 rounded-2xl border border-[#bdc9c8]/20">
              <h3 className="font-bold text-[#1b1c1c] text-sm">المهام اليومية المطلوبة من العائلة (مغلقة):</h3>
              {selectedJob.taskList && selectedJob.taskList.length > 0 ? (
                <ul className="space-y-2">
                  {selectedJob.taskList.map((task, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-[#3e4949] font-medium">
                      <span className="material-symbols-outlined text-[#1f8a8a] text-sm">lock</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#3e4949]/70">رعاية عامة ومتابعة متطلبات الحالة اليومية.</p>
              )}

              <div className="border-t border-[#bdc9c8]/30 pt-3 flex justify-between text-sm text-[#3e4949] font-semibold">
                <span>الجنس المفضل المطلوب:</span>
                <span className="text-[#1f8a8a]">
                  {selectedJob.preferredGender === "male" ? "ذكر فقط" : selectedJob.preferredGender === "female" ? "أنثى فقط" : "لا يفضل جنس محدد"}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Proposed Hourly Rate */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="rate">سعر الساعة المقترح الخاص بك (ريال سعودي) *</label>
                <input
                  id="rate"
                  type="number"
                  min={1}
                  value={proposedRate}
                  onChange={(e) => {
                    setProposedRate(e.target.value === "" ? "" : Number(e.target.value));
                    setErrors((prev) => ({ ...prev, proposedRate: "" }));
                  }}
                  className="w-full h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
                />
                {errors.proposedRate && <p className="text-xs text-red-500">{errors.proposedRate}</p>}
                <p className="text-xs text-[#3e4949]/70">ميزانية العائلة المقترحة هي {selectedJob.budgetPerHour} ريال سعودي.</p>
              </div>

              {/* Cover Letter */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="cover">رسالة التعريف والمهارات المتاحة *</label>
                <textarea
                  id="cover"
                  rows={5}
                  value={coverLetter}
                  onChange={(e) => {
                    setCoverLetter(e.target.value);
                    setErrors((prev) => ({ ...prev, coverLetter: "" }));
                  }}
                  placeholder="اكتب للعائلة لماذا أنت الشخص المثالي لهذه الوظيفة وكيف ستعتني بالمستفيد..."
                  className="w-full bg-white border border-[#bdc9c8] rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all resize-none"
                />
                {errors.coverLetter && <p className="text-xs text-red-500">{errors.coverLetter}</p>}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#bdc9c8]/30">
                <button
                  type="button"
                  onClick={handleCloseProposal}
                  className="px-5 h-12 rounded-xl border border-[#bdc9c8] text-[#3e4949] font-bold text-sm hover:bg-[#eae7e7]/30 transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-8 h-12 rounded-xl bg-[#1f8a8a] text-white font-bold text-sm hover:bg-[#0d8282] transition-all disabled:opacity-50"
                >
                  {submitting ? "جاري الإرسال..." : "إرسال العرض"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
