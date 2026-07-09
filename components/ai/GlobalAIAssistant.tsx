"use client";

import React, { useState, useRef, useEffect } from "react";
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
  isStreaming?: boolean;
}

interface ChatSession {
  _id: string;
  title: string;
  agentType: string;
  createdAt: string;
  updatedAt: string;
}

interface GlobalAIAssistantProps {
  userRole?: string;
}

function TypingEffect({ text, onFinished }: { text: string; onFinished: () => void }) {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    const words = text.split(" ");
    let currentText = "";
    
    const interval = setInterval(() => {
      if (index < words.length) {
        currentText += (index === 0 ? "" : " ") + words[index];
        setDisplayedText(currentText);
        index++;
      } else {
        clearInterval(interval);
        onFinished();
      }
    }, 40); // Smooth typewriter effect per word
    
    return () => clearInterval(interval);
  }, [text, onFinished]);

  return (
    <ReactMarkdown
      components={{
        a: ({ node, ...props }) => (
          <a
            {...props}
            className="text-white bg-stitch-primary hover:opacity-90 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-0.5 no-underline mx-1 shadow-sm align-middle"
          />
        )
      }}
    >
      {displayedText}
    </ReactMarkdown>
  );
}

export default function GlobalAIAssistant({ userRole }: GlobalAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore?.() || { user: null }; 
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const role = userRole || user?.role || "family";
  const normalizedRole = role.toLowerCase() === "companion" ? "companion" : "family";

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Load chat sessions when history is shown
  useEffect(() => {
    if (isOpen && showHistory) {
      fetchSessions();
    }
  }, [isOpen, showHistory]);

  const fetchSessions = async () => {
    try {
      const res = await api.get(`/ai/sessions?agentType=${normalizedRole}`);
      if (res.data?.status === "success") {
        setSessions(res.data.data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const handleSelectSession = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/ai/sessions/${id}`);
      if (res.data?.status === "success") {
        const session = res.data.data.session;
        setSessionId(id);
        const mappedMessages = (session.messages || []).map((m: any) => ({
          id: m._id,
          sender: m.sender,
          text: m.text,
          isStreaming: false, // History messages shouldn't animate
        }));
        setMessages(mappedMessages);
      }
    } catch (err) {
      console.error("Failed to load session details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(isArabic() ? "هل أنت متأكد من حذف هذه المحادثة؟" : "Are you sure you want to delete this conversation?")) return;
    try {
      const res = await api.delete(`/ai/sessions/${id}`);
      if (res.data?.status === "success") {
        setSessions((prev) => prev.filter((s) => s._id !== id));
        if (sessionId === id) {
          setSessionId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleNewChat = () => {
    setSessionId(null);
    setMessages([]);
  };

  const isArabic = () => {
    if (typeof window !== "undefined") {
      const clientLang = navigator.language;
      return clientLang.startsWith("ar");
    }
    return true;
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await handleSendDirect(inputValue);
  };

  const handleSendDirect = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const endpoint = normalizedRole === "companion" ? "/ai/session/companion" : "/ai/session/family";
      
      const response = await api.post(endpoint, {
        message: userMessage.text,
        role: normalizedRole === "companion" ? "Companion" : "Family",
        isAgentActive,
        sessionId
      }, {
        timeout: 45000
      });

      const data = response.data?.data || response.data;
      
      if (data.sessionId) {
        setSessionId(data.sessionId);
        // Refresh sessions list silently
        fetchSessions();
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: data.reply || data.aiReply || data.answer || "Here is your information.",
        companions: data.companions || data.data?.companions,
        scheduleConflicts: data.conflicts || data.data?.conflicts,
        isStreaming: true, // Typewrite new replies
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

  const suggestedPrompts = normalizedRole === "companion" 
    ? [
        { label: "📅 Show my bookings", text: "Show my upcoming bookings" },
        { label: "🔒 Verification help", text: "How does verification work?" },
        { label: "📜 Cancellation policy", text: "What is the policy for shift cancellations?" }
      ]
    : [
        { label: "🔍 Find nurse in Cairo", text: "Find a nurse in Cairo on Saturday" },
        { label: "📅 Check my schedule", text: "Show my upcoming bookings" },
        { label: "💳 Payment escrow info", text: "How does the payment escrow work?" }
      ];

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-stitch-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:opacity-95 active:scale-95 transition-all duration-300 z-[9999] cursor-pointer hover:shadow-stitch-primary/30 hover:shadow-lg border border-white/10"
        aria-label="Toggle AI Assistant"
      >
        <span className="material-symbols-outlined text-2xl transition-transform duration-300 hover:rotate-12">
          {isOpen ? "close" : "smart_toy"}
        </span>
      </button>

      {/* Floating Chat Box Layout */}
      {isOpen && (
        <div 
          className={`fixed bottom-24 right-6 h-[600px] bg-white dark:bg-zinc-900 rounded-3xl shadow-premium border border-sand-high/30 flex z-[9999] overflow-hidden animate-fade-in-up transition-all duration-300 ${
            showHistory ? "w-[680px]" : "w-[380px]"
          }`}
        >
          {/* History Sidebar Panel */}
          {showHistory && (
            <div className="w-[280px] border-r border-sand-high/30 dark:border-zinc-800 bg-sand-low/20 dark:bg-zinc-950/40 flex flex-col h-full animate-fade-in shrink-0">
              <div className="p-4 border-b border-sand-high/30 dark:border-zinc-800 flex items-center justify-between">
                <span className="font-bold text-xs text-stitch-on-surface tracking-wider uppercase">History</span>
                <button 
                  onClick={handleNewChat}
                  className="flex items-center gap-1 text-[10px] font-bold bg-stitch-primary/10 text-stitch-primary hover:bg-stitch-primary/20 px-2 py-1 rounded-lg transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px]">add</span>
                  <span>New Chat</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {sessions.length === 0 ? (
                  <p className="text-[10px] text-stitch-on-surface-variant/60 text-center mt-6">No previous chats</p>
                ) : (
                  sessions.map((sess) => (
                    <div 
                      key={sess._id} 
                      onClick={() => handleSelectSession(sess._id)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                        sessionId === sess._id 
                          ? "bg-stitch-primary/10 border-stitch-primary/30 text-stitch-primary" 
                          : "border-transparent hover:bg-sand-low/50 dark:hover:bg-zinc-800/40 text-stitch-on-surface"
                      }`}
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-semibold truncate leading-normal">{sess.title || "Conversation"}</span>
                        <span className="text-[9px] text-stitch-on-surface-variant/50 mt-0.5">
                          {new Date(sess.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteSession(sess._id, e)}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1 rounded-md transition-all flex items-center justify-center cursor-pointer ml-1 text-stitch-on-surface-variant/40"
                        title="Delete chat session"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Main Chat Box Panel */}
          <div className="flex-1 flex flex-col h-full min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-stitch-primary text-white shadow-sm shrink-0">
              <div className="flex items-center gap-2">
                {/* Toggle History Button */}
                <button 
                  onClick={() => setShowHistory((prev) => !prev)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center text-white ${
                    showHistory ? "bg-white/20" : "hover:bg-white/15"
                  }`}
                  title="Toggle Chat History"
                >
                  <span className="material-symbols-outlined text-[20px]">history</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-lg">smart_toy</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-xs tracking-wide">Sanad Assistant</h3>
                    <p className="text-[9px] opacity-75 capitalize font-medium">{normalizedRole} Assistant</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Agent Mode Toggle Switch */}
                <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-xl border border-white/5 shadow-inner">
                  <span className="material-symbols-outlined text-[14px] text-white/80">
                    {isAgentActive ? "robot_2" : "person"}
                  </span>
                  <span className="text-[9px] font-bold text-white/90">Agent</span>
                  <button
                    type="button"
                    onClick={() => setIsAgentActive(prev => !prev)}
                    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isAgentActive ? "bg-green-500" : "bg-white/20"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isAgentActive ? "translate-x-3" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* New Chat Button */}
                <button 
                  onClick={handleNewChat} 
                  title="Start a new conversation"
                  className="hover:bg-white/15 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center text-white"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                </button>
                
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="hover:bg-white/15 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center text-white"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-sand-low/10 dark:bg-zinc-950/20">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-stitch-primary/10 flex items-center justify-center text-stitch-primary">
                    <span className="material-symbols-outlined text-4xl animate-pulse">auto_awesome</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-stitch-on-surface">Ask Sanad AI Co-Pilot</h4>
                    <p className="text-xs text-stitch-on-surface-variant/80 mt-1 max-w-[240px]">
                      I can search caregivers, create job postings, audit schedule conflicts, and guide you on policies.
                    </p>
                  </div>
                  
                  {/* Suggested Prompts */}
                  <div className="w-full space-y-2 pt-2">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-stitch-on-surface-variant/60">Suggested actions</p>
                    <div className="flex flex-col gap-2">
                      {suggestedPrompts.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => handleSendDirect(prompt.text)}
                          className="w-full text-left text-xs bg-white dark:bg-zinc-800 hover:bg-sand-low border border-sand-high/40 dark:border-zinc-700/60 p-2.5 rounded-xl transition-all hover:translate-x-1 cursor-pointer text-stitch-on-surface shadow-sm font-medium"
                        >
                          {prompt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} space-y-1`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                      msg.sender === "user"
                        ? "bg-stitch-primary text-white rounded-tr-none"
                        : msg.isError
                        ? "bg-red-50 text-red-700 rounded-tl-none border border-red-200"
                        : "bg-white dark:bg-zinc-800 border border-sand-high/30 text-stitch-on-surface rounded-tl-none"
                    }`}
                  >
                    <div className="prose prose-sm dark:prose-invert">
                      {msg.sender === "ai" && msg.isStreaming ? (
                        <TypingEffect 
                          text={msg.text} 
                          onFinished={() => {
                            msg.isStreaming = false;
                          }} 
                        />
                      ) : (
                        <ReactMarkdown
                          components={{
                            a: ({ node, ...props }) => (
                              <a
                                {...props}
                                className="text-white bg-stitch-primary hover:opacity-90 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-0.5 no-underline mx-1 shadow-sm align-middle"
                              />
                            )
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>

                  {/* Companion Cards */}
                  {msg.companions && msg.companions.length > 0 && (
                    <div className="mt-2 w-[290px] space-y-3">
                      {msg.companions.slice(0, 3).map((comp: any) => {
                        const compId = comp._id || comp.id;
                        const locationText = comp.location?.city
                          ? `${comp.location.city}, ${comp.location.governorate || ""}`
                          : "";
                        const rateText = comp.hourlyRate ? `${comp.hourlyRate} EGP/hr` : "";
                        const ratingVal = comp.rating ? comp.rating.toFixed(1) : "5.0";
                        
                        return (
                          <div key={compId} className="bg-white dark:bg-zinc-800 rounded-2xl border border-sand-high/50 p-3 shadow-sm hover:shadow-md transition-all flex flex-col gap-2.5 animate-fade-in-up">
                            <div className="flex items-center gap-3">
                              <img 
                                src={comp.avatar || "/avatar_1.jpg"} 
                                className="w-12 h-12 rounded-full object-cover border border-sand-high/50 shrink-0" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/avatar_1.jpg";
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-bold text-sm text-stitch-on-surface truncate">{comp.name || "Caregiver"}</p>
                                  {comp.score && (
                                    <span className="text-[10px] font-bold text-stitch-primary bg-stitch-primary/10 px-2 py-0.5 rounded-full shrink-0">
                                      {Math.round(comp.score * 100)}% Match
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-stitch-primary font-semibold capitalize mt-0.5">
                                  {comp.specialization?.replace("_", " ") || "Specialist"}
                                </p>
                                
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <div className="flex items-center gap-0.5 text-amber-500 text-[11px] font-bold">
                                    <span className="material-symbols-outlined text-[12px] [font-variation-settings:'FILL'_1]">star</span>
                                    <span>{ratingVal}</span>
                                  </div>
                                  
                                  {locationText && (
                                    <div className="flex items-center gap-0.5 text-stitch-on-surface-variant/70 text-[11px] min-w-0">
                                      <span className="material-symbols-outlined text-[12px]">location_on</span>
                                      <span className="truncate">{locationText}</span>
                                    </div>
                                  )}

                                  {rateText && (
                                    <div className="flex items-center gap-0.5 text-stitch-on-surface-variant/70 text-[11px] font-bold">
                                      <span className="material-symbols-outlined text-[12px]">payments</span>
                                      <span>{rateText}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 border-t border-sand-low pt-2.5 mt-0.5">
                              <a
                                href={`/family/companions/${compId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-1.5 text-center text-[11px] font-bold border border-stitch-primary text-stitch-primary rounded-lg hover:bg-stitch-primary/5 transition-all cursor-pointer"
                              >
                                View Profile
                              </a>
                              <a
                                href={`/family/companions/${compId}/request`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-1.5 text-center text-[11px] font-bold bg-stitch-primary text-white rounded-lg hover:opacity-90 transition-all cursor-pointer"
                              >
                                Book Now
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Schedule Conflicts */}
                  {msg.scheduleConflicts && msg.scheduleConflicts.length > 0 && (
                    <div className="mt-2 w-full space-y-2">
                      {msg.scheduleConflicts.map((conflict: any, idx: number) => (
                        <div key={idx} className="bg-red-50 p-2.5 rounded-xl border border-red-200 flex flex-col gap-1 shadow-sm animate-fade-in-up">
                          <div className="flex items-center gap-1.5 text-red-700">
                            <span className="material-symbols-outlined text-sm">warning</span>
                            <p className="font-bold text-xs">Schedule Conflict Detected</p>
                          </div>
                          <p className="text-[11px] text-red-600 font-medium">
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
                  <div className="bg-white dark:bg-zinc-800 border border-sand-high/50 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-stitch-primary rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-stitch-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-stitch-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form Area */}
            <div className="p-3 bg-white dark:bg-zinc-900 border-t border-sand-high/50 shrink-0">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full bg-sand-low dark:bg-zinc-800 text-stitch-on-surface rounded-full py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-stitch-primary/50 border border-transparent focus:border-stitch-primary/30"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="absolute right-1.5 p-1.5 bg-stitch-primary text-white rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-md hover:shadow-stitch-primary/20"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
