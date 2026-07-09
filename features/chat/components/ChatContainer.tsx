"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../../store/authStore";
import { useChat } from "../hooks/useChat";
import { ConversationsSidebar } from "./ConversationsSidebar";
import { ChatArea } from "./ChatArea";

export const ChatContainer: React.FC = () => {
  const { user } = useAuthStore();
  const currentUserId = user?.id || (user as any)?._id || null;

  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  const {
    conversations,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    conversationsError,
    messagesError,
    sendMessage,
  } = useChat(activeBookingId, currentUserId);

  // Auto-select booking from URL query parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const bookingIdParam = params.get("bookingId");
      if (bookingIdParam) {
        setActiveBookingId(bookingIdParam);
      } else {
        const companionIdParam = params.get("companionId");
        if (companionIdParam && conversations.length > 0) {
          const matchedConv = conversations.find(c => c.otherUser?._id === companionIdParam);
          if (matchedConv) {
            setActiveBookingId(matchedConv.bookingId);
          }
        }
      }
    }
  }, [conversations]);

  // Lock parent layout scroll on mount to prevent layout-related vertical scrolling and clipping
  useEffect(() => {
    const mainEl = document.querySelector("main");
    if (mainEl) {
      const originalOverflow = mainEl.style.overflow;
      mainEl.style.overflow = "hidden";
      return () => {
        mainEl.style.overflow = originalOverflow;
      };
    }
  }, []);

  const activeConversation =
    conversations.find((c) => c.bookingId === activeBookingId) || null;

  const handleSendMessage = (text: string) => {
    sendMessage(text);
  };

  const handleSelectConversation = (bookingId: string) => {
    setActiveBookingId(bookingId);
  };

  const handleBackToSidebar = () => {
    setActiveBookingId(null);
  };

  return (
    <div className="w-[calc(100%+3rem)] md:w-[calc(100%+4rem)] h-[calc(100dvh-4rem)] md:h-screen flex bg-stitch-surface -mt-6 -mx-6 -mb-24 md:-m-8 border-none rounded-none overflow-hidden transition-all duration-300">
      
      {/* Sidebar View */}
      <div
        className={`${
          activeBookingId ? "hidden md:block" : "w-full"
        } md:w-[360px] lg:w-[400px] h-full shrink-0`}
      >
        <ConversationsSidebar
          conversations={conversations}
          activeBookingId={activeBookingId}
          onSelectConversation={handleSelectConversation}
          isLoading={isLoadingConversations}
          currentUserId={currentUserId}
        />
      </div>

      {/* Active Conversation Area View */}
      <div
        className={`${
          !activeBookingId ? "hidden md:flex" : "flex"
        } flex-1 h-full min-w-0`}
      >
        <ChatArea
          activeConversation={activeConversation}
          messages={messages}
          currentUserId={currentUserId}
          isLoadingMessages={isLoadingMessages}
          messagesError={messagesError}
          onSendMessage={handleSendMessage}
          onBack={handleBackToSidebar}
        />
      </div>
    </div>
  );
};
