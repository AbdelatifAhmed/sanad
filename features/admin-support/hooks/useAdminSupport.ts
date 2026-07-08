"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../../../components/providers/SocketProvider";
import { api } from "../../../lib/services/api";
import { AdminConversation, AdminMessage, ConversationStatus } from "../types";

export const useAdminSupport = (userId: string | null) => {
  const [conversation, setConversation] = useState<AdminConversation | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [isLoadingConv, setIsLoadingConv] = useState(false);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdminTyping, setIsAdminTyping] = useState(false);

  const { socket } = useSocket();
  const convIdRef = useRef<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Fetch messages ──────────────────────────────────────────────── */
  const fetchMessages = useCallback(async () => {
    try {
      setIsLoadingMsgs(true);
      const res = await api.get("/admin/messages/user/messages");
      setMessages(res.data?.data?.messages ?? []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load messages");
    } finally {
      setIsLoadingMsgs(false);
    }
  }, []);

  /* ─── Fetch or initialise conversation ───────────────────────────── */
  const fetchConversation = useCallback(async () => {
    try {
      setIsLoadingConv(true);
      setError(null);
      const res = await api.get("/admin/messages/user/my-conversation");
      const conv: AdminConversation | null = res.data?.data?.conversation ?? null;
      setConversation(conv);
      convIdRef.current = conv?._id ?? null;
      if (conv) await fetchMessages();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load support conversation");
    } finally {
      setIsLoadingConv(false);
    }
  }, [fetchMessages]);

  /* ─── Send text message ───────────────────────────────────────────── */
  const sendMessage = useCallback(
    async (text: string, subject?: string) => {
      if (!text.trim() || !userId) return;

      const optimisticId = `opt_${Date.now()}`;
      const optimistic: AdminMessage = {
        _id: optimisticId,
        conversationId: convIdRef.current ?? "",
        senderId: userId,
        senderRole: "family",
        receiverId: "admin",
        receiverRole: "admin",
        messageType: "text",
        text: text.trim(),
        isRead: false,
        isEdited: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimistic]);
      setIsSending(true);

      try {
        const body: Record<string, string> = { text: text.trim() };
        if (convIdRef.current) body.conversationId = convIdRef.current;
        if (subject) body.subject = subject;

        const res = await api.post("/admin/messages/send", body);
        const saved: AdminMessage = res.data.data.message;
        const newConvId: string = res.data.data.conversationId;

        setMessages((prev) =>
          prev.map((m) => (m._id === optimisticId ? saved : m))
        );

        if (!convIdRef.current) {
          convIdRef.current = newConvId;
          await fetchConversation();
        } else {
          setConversation((prev) =>
            prev
              ? {
                  ...prev,
                  lastMessage: text.trim(),
                  lastMessageTime: saved.createdAt,
                  // status update will arrive via socket; keep current
                }
              : prev
          );
        }
      } catch (err: any) {
        setMessages((prev) => prev.filter((m) => m._id !== optimisticId));
        setError(err.response?.data?.error || "Failed to send message");
      } finally {
        setIsSending(false);
      }
    },
    [userId, fetchConversation]
  );

  /* ─── Reopen conversation ─────────────────────────────────────────── */
  const reopenConversation = useCallback(async () => {
    const convId = convIdRef.current;
    if (!convId) return;
    setIsReopening(true);
    try {
      await api.patch("/admin/messages/user/reopen", { conversationId: convId });
      setConversation((prev) =>
        prev ? { ...prev, status: "open", reopenedAt: new Date().toISOString() } : prev
      );
      // Reload messages so the system event appears
      await fetchMessages();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to reopen conversation");
    } finally {
      setIsReopening(false);
    }
  }, [fetchMessages]);

  /* ─── Upload attachment ───────────────────────────────────────────── */
  const uploadFile = useCallback(async (file: File) => {
    const convId = convIdRef.current;
    if (!convId) {
      setError("Please send a text message first to start the conversation.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { setError("File exceeds the 5 MB limit"); return; }
    const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("Only JPEG, PNG and PDF files are supported");
      return;
    }

    setIsUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("conversationId", convId);

    try {
      const res = await api.post("/admin/messages/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessages((prev) => [...prev, res.data.data.message as AdminMessage]);
    } catch (err: any) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, []);

  /* ─── Mark as read ────────────────────────────────────────────────── */
  const markAsRead = useCallback(async () => {
    const convId = convIdRef.current;
    if (!convId) return;
    try {
      await api.patch("/admin/messages/read", { conversationId: convId });
      setConversation((prev) => (prev ? { ...prev, unreadByUser: 0 } : prev));
    } catch (_) { /* non-fatal */ }
  }, []);

  /* ─── Typing helpers ──────────────────────────────────────────────── */
  const emitTyping = useCallback(() => {
    if (!socket || !convIdRef.current) return;
    socket.emit("adminMessage:typing", {
      conversationId: convIdRef.current,
      senderRole: "user",
      senderName: "User",
    });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (convIdRef.current)
        socket.emit("adminMessage:stopTyping", { conversationId: convIdRef.current });
    }, 2500);
  }, [socket]);

  /* ─── Socket listeners ────────────────────────────────────────────── */
  useEffect(() => {
    if (!socket) return;

    if (convIdRef.current) {
      socket.emit("adminConversation:join", convIdRef.current);
    }

    const onNewMessage = (msg: AdminMessage) => {
      if (msg.conversationId !== convIdRef.current) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      if (msg.senderRole === "admin" || msg.messageType === "system") markAsRead();
    };

    const onTyping = (payload: any) => {
      if (
        payload.conversationId === convIdRef.current &&
        payload.senderRole === "admin"
      ) {
        setIsAdminTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setIsAdminTyping(false), 3000);
      }
    };

    const onStopTyping = (payload: any) => {
      if (payload.conversationId === convIdRef.current) setIsAdminTyping(false);
    };

    // Unified status handler
    const onStatusChanged = ({ conversationId, status }: { conversationId: string; status: ConversationStatus }) => {
      if (conversationId !== convIdRef.current) return;
      setConversation((prev) => (prev ? { ...prev, status } : prev));
    };

    const onResolved = ({ conversationId }: any) => {
      if (conversationId === convIdRef.current)
        setConversation((prev) => (prev ? { ...prev, status: "resolved" as const } : prev));
    };

    const onReopened = ({ conversationId }: any) => {
      if (conversationId === convIdRef.current)
        setConversation((prev) => (prev ? { ...prev, status: "open" as const, reopenedAt: new Date().toISOString() } : prev));
    };

    const onDeleted = ({ messageId }: any) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isDeleted: true, text: "" } : m))
      );
    };

    socket.on("adminMessage:new", onNewMessage);
    socket.on("adminMessage:typing", onTyping);
    socket.on("adminMessage:stopTyping", onStopTyping);
    socket.on("adminConversation:statusChanged", onStatusChanged);
    socket.on("adminConversation:resolved", onResolved);
    socket.on("adminConversation:reopened", onReopened);
    socket.on("adminMessage:deleted", onDeleted);

    return () => {
      socket.off("adminMessage:new", onNewMessage);
      socket.off("adminMessage:typing", onTyping);
      socket.off("adminMessage:stopTyping", onStopTyping);
      socket.off("adminConversation:statusChanged", onStatusChanged);
      socket.off("adminConversation:resolved", onResolved);
      socket.off("adminConversation:reopened", onReopened);
      socket.off("adminMessage:deleted", onDeleted);
    };
  }, [socket, markAsRead]);

  /* ─── Init ────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (userId) fetchConversation();
  }, [userId, fetchConversation]);

  return {
    conversation,
    messages: messages.filter((m) => !m.isDeleted || m.messageType === "system"),
    isLoadingConv,
    isLoadingMsgs,
    isSending,
    isReopening,
    isUploading,
    isAdminTyping,
    error,
    sendMessage,
    uploadFile,
    emitTyping,
    markAsRead,
    reopenConversation,
    refetch: fetchConversation,
  };
};
