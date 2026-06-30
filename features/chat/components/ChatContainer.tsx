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

  // Auto-select the first conversation on desktop initial load
  useEffect(() => {
    if (!activeBookingId && conversations.length > 0) {
      if (typeof window !== "undefined" && window.innerWidth >= 768) {
        setActiveBookingId(conversations[0].bookingId);
      }
    }
  }, [conversations, activeBookingId]);

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
    <div className="w-[calc(100%+3rem)] md:w-[calc(100%+4rem)] h-screen flex bg-stitch-surface -m-6 md:-m-8 border-none rounded-none overflow-hidden transition-all duration-300">
      
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
        } flex-1 h-full`}
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
