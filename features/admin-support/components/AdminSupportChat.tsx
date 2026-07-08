"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useAuthStore } from "../../../store/authStore";
import { useAdminSupport } from "../hooks/useAdminSupport";
import { AdminMessage } from "../types";
import { useTranslations } from "next-intl";

/* ─── tiny helpers ─────────────────────────────────────────────────────── */
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
}
function formatFileSize(bytes: number | null | undefined) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ══════════════════════════════════════════════════════════════════════════
   AdminSupportChat
   A self-contained support-chat widget for Family and Companion dashboards.
   Drop it anywhere — it manages its own state via useAdminSupport.
══════════════════════════════════════════════════════════════════════════ */
export const AdminSupportChat: React.FC = () => {
  const { user } = useAuthStore();
  const userId = user?.id ?? (user as any)?._id ?? null;
  const t = useTranslations("adminSupport");

  const {
    conversation,
    messages,
    isLoadingConv,
    isLoadingMsgs,
    isSending,
    isUploading,
    isAdminTyping,
    error,
    sendMessage,
    uploadFile,
    emitTyping,
  } = useAdminSupport(userId);

  const [text, setText] = useState("");
  const [firstSubject, setFirstSubject] = useState("");
  const [showSubjectInput, setShowSubjectInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

  /* scroll to bottom whenever messages change */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAdminTyping]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || isSending) return;
    const subject = !conversation ? firstSubject.trim() : undefined;
    await sendMessage(text.trim(), subject || undefined);
    setText("");
    setFirstSubject("");
    setShowSubjectInput(false);
    textareaRef.current?.focus();
  }, [text, firstSubject, conversation, isSending, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const isResolved = conversation?.status === "resolved";

  /* ─── Status banner ─────────────────────────────────────────────── */
  const StatusBanner = () => {
    if (!isResolved) return null;
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-b border-green-100 text-green-700 text-xs font-medium">
        <span className="material-symbols-outlined text-base">check_circle</span>
        {t("conversationResolved")}
      </div>
    );
  };

  /* ─── Message bubble ────────────────────────────────────────────── */
  const Bubble = ({ msg }: { msg: AdminMessage }) => {
    const isSelf = msg.senderRole !== "admin";

    return (
      <div className={`flex w-full ${isSelf ? "justify-end" : "justify-start"} mb-3`}>
        {/* Admin avatar */}
        {!isSelf && (
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs mr-2 shrink-0 self-end">
            A
          </div>
        )}

        <div className={`flex flex-col max-w-[72%] ${isSelf ? "items-end" : "items-start"}`}>
          {/* Sender label for admin messages */}
          {!isSelf && (
            <span className="text-[10px] text-gray-400 mb-1 px-1">{t("admin")}</span>
          )}

          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
              isSelf
                ? "bg-teal-600 text-white rounded-tr-sm"
                : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
            }`}
          >
            {/* Text */}
            {msg.messageType === "text" && <p className="m-0 whitespace-pre-wrap">{msg.text}</p>}

            {/* Image */}
            {msg.messageType === "image" && msg.attachment?.url && (
              <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={msg.attachment.url}
                  alt={msg.attachment.fileName ?? t("image")}
                  className="max-w-[240px] max-h-[180px] rounded-xl object-cover"
                  loading="lazy"
                />
              </a>
            )}

            {/* PDF / Document */}
            {(msg.messageType === "pdf" || msg.messageType === "document") && msg.attachment?.url && (
              <a
                href={msg.attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className={`flex items-center gap-2 no-underline ${isSelf ? "text-white" : "text-teal-700"}`}
              >
                <span className="material-symbols-outlined text-2xl">
                  {msg.messageType === "pdf" ? "picture_as_pdf" : "description"}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">{msg.attachment.fileName ?? t("file")}</span>
                  {msg.attachment.fileSize && (
                    <span className="text-[10px] opacity-70">{formatFileSize(msg.attachment.fileSize)}</span>
                  )}
                </div>
                <span className="material-symbols-outlined text-sm ml-1">download</span>
              </a>
            )}
          </div>

          {/* Timestamp + read */}
          <div className="flex items-center gap-1 mt-1 px-1">
            <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
            {isSelf && (
              <span className={`material-symbols-outlined text-xs ${msg.isRead ? "text-teal-500" : "text-gray-300"}`}>
                {msg.isRead ? "done_all" : "done"}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ─── Empty / loading states ────────────────────────────────────── */
  if (isLoadingConv) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <span className="material-symbols-outlined text-5xl animate-spin" style={{ animationDuration: "1s" }}>autorenew</span>
        <p className="text-sm">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-lg">support_agent</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800">{t("sanadSupport")}</h3>
          <p className="text-xs text-gray-500">
            {conversation ? (
              <span className={`inline-flex items-center gap-1 ${isResolved ? "text-green-600" : "text-teal-600"}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                {isResolved ? t("resolved") : t("open")}
              </span>
            ) : (
              t("startNewConversation")
            )}
          </p>
        </div>
      </div>

      {/* Status banner */}
      <StatusBanner />

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}

      {/* ── Messages Area ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col">

        {/* Loading messages skeleton */}
        {isLoadingMsgs && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`flex ${n % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <div className="h-10 w-48 rounded-2xl bg-gray-200 animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* No conversation yet */}
        {!isLoadingMsgs && !conversation && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center text-gray-400 py-8">
            <span className="material-symbols-outlined text-5xl text-gray-300">chat_bubble_outline</span>
            <p className="text-sm font-medium text-gray-500">{t("howCanWeHelp")}</p>
            <p className="text-xs">{t("sendMessagePrompt")}</p>
          </div>
        )}

        {/* Empty conversation */}
        {!isLoadingMsgs && conversation && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-gray-400">
            <span className="material-symbols-outlined text-4xl text-gray-300">forum</span>
            <p className="text-sm">{t("noMessagesYet")}</p>
          </div>
        )}

        {/* Messages */}
        {!isLoadingMsgs && messages.map((msg) => (
          <Bubble key={msg._id} msg={msg} />
        ))}

        {/* Admin typing indicator */}
        {isAdminTyping && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
              A
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 0.2, 0.4].map((d, i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce"
                    style={{ animationDelay: `${d}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Subject input (first message only) ──────────────────────── */}
      {!conversation && showSubjectInput && (
        <div className="px-4 pb-2">
          <input
            type="text"
            placeholder={t("subjectOptional")}
            value={firstSubject}
            onChange={(e) => setFirstSubject(e.target.value)}
            maxLength={200}
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 placeholder-gray-400 outline-none focus:border-teal-400 transition"
          />
        </div>
      )}

      {/* ── Composer ────────────────────────────────────────────────── */}
      <div className={`flex items-end gap-2 px-4 py-3 bg-white border-t border-gray-100 ${isResolved ? "opacity-60 pointer-events-none" : ""}`}>

        {/* Subject toggle for first message */}
        {!conversation && (
          <button
            onClick={() => setShowSubjectInput((s) => !s)}
            title={t("addSubject")}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-teal-600 hover:border-teal-300 transition shrink-0"
          >
            <span className="material-symbols-outlined text-lg">label</span>
          </button>
        )}

        {/* Attach file */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || !conversation}
          title={t("attachFile")}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-teal-600 hover:border-teal-300 transition shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isUploading
            ? <span className="material-symbols-outlined text-lg animate-spin" style={{ animationDuration: "1s" }}>autorenew</span>
            : <span className="material-symbols-outlined text-lg">attach_file</span>
          }
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => { setText(e.target.value); emitTyping(); }}
          onKeyDown={handleKeyDown}
          disabled={isResolved}
          placeholder={isResolved ? t("conversationResolvedPlaceholder") : t("typeMessagePlaceholder")}
          className="flex-1 resize-none text-sm px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 outline-none focus:border-teal-400 focus:bg-white transition max-h-28 overflow-y-auto font-inherit"
          style={{ fontFamily: "inherit" }}
        />

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending || isResolved}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0"
        >
          {isSending
            ? <span className="material-symbols-outlined text-lg animate-spin" style={{ animationDuration: "1s" }}>autorenew</span>
            : <span className="material-symbols-outlined text-lg">send</span>
          }
        </button>
      </div>

      {/* Resolved message */}
      {isResolved && (
        <p className="text-center text-xs text-gray-400 py-2 bg-white border-t border-gray-100">
          {t("conversationResolvedFooter")}
        </p>
      )}
    </div>
  );
};
