import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { UserPlus, AlertCircle } from "lucide-react";

export interface FamilyMember {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female";
  category: "elderly" | "special_needs";
  avatar?: string;
}

interface WhoNeedsCareProps {
  members: FamilyMember[];
  selectedId: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
  error?: string;
}

export default function WhoNeedsCare({
  members = [],
  selectedId = "",
  onSelect,
  isLoading = false,
  error,
}: WhoNeedsCareProps) {
  const t = useTranslations("bookingForm");

  return (
    <div className="space-y-4 w-full">
      {/* Header Row */}
      <div className="flex justify-between items-center">
        <h3 className="font-display font-bold text-lg text-[#012d1d]">
          {t("whoNeedsCare")}
        </h3>
        <Link 
          href="/family/profile" 
          className="text-sm font-bold text-[#1f8a8a] hover:text-[#166f6f] transition-all hover:underline"
        >
          {t("manageProfiles")}
        </Link>
      </div>

      {/* Grid of Profile Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
        {isLoading ? (
          // Skeleton Loading State
          Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-sand-high bg-white flex items-center gap-4 animate-pulse shadow-soft h-[96px]"
            >
              <div className="w-14 h-14 rounded-full bg-sand-low shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-sand-low rounded w-3/4" />
                <div className="h-3 bg-sand-low rounded w-1/2" />
              </div>
            </div>
          ))
        ) : (
          members.map((member) => {
            const isSelected = member.id === selectedId;
            const fallbackAvatar = member.gender === "female" ? "/avatar_2.jpg" : "/avatar_1.jpg";
            const isElderly = member.category === "elderly";

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => onSelect?.(member.id)}
                className={`p-5 rounded-2xl border text-left flex items-center gap-4 transition-all hover:scale-[1.01] active:scale-[0.99] w-full cursor-pointer ${
                  isSelected 
                    ? "bg-white border-2 border-[#005c53] shadow-md" 
                    : "bg-white border-sand-high hover:border-sand-highest shadow-soft"
                }`}
              >
                {/* Profile Avatar */}
                <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-sand-low border border-sand-high">
                  <img 
                    src={member.avatar || fallbackAvatar} 
                    alt={member.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>

                {/* Info */}
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="font-bold text-sm text-[#012d1d] truncate">
                    {member.name}
                  </p>
                  
                  {/* Category & Age badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isElderly 
                        ? "bg-[#e6f4f2] text-[#005c53]" 
                        : "bg-[#eef2ff] text-[#4f46e5]"
                    }`}>
                      {isElderly ? t("elderly") : t("specialNeeds")}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      • {member.age} {t("years")}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}

        {/* Add Family Member Card */}
        <Link
          href="/family/profile?add=true"
          className="p-5 rounded-2xl border border-dashed border-gray-300 hover:border-gray-400 bg-transparent flex flex-col items-center justify-center gap-1.5 text-center transition-all hover:scale-[1.01] active:scale-[0.99] min-h-[96px] cursor-pointer"
        >
          <UserPlus className="w-6 h-6 text-gray-400" />
          <span className="text-xs font-bold text-gray-500">
            {t("addFamilyMember")}
          </span>
        </Link>
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

