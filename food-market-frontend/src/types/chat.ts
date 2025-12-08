// src/types/chat.ts

export type ConversationStatus = 'WAITING' | 'ACTIVE' | 'IDLE';
export type SenderType = 'CUSTOMER' | 'STAFF' | 'SYSTEM';

export interface ChatStats {
  waitingCount: number;
  myActiveCount: number;
}

export interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar: string | null;
  customerEmail: string;
  staffId: string | null;
  status: ConversationStatus;
  title: string | null;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  conversationId: string;
  senderId: string;
  senderType: SenderType;
  content: string;
  isRead: boolean;
  sentAt: string;
}