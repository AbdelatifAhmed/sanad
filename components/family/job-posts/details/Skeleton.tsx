import React from "react";

export default function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="h-4 w-32 bg-[#f0eded] rounded-lg" />
      <div className="h-8 w-72 bg-[#f0eded] rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#eae7e7] p-6 h-40" />
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-[#eae7e7] p-6 h-52" />
    </div>
  );
}
