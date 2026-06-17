import React from "react";
import { PlusSquare } from "lucide-react";

interface CompanionSkillsProps {
  skills: string[];
}

export default function CompanionSkills({ skills }: CompanionSkillsProps) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-sand-high/60 shadow-soft space-y-4">
      <h3 className="font-display text-base font-bold text-[#012d1d] flex items-center gap-2 border-b border-sand-high/40 pb-3">
        <PlusSquare className="w-5 h-5 text-[#005c53]" />
        Clinical Skills
      </h3>
      <div className="flex flex-wrap gap-2 pt-1">
        {skills.map((skill, index) => (
          <span 
            key={index} 
            className="bg-[#fcf9f6] text-gray-700 border border-sand-high/80 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-gray-50 cursor-default"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
