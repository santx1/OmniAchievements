import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { ShieldCheck, Lock, ArrowRight, Eye, EyeOff, Server, KeyRound } from 'lucide-react';

export const MasterPasswordGate: React.FC = () => {
  const { loginMaster } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setError(null);
    setIsLoading(true);

    try {
      await loginMaster(password.trim());
    } catch (err: any) {
      setError(err.message || 'Incorrect master password. Check your server config.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
      <div className="w-full max-w-md p-8 rounded-3xl glass-dark border border-slate-700/60 shadow-2xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-glow mb-4">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">OmniAchievements</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">Self-Hosted Universal Game & Achievement Hub</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-indigo-300 font-medium mt-3">
            <Server className="w-3.5 h-3.5" />
            <span>Local Network & Web Gateway</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Master Server Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter master password..."
                autoFocus
                className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-xs font-medium text-rose-400 flex items-center gap-1">
                <span>✕</span> {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Access Server</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Configured in server <code className="text-slate-400 font-mono">.env</code> or <code className="text-slate-400 font-mono">config.json</code></span>
          </div>
        </div>
      </div>
    </div>
  );
};
