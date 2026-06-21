import { ProposalDetail } from "@/lib/api/proposal.api";
import { Calendar, Eye, FileText, MessageSquare, Search, User } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";

interface ApplicationCardProps {
  proposal: ProposalDetail;
  onMessage?: () => void;
  onViewRequest?: () => void;
}

export default function ApplicationCard({ proposal, onMessage, onViewRequest }: ApplicationCardProps) {
  const locale = useLocale();
  const { jobPostId, proposedRate, status, createdAt } = proposal;
  
  if (!jobPostId) return null;

  const { title, serviceType, location, familyId } = jobPostId;

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
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

  // Status styling configurations
  const statusConfig = {
    pending: {
      text: locale === "ar" ? "قيد الانتظار" : "PENDING",
      classes: "bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]",
    },
    accepted: {
      text: locale === "ar" ? "مقبول" : "ACCEPTED",
      classes: "bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]",
    },
    rejected: {
      text: locale === "ar" ? "مرفوض" : "REJECTED",
      classes: "bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]",
    },
  }[status] || {
    text: status.toUpperCase(),
    classes: "bg-gray-100 text-gray-800 border border-gray-200",
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow h-full">
      <div className="space-y-4 md:space-y-6">
        
        {/* Title and Status Badge */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-bold text-gray-900 leading-snug line-clamp-2">
            {title}
          </h3>
          <span className={`text-[10px] md:text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${statusConfig.classes}`}>
            {statusConfig.text}
          </span>
        </div>

        {/* Requested By */}
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
          <User className="w-4 h-4 text-gray-400" />
          <span>
            {locale === "ar" ? "طلب من عائلة:" : "Requested by:"}{" "}
            <span className="text-stitch-primary font-bold">
              {familyId?.name || (locale === "ar" ? "مستخدم مناد" : "Sanad User")}
            </span>
          </span>
        </div>

        {/* Details Gray Box */}
        <div className="bg-[#FCF9F6] rounded-2xl p-4 grid grid-cols-3 gap-2 md:gap-4 text-center border border-gray-50">
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {locale === "ar" ? "النوع" : "TYPE"}
            </span>
            <span className="text-xs md:text-sm font-bold text-gray-700 mt-1 truncate">
              {getServiceTypeName(serviceType)}
            </span>
          </div>
          <div className="flex flex-col text-left border-l border-r border-gray-200/50 px-2 md:px-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {locale === "ar" ? "السعر" : "RATE"}
            </span>
            <span className="text-xs md:text-sm font-bold text-gray-700 mt-1 truncate">
              {proposedRate} {locale === "ar" ? "ج.م/س" : "EGP/hr"}
            </span>
          </div>
          <div className="flex flex-col text-left pl-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {locale === "ar" ? "الموقع" : "LOCATION"}
            </span>
            <span className="text-xs md:text-sm font-bold text-gray-700 mt-1 truncate">
              {location?.city || (locale === "ar" ? "غير محدد" : "Not Set")}
            </span>
          </div>
        </div>

        {/* Date Applied */}
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>
            {locale === "ar" ? "تاريخ التقديم:" : "Applied:"} {formatDate(createdAt)}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
        {status !== "rejected" ? (
          <>
            <button
              onClick={onViewRequest}
              className="flex-1 py-3 px-4 bg-white text-stitch-primary border border-stitch-primary/30 hover:border-stitch-primary hover:bg-stitch-primary/5 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              {locale === "ar" ? "عرض الطلب" : "View Request"}
            </button>
            <button
              onClick={onMessage}
              className="flex-1 py-3 px-4 bg-stitch-primary hover:bg-stitch-primary-container text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              {locale === "ar" ? "مراسلة العائلة" : "Message Family"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onViewRequest}
              className="flex-1 py-3 px-4 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              {locale === "ar" ? "التفاصيل" : "Details"}
            </button>
            <Link
              href="/companion/requests"
              className="flex-1 py-3 px-4 bg-white text-stitch-primary border border-stitch-primary/30 hover:border-stitch-primary hover:bg-stitch-primary/5 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              {locale === "ar" ? "طلبات مشابهة" : "Find Similar"}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
