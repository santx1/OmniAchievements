import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
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
  Sparkles,
  Users,
  Plus,
  Trash2
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
  const { t } = useLanguage();
  const { activeProfile, refreshActiveProfile } = useAuth();
  const [steamId, setSteamId] = useState(activeProfile?.steam_id || '');
  const [vanityInput, setVanityInput] = useState('');
  const [isResolvingVanity, setIsResolvingVanity] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBlacklistOpen, setIsBlacklistOpen] = useState(false);

  // Steam Family Sharing Accounts
  const [familyAccounts, setFamilyAccounts] = useState<{ name: string; steamId: string }[]>(() => {
    try {
      return activeProfile?.family_steam_ids ? JSON.parse(activeProfile.family_steam_ids) : [];
    } catch (e) {
      return [];
    }
  });
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilySteamId, setNewFamilySteamId] = useState('');
  const [isAddingFamily, setIsAddingFamily] = useState(false);

  if (!isOpen) return null;

  const handleAddFamilyAccount = async () => {
    if (!newFamilySteamId.trim() || !activeProfile) return;
    setIsAddingFamily(true);
    let resolvedId = newFamilySteamId.trim();

    // If vanity URL, try to resolve it
    if (!/^\d{17}$/.test(resolvedId)) {
      try {
        const res = await api.resolveSteamVanity(resolvedId);
        resolvedId = res.steamId;
      } catch (e) {}
    }

    const updated = [
      ...familyAccounts.filter((f) => f.steamId !== resolvedId),
      { name: newFamilyName.trim() || 'Family Member', steamId: resolvedId }
    ];

    try {
      await api.updateProfile(activeProfile.id, {
        family_steam_ids: JSON.stringify(updated)
      });
      setFamilyAccounts(updated);
      setNewFamilyName('');
      setNewFamilySteamId('');
      await refreshActiveProfile();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save family account');
    } finally {
      setIsAddingFamily(false);
    }
  };

  const handleRemoveFamilyAccount = async (steamIdToRemove: string) => {
    if (!activeProfile) return;
    const updated = familyAccounts.filter((f) => f.steamId !== steamIdToRemove);
    try {
      await api.updateProfile(activeProfile.id, {
        family_steam_ids: JSON.stringify(updated)
      });
      setFamilyAccounts(updated);
      await refreshActiveProfile();
    } catch (err) {}
  };

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
        <div className="w-full max-w-lg rounded-3xl glass-dark border border-slate-700/60 shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t('steam.syncModalTitle')}</h2>
                <p className="text-xs text-slate-400">{t('steam.syncModalSub')}</p>
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

            {/* Steam Family Sharing Accounts */}
            <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Steam Family Sharing & Shared Libraries</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Add family members' SteamIDs (or profile URLs) to sync borrowed/shared family games too!
              </p>

              {/* Existing Family Accounts */}
              {familyAccounts.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {familyAccounts.map((fam) => (
                    <div
                      key={fam.steamId}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200"
                    >
                      <div>
                        <span className="font-semibold text-white">{fam.name}</span>
                        <span className="text-[11px] text-slate-500 ml-2 font-mono">{fam.steamId}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFamilyAccount(fam.steamId)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Family Account form */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  placeholder="Name (e.g. Dad, Brother)"
                  className="w-1/3 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                />
                <input
                  type="text"
                  value={newFamilySteamId}
                  onChange={(e) => setNewFamilySteamId(e.target.value)}
                  placeholder="SteamID64 or URL"
                  className="flex-grow px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                />
                <button
                  type="button"
                  onClick={handleAddFamilyAccount}
                  disabled={isAddingFamily || !newFamilySteamId.trim()}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shrink-0 flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
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
                  <div>• Family shared: <strong className="text-purple-400">{syncResult.familyShared || 0}</strong></div>
                  <div className="col-span-2">• Bloat games skipped: <strong className="text-amber-400">{syncResult.skippedBlacklisted}</strong></div>
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
                    <span>{t('steam.syncingStatus', { current: '...', total: '...' })}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t('steam.syncNowBtn')}</span>
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
