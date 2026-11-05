import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Globe,
  Mic,
  MicOff,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface AttachmentFile {
  name: string;
  mimeType: string;
  data: string;
  size: number;
}

interface ComposerProps {
  onSendMessage: (text: string, attachments?: AttachmentFile[]) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  webSearch: boolean;
  onToggleWebSearch: () => void;
  disabled?: boolean;
}

export const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  webSearch,
  onToggleWebSearch,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Mic start error:', err);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 25 * 1024 * 1024) {
        setFileError(`File "${file.name}" exceeds 25MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            data: base64Data,
            size: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isStreaming || disabled) return;
    onSendMessage(text.trim(), attachments.length > 0 ? attachments : undefined);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      {fileError && (
        <div className="mb-2 p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800/60 text-xs text-red-800 dark:text-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>{fileError}</span>
          </div>
          <button onClick={() => setFileError(null)}>
            <X className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      )}

      {/* Attachment Pills */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span className="truncate max-w-[180px] font-semibold">{file.name}</span>
              <span className="text-[10px] text-slate-500">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
              <button
                onClick={() => removeAttachment(idx)}
                className="p-0.5 hover:text-red-500 text-slate-400 ml-1"
                title="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Box */}
      <div className="relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 shadow-xl transition-all">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            isListening
              ? 'Listening to your voice...'
              : 'Ask Omni anything, analyze documents, or request complex code...'
          }
          rows={1}
          className="w-full bg-transparent px-4 pt-3.5 pb-12 text-xs md:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none resize-none min-h-[52px]"
        />

        {/* Bottom Toolbar Controls */}
        <div className="absolute left-3 right-3 bottom-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept=".pdf,.txt,.csv,.json,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Attach documents (PDF, TXT, CSV, images)"
              aria-label="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Live Web Search Grounding Toggle */}
            <button
              type="button"
              onClick={onToggleWebSearch}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                webSearch
                  ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Live Google Search grounding"
              aria-label="Toggle web search"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Web Search</span>
            </button>

            {/* Voice Input */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-1.5 rounded-lg transition-colors ${
                isListening
                  ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 animate-pulse'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isListening ? 'Stop voice listening' : 'Dictate with voice'}
              aria-label="Voice input"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                title="Stop response generation"
              >
                <Square className="w-3 h-3 fill-white" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={(!text.trim() && attachments.length === 0) || disabled}
                className="w-8 h-8 rounded-xl bg-gradient-to-r from-rose-500 via-sky-500 to-amber-500 hover:opacity-90 text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-500 dark:text-slate-400">
        <span>Omni AI may produce factual errors. Verify important information.</span>
        <span>Enter to send · Shift+Enter for new line</span>
      </div>
    </div>
  );
};
