import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../../api';
import {
  Globe2,
  ArrowRightLeft,
  Copy,
  Check,
  Loader2,
  Menu,
  ArrowRight,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';

interface TranslationWorkspaceProps {
  onOpenMobileMenu: () => void;
  onSendToChat: (content: string) => void;
  theme?: 'dark' | 'light' | 'system';
  onToggleTheme?: () => void;
}

export const TranslationWorkspace: React.FC<TranslationWorkspaceProps> = ({
  onOpenMobileMenu,
  onSendToChat,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [text, setText] = useState('Knowledge is the foundation of innovation and wisdom across generations.');
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Yorùbá');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const supportedLanguages = [
    'English',
    'Yorùbá',
    'Igbo',
    'Hausa',
    'French',
    'Spanish',
    'German',
    'Arabic',
    'Portuguese',
    'Mandarin',
    'Japanese',
    'Swahili',
  ];

  const handleSwap = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
  };

  const handleTranslate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await api.translate({
        text: text.trim(),
        sourceLang,
        targetLang,
      });
      setResult(res.result);
    } catch (err: any) {
      console.error('Translation error:', err);
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
            <Globe2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h1 className="font-bold text-xs md:text-sm text-slate-900 dark:text-white">
              Multilingual Nexus & Cultural Translation
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
        {/* Translation Box */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Language Selection</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-normal">
                Contextual translation with tonal markers, regional dialect nuances, and register variations.
              </p>
            </div>

            {/* Language Dropdowns & Swap */}
            <div className="flex items-center gap-2">
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-sky-500"
              >
                {supportedLanguages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleSwap}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Swap languages"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>

              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-sky-500"
              >
                {supportedLanguages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleTranslate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 mb-1.5">
                Input Text ({sourceLang})
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="Type or paste text to translate..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 resize-none leading-relaxed font-normal"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-sky-500 to-amber-500 hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-md cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Translating with Cultural Nuance...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Translate to {targetLang}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Translation Output */}
        {result && (
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Translation & Linguistic Notes ({targetLang})
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
