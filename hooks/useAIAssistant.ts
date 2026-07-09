import { useState, useCallback, useRef } from "react";
import { api } from "@/lib/services/api";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export function useAIAssistant(userRole: "Family" | "Companion") {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const toggleAssistant = useCallback(() => setIsOpen((prev) => !prev), []);

  const sendMessage = useCallback(
    async (text: string, currentLanguage: string = "ar") => {
      if (!text.trim()) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const res = await api.post(
          "/ai/chat/message",
          { message: text, role: userRole, currentLanguage },
          { timeout: 60000 }
        );

        if (res.data?.status === "success") {
          const { action, reply, filters } = res.data.data;

          if (action === "REDIRECT_SEARCH") {
            // Trigger global redirect to browse page with filters
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("sanad:assistant-redirect", {
                  detail: { filters, reply },
                })
              );
            }
          }

          const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: reply,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMsg]);
        }
      } catch (err) {
        console.error("AI Assistant error:", err);
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "عذرًا، حدث خطأ أثناء الاتصال بالمساعد الذكي.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [userRole]
  );

  const clearChat = useCallback(() => setMessages([]), []);

  return {
    messages,
    isLoading,
    isOpen,
    toggleAssistant,
    sendMessage,
    clearChat,
  };
}
