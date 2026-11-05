import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../../api';
import {
  Code2,
  Bug,
  Zap,
  Sparkles,
  FileCode,
  Copy,
  Check,
  Loader2,
  Menu,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';

interface CodingWorkspaceProps {
  onOpenMobileMenu: () => void;
  onSendToChat: (content: string) => void;
  theme?: 'dark' | 'light' | 'system';
  onToggleTheme?: () => void;
}

export const CodingWorkspace: React.FC<CodingWorkspaceProps> = ({
  onOpenMobileMenu,
  onSendToChat,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [code, setCode] = useState(`// Sample: Asynchronous queue with concurrent worker pool
class AsyncQueue<T> {
  private queue: (() => Promise<T>)[] = [];
  private activeCount = 0;

  constructor(private readonly concurrency: number = 4) {}

  add(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const res = await task();
          resolve(res);
        } catch (err) {
          reject(err);
        } finally {
          this.activeCount--;
          this.next();
        }
      });
      this.next();
    });
  }

  private next() {
    if (this.activeCount < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift()!;
      this.activeCount++;
      task();
    }
  }
}`);
  const [language, setLanguage] = useState('typescript');
  const [action, setAction] = useState<'explain' | 'debug' | 'optimize' | 'refactor'>('debug');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const languages = [
    'typescript',
    'python',
    'rust',
    'go',
    'javascript',
    'sql',
    'cpp',
    'java',
  ];

  const handleAudit = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await api.codeAudit({
        action,
        code,
        language,
        context: context.trim() || undefined,
      });
      setResult(res.result);
    } catch (err: any) {
      console.error('Code analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800/80 px-4 flex items-center justify-between shrink-0 bg-white/80 dark:bg-slate-950/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h1 className="font-bold text-xs md:text-sm text-slate-900 dark:text-white">
              Coding Lab & Architectural Audit
            </h1>
          </div>
        </div>

        {onToggleTheme && (
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
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Editor & Controls */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Source Code Input</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-normal">
                Inspect algorithms, catch edge-case bugs, optimize complexity, and refactor using Gemini 4 Argon.
              </p>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-sky-500"
              >
                {languages.map((l) => (
                  <option key={l} value={l}>
                    {l.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <button
              type="button"
              onClick={() => setAction('debug')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
                action === 'debug'
                  ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/40 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Bug Hunter</span>
            </button>

            <button
              type="button"
              onClick={() => setAction('explain')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
                action === 'explain'
                  ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/40 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Explain Architecture</span>
            </button>

            <button
              type="button"
              onClick={() => setAction('optimize')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
                action === 'optimize'
                  ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/40 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Optimize Speed</span>
            </button>

            <button
              type="button"
              onClick={() => setAction('refactor')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
                action === 'refactor'
                  ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/40 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Refactor Clean</span>
            </button>
          </div>

          {/* Code Textarea */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={12}
              className="w-full bg-slate-950 p-4 font-mono text-xs text-sky-200 focus:outline-none resize-none leading-relaxed"
              placeholder="// Paste your code snippet here..."
            />
          </div>

          <div className="mt-3">
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Optional context (e.g. Must run in Node.js 22, memory is constrained to 256MB)"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="mt-4">
            <button
              onClick={handleAudit}
              disabled={loading || !code.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-sky-500 to-amber-500 hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-md cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Auditing Code with Omni...</span>
                </>
              ) : (
                <>
                  <Code2 className="w-4 h-4" />
                  <span>Execute Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Analysis & Review Output
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => onSendToChat(result)}
                  className="px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-500/20 hover:bg-sky-100 dark:hover:bg-sky-500/30 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Continue in Chat</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="text-xs md:text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-normal">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
