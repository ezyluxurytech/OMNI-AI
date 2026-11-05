import React, { useRef, useEffect } from 'react';
import { Conversation, Message } from '../../types';
import { AstraeaLogo } from '../brand/AstraeaLogo';
import { MessageItem } from './MessageItem';
import { Composer } from './Composer';
import {
  Menu,
  Sparkles,
  Code2,
  Globe2,
  FileText,
  Search,
  Sun,
  Moon,
  Zap,
} from 'lucide-react';

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  isStreaming: boolean;
  streamingMessageText: string;
  streamingSources: any[];
  webSearch: boolean;
  isPro?: boolean;
  theme: 'dark' | 'light' | 'system';
  onToggleTheme: () => void;
  onReplayIntro?: () => void;
  onOpenPro: () => void;
  onToggleWebSearch: () => void;
  onSendMessage: (text: string, attachments?: any[]) => void;
  onStopStreaming: () => void;
  onRegenerate: () => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onOpenMobileMenu: () => void;
  onSelectQuickPrompt: (prompt: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  isStreaming,
  streamingMessageText,
  streamingSources,
  webSearch,
  isPro = false,
  theme,
  onToggleTheme,
  onReplayIntro,
  onOpenPro,
  onToggleWebSearch,
  onSendMessage,
  onStopStreaming,
  onRegenerate,
  onEditMessage,
  onOpenMobileMenu,
  onSelectQuickPrompt,
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessageText]);

  const quickPrompts = [
    {
      icon: Search,
      title: 'Web Grounded Research',
      desc: 'Verify latest discoveries with clickable citations',
      prompt: 'Perform web-grounded research on recent commercial fusion energy breakthroughs in 2026. Summarize key milestones and remaining obstacles.',
    },
    {
      icon: Code2,
      title: 'Code Architecture & Audit',
      desc: 'Debug, benchmark, and optimize complex pipelines',
      prompt: 'Review the best architectural patterns for handling backpressure and concurrency in modern TypeScript Node.js applications with code examples.',
    },
    {
      icon: FileText,
      title: 'Multi-Page Document Synthesis',
      desc: 'Extract findings, formulas & study notes from PDFs',
      prompt: 'Explain how you analyze uploaded multi-page documents, retain page references, and generate revision notes.',
    },
    {
      icon: Globe2,
      title: 'Multilingual Translation Nexus',
      desc: 'English, Yorùbá, Igbo, Hausa & global languages',
      prompt: 'Translate the concept of "continuous learning, innovation and wisdom" into Yorùbá, Igbo, and Hausa, providing grammatical nuance and pronunciation notes.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800/80 px-4 flex items-center justify-between shrink-0 bg-white/85 dark:bg-slate-950/75 backdrop-blur-md z-10">
        <div className="flex items-center gap-3 overflow-hidden">
          <button
            onClick={onOpenMobileMenu}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-xs md:text-sm text-slate-900 dark:text-white truncate">
              {conversation?.title || 'New Conversation'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-500/15 border border-sky-300 dark:border-sky-500/30 text-sky-800 dark:text-sky-300 font-mono font-bold hidden sm:inline-block">
              {conversation?.model || (isPro ? 'gemini-4-argon' : 'gemini-3.8-flash')}
            </span>
            {isPro && (
              <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[9px] font-extrabold uppercase shadow-sm hidden sm:inline-block">
                PRO
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {webSearch && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-500/10 border border-sky-300 dark:border-sky-500/30 px-2 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              <span className="hidden sm:inline">Search Grounding Active</span>
            </div>
          )}

          {/* Replay Hyperspace Intro Button */}
          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Replay cinematic hyperspace animation"
            >
              <Zap className="w-3.5 h-3.5 text-sky-500" />
              <span className="hidden md:inline">Hyperspace Intro</span>
            </button>
          )}

          {/* Upgrade to Pro Header Button */}
          <button
            onClick={onOpenPro}
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isPro
                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40'
                : 'bg-gradient-to-r from-rose-500 via-sky-500 to-amber-500 text-white hover:opacity-90'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isPro ? 'Pro Active' : 'Upgrade to Pro'}</span>
          </button>

          {/* High-Visibility Dark / Light Mood Toggle */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 transition-all cursor-pointer shadow-xs"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                <span className="hidden sm:inline">Dark Mood</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600/20" />
                <span className="hidden sm:inline">Light Mood</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 md:px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto pt-8 pb-12 flex flex-col items-center text-center px-4">
            <div className="mb-4 relative">
              <AstraeaLogo size={72} glow={true} glowIntensity="high" withExplosions={true} animated={true} />
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
              How can Omni assist you today?
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mb-8 leading-relaxed font-normal">
              A multimodal frontier assistant with 4 dedicated engines for deep reasoning, real-time web search grounding, document analysis, and neural voice.
            </p>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectQuickPrompt(item.prompt)}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-slate-700 text-left transition-all group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <item.icon className="w-4 h-4 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <MessageItem
                key={msg.id || index}
                message={msg}
                onRegenerate={index === messages.length - 1 ? onRegenerate : undefined}
                onEdit={onEditMessage}
              />
            ))}

            {isStreaming && (
              <MessageItem
                message={{
                  id: 'streaming-temp',
                  conversationId: conversation?.id || '',
                  role: 'assistant',
                  content: streamingMessageText || 'Thinking with Omni...',
                  timestamp: new Date().toISOString(),
                  citations: streamingSources,
                }}
                isStreaming={true}
              />
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer at Bottom */}
      <Composer
        onSendMessage={onSendMessage}
        isStreaming={isStreaming}
        onStopStreaming={onStopStreaming}
        webSearch={webSearch}
        onToggleWebSearch={onToggleWebSearch}
      />
    </div>
  );
};
