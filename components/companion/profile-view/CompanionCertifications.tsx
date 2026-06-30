"use client";

import React from "react";
import { ShieldCheck, CheckCircle, Circle } from "lucide-react";
import { useTranslations } from "next-intl";

interface CompanionDocuments {
  nationalIdUrl?: string;
  criminalRecordUrl?: string;
  syndicateCardUrl?: string;
}

interface CompanionCertificationsProps {
  documents?: CompanionDocuments;
}

export default function CompanionCertifications({ documents }: CompanionCertificationsProps) {
  const t = useTranslations("companionProfile");
  const verifiedId = !!documents?.nationalIdUrl;
  const verifiedCriminal = !!documents?.criminalRecordUrl;
  const verifiedSyndicate = !!documents?.syndicateCardUrl;

  const documentItems = [
    {
      title: t("nationalId"),
      verified: verifiedId,
      desc: verifiedId ? t("idVerified") : t("idPending"),
    },
    {
      title: t("criminalRecord"),
      verified: verifiedCriminal,
      desc: verifiedCriminal ? t("recordVerified") : t("recordPending"),
    },
    {
      title: t("syndicateLicense"),
      verified: verifiedSyndicate,
      desc: verifiedSyndicate ? t("syndicateVerified") : t("syndicateOptional"),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-3xl border border-sand-high/60 shadow-soft space-y-4">
      <h3 className="font-display text-base font-bold text-[#012d1d] flex items-center gap-2 border-b border-sand-high/40 pb-3">
        <ShieldCheck className="w-5 h-5 text-[#005c53]" />
        {t("verifiedCredentials")}
      </h3>
      <div className="space-y-4 pt-1">
        {documentItems.map((item, index) => (
          <div key={index} className="flex gap-3 items-start">
            {item.verified ? (
              <CheckCircle className="w-5 h-5 text-[#005c53] fill-[#e6f4f2] shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className={`text-xs font-bold ${item.verified ? "text-gray-900" : "text-gray-400 font-semibold"}`}>
                {item.title}
              </h4>
              <p className={`text-[10px] font-semibold mt-0.5 ${item.verified ? "text-[#005c53]" : "text-gray-400"}`}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
