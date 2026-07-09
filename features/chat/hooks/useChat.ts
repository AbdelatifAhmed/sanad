"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../../../components/providers/SocketProvider";
import { api } from "../../../lib/services/api";
import { Conversation, ChatMessage } from "../types";
import { useLocale } from "next-intl";

export const useChat = (activeBookingId: string | null, userId: string | null) => {
  const locale = useLocale();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const { socket } = useSocket();
  const activeBookingIdRef = useRef(activeBookingId);
  const activeOtherUserIdRef = useRef<string | null>(null);

  // Keep ref up to date for socket event handler
  useEffect(() => {
    activeBookingIdRef.current = activeBookingId;
  }, [activeBookingId]);

  // Keep active other user ID ref up to date
  useEffect(() => {
    const activeConv = conversations.find((c) => c.bookingId === activeBookingId);
    activeOtherUserIdRef.current = activeConv?.otherUser?._id || null;
  }, [activeBookingId, conversations]);

  // Fetch Conversations List
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      setConversationsError(null);
      const res = await api.get("/chat/conversations");
      if (res.data?.status === "success") {
        setConversations(res.data.data.conversations || []);
      }
    } catch (err: any) {
      console.error("Error fetching conversations:", err);
      setConversationsError(
        err.response?.data?.message || err.message || "Failed to load conversations"
      );
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // Fetch Messages History for active booking
  const fetchChatHistory = useCallback(async (bookingId: string) => {
    try {
      setIsLoadingMessages(true);
      setMessagesError(null);
      const res = await api.get(`/chat/${bookingId}`);
      if (res.data?.status === "success") {
        setMessages(res.data.data.messages || []);
        
        // After loading history, mark conversations as read locally
        setConversations((prev) =>
          prev.map((c) =>
            c.bookingId === bookingId ? { ...c, unreadCount: 0 } : c
          )
        );
      }
    } catch (err: any) {
      console.error("Error fetching chat history:", err);
      setMessagesError(
        err.response?.data?.message || err.message || "Failed to load chat history"
      );
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Send Message
  const sendMessage = async (messageText: string) => {
    if (!activeBookingId || !messageText.trim() || !userId) return;
    const trimmed = messageText.trim();

    // Create optimistic message ID
    const optimisticId = `optimistic_${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      _id: optimisticId,
      bookingId: activeBookingId,
      senderId: userId,
      receiverId: "", // will be set by backend
      messageText: trimmed,
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update messages list
    setMessages((prev) => [...prev, optimisticMessage]);

    // Update conversation sidebar last message optimistically
    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.bookingId === activeBookingId) {
          return {
            ...c,
            lastMessage: {
              messageText: trimmed,
              senderId: userId,
              createdAt: optimisticMessage.createdAt,
            },
          };
        }
        return c;
      });
      // Resort to bring active booking to top
      return [...updated].sort((a, b) => {
        const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.startDate);
        const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.startDate);
        return dateB.getTime() - dateA.getTime();
      });
    });

    try {
      const res = await api.post("/chat", {
        bookingId: activeBookingId,
        messageText: trimmed,
      }, {
        timeout: 45000
      });

      // Replace optimistic message with actual saved message
      if (res.data) {
        setMessages((prev) => {
          const mapped = prev.map((msg) => (msg._id === optimisticId ? res.data : msg));
          const seen = new Set<string>();
          return mapped.filter((m) => {
            if (seen.has(m._id)) return false;
            seen.add(m._id);
            return true;
          });
        });
        
        // Update sidebar last message with official server timestamp
        setConversations((prev) =>
          prev.map((c) =>
            c.bookingId === activeBookingId
              ? {
                  ...c,
                  lastMessage: {
                    messageText: res.data.messageText,
                    senderId: res.data.senderId,
                    createdAt: res.data.createdAt,
                  },
                }
              : c
          )
        );
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((msg) => msg._id !== optimisticId));
      if (err.response?.status === 403) {
        const errorMsg = err.response.data?.message || 
          (locale === "ar"
            ? "تنبيه أمني: مشاركة معلومات الاتصال الشخصية أو الدفع خارج المنصة محظور لحماية حسابك."
            : "Security alert: sharing personal contacts or proposing off-platform payments is forbidden to keep your booking protected.");
        
        // Append inline system alert message bubble
        const blockedMsg: ChatMessage = {
          _id: `blocked-${Date.now()}`,
          bookingId: activeBookingId || "",
          senderId: userId || "",
          receiverId: "",
          messageText: errorMsg,
          isRead: false,
          isSystemAlert: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, blockedMsg]);
      } else {
        setMessagesError("Failed to send message. Please try again.");
        // Clear global error after 4 seconds to not disrupt user experience
        setTimeout(() => setMessagesError(null), 4000);
      }
    }
  };

  // Mark active chat as read
  const markAsRead = useCallback(async (bookingId: string) => {
    try {
      await api.patch(`/chat/${bookingId}/read`);
    } catch (err) {
      console.error("Failed to mark chat as read on server:", err);
    }
  }, []);

  // Initialize conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch chat history whenever active booking ID changes
  useEffect(() => {
    if (bookingIdOf(activeBookingId)) {
      fetchChatHistory(activeBookingId!);
    } else {
      setMessages([]);
    }
  }, [activeBookingId, fetchChatHistory]);

  // Handle active chat selection and socket room joining
  useEffect(() => {
    if (!socket || !bookingIdOf(activeBookingId)) return;
    const bookingId = activeBookingId!;

    const joinRoom = () => {
      console.log(`Joining chat booking room: booking_${bookingId}`);
      socket.emit("joinBookingRoom", { bookingId });
    };

    joinRoom();

    // Rejoin on socket reconnect
    socket.on("connect", joinRoom);

    return () => {
      console.log(`Leaving chat booking room: booking_${bookingId}`);
      socket.emit("leaveBookingRoom", { bookingId });
      socket.off("connect", joinRoom);
    };
  }, [activeBookingId, socket]);

  // Real-time socket event listener for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: ChatMessage) => {
      console.log("Realtime message received:", msg);
      
      const currentActiveId = activeBookingIdRef.current;
      const currentActiveOtherUserId = activeOtherUserIdRef.current;
      const msgOtherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;

      const isForActiveChat = currentActiveOtherUserId && msgOtherUserId === currentActiveOtherUserId;

      if (isForActiveChat) {
        // Append to messages if it's the active chat, avoiding duplicates and replacing optimistic ones
        setMessages((prev) => {
          // If we already have this message ID, ignore it
          if (prev.some((m) => m._id === msg._id)) return prev;

          let next = [...prev];
          // If the message is from the current user, check if we have a matching optimistic message
          if (msg.senderId === userId) {
            const hasOptimistic = prev.some((m) => m._id.startsWith("optimistic_") && m.messageText === msg.messageText);
            if (hasOptimistic) {
              // Replace the first matching optimistic message with the real one
              let replaced = false;
              next = prev.map((m) => {
                if (!replaced && m._id.startsWith("optimistic_") && m.messageText === msg.messageText) {
                  replaced = true;
                  return msg;
                }
                return m;
              });
            } else {
              next.push(msg);
            }
          } else {
            next.push(msg);
          }

          // Uniqueness filter as a failsafe
          const seen = new Set<string>();
          return next.filter((m) => {
            if (seen.has(m._id)) return false;
            seen.add(m._id);
            return true;
          });
        });

        // Trigger mark as read in backend
        if (currentActiveId) markAsRead(currentActiveId);
      }

      // Update conversations sidebar last message and unread count
      setConversations((prev) => {
        const updated = prev.map((c) => {
          const isMatch = c.otherUser?._id === msgOtherUserId;
          if (isMatch) {
            const isSelf = msg.senderId === userId;
            const isCurrentlyActive = c.bookingId === currentActiveId;
            const newUnread = (isCurrentlyActive || isSelf) 
              ? c.unreadCount 
              : c.unreadCount + 1;

            return {
              ...c,
              unreadCount: newUnread,
              lastMessage: {
                messageText: msg.messageText,
                senderId: msg.senderId,
                createdAt: msg.createdAt,
              },
            };
          }
          return c;
        });

        // Re-sort conversations
        return [...updated].sort((a, b) => {
          const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.startDate);
          const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.startDate);
          return dateB.getTime() - dateA.getTime();
        });
      });
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, userId, markAsRead]);

  // Helper utility to safe check bookingId
  function bookingIdOf(id: string | null): boolean {
    return id !== null && id !== undefined && id !== "";
  }

  return {
    conversations,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    conversationsError,
    messagesError,
    sendMessage,
    refetchConversations: fetchConversations,
    refetchChatHistory: () => activeBookingId && fetchChatHistory(activeBookingId),
  };
};
