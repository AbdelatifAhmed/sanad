import { BookingStatus } from "../../types";

export interface ChatUser {
  _id: string;
  name: string;
  avatar: { url: string; public_id?: string } | null;
  role: string;
}

export interface ChatMessage {
  _id: string;
  bookingId: string;
  senderId: string;
  receiverId: string;
  messageText: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  bookingId: string;
  bookingStatus: BookingStatus;
  startDate: string;
  endDate: string;
  otherUser: ChatUser | null;
  lastMessage: {
    messageText: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}
