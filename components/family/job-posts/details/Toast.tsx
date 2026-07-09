"use client";

import React from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  visible: boolean;
}

export default function Toast({ message, type, visible }: ToastProps) {
  if (!visible) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl font-semibold text-sm transition-all duration-300 ${
        type === "success"
          ? "bg-[#1f8a8a] text-white"
          : "bg-red-600 text-white"
      }`}
    >
      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
        {type === "success" ? "check_circle" : "error"}
      </span>
      {message}
    </div>
  );
}
