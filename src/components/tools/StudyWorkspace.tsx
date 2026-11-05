import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../../api';
import {
  GraduationCap,
  Sparkles,
  HelpCircle,
  BookOpen,
  Copy,
  Check,
  Loader2,
  Menu,
  Layers,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';

interface StudyWorkspaceProps {
  onOpenMobileMenu: () => void;
  onSendToChat: (content: string) => void;
  theme?: 'dark' | 'light' | 'system';
  onToggleTheme?: () => void;
}

export const StudyWorkspace: React.FC<StudyWorkspaceProps> = ({
  onOpenMobileMenu,
  onSendToChat,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<'quiz' | 'flashcards' | 'revision'>('quiz');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sampleTopics = [
    'Quantum Key Distribution & Cryptography',
    'Distributed Systems Consensus (Raft & Paxos)',
    'Cellular Respiration & Krebs Cycle',
    'Macroeconomic Fiscal Policy & Inflation',
  ];

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await api.studyAid({
        topic: topic.trim(),
        type,
        difficulty,
      });
      setResult(res.result);
    } catch (err: any) {
      console.error('Study aid generation failed:', err);
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
            <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h1 className="font-bold text-xs md:text-sm text-slate-900 dark:text-white">
              Study Studio & Exam Preparation
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
        {/* Topic Input & Mode Config */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
            Create Custom Study Materials
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 font-normal">
            Generate high-yield quizzes, concept flashcards, or structured revision notes powered by Omni.
          </p>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 mb-1.5">
                Topic or Subject
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Distributed consensus algorithms, Organic chemistry isomers, etc."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Quick suggested topics */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 self-center mr-1">Suggested:</span>
              {sampleTopics.map((t, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setTopic(t)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-300 transition-colors font-medium cursor-pointer"
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Format selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setType('quiz')}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  type === 'quiz'
                    ? 'bg-sky-50 dark:bg-sky-500/15 border-sky-300 dark:border-sky-500/40 text-slate-900 dark:text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-bold">Practice Quiz</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                    5 high-yield MCQs with explanations
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('flashcards')}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  type === 'flashcards'
                    ? 'bg-sky-50 dark:bg-sky-500/15 border-sky-300 dark:border-sky-500/40 text-slate-900 dark:text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-bold">Flashcards</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                    Concept cards with memory hooks
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('revision')}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  type === 'revision'
                    ? 'bg-sky-50 dark:bg-sky-500/15 border-sky-300 dark:border-sky-500/40 text-slate-900 dark:text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-bold">Revision Sheet</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                    Core models & rapid review summary
                  </span>
                </div>
              </button>
            </div>

            {/* Difficulty selection */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">Difficulty:</span>
              {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    difficulty === lvl
                      ? 'bg-slate-200 dark:bg-slate-800 text-sky-700 dark:text-sky-400 border border-slate-300 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-sky-500 to-amber-500 hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-md cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Study Materials...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Study Materials</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Study Aid for "{topic}"
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
