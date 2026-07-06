export interface AdminConversation {
  _id: string;
  userId: string;
  userRole: "family" | "companion";
  adminId?: string;
  lastMessage: string;
  lastMessageTime: string | null;
  unreadByAdmin: number;
  unreadByUser: number;
  status: "open" | "resolved";
  subject?: string;
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
  messageType: "text" | "image" | "pdf" | "document";
  text: string;
  attachment?: Attachment;
  isRead: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
