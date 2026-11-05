import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AstraeaLogo } from '../brand/AstraeaLogo';
import { Message } from '../../types';
import { api } from '../../api';
import {
  Copy,
  Check,
  RotateCw,
  Edit3,
  ExternalLink,
  Globe,
  FileText,
  User as UserIcon,
  Volume2,
  VolumeX,
  Loader2,
  Zap,
} from 'lucide-react';

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onEdit?: (messageId: string, newContent: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isStreaming = false,
  onRegenerate,
  onEdit,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(message.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handlePlayAudio = async () => {
    if (isPlayingAudio && audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    setLoadingAudio(true);
    try {
      const base64Wav = await api.synthesizeSpeech(message.content);
      if (!base64Wav) {
        throw new Error('No audio synthesized');
      }

      const audioBlob = await fetch(`data:audio/wav;base64,${base64Wav}`).then((r) => r.blob());
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;

      audio.onplay = () => {
        setIsPlayingAudio(true);
        setLoadingAudio(false);
      };

      audio.onended = () => {
        setIsPlayingAudio(false);
      };

      audio.onerror = () => {
        setIsPlayingAudio(false);
        setLoadingAudio(false);
      };

      await audio.play();
    } catch (err) {
      console.error('Audio playback error:', err);
      setLoadingAudio(false);
      setIsPlayingAudio(false);
    }
  };

  return (
    <div
      className={`py-5 px-4 md:px-6 rounded-2xl transition-colors ${
        isUser
          ? 'bg-slate-100/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/40'
          : 'bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-sm'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-start gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <UserIcon className="w-4 h-4" />
            </div>
          ) : (
            <div className="relative">
              <AstraeaLogo size={34} glow={true} glowIntensity="medium" withExplosions={true} />
            </div>
          )}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0">
          {/* Header info */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold tracking-wide text-slate-900 dark:text-white">
              {isUser ? 'You' : 'Omni'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Attachments if any */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {message.attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-slate-800/90 border border-sky-200 dark:border-slate-700/80 text-xs text-sky-700 dark:text-sky-300"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="font-semibold truncate max-w-xs">{att.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Edit mode for user */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full bg-white dark:bg-slate-950 border border-sky-500 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                >
                  Save & Resubmit
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs md:text-sm leading-relaxed text-slate-800 dark:text-slate-100 font-normal">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Code block customization
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !String(children).includes('\n');

                    if (isInline) {
                      return (
                        <code
                          className="bg-slate-100 dark:bg-slate-800/90 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-slate-200 dark:border-slate-700/60 font-medium"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    const codeString = String(children).replace(/\n$/, '');
                    return (
                      <div className="my-3 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-md">
                        <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-300 font-mono">
                          <span className="font-semibold text-sky-400">{match ? match[1] : 'code'}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(codeString);
                            }}
                            className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy code</span>
                          </button>
                        </div>
                        <pre className="p-4 text-xs font-mono overflow-x-auto text-slate-100 leading-relaxed bg-slate-950">
                          <code>{children}</code>
                        </pre>
                      </div>
                    );
                  },
                  h1({ children }) {
                    return <h1 className="text-base font-bold text-slate-900 dark:text-white my-3">{children}</h1>;
                  },
                  h2({ children }) {
                    return <h2 className="text-sm font-bold text-slate-900 dark:text-white my-2.5">{children}</h2>;
                  },
                  h3({ children }) {
                    return <h3 className="text-xs font-bold text-slate-900 dark:text-white my-2">{children}</h3>;
                  },
                  p({ children }) {
                    return <p className="mb-2.5 leading-relaxed text-slate-800 dark:text-slate-200 font-normal">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="list-disc pl-5 my-2 space-y-1 text-slate-800 dark:text-slate-200">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="list-decimal pl-5 my-2 space-y-1 text-slate-800 dark:text-slate-200">{children}</ol>;
                  },
                  table({ children }) {
                    return (
                      <div className="my-3 overflow-x-auto">
                        <table className="w-full text-left border-collapse border border-slate-300 dark:border-slate-800 text-xs">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="bg-slate-100 dark:bg-slate-800/80 p-2.5 border border-slate-300 dark:border-slate-700/80 font-bold text-slate-900 dark:text-white">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="p-2 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                        {children}
                      </td>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* Streaming pulsing cursor */}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-sky-500 animate-pulse rounded-sm align-middle" />
              )}
            </div>
          )}

          {/* Web Search Grounding Citations */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">
                <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Verified Sources ({message.citations.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {message.citations.map((cite, i) => (
                  <a
                    key={i}
                    href={cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-800 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-300 transition-colors font-medium"
                  >
                    <span className="truncate max-w-[200px]">{cite.title}</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Message bottom actions */}
          {!isEditing && (
            <div className="mt-3 flex items-center gap-2 pt-1 text-slate-500 dark:text-slate-400">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] hover:text-slate-900 dark:hover:text-slate-200 transition-colors font-medium cursor-pointer"
                title="Copy text"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* Neural TTS Voice Audio Synthesis Playback */}
              {!isUser && (
                <button
                  onClick={handlePlayAudio}
                  disabled={loadingAudio}
                  className={`flex items-center gap-1 text-[11px] transition-colors ml-2 font-medium cursor-pointer ${
                    isPlayingAudio
                      ? 'text-rose-500 dark:text-rose-400 font-bold'
                      : 'hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title={isPlayingAudio ? 'Pause voice playback' : 'Listen with Neural Voice'}
                >
                  {loadingAudio ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-sky-500" />
                      <span>Synthesizing...</span>
                    </>
                  ) : isPlayingAudio ? (
                    <>
                      <VolumeX className="w-3 h-3 animate-pulse" />
                      <span>Speaking</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3" />
                      <span>Listen</span>
                    </>
                  )}
                </button>
              )}

              {!isUser && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="flex items-center gap-1 text-[11px] hover:text-slate-900 dark:hover:text-slate-200 transition-colors ml-2 font-medium cursor-pointer"
                  title="Regenerate response"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>
              )}

              {isUser && onEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-[11px] hover:text-slate-900 dark:hover:text-slate-200 transition-colors ml-2 font-medium cursor-pointer"
                  title="Edit message"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}

              {/* Real-time Response Time & Throughput Telemetry */}
              {!isUser && message.metrics && (
                <div
                  className="flex items-center gap-1.5 ml-auto text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/60"
                  title={`Time-To-First-Token: ${message.metrics.ttftMs}ms | Total Duration: ${message.metrics.totalTimeMs}ms | Engine: ${message.metrics.modelUsed || 'Gemini'}`}
                >
                  <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {message.metrics.totalTimeMs ? `${(message.metrics.totalTimeMs / 1000).toFixed(1)}s` : '0.8s'}
                  </span>
                  {message.metrics.tokensPerSec ? (
                    <>
                      <span className="opacity-30">•</span>
                      <span>{message.metrics.tokensPerSec} tok/s</span>
                    </>
                  ) : null}
                  {message.metrics.speedMode === 'turbo' && (
                    <span className="px-1 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold text-[9px] uppercase">
                      Turbo
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
