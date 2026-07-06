"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  confirmClassName?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmClassName = "bg-[#1f8a8a] text-white hover:bg-[#0d8282]",
  isLoading,
  onConfirm,
  onCancel,
  children,
}: ConfirmModalProps) {
  const t = useTranslations("jobPostDetails");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-[#eae7e7] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#1f8a8a]/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#1f8a8a]">help</span>
          </div>
          <div>
            <h3 className="font-bold text-[#1b1c1c] text-base">{title}</h3>
            {message && <p className="text-sm text-[#3e4949] mt-1">{message}</p>}
            {children}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 border border-[#bdc9c8] text-[#3e4949] py-2.5 rounded-xl font-semibold text-sm hover:bg-[#f0eded] transition-colors cursor-pointer"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer ${confirmClassName}`}
          >
            {isLoading ? t("processing") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
