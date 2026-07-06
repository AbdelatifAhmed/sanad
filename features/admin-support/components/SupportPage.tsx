"use client";

import React from "react";
import { AdminSupportChat } from "./AdminSupportChat";

interface SupportPageProps {
  /** "family" | "companion" — used for contextual copy only */
  userRole?: "family" | "companion";
}

export const SupportPage: React.FC<SupportPageProps> = ({ userRole = "family" }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-teal-600 text-xl">support_agent</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Contact Admin</h1>
            <p className="text-sm text-gray-500">
              {userRole === "family"
                ? "Have a question or need help with a booking? Our team is here for you."
                : "Need support, have a complaint, or want to report something? Reach out to us directly."}
            </p>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { icon: "help", label: "General Inquiries", desc: "Questions about the platform" },
          { icon: "report_problem", label: "Complaints", desc: "Report an issue or concern" },
          { icon: "info", label: "Account Support", desc: "Help with your account" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-teal-600 text-base">{item.icon}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">{item.label}</p>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chat — fills remaining space */}
      <div className="flex-1 min-h-0" style={{ minHeight: "420px" }}>
        <AdminSupportChat />
      </div>
    </div>
  );
};
