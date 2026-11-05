import React from 'react';
import {
  X,
  Sparkles,
  Zap,
  Globe,
  FileText,
  Volume2,
  Check,
  Shield,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { AstraeaLogo } from '../brand/AstraeaLogo';

interface ProModalProps {
  isPro: boolean;
  onTogglePro: () => void;
  onClose: () => void;
}

export const ProModal: React.FC<ProModalProps> = ({
  isPro,
  onTogglePro,
  onClose,
}) => {
  const proEngines = [
    {
      icon: Cpu,
      name: 'Gemini 4 Argon Cognitive Engine',
      modelId: 'gemini-4-argon',
      color: 'from-purple-500 to-indigo-600',
      badge: 'STEM & Reasoning Flagship',
      description:
        'Advanced mathematical proofs, complex algorithmic debugging, multi-file software architecture, and recursive deduction.',
      capabilities: ['Deep STEM reasoning', 'Zero hallucination logic', 'Complex coding pipelines'],
    },
    {
      icon: Globe,
      name: 'Google Live Search Grounding Engine',
      modelId: 'googleSearch',
      color: 'from-sky-500 to-blue-600',
      badge: 'Real-Time Fact Verification',
      description:
        'Live web grounding indexing current news, market data, scientific preprints, and real-time facts with clickable citations.',
      capabilities: ['Live web retrieval', 'Clickable verified citations', 'Up-to-the-minute awareness'],
    },
    {
      icon: FileText,
      name: 'Multimodal Vision & Document Engine',
      modelId: 'gemini-multimodal',
      color: 'from-teal-500 to-emerald-600',
      badge: 'Multi-Page Optical Synthesis',
      description:
        'Native visual reading of multi-page PDFs, complex charts, technical diagrams, CSV tabular analysis, and OCR extraction.',
      capabilities: ['Up to 50MB PDF extraction', 'High-res image understanding', 'Tabular CSV synthesis'],
    },
    {
      icon: Volume2,
      name: 'Neural Audio & Speech Synthesis Engine',
      modelId: 'gemini-3.8-flash-lite-tts',
      color: 'from-rose-500 to-pink-600',
      badge: 'Natural Conversational Voice',
      description:
        'Studio-grade text-to-speech audio synthesis with natural inflections, punctuation awareness, and crystal-clear pronunciation.',
      capabilities: ['Natural vocal narration', 'WAV audio synthesis', 'Multilingual pronunciation'],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-slate-100 transition-colors">
        {/* Banner with Chromatic Celestial Glow */}
        <div className="relative p-6 bg-gradient-to-r from-rose-500/10 via-sky-500/10 to-amber-500/10 dark:from-rose-950/40 dark:via-sky-950/40 dark:to-amber-950/40 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <AstraeaLogo size={56} glow={true} glowIntensity="high" withExplosions={true} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">OMNI PRO</h2>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 via-sky-500 to-amber-400 text-white text-[10px] font-bold tracking-wider uppercase shadow-sm">
                  {isPro ? 'Active Tier' : 'Frontier Intelligence'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Supercharged with 4 dedicated flagship engines for deep reasoning, live web grounding, vision, and voice.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Four Flagship Pro Engines
          </div>

          {/* 4 Flagship Engines Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {proEngines.map((engine, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-sky-400/50 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`p-2 rounded-xl bg-gradient-to-tr ${engine.color} text-white shadow-sm`}>
                    <engine.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold truncate">{engine.name}</h3>
                    <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                      {engine.badge}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                  {engine.description}
                </p>

                <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  {engine.capabilities.map((cap, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-1.5 text-[10px] text-slate-700 dark:text-slate-300">
                      <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pro Benefits Highlights */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              What Omni Pro Unlocks:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-sky-500 shrink-0" />
                <span>Gemini 4 Argon Multi-Step Reasoning</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-sky-500 shrink-0" />
                <span>Autonomous Web Grounding with Citations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-sky-500 shrink-0" />
                <span>Text-to-Speech Audio Playback</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-sky-500 shrink-0" />
                <span>High-Throughput Unlimited Context</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with One-Click Activation */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Enterprise Secure & Powered by @google/genai
            </span>
          </div>

          <button
            onClick={() => {
              onTogglePro();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              isPro
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'
                : 'bg-gradient-to-r from-rose-500 via-sky-500 to-amber-500 text-white hover:opacity-95 shadow-sky-500/25'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isPro ? 'Pro Mode Active (Switch to Standard)' : 'Activate Omni Pro Now'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
