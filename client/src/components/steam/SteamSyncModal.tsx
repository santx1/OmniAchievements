import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { BlacklistManagerModal } from './BlacklistManagerModal.js';
import {
  X,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface SteamSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: () => void;
}

export const SteamSyncModal: React.FC<SteamSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete
}) => {
  const { activeProfile, refreshActiveProfile } = useAuth();
  const [steamId, setSteamId] = useState(activeProfile?.steam_id || '');
  const [vanityInput, setVanityInput] = useState('');
  const [isResolvingVanity, setIsResolvingVanity] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBlacklistOpen, setIsBlacklistOpen] = useState(false);

  if (!isOpen) return null;

  const handleResolveVanity = async () => {
    if (!vanityInput.trim()) return;
    setIsResolvingVanity(true);
    setErrorMessage(null);
    try {
      const res = await api.resolveSteamVanity(vanityInput.trim());
      setSteamId(res.steamId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not resolve Steam URL');
    } finally {
      setIsResolvingVanity(false);
    }
  };

  const handleSync = async () => {
    if (!steamId.trim()) {
      setErrorMessage('Please enter your 17-digit SteamID64');
      return;
    }

    setIsSyncing(true);
    setErrorMessage(null);
    setSyncResult(null);

    try {
      const res = await api.syncSteam(steamId.trim());
      setSyncResult(res.stats);
      await refreshActiveProfile();
      onSyncComplete();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sync with Steam Web API');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
        <div className="w-full max-w-lg rounded-3xl glass border border-slate-700/60 shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Steam Synchronization</h2>
                <p className="text-xs text-slate-400">Import games, achievements & playtime</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* SteamID Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                SteamID64 (17 digits)
              </label>
              <input
                type="text"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                placeholder="e.g. 76561198000000000"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Resolve Vanity helper */}
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Don't know your SteamID64? Enter your Steam profile URL or username:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={vanityInput}
                  onChange={(e) => setVanityInput(e.target.value)}
                  placeholder="e.g. https://steamcommunity.com/id/yourname"
                  className="flex-grow px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-600"
                />
                <button
                  type="button"
                  onClick={handleResolveVanity}
                  disabled={isResolvingVanity || !vanityInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold shrink-0 transition-colors disabled:opacity-50"
                >
                  {isResolvingVanity ? 'Finding...' : 'Resolve'}
                </button>
              </div>
            </div>

            {/* Security Guarantee Note */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-300">Account Safety Guarantee</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  This app uses the official public Steam Web API. It <strong>never asks for your Steam password, login credentials, or Steam Guard codes</strong>, keeping your account 100% safe from theft.
                </p>
              </div>
            </div>

            {/* Manage Blacklist link */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Removed bloatware games?</span>
              <button
                type="button"
                onClick={() => setIsBlacklistOpen(true)}
                className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Manage Ignored Games</span>
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Sync Results Preview */}
            {syncResult && (
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Synchronization Completed!</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                  <div>• Games scanned: <strong>{syncResult.totalFound}</strong></div>
                  <div>• New games added: <strong>{syncResult.added}</strong></div>
                  <div>• Games updated: <strong>{syncResult.updated}</strong></div>
                  <div>• Bloat games skipped: <strong className="text-amber-400">{syncResult.skippedBlacklisted}</strong></div>
                </div>
              </div>
            )}

            {/* Trigger Sync Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isSyncing || !steamId.trim()}
                onClick={handleSync}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold text-sm transition-all shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synchronizing Library & Achievements...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Start Steam Sync</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <BlacklistManagerModal
        isOpen={isBlacklistOpen}
        onClose={() => setIsBlacklistOpen(false)}
      />
    </>
  );
};
