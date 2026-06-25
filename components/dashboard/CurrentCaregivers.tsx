import React from "react";
import Link from "next/link";
import { Calendar, MessageSquare, Briefcase, ArrowRight } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";

interface CaregiverItem {
  id: string;
  name: string;
  avatar: any;
  role: string;
  subtext: string;
  status: string;
  scheduleText: string;
  companionId: string | null;
}

interface CurrentCaregiversProps {
  caregivers: CaregiverItem[];
}

export default function CurrentCaregivers({ caregivers }: CurrentCaregiversProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl font-bold text-[#012d1d]">
          Current Caregivers
        </h2>
        <Link 
          href="/family/companions" 
          className="text-xs font-bold text-[#1f8a8a] flex items-center gap-1 hover:underline transition-all"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {caregivers.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-sand-high/60 shadow-soft text-center text-gray-500 text-sm font-medium">
          No current care arrangements or pending requests.
        </div>
      ) : (
        <div className="space-y-4">
          {caregivers.map((caregiver) => {
            const isPending = caregiver.status === "pending";

            return (
              <div 
                key={caregiver.id} 
                className="bg-white p-5 rounded-3xl border border-sand-high shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  {isPending ? (
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-sand-high shrink-0">
                      <Briefcase className="w-5 h-5 stroke-[2]" />
                    </div>
                  ) : (
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-sand-high">
                        <img 
                          src={getAvatarUrl(caregiver.avatar, "/avatar_2.jpg") || "/avatar_2.jpg"} 
                          alt={caregiver.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-body font-bold text-sm text-gray-900">
                        {caregiver.name}
                      </h4>
                      {!isPending && caregiver.role && (
                        <span className="text-[10px] font-extrabold text-gray-500 bg-gray-100 border border-gray-200/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {caregiver.role}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">
                      {caregiver.subtext}
                    </p>
                    {caregiver.scheduleText && (
                      <div className="flex items-center gap-1.5 text-xs text-[#2e7d32] font-semibold mt-2 bg-[#e8f5e9]/70 px-2.5 py-1 rounded-lg w-fit border border-[#c8e6c9]/30">
                        <Calendar className="w-3.5 h-3.5 text-[#2e7d32]/80" />
                        <span>{caregiver.scheduleText}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isPending ? (
                  <div className="self-end sm:self-center px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wide bg-[#fff3cd] text-[#856404] border border-[#ffeeba]/50">
                    ⏳ Pending Confirmation
                  </div>
                ) : (
                  <Link 
                    href="/family/messages"
                    className="self-end sm:self-center w-10 h-10 rounded-full bg-gray-50 hover:bg-[#e6f4f2] hover:text-[#015347] flex items-center justify-center text-gray-400 transition-colors border border-sand-high cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
