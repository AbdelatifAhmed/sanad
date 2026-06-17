import React from "react";
import { Award, CheckCircle } from "lucide-react";

interface Certification {
  title: string;
  issuer: string;
}

interface CompanionCertificationsProps {
  certifications: Certification[];
}

export default function CompanionCertifications({ certifications }: CompanionCertificationsProps) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-sand-high/60 shadow-soft space-y-4">
      <h3 className="font-display text-base font-bold text-[#012d1d] flex items-center gap-2 border-b border-sand-high/40 pb-3">
        <Award className="w-5 h-5 text-[#005c53]" />
        Certifications
      </h3>
      <div className="space-y-4 pt-1">
        {certifications.map((cert, index) => (
          <div key={index} className="flex gap-3">
            <CheckCircle className="w-4 h-4 text-[#005c53] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-gray-800">
                {cert.title}
              </h4>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                {cert.issuer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
