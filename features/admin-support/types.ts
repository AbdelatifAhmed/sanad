export type ConversationStatus =
  | "open"
  | "waiting_for_admin"
  | "waiting_for_user"
  | "resolved"
  | "closed";

export interface AdminConversation {
  _id: string;
  userId: string;
  userRole: "family" | "companion";
  adminId?: string;
  lastMessage: string;
  lastMessageTime: string | null;
  unreadByAdmin: number;
  unreadByUser: number;
  status: ConversationStatus;
  subject?: string;
  reopenedAt?: string | null;
  reopenCount?: number;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  url: string | null;
  publicId?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  attachmentType?: string | null;
}

export interface AdminMessage {
  _id: string;
  conversationId: string;
  senderId: string | { _id: string; name: string; avatar?: { url: string } | null; role: string };
  senderRole: "admin" | "family" | "companion";
  receiverId: string | { _id: string; name: string };
  receiverRole: "admin" | "family" | "companion";
  messageType: "text" | "image" | "pdf" | "document" | "system";
  text: string;
  attachment?: Attachment;
  isRead: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
