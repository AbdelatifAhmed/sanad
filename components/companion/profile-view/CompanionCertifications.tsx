"use client";

import React from "react";
import { ShieldCheck, CheckCircle, Circle } from "lucide-react";
import { useTranslations } from "next-intl";

interface CompanionDocuments {
  nationalIdCard?: { url: string; public_id: string };
  criminalRecord?: { url: string; public_id: string };
  syndicateCard?: { url: string; public_id: string };
  Certificates?: Array<{ name: string; url: string; public_id: string }>;
}

interface CompanionCertificationsProps {
  documents?: CompanionDocuments;
  verificationStatus?: string;
}

export default function CompanionCertifications({ documents, verificationStatus }: CompanionCertificationsProps) {
  const t = useTranslations("companionProfile");
  const isVerified = verificationStatus === "verified";

  const documentItems = [];

  if (documents?.nationalIdCard?.url) {
    documentItems.push({
      title: t("nationalId") || "National Identity Card",
      verified: isVerified,
      desc: isVerified ? (t("idVerified") || "Identity verified securely") : (t("idPending") || "Pending verification"),
    });
  }

  if (documents?.criminalRecord?.url) {
    documentItems.push({
      title: t("criminalRecord") || "Criminal Record Check",
      verified: isVerified,
      desc: isVerified ? (t("recordVerified") || "Passed background check") : (t("recordPending") || "Pending record review"),
    });
  }

  if (documents?.syndicateCard?.url) {
    documentItems.push({
      title: t("syndicateLicense") || "Professional Syndicate License",
      verified: isVerified,
      desc: isVerified ? (t("syndicateVerified") || "Verified healthcare license") : (t("syndicatePending") || "Pending verification"),
    });
  }

  if (documents?.Certificates && Array.isArray(documents.Certificates)) {
    documents.Certificates.forEach((cert) => {
      if (cert.url) {
        documentItems.push({
          title: cert.name || "Certificate",
          verified: isVerified,
          desc: isVerified ? "Verified Certificate" : "Pending review",
        });
      }
    });
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-sand-high/60 shadow-soft space-y-4">
      <h3 className="font-display text-base font-bold text-[#012d1d] flex items-center gap-2 border-b border-sand-high/40 pb-3">
        <ShieldCheck className="w-5 h-5 text-[#005c53]" />
        {t("verifiedCredentials")}
      </h3>
      {documentItems.length === 0 ? (
        <p className="text-xs text-gray-400 font-semibold pt-1">
          {t("noDocuments") || "No credentials uploaded yet."}
        </p>
      ) : (
        <div className="space-y-4 pt-1">
          {documentItems.map((item, index) => (
            <div key={index} className="flex gap-3 items-start">
              {item.verified ? (
                <CheckCircle className="w-5 h-5 text-[#005c53] fill-[#e6f4f2] shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-amber-500 fill-amber-50 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className={`text-xs font-bold ${item.verified ? "text-gray-900" : "text-gray-500 font-semibold"}`}>
                  {item.title}
                </h4>
                <p className={`text-[10px] font-semibold mt-0.5 ${item.verified ? "text-[#005c53]" : "text-amber-600"}`}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
