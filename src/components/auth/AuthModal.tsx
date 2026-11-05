import React, { useState } from 'react';
import { AstraeaLogo } from '../brand/AstraeaLogo';
import { api } from '../../api';
import { User } from '../../types';
import { Lock, Mail, User as UserIcon, Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  onSuccess: (user: User, isNewUser: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login(email, password);
        onSuccess(res.user, res.isNewUser);
      } else {
        const res = await api.register(name, email, password);
        onSuccess(res.user, true);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      const res = await api.demoLogin();
      onSuccess(res.user, res.isNewUser);
    } catch (err: any) {
      setError(err.message || 'Demo access failed');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
      {/* Background celestial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-sky-600/20 via-indigo-600/25 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-2xl p-8 shadow-2xl backdrop-blur-2xl">
        {/* Header with Star Logo */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="mb-3.5 relative">
            <AstraeaLogo size={64} glow={true} glowIntensity="high" animated={true} withExplosions={true} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-rose-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
            Omni AI
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs font-medium">
            Next-generation multimodal intelligence for research, deep reasoning, coding, and translation.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-950/60 rounded-xl mb-6 border border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/80 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 transition-colors focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/80 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 transition-colors focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/80 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 transition-colors focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || demoLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:via-indigo-500 hover:to-purple-500 text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* One-Click Instant Demo Access */}
        <div className="mt-5 pt-5 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400 mb-3">
            Testing or reviewing the application?
          </p>
          <button
            type="button"
            onClick={handleDemoAccess}
            disabled={loading || demoLoading}
            className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {demoLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>One-Click Demo Access</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
