import React from "react";

export default function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#eae7e7] p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#f0eded] shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex justify-between">
            <div className="h-5 w-40 bg-[#f0eded] rounded-lg" />
            <div className="h-6 w-16 bg-[#f0eded] rounded-full" />
          </div>
          <div className="h-3 w-full bg-[#f0eded] rounded-lg" />
          <div className="h-3 w-3/4 bg-[#f0eded] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
