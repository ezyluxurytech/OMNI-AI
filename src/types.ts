export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  preferences: {
    theme: 'dark' | 'light' | 'system';
    reducedMotion: boolean;
    introCompleted: boolean;
    defaultModel: string;
    speedMode?: 'turbo' | 'standard' | 'deep';
  };
}

export interface MessageCitation {
  title: string;
  url: string;
  snippet?: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
}

export interface MessageMetrics {
  totalTimeMs?: number;
  ttftMs?: number;
  tokensPerSec?: number;
  speedMode?: 'turbo' | 'standard' | 'deep';
  modelUsed?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: MessageCitation[];
  attachments?: MessageAttachment[];
  metrics?: MessageMetrics;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  name: string;
  type: string;
  size: number;
  summary?: string;
  pageCount?: number;
  createdAt: string;
}

export type ActiveWorkspace = 'chat' | 'documents' | 'study' | 'code' | 'translate';
