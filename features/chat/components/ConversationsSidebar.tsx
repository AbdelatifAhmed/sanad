"use client";

import React, { useState } from "react";
import { Conversation } from "../types";
import { ConversationItem } from "./ConversationItem";
import { useTranslations } from "next-intl";
import { Search, MessageSquare } from "lucide-react";

interface ConversationsSidebarProps {
  conversations: Conversation[];
  activeBookingId: string | null;
  onSelectConversation: (bookingId: string) => void;
  isLoading: boolean;
  currentUserId: string | null;
}

export const ConversationsSidebar: React.FC<ConversationsSidebarProps> = ({
  conversations,
  activeBookingId,
  onSelectConversation,
  isLoading,
  currentUserId,
}) => {
  const t = useTranslations("chat");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((c) =>
    c.otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-stitch-surface border-e border-stitch-outline/10">
      {/* Sticky Sidebar Header & Search Bar */}
      <div className="sticky top-0 z-20 bg-stitch-surface/90 backdrop-blur-md p-6 pb-4 space-y-4">
        <h2 className="text-xl font-bold text-stitch-on-surface flex items-center gap-2">
          <MessageSquare className="w-5.5 h-5.5 text-stitch-primary" />
          {t("title")}
        </h2>
        <div className="relative">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stitch-on-surface-variant/50" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-11 pe-4 py-2.5 rounded-2xl bg-sand-low border border-stitch-outline/20 focus:outline-none focus:ring-2 focus:ring-stitch-primary/10 focus:border-stitch-primary transition-all text-sm text-stitch-on-surface placeholder-stitch-on-surface-variant/40"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <div className="w-8 h-8 border-3 border-stitch-primary/20 border-t-stitch-primary rounded-full animate-spin" />
            <span className="text-xs text-stitch-on-surface-variant/50">
              {t("loading")}
            </span>
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.bookingId}
              conversation={conversation}
              isActive={conversation.bookingId === activeBookingId}
              onClick={() => onSelectConversation(conversation.bookingId)}
              currentUserId={currentUserId}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-sand-low flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-stitch-on-surface-variant/40" />
            </div>
            <p className="text-sm font-semibold text-stitch-on-surface mb-1">
              {t("noConversations")}
            </p>
            <p className="text-xs text-stitch-on-surface-variant/50 max-w-[200px]">
              {searchQuery
                ? "Try searching for a different caregiver or family name."
                : "Your chat threads associated with care bookings will appear here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
