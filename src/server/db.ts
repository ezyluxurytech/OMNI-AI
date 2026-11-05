import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  preferences: {
    theme: 'dark' | 'light' | 'system';
    reducedMotion: boolean;
    introCompleted: boolean;
    defaultModel: string;
    speedMode?: 'turbo' | 'standard' | 'deep';
  };
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
}

export interface MessageCitation {
  title: string;
  url: string;
  snippet?: string;
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

interface DatabaseSchema {
  users: User[];
  conversations: Conversation[];
  messages: Message[];
  documents: DocumentRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class Database {
  private data: DatabaseSchema = {
    users: [],
    conversations: [],
    messages: [],
    documents: [],
  };
  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        // Seed default demo user
        this.seedDemoUser();
        this.save();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('[DB] Error initializing database file:', err);
      this.seedDemoUser();
    }
  }

  private seedDemoUser() {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync('astraea2026', salt, 64).toString('hex');
    const demoUser: User = {
      id: 'usr_demo_astraea',
      email: 'explorer@astraea.ai',
      name: 'Cosmic Explorer',
      passwordHash: hash,
      salt: salt,
      createdAt: new Date().toISOString(),
      preferences: {
        theme: 'dark',
        reducedMotion: false,
        introCompleted: false,
        defaultModel: 'gemini-3.8-flash',
      },
    };
    this.data.users.push(demoUser);

    // Initial welcoming conversation
    const convId = 'conv_welcome_init';
    this.data.conversations.push({
      id: convId,
      userId: demoUser.id,
      title: 'Welcome to Omni AI',
      model: 'gemini-3.8-flash',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: true,
    });

    this.data.messages.push({
      id: 'msg_welcome_1',
      conversationId: convId,
      role: 'assistant',
      content: `### Welcome to Omni AI\n\nI am **Omni**, your next-generation frontier assistant powered by 4 flagship intelligence engines: deep multi-step reasoning, real-time web search grounding, multi-page document synthesis, and neural voice audio.\n\nHere is what you can do:\n\n- **Frontier Reasoning:** Tackle advanced STEM, multi-file code architectures, mathematics, and complex planning with Gemini 4 Argon.\n- **Live Web Research:** Ask current questions and receive answers grounded with clickable source citations.\n- **Document Synthesis:** Drag and drop PDFs, CSV spreadsheets, and reports for deep structural analysis, flashcards, and quizzes.\n- **Study Studio & Coding Lab:** Generate interactive multiple-choice practice quizzes, concept flashcards, and audit code for bugs and speed.\n- **Multilingual Nexus:** Translate fluently across English, Yorùbá, Igbo, Hausa, French, Spanish, German, and global languages with cultural nuance.\n- **Voice Narration:** Click the speaker button on any of my messages to listen with natural neural voice.\n\nHow may I help you explore today?`,
      timestamp: new Date().toISOString(),
    });
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error persisting database:', err);
    }
  }

  // Users
  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  createUser(name: string, email: string, password: string): User {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    const newUser: User = {
      id: `usr_${crypto.randomUUID().slice(0, 8)}`,
      email: email.toLowerCase(),
      name,
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
      preferences: {
        theme: 'dark',
        reducedMotion: false,
        introCompleted: false,
        defaultModel: 'gemini-3.8-flash',
      },
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUserPreferences(userId: string, prefs: Partial<User['preferences']>): User | undefined {
    const user = this.getUserById(userId);
    if (!user) return undefined;
    user.preferences = { ...user.preferences, ...prefs };
    this.save();
    return user;
  }

  verifyPassword(user: User, passwordAttempt: string): boolean {
    const attemptHash = crypto.scryptSync(passwordAttempt, user.salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(user.passwordHash, 'hex'), Buffer.from(attemptHash, 'hex'));
  }

  // Conversations
  listConversations(userId: string): Conversation[] {
    return this.data.conversations
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getConversation(id: string, userId: string): Conversation | undefined {
    return this.data.conversations.find((c) => c.id === id && c.userId === userId);
  }

  createConversation(userId: string, title = 'New Conversation', model = 'gemini-3.8-flash'): Conversation {
    const newConv: Conversation = {
      id: `conv_${crypto.randomUUID().slice(0, 10)}`,
      userId,
      title,
      model,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.conversations.unshift(newConv);
    this.save();
    return newConv;
  }

  updateConversation(id: string, userId: string, updates: Partial<Pick<Conversation, 'title' | 'pinned' | 'model'>>): Conversation | undefined {
    const conv = this.getConversation(id, userId);
    if (!conv) return undefined;
    if (updates.title !== undefined) conv.title = updates.title;
    if (updates.pinned !== undefined) conv.pinned = updates.pinned;
    if (updates.model !== undefined) conv.model = updates.model;
    conv.updatedAt = new Date().toISOString();
    this.save();
    return conv;
  }

  deleteConversation(id: string, userId: string): boolean {
    const initialLen = this.data.conversations.length;
    this.data.conversations = this.data.conversations.filter(
      (c) => !(c.id === id && c.userId === userId)
    );
    this.data.messages = this.data.messages.filter((m) => m.conversationId !== id);
    if (this.data.conversations.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Messages
  listMessages(conversationId: string): Message[] {
    return this.data.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  addMessage(msg: Omit<Message, 'id' | 'timestamp'>): Message {
    const newMsg: Message = {
      ...msg,
      id: `msg_${crypto.randomUUID().slice(0, 10)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.messages.push(newMsg);

    // Update conversation updatedAt
    const conv = this.data.conversations.find((c) => c.id === msg.conversationId);
    if (conv) {
      conv.updatedAt = newMsg.timestamp;
      // Auto-title first user message if title is default
      if (conv.title === 'New Conversation' && msg.role === 'user') {
        const snippet = msg.content.trim().slice(0, 36);
        conv.title = snippet.length < msg.content.trim().length ? `${snippet}...` : snippet;
      }
    }
    this.save();
    return newMsg;
  }

  deleteMessagesAfter(conversationId: string, messageId: string): boolean {
    const msgs = this.listMessages(conversationId);
    const targetIdx = msgs.findIndex((m) => m.id === messageId);
    if (targetIdx === -1) return false;

    const idsToDelete = new Set(msgs.slice(targetIdx).map((m) => m.id));
    this.data.messages = this.data.messages.filter((m) => !idsToDelete.has(m.id));
    this.save();
    return true;
  }

  // Documents
  addDocument(doc: Omit<DocumentRecord, 'id' | 'createdAt'>): DocumentRecord {
    const newDoc: DocumentRecord = {
      ...doc,
      id: `doc_${crypto.randomUUID().slice(0, 10)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.documents.unshift(newDoc);
    this.save();
    return newDoc;
  }

  listDocuments(userId: string): DocumentRecord[] {
    return this.data.documents
      .filter((d) => d.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const db = new Database();
