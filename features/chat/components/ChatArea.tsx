"use client";

import React from "react";
import { Conversation, ChatMessage } from "../types";
import { ChatHeader } from "./ChatHeader";
import { MessagesList } from "./MessagesList";
import { MessageInput } from "./MessageInput";
import { useTranslations, useLocale } from "next-intl";
import { MessageSquare } from "lucide-react";

interface ChatAreaProps {
  activeConversation: Conversation | null;
  messages: ChatMessage[];
  currentUserId: string | null;
  isLoadingMessages: boolean;
  messagesError: string | null;
  onSendMessage: (text: string) => void;
  onBack: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  activeConversation,
  messages,
  currentUserId,
  isLoadingMessages,
  messagesError,
  onSendMessage,
  onBack,
}) => {
  const t = useTranslations("chat");
  const locale = useLocale();

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-sand-low/30 text-center relative overflow-hidden">
        {/* Decorative background blur shapes */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-stitch-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-stitch-secondary-container/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center max-w-sm px-6 py-12 rounded-3xl bg-stitch-surface/50 border border-stitch-outline/10 shadow-soft backdrop-blur-sm">
          {/* Layered glowing icons */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-stitch-primary/20 rounded-full blur-xl scale-125 animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-stitch-primary to-stitch-primary/80 text-white flex items-center justify-center shadow-lg shadow-stitch-primary/20">
              <MessageSquare className="w-9 h-9" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-stitch-on-surface mb-2 font-display">
            {t("title")}
          </h3>
          <p className="text-sm text-stitch-on-surface-variant/70 leading-relaxed max-w-[260px]">
            {t("noActiveChat")}
          </p>
          
          {/* Quick tips list */}
          <div className="mt-8 pt-6 border-t border-stitch-outline/15 w-full text-start space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-stitch-primary/10 text-stitch-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
              <p className="text-xs text-stitch-on-surface-variant/80">{locale === "ar" ? "اختر محادثة نشطة من القائمة الجانبية للبدء." : "Select an active booking thread from the sidebar."}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-stitch-primary/10 text-stitch-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
              <p className="text-xs text-stitch-on-surface-variant/80">{locale === "ar" ? "يمكنك التحدث بالوقت الحقيقي والتأكد من تفاصيل الحجز." : "Discuss services, schedules and details in real-time."}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { otherUser, startDate, endDate, bookingId } = activeConversation;

  return (
    <div className="flex-1 flex flex-col h-full bg-stitch-surface overflow-hidden relative min-w-0">
      {/* Chat Header */}
      <ChatHeader
        otherUser={otherUser}
        startDate={startDate}
        endDate={endDate}
        bookingId={bookingId}
        onBack={onBack}
      />

      {/* Messages Scroll List */}
      <MessagesList
        messages={messages}
        currentUserId={currentUserId}
        isLoading={isLoadingMessages}
        error={messagesError}
      />

      {/* Message Input box */}
      <MessageInput onSendMessage={onSendMessage} disabled={isLoadingMessages} />
    </div>
  );
};
