import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/server/db.js';
import {
  createToken,
  requireAuth,
  sanitizeUser,
  AuthenticatedRequest,
} from './src/server/auth.js';
import {
  streamChat,
  analyzeDocument,
  generateStudyAid,
  analyzeCode,
  translateText,
  getProviderStatus,
  generateSpeech,
} from './src/server/gemini.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // High body limit for base64 PDF and image processing
  app.use(cors());
  app.use(express.json({ limit: '35mb' }));
  app.use(express.urlencoded({ extended: true, limit: '35mb' }));

  // --- AUTHENTICATION ROUTES ---
  app.post('/api/auth/register', (req: Request, res: Response): void => {
    try {
      const { name, email, password } = req.body;
      if (!email || !password || !name) {
        res.status(400).json({ error: 'Name, email, and password are required' });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
      }
      const existing = db.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: 'An account with this email already exists' });
        return;
      }
      const user = db.createUser(name, email, password);
      const token = createToken(user.id);
      res.status(201).json({ user: sanitizeUser(user), token, isNewUser: true });
    } catch (err: any) {
      console.error('[Auth Register Error]:', err);
      res.status(500).json({ error: 'Failed to create user account' });
    }
  });

  app.post('/api/auth/login', (req: Request, res: Response): void => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }
      const user = db.getUserByEmail(email);
      if (!user || !db.verifyPassword(user, password)) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }
      const token = createToken(user.id);
      res.json({
        user: sanitizeUser(user),
        token,
        isNewUser: !user.preferences.introCompleted,
      });
    } catch (err: any) {
      console.error('[Auth Login Error]:', err);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  app.post('/api/auth/demo', (req: Request, res: Response): void => {
    try {
      let demoUser = db.getUserByEmail('explorer@omni.ai') || db.getUserByEmail('explorer@astraea.ai');
      if (!demoUser) {
        demoUser = db.createUser('Cosmic Explorer', 'explorer@omni.ai', 'omni2026');
      }
      const token = createToken(demoUser.id);
      res.json({
        user: sanitizeUser(demoUser),
        token,
        isNewUser: !demoUser.preferences.introCompleted,
      });
    } catch (err: any) {
      console.error('[Demo Auth Error]:', err);
      res.status(500).json({ error: 'Demo login failed' });
    }
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
    res.json({ user: sanitizeUser(req.user!) });
  });

  app.patch('/api/auth/preferences', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
    try {
      const updated = db.updateUserPreferences(req.user!.id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json({ user: sanitizeUser(updated) });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  });

  // --- CONVERSATION ROUTES ---
  app.get('/api/conversations', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
    const list = db.listConversations(req.user!.id);
    res.json({ conversations: list });
  });

  app.post('/api/conversations', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
    const { title, model } = req.body;
    const conv = db.createConversation(req.user!.id, title || 'New Conversation', model || 'gemini-3.8-flash');
    res.status(201).json({ conversation: conv });
  });

  app.get('/api/conversations/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
    const conv = db.getConversation(req.params.id, req.user!.id);
    if (!conv) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    const messages = db.listMessages(conv.id);
    res.json({ conversation: conv, messages });
  });

  app.patch('/api/conversations/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
    const updated = db.updateConversation(req.params.id, req.user!.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ conversation: updated });
  });

  app.delete('/api/conversations/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
    const ok = db.deleteConversation(req.params.id, req.user!.id);
    if (!ok) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ success: true });
  });

  app.post('/api/conversations/:id/truncate', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
    const conv = db.getConversation(req.params.id, req.user!.id);
    if (!conv) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    const { messageId } = req.body;
    if (!messageId) {
      res.status(400).json({ error: 'messageId required' });
      return;
    }
    db.deleteMessagesAfter(conv.id, messageId);
    const messages = db.listMessages(conv.id);
    res.json({ success: true, messages });
  });

  // --- STREAMING CHAT (SSE) ---
  app.post('/api/chat/stream', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { conversationId, message, webSearch, model, attachments } = req.body;

    if (!conversationId || (!message && (!attachments || attachments.length === 0))) {
      res.status(400).json({ error: 'conversationId and message or attachment are required' });
      return;
    }

    const conv = db.getConversation(conversationId, req.user!.id);
    if (!conv) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Save user message to database
    const savedUserMsg = db.addMessage({
      conversationId: conv.id,
      role: 'user',
      content: message || 'Attached file analysis',
      attachments: attachments?.map((a: any) => ({
        id: Math.random().toString(36).substring(7),
        name: a.name || 'attachment',
        type: a.mimeType || 'application/octet-stream',
        size: a.size || 0,
      })),
    });

    // Prepare SSE response headers with zero-buffering for instant Time-To-First-Token
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Critical: disables reverse-proxy/Cloud Run buffering
    });

    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }
    if (req.socket) {
      req.socket.setNoDelay(true); // Disable TCP Nagle's algorithm for instant token delivery
    }

    // Send the user message acknowledgment
    res.write(`data: ${JSON.stringify({ type: 'user_message', message: savedUserMsg })}\n\n`);
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }

    // Fetch message history for context
    const allMsgs = db.listMessages(conv.id);
    const history = allMsgs.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let fullAnswer = '';
    let sources: any[] = [];
    let isAborted = false;
    const startTime = Date.now();
    let firstTokenTime: number | null = null;
    let wordCount = 0;

    req.on('close', () => {
      isAborted = true;
    });

    try {
      const chatResult = await streamChat(
        {
          model: model || conv.model || (req.body.speedMode === 'turbo' ? 'gemini-3.1-flash-lite' : undefined),
          speedMode: req.body.speedMode,
          messages: history,
          webSearch: Boolean(webSearch),
          attachments: attachments?.map((a: any) => ({
            mimeType: a.mimeType,
            data: a.data,
            name: a.name,
          })),
        },
        (chunkText) => {
          if (!isAborted) {
            if (!firstTokenTime) {
              firstTokenTime = Date.now();
            }
            fullAnswer += chunkText;
            wordCount += chunkText.split(/\s+/).filter(Boolean).length;
            res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunkText })}\n\n`);
            if (typeof (res as any).flush === 'function') {
              (res as any).flush();
            }
          }
        },
        (retrievedSources) => {
          if (!isAborted) {
            sources = retrievedSources;
            res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);
            if (typeof (res as any).flush === 'function') {
              (res as any).flush();
            }
          }
        }
      );

      const totalTimeMs = Date.now() - startTime;
      const ttftMs = firstTokenTime ? firstTokenTime - startTime : totalTimeMs;
      const tokenEstimate = Math.round(wordCount * 1.3);
      const tokensPerSec = totalTimeMs > 0 ? Math.round((tokenEstimate / (totalTimeMs / 1000)) * 10) / 10 : 0;

      const metrics = {
        totalTimeMs,
        ttftMs,
        tokensPerSec,
        speedMode: req.body.speedMode || 'turbo',
        modelUsed: chatResult.model,
      };

      // Save assistant message to database with performance metrics
      const savedAssistantMsg = db.addMessage({
        conversationId: conv.id,
        role: 'assistant',
        content: fullAnswer,
        citations: sources,
        metrics,
      });

      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          message: savedAssistantMsg,
          metrics,
        })}\n\n`
      );
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: any) {
      console.error('[Gemini Stream Error]:', err);
      const errMsg = err?.message || 'Error generating AI response';
      res.write(`data: ${JSON.stringify({ type: 'error', error: errMsg })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  });

  // --- DOCUMENT ANALYSIS ---
  app.post('/api/documents/analyze', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { filename, mimeType, base64Data, task, customPrompt } = req.body;
      if (!filename || !mimeType || !base64Data) {
        res.status(400).json({ error: 'filename, mimeType, and base64Data are required' });
        return;
      }

      const analysisResult = await analyzeDocument({
        filename,
        mimeType,
        base64Data,
        task: task || 'summary',
        customPrompt,
      });

      // Save document record in DB
      const approxBytes = Math.round((base64Data.length * 3) / 4);
      const record = db.addDocument({
        userId: req.user!.id,
        name: filename,
        type: mimeType,
        size: approxBytes,
        summary: (analysisResult || '').slice(0, 300) + '...',
      });

      res.json({
        document: record,
        result: analysisResult,
      });
    } catch (err: any) {
      console.error('[Document Analysis Error]:', err);
      res.status(500).json({ error: err?.message || 'Failed to analyze document' });
    }
  });

  app.get('/api/documents/list', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
    const docs = db.listDocuments(req.user!.id);
    res.json({ documents: docs });
  });

  // --- STUDY ASSISTANT ---
  app.post('/api/tools/study', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { type, topic, difficulty } = req.body;
      if (!topic) {
        res.status(400).json({ error: 'topic is required' });
        return;
      }
      const result = await generateStudyAid({
        type: type || 'quiz',
        topic,
        difficulty: difficulty || 'intermediate',
      });
      res.json({ result });
    } catch (err: any) {
      console.error('[Study Tool Error]:', err);
      res.status(500).json({ error: err?.message || 'Failed to generate study materials' });
    }
  });

  // --- CODING ASSISTANT ---
  app.post('/api/tools/code', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { action, code, language, context } = req.body;
      if (!code) {
        res.status(400).json({ error: 'code is required' });
        return;
      }
      const result = await analyzeCode({
        action: action || 'explain',
        code,
        language: language || 'typescript',
        context,
      });
      res.json({ result });
    } catch (err: any) {
      console.error('[Coding Tool Error]:', err);
      res.status(500).json({ error: err?.message || 'Code analysis failed' });
    }
  });

  // --- MULTILINGUAL TRANSLATOR ---
  app.post('/api/tools/translate', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { text, sourceLang, targetLang } = req.body;
      if (!text || !targetLang) {
        res.status(400).json({ error: 'text and targetLang are required' });
        return;
      }
      const result = await translateText({
        text,
        sourceLang: sourceLang || 'Auto-detect',
        targetLang,
      });
      res.json({ result });
    } catch (err: any) {
      console.error('[Translation Error]:', err);
      res.status(500).json({ error: err?.message || 'Translation failed' });
    }
  });

  // --- NEURAL SPEECH AUDIO ---
  app.post('/api/speech', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { text, voice } = req.body;
      if (!text) {
        res.status(400).json({ error: 'text is required' });
        return;
      }
      const audioBase64 = await generateSpeech(text, voice);
      if (!audioBase64) {
        res.status(500).json({ error: 'Failed to synthesize speech audio' });
        return;
      }
      res.json({ audio: audioBase64, mimeType: 'audio/wav' });
    } catch (err: any) {
      console.error('[Speech API Error]:', err);
      res.status(500).json({ error: err?.message || 'Speech generation failed' });
    }
  });

  // --- SYSTEM STATUS & PROVIDERS ---
  app.get('/api/system/status', async (req: Request, res: Response): Promise<void> => {
    try {
      const status = await getProviderStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: 'Status check failed' });
    }
  });

  // --- VITE DEV OR STATIC PRODUCTION MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Astraea AI Full-Stack Server active on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Startup Failure]:', err);
  process.exit(1);
});
