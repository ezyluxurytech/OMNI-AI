import React, { useState, useEffect } from 'react';
import { User, Conversation } from '../../types';
import { api } from '../../api';
import {
  X,
  Moon,
  Sun,
  Monitor,
  Play,
  Download,
  Trash2,
  Check,
  Sparkles,
  Cpu,
} from 'lucide-react';

interface SettingsModalProps {
  user: User;
  conversations: Conversation[];
  onClose: () => void;
  onUpdatePreferences: (prefs: Partial<User['preferences']>) => void;
  onReplayIntro: () => void;
  onClearHistory: () => void;
  onSignOut: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  conversations,
  onClose,
  onUpdatePreferences,
  onReplayIntro,
  onClearHistory,
  onSignOut,
}) => {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(user.preferences?.theme || 'dark');
  const [reducedMotion, setReducedMotion] = useState(user.preferences?.reducedMotion || false);
  const [defaultModel, setDefaultModel] = useState(user.preferences?.defaultModel || 'gemini-3.8-flash');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSavePreferences = async (newPrefs: Partial<User['preferences']>) => {
    try {
      await api.updatePreferences(newPrefs);
      onUpdatePreferences(newPrefs);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update preferences:', err);
    }
  };

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme);
    handleSavePreferences({ theme: newTheme });
  };

  const handleToggleReducedMotion = () => {
    const val = !reducedMotion;
    setReducedMotion(val);
    handleSavePreferences({ reducedMotion: val });
  };

  const handleModelChange = (model: string) => {
    setDefaultModel(model);
    handleSavePreferences({ defaultModel: model });
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `omni_conversations_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-slate-100 transition-colors">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <span>Omni Settings & Preferences</span>
            {savedSuccess && (
              <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> Saved
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* Appearance & Theme Mood */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Theme Mood
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-sky-50 dark:bg-sky-500/20 border-sky-400 text-sky-700 dark:text-sky-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark Mood</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-sky-50 dark:bg-sky-500/20 border-sky-400 text-sky-700 dark:text-sky-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light Mood</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'bg-sky-50 dark:bg-sky-500/20 border-sky-400 text-sky-700 dark:text-sky-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Signature Cinematic Hyperspace Intro */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Cinematic Experience
            </h3>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block font-bold text-slate-900 dark:text-white">
                    Center-Origin Hyperspace Intro
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    Starts tiny in center, zooms forward, stops, and stars streak past
                  </span>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onReplayIntro();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Replay Intro</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <div>
                  <span className="block font-bold text-slate-900 dark:text-white">Reduced Motion</span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    Replace full cosmic zooms with gentle fades
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleReducedMotion}
                  className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                    reducedMotion ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={reducedMotion}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform transform mt-1 ${
                      reducedMotion ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* AI Intelligence Model */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Intelligence Engine
            </h3>
            <div className="space-y-2">
              <label
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  defaultModel === 'gemini-3.8-flash'
                    ? 'bg-sky-50 dark:bg-sky-500/15 border-sky-400 text-slate-900 dark:text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <div>
                    <span className="block font-bold text-slate-900 dark:text-white">Gemini 3.8 Flash</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      High-throughput, ultra-low latency, streaming multimodal answers
                    </span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="model"
                  checked={defaultModel === 'gemini-3.8-flash'}
                  onChange={() => handleModelChange('gemini-3.8-flash')}
                  className="text-sky-600"
                />
              </label>

              <label
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  defaultModel === 'gemini-4-argon'
                    ? 'bg-sky-50 dark:bg-sky-500/15 border-sky-400 text-slate-900 dark:text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="block font-bold text-slate-900 dark:text-white">Gemini 4 Argon (Pro Mode)</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      Flagship model for deep STEM, multi-turn architecture & algorithmic logic
                    </span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="model"
                  checked={defaultModel === 'gemini-4-argon'}
                  onChange={() => handleModelChange('gemini-4-argon')}
                  className="text-sky-600"
                />
              </label>
            </div>
          </div>

          {/* Data Management */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Data & Conversations
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleExportData}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export History (.JSON)</span>
              </button>

              <button
                type="button"
                onClick={onClearHistory}
                className="py-2 px-3 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800/60 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Chats</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Omni AI v2.0 · Frontier Assistant
          </span>
          <button
            onClick={onSignOut}
            className="text-xs text-red-600 dark:text-red-400 hover:underline font-bold cursor-pointer"
          >
            Sign Out of Account
          </button>
        </div>
      </div>
    </div>
  );
};
