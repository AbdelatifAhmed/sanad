"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAIStore } from "@/store/aiStore";
import { api } from "@/lib/services/api";
import { useAuthStore } from "@/store/authStore"; 
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  companions?: any[];
  scheduleConflicts?: any[];
  isError?: boolean;
}

export default function GlobalAIAssistant() {
  const { isAssistantOpen, closeAssistant } = useAIStore();
  const { user } = useAuthStore?.() || { user: null }; 
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const role = user?.role || "family"; // Fallback to family

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAssistantOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const endpoint = role === "companion" ? "/ai/session/companion" : "/ai/session/family";
      
      const response = await api.post(endpoint, {
        message: userMessage.text,
      });

      const data = response.data?.data || response.data;

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: data.aiReply || data.answer || "Here is your information.",
        companions: data.companions || data.data?.companions,
        scheduleConflicts: data.conflicts || data.data?.conflicts,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Something went wrong. Please try again.";
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: "ai", text: errorMessage, isError: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAssistantOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-[380px] h-[600px] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-sand-high/50 flex flex-col z-50 overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-stitch-primary text-white">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined">smart_toy</span>
          <div>
            <h3 className="font-bold text-sm">Sanad Assistant</h3>
            <p className="text-xs opacity-80 capitalize">{role} Mode</p>
          </div>
        </div>
        <button onClick={closeAssistant} className="hover:opacity-75 transition-opacity">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-sand-low/20">
        {messages.length === 0 && (
          <div className="text-center text-sm text-stitch-on-surface-variant mt-10">
            How can I help you today?
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                msg.sender === "user"
                  ? "bg-stitch-primary text-white rounded-br-none"
                  : msg.isError
                  ? "bg-red-50 text-red-700 rounded-bl-none border border-red-200"
                  : "bg-white border border-sand-high/50 text-stitch-on-surface rounded-bl-none shadow-sm"
              }`}
            >
              <ReactMarkdown className="prose prose-sm dark:prose-invert">
                {msg.text}
              </ReactMarkdown>
            </div>

            {/* Custom Interactive Cards */}
            {msg.companions && msg.companions.length > 0 && (
              <div className="mt-2 w-full space-y-2">
                {msg.companions.slice(0, 3).map((comp: any) => (
                  <div key={comp._id || comp.id} className="bg-white p-2 rounded-xl border border-stitch-primary/30 flex items-center gap-3 shadow-sm">
                    <img src={comp.avatar || "/avatar_1.jpg"} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1">
                      <p className="font-bold text-xs">{comp.name}</p>
                      <p className="text-[10px] text-stitch-on-surface-variant">{comp.specialization}</p>
                    </div>
                    {comp.score && (
                      <div className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        {Math.round(comp.score * 100)}% Match
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {msg.scheduleConflicts && msg.scheduleConflicts.length > 0 && (
              <div className="mt-2 w-full space-y-2">
                {msg.scheduleConflicts.map((conflict: any, idx: number) => (
                  <div key={idx} className="bg-red-50 p-2 rounded-xl border border-red-200 flex flex-col gap-1 shadow-sm">
                    <div className="flex items-center gap-1 text-red-700">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      <p className="font-bold text-xs">Schedule Conflict Detected</p>
                    </div>
                    <p className="text-[11px] text-red-600">
                      {conflict.date} at {conflict.startTime}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start">
            <div className="bg-white border border-sand-high/50 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-stitch-primary rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-stitch-primary rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 bg-stitch-primary rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-sand-high/50">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-sand-low rounded-full py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-stitch-primary/50"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="absolute right-1.5 p-1.5 bg-stitch-primary text-white rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-all"
          >
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
