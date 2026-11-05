import React, { useState, useEffect, useRef } from 'react';
import { User, Conversation, Message, ActiveWorkspace } from './types';
import { api, authStorage } from './api';
import { GalaxyIntro } from './components/intro/GalaxyIntro';
import { AuthModal } from './components/auth/AuthModal';
import { Sidebar } from './components/layout/Sidebar';
import { ChatArea } from './components/chat/ChatArea';
import { DocumentWorkspace } from './components/documents/DocumentWorkspace';
import { StudyWorkspace } from './components/tools/StudyWorkspace';
import { CodingWorkspace } from './components/tools/CodingWorkspace';
import { TranslationWorkspace } from './components/tools/TranslationWorkspace';
import { SettingsModal } from './components/settings/SettingsModal';
import { ProModal } from './components/pro/ProModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light' | 'system'>('dark');

  // Workspaces
  const [activeWorkspace, setActiveWorkspace] = useState<ActiveWorkspace>('chat');

  // Conversations & Messages
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamingSources, setStreamingSources] = useState<any[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Web Grounding Toggle
  const [webSearch, setWebSearch] = useState(false);

  // 1. Initial Authentication & Theme Check
  useEffect(() => {
    // Immediately apply saved theme from localStorage on initial render
    const savedTheme = (localStorage.getItem('omni_theme') as 'dark' | 'light' | 'system') || 'dark';
    applyTheme(savedTheme);

    // Check if user has seen the signature center-origin hyperspace intro
    const introSeen = localStorage.getItem('omni_hyperspace_intro_v4_seen');
    if (!introSeen) {
      setShowIntro(true);
    }

    const token = authStorage.getToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }

    api
      .getMe()
      .then((data) => {
        setUser(data.user);
        const userTheme = data.user.preferences?.theme || savedTheme;
        applyTheme(userTheme);
        // Check if pro preference or model
        if (data.user.preferences?.defaultModel === 'gemini-4-argon') {
          setIsPro(true);
        }
      })
      .catch(() => {
        authStorage.clearToken();
        setUser(null);
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []);

  // 2. Load conversations when user is authenticated
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // 3. Load active conversation messages when selected
  useEffect(() => {
    if (activeConversationId && user) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, user]);

  const applyTheme = (theme: 'dark' | 'light' | 'system') => {
    const root = document.documentElement;
    const body = document.body;
    setCurrentTheme(theme);
    try {
      localStorage.setItem('omni_theme', theme);
    } catch (e) {}

    const isDark =
      theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
      body.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      body.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
      body.className = 'dark bg-slate-950 text-slate-100 antialiased min-h-screen selection:bg-sky-500/30 selection:text-sky-200';
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      body.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
      body.className = 'bg-slate-50 text-slate-900 antialiased min-h-screen selection:bg-sky-500/20 selection:text-sky-900';
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    if (user) {
      api.updatePreferences({ theme: nextTheme }).catch(console.error);
    }
  };

  const handleTogglePro = () => {
    const newPro = !isPro;
    setIsPro(newPro);
    const newModel = newPro ? 'gemini-4-argon' : 'gemini-3.8-flash';
    if (user) {
      api.updatePreferences({ defaultModel: newModel }).catch(console.error);
    }
  };

  const loadConversations = async () => {
    try {
      const res = await api.getConversations();
      setConversations(res.conversations);
      if (res.conversations.length > 0 && !activeConversationId) {
        setActiveConversationId(res.conversations[0].id);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  };

  const loadMessages = async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await api.getConversationMessages(convId);
      setMessages(res.messages);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Auth Success Handler
  const handleAuthSuccess = (authenticatedUser: User, isNewUser: boolean) => {
    setUser(authenticatedUser);
    const uTheme = authenticatedUser.preferences?.theme || currentTheme;
    applyTheme(uTheme);

    const storageKey = 'omni_hyperspace_intro_v4_seen';
    const alreadySeen = localStorage.getItem(storageKey);

    if (isNewUser || !alreadySeen) {
      setShowIntro(true);
    } else {
      setShowIntro(false);
    }
  };

  // Intro Completion Handler
  const handleIntroComplete = () => {
    setShowIntro(false);
    try {
      localStorage.setItem('omni_hyperspace_intro_v4_seen', 'true');
    } catch (e) {}
    if (user) {
      api.updatePreferences({ introCompleted: true }).catch(console.error);
    }
  };

  // Replay Intro
  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  // New Conversation
  const handleNewConversation = async () => {
    try {
      const preferredModel = isPro ? 'gemini-4-argon' : user?.preferences?.defaultModel || 'gemini-3.8-flash';
      const res = await api.createConversation('New Conversation', preferredModel);
      setConversations((prev) => [res.conversation, ...prev]);
      setActiveConversationId(res.conversation.id);
      setActiveWorkspace('chat');
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  // Delete Conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Rename Conversation
  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const res = await api.updateConversation(id, { title: newTitle });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: res.conversation.title } : c))
      );
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  // Toggle Pin Conversation
  const handleTogglePin = async (id: string, currentPin?: boolean) => {
    try {
      const res = await api.updateConversation(id, { pinned: !currentPin });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, pinned: res.conversation.pinned } : c))
      );
    } catch (err) {
      console.error('Failed to pin conversation:', err);
    }
  };

  // Send Chat Message via SSE Streaming
  const handleSendMessage = async (text: string, attachments?: any[]) => {
    let convId = activeConversationId;
    const modelToUse = isPro ? 'gemini-4-argon' : user?.preferences?.defaultModel || 'gemini-3.8-flash';

    if (!convId) {
      try {
        const res = await api.createConversation('New Conversation', modelToUse);
        setConversations((prev) => [res.conversation, ...prev]);
        convId = res.conversation.id;
        setActiveConversationId(convId);
      } catch (err) {
        console.error('Failed to create conversation for chat:', err);
        return;
      }
    }

    setIsStreaming(true);
    setStreamingText('');
    setStreamingSources([]);

    abortControllerRef.current = new AbortController();

    api.streamChat({
      conversationId: convId,
      message: text,
      attachments,
      webSearch,
      model: modelToUse,
      signal: abortControllerRef.current.signal,
      onUserMessage: (userMsg) => {
        setMessages((prev) => [...prev, userMsg]);
      },
      onChunk: (chunk) => {
        setStreamingText((prev) => prev + chunk);
      },
      onSources: (sources) => {
        setStreamingSources(sources);
      },
      onComplete: (assistantMsg) => {
        setIsStreaming(false);
        setStreamingText('');
        setStreamingSources([]);
        if (assistantMsg) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === assistantMsg.id)) return prev;
            return [...prev, assistantMsg];
          });
        }
        loadConversations();
      },
      onError: (errMsg) => {
        setIsStreaming(false);
        setStreamingText('');
        setStreamingSources([]);
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            conversationId: convId!,
            role: 'assistant',
            content: `**Error:** ${errMsg}. Please try again.`,
            timestamp: new Date().toISOString(),
          },
        ]);
      },
    });
  };

  // Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  // Regenerate Response
  const handleRegenerate = async () => {
    if (messages.length === 0 || isStreaming) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg || !activeConversationId) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'assistant') {
      try {
        await api.truncateConversation(activeConversationId, lastMsg.id);
        setMessages((prev) => prev.slice(0, -1));
      } catch {}
    }

    handleSendMessage(lastUserMsg.content, lastUserMsg.attachments as any);
  };

  // Edit Message
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!activeConversationId) return;

    try {
      await api.truncateConversation(activeConversationId, messageId);
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === messageId);
        return idx !== -1 ? prev.slice(0, idx) : prev;
      });
      handleSendMessage(newContent);
    } catch (err) {
      console.error('Failed to edit and resubmit message:', err);
    }
  };

  // Bridge Document to Chat
  const handleStartChatWithDoc = (docName: string, initialInsight: string) => {
    const modelToUse = isPro ? 'gemini-4-argon' : user?.preferences?.defaultModel || 'gemini-3.8-flash';
    api
      .createConversation(`Analysis: ${docName}`, modelToUse)
      .then((res) => {
        setConversations((prev) => [res.conversation, ...prev]);
        setActiveConversationId(res.conversation.id);
        setActiveWorkspace('chat');
        handleSendMessage(
          `I would like to explore this document further:\n\n${initialInsight}`
        );
      })
      .catch(console.error);
  };

  // Bridge Study Aid or Code Review to Chat
  const handleSendToolContentToChat = (content: string) => {
    const modelToUse = isPro ? 'gemini-4-argon' : user?.preferences?.defaultModel || 'gemini-3.8-flash';
    api
      .createConversation('Exploration Session', modelToUse)
      .then((res) => {
        setConversations((prev) => [res.conversation, ...prev]);
        setActiveConversationId(res.conversation.id);
        setActiveWorkspace('chat');
        handleSendMessage(content);
      })
      .catch(console.error);
  };

  // Sign out
  const handleSignOut = () => {
    authStorage.clearToken();
    setUser(null);
    setConversations([]);
    setMessages([]);
    setActiveConversationId(null);
    setShowSettings(false);
    setShowProModal(false);
  };

  // Clear History
  const handleClearHistory = async () => {
    if (!user) return;
    for (const c of conversations) {
      await api.deleteConversation(c.id).catch(() => {});
    }
    setConversations([]);
    setMessages([]);
    setActiveConversationId(null);
    setShowSettings(false);
  };

  // Loading Screen
  if (authChecking) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-mono tracking-wider text-sky-400 font-bold">INITIALIZING OMNI AI...</span>
      </div>
    );
  }

  // Not logged in -> Show Auth Modal
  if (!user) {
    return <AuthModal onSuccess={handleAuthSuccess} />;
  }

  // First Login or Replay Intro -> Show Galaxy Intro
  if (showIntro) {
    return (
      <GalaxyIntro
        onComplete={handleIntroComplete}
        reducedMotion={user.preferences?.reducedMotion}
      />
    );
  }

  const activeConv = conversations.find((c) => c.id === activeConversationId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Left Sidebar */}
      <Sidebar
        user={user}
        conversations={conversations}
        activeConversationId={activeConversationId}
        activeWorkspace={activeWorkspace}
        isPro={isPro}
        theme={currentTheme}
        onToggleTheme={handleToggleTheme}
        onOpenPro={() => setShowProModal(true)}
        onSelectConversation={(id) => {
          setActiveConversationId(id);
          setActiveWorkspace('chat');
        }}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePin}
        onSelectWorkspace={setActiveWorkspace}
        onOpenSettings={() => setShowSettings(true)}
        onSignOut={handleSignOut}
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* Main Workspace Switcher */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {activeWorkspace === 'chat' && (
          <ChatArea
            conversation={activeConv}
            messages={messages}
            isStreaming={isStreaming}
            streamingMessageText={streamingText}
            streamingSources={streamingSources}
            webSearch={webSearch}
            isPro={isPro}
            theme={currentTheme}
            onToggleTheme={handleToggleTheme}
            onReplayIntro={handleReplayIntro}
            onOpenPro={() => setShowProModal(true)}
            onToggleWebSearch={() => setWebSearch((prev) => !prev)}
            onSendMessage={handleSendMessage}
            onStopStreaming={handleStopStreaming}
            onRegenerate={handleRegenerate}
            onEditMessage={handleEditMessage}
            onOpenMobileMenu={() => setSidebarOpen(true)}
            onSelectQuickPrompt={(prompt) => handleSendMessage(prompt)}
          />
        )}

        {activeWorkspace === 'documents' && (
          <DocumentWorkspace
            theme={currentTheme}
            onToggleTheme={handleToggleTheme}
            onStartChatWithDoc={handleStartChatWithDoc}
            onOpenMobileMenu={() => setSidebarOpen(true)}
          />
        )}

        {activeWorkspace === 'study' && (
          <StudyWorkspace
            theme={currentTheme}
            onToggleTheme={handleToggleTheme}
            onOpenMobileMenu={() => setSidebarOpen(true)}
            onSendToChat={handleSendToolContentToChat}
          />
        )}

        {activeWorkspace === 'code' && (
          <CodingWorkspace
            theme={currentTheme}
            onToggleTheme={handleToggleTheme}
            onOpenMobileMenu={() => setSidebarOpen(true)}
            onSendToChat={handleSendToolContentToChat}
          />
        )}

        {activeWorkspace === 'translate' && (
          <TranslationWorkspace
            theme={currentTheme}
            onToggleTheme={handleToggleTheme}
            onOpenMobileMenu={() => setSidebarOpen(true)}
            onSendToChat={handleSendToolContentToChat}
          />
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          user={user}
          conversations={conversations}
          onClose={() => setShowSettings(false)}
          onUpdatePreferences={(prefs) => {
            setUser((prev) => (prev ? { ...prev, preferences: { ...prev.preferences, ...prefs } } : prev));
            if (prefs.theme) applyTheme(prefs.theme);
          }}
          onReplayIntro={handleReplayIntro}
          onClearHistory={handleClearHistory}
          onSignOut={handleSignOut}
        />
      )}

      {/* Omni Pro Modal */}
      {showProModal && (
        <ProModal
          isPro={isPro}
          onTogglePro={handleTogglePro}
          onClose={() => setShowProModal(false)}
        />
      )}
    </div>
  );
}
