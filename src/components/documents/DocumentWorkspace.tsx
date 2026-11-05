import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../../api';
import { DocumentRecord } from '../../types';
import {
  Upload,
  FileText,
  Loader2,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileCode,
  AlertCircle,
  Menu,
  Sun,
  Moon,
} from 'lucide-react';

interface DocumentWorkspaceProps {
  onStartChatWithDoc: (docName: string, initialInsight: string) => void;
  onOpenMobileMenu: () => void;
  theme?: 'dark' | 'light' | 'system';
  onToggleTheme?: () => void;
}

export const DocumentWorkspace: React.FC<DocumentWorkspaceProps> = ({
  onStartChatWithDoc,
  onOpenMobileMenu,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [task, setTask] = useState<'summary' | 'study_guide' | 'quiz' | 'qa'>('summary');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await api.listDocuments();
      setDocuments(res.documents);
    } catch (err) {
      console.error('Failed to load document records:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a PDF, TXT, or CSV file to analyze.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const raw = reader.result as string;
        const base64Data = raw.split(',')[1];

        const response = await api.analyzeDocument({
          filename: file.name,
          mimeType: file.type || 'application/pdf',
          base64Data,
          task,
          customPrompt: task === 'qa' ? customPrompt : undefined,
        });

        setResult(response.result);
        loadDocuments();
      } catch (err: any) {
        setError(err.message || 'Failed to process document');
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Error reading file from disk');
      setLoading(false);
    };

    reader.readAsDataURL(file);
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
          <div>
            <h1 className="font-bold text-xs md:text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Document Synthesis & Optical Analysis
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

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Upload & Configuration Card */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Upload Source Document</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 font-normal">
            Upload multi-page PDFs, research preprints, CSV datasets, or source notes for deep synthesis powered by Omni.
          </p>

          {/* Dropzone */}
          <label className="border-2 border-dashed border-slate-300 dark:border-slate-700/80 hover:border-sky-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50 dark:bg-slate-950/40">
            <Upload className="w-8 h-8 text-sky-600 dark:text-sky-400 mb-2" />
            <span className="text-xs font-bold text-slate-800 dark:text-white mb-1">
              {file ? file.name : 'Click to select or drag and drop document'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              PDF, TXT, CSV (up to 25MB)
            </span>
            <input
              type="file"
              accept=".pdf,.txt,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Task Type Selector */}
          <div className="mt-5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 mb-2">
              Synthesis Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setTask('summary')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                  task === 'summary'
                    ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/40 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Summary</span>
              </button>

              <button
                type="button"
                onClick={() => setTask('study_guide')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                  task === 'study_guide'
                    ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/40 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Study Guide</span>
              </button>

              <button
                type="button"
                onClick={() => setTask('quiz')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                  task === 'quiz'
                    ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/40 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Practice Quiz</span>
              </button>

              <button
                type="button"
                onClick={() => setTask('qa')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                  task === 'qa'
                    ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/40 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Custom Question</span>
              </button>
            </div>
          </div>

          {task === 'qa' && (
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 mb-1.5">
                Specific Question or Instruction
              </label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Extract table on page 3 and summarize the revenue forecasts"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 text-xs text-red-800 dark:text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-5">
            <button
              onClick={handleAnalyze}
              disabled={loading || !file}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-sky-500 to-amber-500 hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Document with Omni...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        {result && (
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Analysis Results for {file?.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => onStartChatWithDoc(file?.name || 'Document', result)}
                  className="px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-500/20 hover:bg-sky-100 dark:hover:bg-sky-500/30 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discuss in Chat</span>
                </button>
              </div>
            </div>

            <div className="text-xs md:text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-normal">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Previous Uploads List */}
        {documents.length > 0 && (
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Previously Uploaded Documents ({documents.length})
            </h3>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <div className="truncate">
                      <span className="font-bold text-slate-900 dark:text-white truncate block">{doc.name}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-normal">
                        {(doc.size / 1024).toFixed(0)} KB · {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
