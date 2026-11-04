import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { api } from '../../api/client.js';
import { 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Server, 
  KeyRound, 
  Wifi, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Globe
} from 'lucide-react';

export const MasterPasswordGate: React.FC = () => {
  const { loginMaster } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Server Connection URL
  const isNative = api.isNativeApp();
  const [serverUrl, setServerUrl] = useState(api.getServerUrl());
  const [showServerConfig, setShowServerConfig] = useState(isNative && !api.getServerUrl());
  const [connectionStatus, setConnectionStatus] = useState<{ online: boolean; latencyMs?: number; error?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionStatus(null);
    try {
      const target = serverUrl.trim();
      const res = await api.testConnection(target);
      setConnectionStatus(res);
      if (res.online) {
        api.setServerUrl(target);
      }
    } catch (e: any) {
      setConnectionStatus({ online: false, error: e.message || 'Connection failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleServerUrlChange = (val: string) => {
    setServerUrl(val);
    setConnectionStatus(null);
    api.setServerUrl(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    if (isNative && !serverUrl.trim()) {
      setError(t('auth.serverUrlRequired'));
      setShowServerConfig(true);
      return;
    }

    if (serverUrl.trim()) {
      api.setServerUrl(serverUrl.trim());
    }

    setError(null);
    setIsLoading(true);

    try {
      await loginMaster(password.trim());
    } catch (err: any) {
      setError(err.message || t('auth.incorrectPassword'));
      if (err.message && (err.message.includes('Server') || err.message.includes('connect') || err.message.includes('JSON') || err.message.includes('HTML'))) {
        setShowServerConfig(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl overflow-y-auto">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl glass-dark border border-slate-700/60 shadow-2xl relative overflow-hidden my-auto">
        {/* Language switch button in top right */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="absolute top-5 right-5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-slate-300 hover:text-white text-xs font-semibold transition-all active:scale-95 shadow-sm"
          title="Switch Language / Cambiar Idioma"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span>{language === 'en' ? 'Español' : 'English'}</span>
        </button>

        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-glow mb-3">
            <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">{t('common.appName')}</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">{t('common.tagline')}</p>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-indigo-300 font-medium mt-2.5">
            <Server className="w-3.5 h-3.5" />
            <span>{isNative ? t('auth.gatewayBadgeNative') : t('auth.gatewayBadgeWeb')}</span>
          </div>
        </div>

        {/* Server Connection Section */}
        <div className="mb-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowServerConfig(!showServerConfig)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('auth.serverConnection')}:</span>
              <span className="text-indigo-300 font-mono text-[11px] truncate max-w-[170px]">
                {serverUrl.trim() || (isNative ? t('auth.notConfigured') : t('auth.localOrigin'))}
              </span>
            </div>
            {showServerConfig ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showServerConfig && (
            <div className="p-4 pt-1 border-t border-slate-800/60 space-y-3 bg-slate-950/40">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isNative ? t('auth.serverHelpNative') : t('auth.serverHelpWeb')}
              </p>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={serverUrl}
                    onChange={(e) => handleServerUrlChange(e.target.value)}
                    placeholder={t('auth.serverUrlPlaceholder')}
                    className="flex-grow px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
                  >
                    {isTesting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>{t('auth.testConnection')}</span>
                    )}
                  </button>
                </div>

                {connectionStatus && (
                  <div className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                    connectionStatus.online 
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                  }`}>
                    {connectionStatus.online ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>{t('auth.connectedSuccess')} ({t('auth.latency', { ms: connectionStatus.latencyMs || 0 })})</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span className="truncate">{connectionStatus.error || t('auth.unreachable')}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              {t('auth.masterPasswordTitle')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.enterMasterPassword')}
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
              <div className="mt-2.5 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs font-medium text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
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
                <span>{t('auth.accessServer')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <KeyRound className="w-3.5 h-3.5" />
            <span>{t('auth.configuredInServer')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
