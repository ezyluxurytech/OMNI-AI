import { Conversation, Message, User, DocumentRecord } from './types';

const TOKEN_KEY = 'astraea_auth_token';

export const authStorage = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clearToken: (): void => localStorage.removeItem(TOKEN_KEY),
};

function getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  const token = authStorage.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async register(name: string, email: string, password: string) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register');
    authStorage.setToken(data.token);
    return data;
  },

  async login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to log in');
    authStorage.setToken(data.token);
    return data;
  },

  async demoLogin() {
    const res = await fetch('/api/auth/demo', {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed demo login');
    authStorage.setToken(data.token);
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch('/api/auth/me', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  async updatePreferences(prefs: Partial<User['preferences']>): Promise<{ user: User }> {
    const res = await fetch('/api/auth/preferences', {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(prefs),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update preferences');
    return data;
  },

  // Conversations
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    const res = await fetch('/api/conversations', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load conversations');
    return res.json();
  },

  async createConversation(title?: string, model?: string): Promise<{ conversation: Conversation }> {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, model }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create conversation');
    return data;
  },

  async getConversationMessages(id: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    const res = await fetch(`/api/conversations/${id}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load conversation');
    return data;
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<{ conversation: Conversation }> {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update conversation');
    return data;
  },

  async deleteConversation(id: string): Promise<void> {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
  },

  async truncateConversation(id: string, messageId: string): Promise<{ messages: Message[] }> {
    const res = await fetch(`/api/conversations/${id}/truncate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ messageId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to truncate messages');
    return data;
  },

  // Streaming Chat with SSE & AbortController
  streamChat(params: {
    conversationId: string;
    message?: string;
    webSearch?: boolean;
    model?: string;
    speedMode?: 'turbo' | 'standard' | 'deep';
    attachments?: Array<{ name: string; mimeType: string; data: string; size: number }>;
    signal?: AbortSignal;
    onUserMessage?: (msg: Message) => void;
    onChunk: (chunk: string) => void;
    onSources?: (sources: any[]) => void;
    onComplete: (assistantMsg?: Message) => void;
    onError: (err: string) => void;
  }) {
    fetch('/api/chat/stream', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        conversationId: params.conversationId,
        message: params.message,
        webSearch: params.webSearch,
        model: params.model,
        speedMode: params.speedMode,
        attachments: params.attachments,
      }),
      signal: params.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error: 'Stream failed' }));
          params.onError(errData.error || `HTTP ${response.status}`);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          params.onError('No response stream available');
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              params.onComplete();
              return;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'user_message' && params.onUserMessage) {
                params.onUserMessage(parsed.message);
              } else if (parsed.type === 'chunk') {
                params.onChunk(parsed.text);
              } else if (parsed.type === 'sources' && params.onSources) {
                params.onSources(parsed.sources);
              } else if (parsed.type === 'done') {
                params.onComplete(parsed.message);
              } else if (parsed.type === 'error') {
                params.onError(parsed.error);
              }
            } catch {
              // ignore parse error on partial chunks
            }
          }
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          console.log('[Chat Stream] Request canceled by user');
          params.onComplete();
        } else {
          params.onError(err.message || 'Stream interrupted');
        }
      });
  },

  // Document Analysis
  async analyzeDocument(params: {
    filename: string;
    mimeType: string;
    base64Data: string;
    task: 'summary' | 'qa' | 'study_guide' | 'quiz';
    customPrompt?: string;
  }): Promise<{ document: DocumentRecord; result: string }> {
    const res = await fetch('/api/documents/analyze', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Document analysis failed');
    return data;
  },

  async listDocuments(): Promise<{ documents: DocumentRecord[] }> {
    const res = await fetch('/api/documents/list', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load documents');
    return res.json();
  },

  // Tools
  async studyAid(params: { type: 'quiz' | 'flashcards' | 'revision'; topic: string; difficulty?: string }) {
    const res = await fetch('/api/tools/study', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate study materials');
    return data;
  },

  async codeAudit(params: { action: 'explain' | 'debug' | 'optimize' | 'refactor'; code: string; language?: string; context?: string }) {
    const res = await fetch('/api/tools/code', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Code analysis failed');
    return data;
  },

  async translate(params: { text: string; sourceLang: string; targetLang: string }) {
    const res = await fetch('/api/tools/translate', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Translation failed');
    return data;
  },

  async synthesizeSpeech(text: string, voice = 'Kore'): Promise<string> {
    const res = await fetch('/api/speech', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text, voice }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Speech generation failed');
    return data.audio;
  },

  async getSystemStatus() {
    const res = await fetch('/api/system/status');
    return res.json();
  },
};
