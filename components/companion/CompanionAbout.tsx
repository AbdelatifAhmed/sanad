import React from "react";
import { User } from "lucide-react";

interface CompanionAboutProps {
  bio: string[];
}

export default function CompanionAbout({ bio }: CompanionAboutProps) {
  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-sand-high/60 shadow-soft space-y-4">
      <h3 className="font-display text-lg font-bold text-[#012d1d] flex items-center gap-2 border-b border-sand-high/40 pb-3">
        <User className="w-5 h-5 text-[#005c53]" />
        About Me
      </h3>
      <div className="space-y-4 text-gray-500 text-sm leading-relaxed font-semibold">
        {bio.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
