"use client";

import dynamic from "next/dynamic";
import React from "react";

// Dynamically import the actual Leaflet Map with SSR disabled
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[180px] bg-gray-50 flex items-center justify-center text-xs font-semibold text-gray-400 gap-2 border border-gray-100 rounded-2xl animate-pulse">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      <span>Loading map...</span>
    </div>
  ),
});

export default LeafletMap;
