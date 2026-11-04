import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme, ACCENT_PRESETS } from '../../context/ThemeContext.js';
import { api } from '../../api/client.js';
import {
  Settings,
  User,
  ShieldCheck,
  Lock,
  KeyRound,
  Gamepad2,
  Palette,
  Check,
  Save,
  Server,
  Copy,
  CheckCheck,
  ExternalLink,
  Laptop,
  Tag,
  Trash2,
  Edit3,
  Plus,
  Users,
  Cloud,
  CloudOff,
  CloudUpload,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { NEUTRAL_AVATARS, getAvatarUrl, DEFAULT_AVATAR } from '../../utils/avatars.js';
import { useSyncStatus } from '../../utils/syncEngine.js';
import { offlineStore } from '../../utils/offlineStore.js';

export const SettingsView: React.FC = () => {
  const { activeProfile, refreshActiveProfile } = useAuth();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();

  // Profile fields
  const [name, setName] = useState(activeProfile?.name || '');
  const [avatar, setAvatar] = useState(getAvatarUrl(activeProfile?.avatar) || DEFAULT_AVATAR);
  const [steamId, setSteamId] = useState(activeProfile?.steam_id || '');
  const [retroUsername, setRetroUsername] = useState(activeProfile?.retro_username || '');
  const [retroApiKey, setRetroApiKey] = useState(activeProfile?.retro_api_key || '');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Server Connection URL
  const [serverUrlInput, setServerUrlInput] = useState(api.getServerUrl());
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Backup & Restore
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  // Custom Console & Platform Tags
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(true);
  const [newPlatformName, setNewPlatformName] = useState('');
  const [newPlatformColor, setNewPlatformColor] = useState('#3b82f6');
  const [editingPlatformId, setEditingPlatformId] = useState<string | null>(null);
  const [editingPlatformName, setEditingPlatformName] = useState('');
  const [editingPlatformColor, setEditingPlatformColor] = useState('#3b82f6');
  const [platformMsg, setPlatformMsg] = useState<string | null>(null);

  // Steam Family Sharing
  const [familyAccounts, setFamilyAccounts] = useState<Array<{ name: string; steamId: string }>>(() => {
    try {
      return activeProfile?.family_steam_ids ? JSON.parse(activeProfile.family_steam_ids) : [];
    } catch (e) {
      return [];
    }
  });
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilySteamId, setNewFamilySteamId] = useState('');
  const [isAddingFamily, setIsAddingFamily] = useState(false);
  const [familyMsg, setFamilyMsg] = useState<string | null>(null);

  // Server settings fields
  const [serverSettings, setServerSettings] = useState<any | null>(null);
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [steamApiKeyInput, setSteamApiKeyInput] = useState('');
  const [steamGridDbApiKeyInput, setSteamGridDbApiKeyInput] = useState('');
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState('');
  const [isUpdatingServer, setIsUpdatingServer] = useState(false);
  const [serverSuccessMsg, setServerSuccessMsg] = useState<string | null>(null);

  // Legion Go / Decky Plugin pairing
  const [pairingToken, setPairingToken] = useState<string | null>(null);
  const [isGeneratingPairToken, setIsGeneratingPairToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Cloud Sync & Offline Storage
  const { syncState, isOnline, pendingCount, lastSyncTime, triggerSync } = useSyncStatus();
  const [storageSummary, setStorageSummary] = useState<any>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    loadServerSettings();
    loadPlatforms();
    loadStorageSummary();
  }, [activeProfile?.id]);

  useEffect(() => {
    loadStorageSummary();
  }, [syncState, pendingCount]);

  const loadStorageSummary = async () => {
    if (activeProfile?.id) {
      const summary = await offlineStore.getStorageSummary(activeProfile.id);
      setStorageSummary(summary);
    }
  };

  const handleTriggerManualSync = async () => {
    setIsManualSyncing(true);
    setSyncMsg('Synchronizing with cloud server...');
    try {
      const res = await triggerSync();
      setSyncMsg(res.message);
      await loadStorageSummary();
    } catch (e: any) {
      setSyncMsg(`Sync error: ${e.message}`);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const loadPlatforms = async () => {
    setIsLoadingPlatforms(true);
    try {
      const res = await api.getPlatforms();
      setPlatforms(res.platforms || []);
    } catch (err) {
      console.warn('Failed to load platforms', err);
    } finally {
      setIsLoadingPlatforms(false);
    }
  };

  const handleAddPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatformName.trim()) return;
    setPlatformMsg(null);
    try {
      const res = await api.createPlatform({
        name: newPlatformName.trim(),
        color: newPlatformColor
      });
      setPlatforms((prev) => [...prev, res.platform]);
      setNewPlatformName('');
      setPlatformMsg('✓ New console tag added successfully!');
    } catch (err: any) {
      setPlatformMsg(`✕ Failed: ${err.message}`);
    }
  };

  const handleStartEditPlatform = (p: any) => {
    setEditingPlatformId(p.id);
    setEditingPlatformName(p.name);
    setEditingPlatformColor(p.color);
  };

  const handleSaveEditPlatform = async () => {
    if (!editingPlatformId || !editingPlatformName.trim()) return;
    try {
      const res = await api.updatePlatform(editingPlatformId, {
        name: editingPlatformName.trim(),
        color: editingPlatformColor
      });
      setPlatforms((prev) => prev.map((p) => p.id === editingPlatformId ? res.platform : p));
      setEditingPlatformId(null);
      setPlatformMsg('✓ Console tag updated!');
    } catch (err: any) {
      setPlatformMsg(`✕ Update failed: ${err.message}`);
    }
  };

  const handleDeletePlatform = async (id: string) => {
    try {
      await api.deletePlatform(id);
      setPlatforms((prev) => prev.filter((p) => p.id !== id));
      setPlatformMsg('✓ Console tag deleted.');
    } catch (err: any) {
      setPlatformMsg(`✕ Delete failed: ${err.message}`);
    }
  };

  const handleAddFamilyAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilySteamId.trim() || !activeProfile) return;
    setIsAddingFamily(true);
    setFamilyMsg(null);
    let resolvedId = newFamilySteamId.trim();

    // If vanity URL, resolve it
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
      setFamilyMsg('✓ Family account added! Run Steam Sync to import their games.');
    } catch (err: any) {
      setFamilyMsg(`✕ Failed: ${err.message}`);
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
      setFamilyMsg('✓ Family account removed.');
    } catch (err: any) {
      setFamilyMsg(`✕ Failed: ${err.message}`);
    }
  };

  const loadServerSettings = async () => {
    try {
      const data = await api.getSettings();
      setServerSettings(data);
    } catch (err) {
      console.warn('Failed to load server settings', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;

    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);
    setIsUpdatingProfile(true);

    try {
      const payload: any = {
        name: name.trim(),
        avatar,
        theme,
        accent_color: accentColor,
        steam_id: steamId.trim(),
        retro_username: retroUsername.trim(),
        retro_api_key: retroApiKey.trim()
      };

      if (newPin) {
        if (!/^\d{6}$/.test(newPin.trim())) {
          setProfileErrorMsg('New PIN must be exactly 6 digits');
          setIsUpdatingProfile(false);
          return;
        }
        payload.pin = newPin.trim();
        payload.currentPin = currentPin.trim();
      }

      await api.updateProfile(activeProfile.id, payload);
      await refreshActiveProfile();
      setProfileSuccessMsg('Profile settings updated successfully!');
      setNewPin('');
      setCurrentPin('');
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateServerSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingServer(true);
    setServerSuccessMsg(null);

    try {
      const payload: any = {};
      if (masterPasswordInput.trim()) payload.masterPassword = masterPasswordInput.trim();
      if (steamApiKeyInput.trim()) payload.steamApiKey = steamApiKeyInput.trim();
      if (steamGridDbApiKeyInput.trim()) payload.steamGridDbApiKey = steamGridDbApiKeyInput.trim();
      if (geminiApiKeyInput.trim()) payload.geminiApiKey = geminiApiKeyInput.trim();

      await api.updateSettings(payload);
      await loadServerSettings();
      setServerSuccessMsg('Server settings saved successfully!');
      setMasterPasswordInput('');
    } catch (err: any) {
      console.error('Failed to update server settings', err);
    } finally {
      setIsUpdatingServer(false);
    }
  };

  const generateDeckyPairingToken = async () => {
    if (!activeProfile) return;
    setIsGeneratingPairToken(true);
    try {
      const resData = await api.pairDecky(activeProfile.id);
      setPairingToken(resData.token || `decky_session_${activeProfile.id}`);
    } catch (err) {
      setPairingToken(`omni_token_${activeProfile.id}_${Date.now()}`);
    } finally {
      setIsGeneratingPairToken(false);
    }
  };

  const handleSaveServerUrl = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);
    api.setServerUrl(serverUrlInput);
    const res = await api.testConnection(serverUrlInput);
    setIsTestingConnection(false);
    if (res.online) {
      setConnectionStatus(`✓ Connected successfully! (${res.latencyMs}ms latency)`);
    } else {
      setConnectionStatus('✕ Could not reach server. Check IP, port, or Wi-Fi.');
    }
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    setBackupMsg(null);
    try {
      const data = await api.exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omniachievements-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupMsg('✓ Backup downloaded successfully!');
    } catch (err: any) {
      setBackupMsg(`✕ Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setBackupMsg(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await api.importBackup(json);
      setBackupMsg('✓ Backup restored successfully! Refreshing...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setBackupMsg(`✕ Restore failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCopyPairingToken = () => {
    if (!pairingToken) return;
    navigator.clipboard.writeText(pairingToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-indigo-500" />
          <span>App & Profile Settings</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your profile, styling, integrations, and Legion Go SteamOS Decky plugin
        </p>
      </div>

      {/* 1. Profile Customization */}
      <div className="p-6 rounded-3xl glass dark:glass border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Profile: {activeProfile?.name}
            </h3>
            <p className="text-xs text-slate-400">Manage name, avatar, 6-digit PIN and themes</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {/* Name & Steam ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Profile Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                SteamID64
              </label>
              <input
                type="text"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                placeholder="17-digit SteamID64..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Avatar Chooser */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Color Silhouette Avatar
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-2">
              {NEUTRAL_AVATARS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setAvatar(p.dataUri)}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all p-1 ${
                    avatar === p.dataUri ? 'border-indigo-500 scale-105 shadow-glow' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: p.bg }}
                  title={p.name}
                >
                  <img src={p.dataUri} alt={p.name} className="w-full h-full object-contain" />
                  {avatar === p.dataUri && (
                    <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Picture URL */}
            <div className="mt-3 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Or Custom Picture URL</span>
                {avatar && !avatar.startsWith('data:') && (
                  <span className="text-[10px] text-indigo-500 font-medium">Custom URL active</span>
                )}
              </label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex-shrink-0 flex items-center justify-center">
                  <img
                    src={avatar || DEFAULT_AVATAR}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                    }}
                  />
                </div>
                <input
                  type="url"
                  value={avatar.startsWith('data:') ? '' : avatar}
                  onChange={(e) => setAvatar(e.target.value.trim() || DEFAULT_AVATAR)}
                  placeholder="Paste direct image URL (https://...)"
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Paste any web image URL (e.g. Steam, Discord, Gravatar, Imgur) or click a color silhouette above.
              </p>
            </div>
          </div>

          {/* Theme & Accent Customizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Theme Mode
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
              >
                <option value="dark">Dark Mode (OLED Slate)</option>
                <option value="light">Light Mode</option>
                <option value="system">System Synchronized</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>Accent Color</span>
              </label>
              <div className="flex items-center gap-2 pt-1">
                {ACCENT_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setAccentColor(p.value)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      accentColor === p.value ? 'scale-125 ring-2 ring-indigo-500' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: p.value }}
                    title={p.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RetroAchievements Integration */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-2">
              RetroAchievements (Optional - For Emulated Games)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Username</label>
                <input
                  type="text"
                  value={retroUsername}
                  onChange={(e) => setRetroUsername(e.target.value)}
                  placeholder="e.g. RetroPlayer"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Web API Key</label>
                <input
                  type="password"
                  value={retroApiKey}
                  onChange={(e) => setRetroApiKey(e.target.value)}
                  placeholder="Get from retroachievements.org/controlpanel.php"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Change 6-Digit PIN */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
              Change 6-Digit Security PIN (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Current 6-digit PIN..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <input
                  type="password"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="New 6-digit PIN..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {profileSuccessMsg && (
            <p className="text-xs font-semibold text-emerald-400">{profileSuccessMsg}</p>
          )}
          {profileErrorMsg && (
            <p className="text-xs font-semibold text-rose-400">{profileErrorMsg}</p>
          )}

          <button
            type="submit"
            disabled={isUpdatingProfile}
            className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-md shadow-indigo-600/30"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </form>
      </div>

      {/* 2. Custom Console & Platform Tags Manager */}
      <div className="p-6 rounded-3xl glass dark:glass border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Console & Platform Tags
            </h3>
            <p className="text-xs text-slate-400">
              Customize console names, add new platforms (e.g. PS5, Nintendo 3DS, PS Vita), and assign custom colors
            </p>
          </div>
        </div>

        {/* Existing Platform Tags List */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
            Active Consoles & Platforms:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {platforms.map((p) => {
              const isEditing = editingPlatformId === p.id;
              return (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-grow min-w-0">
                      <input
                        type="color"
                        value={editingPlatformColor}
                        onChange={(e) => setEditingPlatformColor(e.target.value)}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer p-0 bg-transparent shrink-0"
                      />
                      <input
                        type="text"
                        value={editingPlatformName}
                        onChange={(e) => setEditingPlatformName(e.target.value)}
                        className="flex-grow px-2 py-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEditPlatform}
                        className="p-1 rounded-lg bg-indigo-600 text-white text-xs font-bold shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                          {p.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditPlatform(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                          title="Edit console tag"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlatform(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                          title="Delete console tag"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add New Console Tag Form */}
        <form onSubmit={handleAddPlatform} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Add New Console / Platform:
          </span>
          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-[11px] text-slate-500">Tag Color:</label>
              <input
                type="color"
                value={newPlatformColor}
                onChange={(e) => setNewPlatformColor(e.target.value)}
                className="w-8 h-8 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white dark:bg-slate-950"
              />
            </div>
            <input
              type="text"
              value={newPlatformName}
              onChange={(e) => setNewPlatformName(e.target.value)}
              placeholder="e.g. PlayStation 5, Nintendo 3DS, PS Vita, Emulators..."
              className="flex-grow px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!newPlatformName.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Console Tag</span>
            </button>
          </div>
          {platformMsg && (
            <p className={`text-xs font-semibold ${platformMsg.startsWith('✓') ? 'text-emerald-500' : 'text-rose-500'}`}>
              {platformMsg}
            </p>
          )}
        </form>
      </div>

      {/* 3. Steam Family Sharing (Steam Families) */}
      <div className="p-6 rounded-3xl glass dark:glass border border-purple-500/30 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Steam Family Sharing (Steam Families)
            </h3>
            <p className="text-xs text-slate-400">
              Add family members who share their Steam games with you to synchronize their libraries
            </p>
          </div>
        </div>

        {/* Informational Guidance Box */}
        <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-xs text-slate-300 space-y-1.5">
          <p className="font-semibold text-purple-300">
            How Steam Family Sharing works with the Steam API:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
            <li>
              Valve's Steam API does <strong>not</strong> include borrowed family games when querying your own SteamID directly.
            </li>
            <li>
              To import them, enter your family member's nickname and their <strong>17-digit SteamID64</strong> (or their Steam profile URL) below.
            </li>
            <li>
              <strong>Crucial:</strong> Your family member's Steam profile <em>Privacy Settings &gt; Game details</em> must be set to <strong>Public</strong> so the Steam API is permitted to read their games.
            </li>
            <li>
              OmniAchievements will pull all shared games, tag them with a purple <strong>Family Shared</strong> badge, and track <strong>your own</strong> unlocked achievements!
            </li>
          </ul>
        </div>

        {/* Existing Family Accounts */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
            Configured Family Accounts ({familyAccounts.length}):
          </span>

          {familyAccounts.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-1">
              No family accounts added yet. Add a family member below to import their shared games!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {familyAccounts.map((fam) => (
                <div
                  key={fam.steamId}
                  className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                      {fam.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">
                      {fam.steamId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFamilyAccount(fam.steamId)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                    title="Remove family account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Family Account Form */}
        <form onSubmit={handleAddFamilyAccount} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Add Family Member:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <input
              type="text"
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
              placeholder="Nickname (e.g. Brother, Dad)"
              className="sm:col-span-4 px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400"
            />
            <input
              type="text"
              value={newFamilySteamId}
              onChange={(e) => setNewFamilySteamId(e.target.value)}
              placeholder="SteamID64 (17 digits) or Profile URL..."
              className="sm:col-span-6 px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={isAddingFamily || !newFamilySteamId.trim()}
              className="sm:col-span-2 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingFamily ? 'Adding...' : 'Add'}</span>
            </button>
          </div>
          {familyMsg && (
            <p className={`text-xs font-semibold ${familyMsg.startsWith('✓') ? 'text-emerald-500' : 'text-rose-500'}`}>
              {familyMsg}
            </p>
          )}
        </form>
      </div>

      {/* Local Offline Storage & Cloud Synchronization */}
      <div className="p-6 rounded-3xl glass dark:glass border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              syncState === 'syncing' ? 'bg-blue-500/10 text-blue-500' :
              syncState === 'offline' ? 'bg-slate-500/10 text-slate-500' :
              pendingCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              {syncState === 'syncing' ? <RefreshCw className="w-5 h-5 animate-spin" /> :
               syncState === 'offline' ? <CloudOff className="w-5 h-5" /> :
               pendingCount > 0 ? <CloudUpload className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>Local Storage & Cloud Synchronization</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  isOnline ? 'bg-emerald-500/15 text-emerald-500' : 'bg-slate-500/15 text-slate-400'
                }`}>
                  {isOnline ? 'Online' : 'Offline Mode'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data is saved locally in IndexedDB and automatically synchronized when connected
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTriggerManualSync}
            disabled={isManualSyncing || !isOnline}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
            <span>{isManualSyncing ? 'Syncing...' : 'Sync Cloud Now'}</span>
          </button>
        </div>

        {/* Status Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Local Games</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
              {storageSummary?.gamesCount ?? '—'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Local Trophies</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
              {storageSummary?.achievementsCount ?? '—'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Pending Sync</span>
            <span className={`text-lg font-black font-mono ${pendingCount > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
              {pendingCount} changes
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Last Cloud Sync</span>
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block truncate">
              {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
            </span>
          </div>
        </div>

        {syncMsg && (
          <p className={`text-xs font-semibold ${syncMsg.includes('error') || syncMsg.includes('failed') ? 'text-rose-500' : 'text-emerald-500'}`}>
            {syncMsg}
          </p>
        )}
      </div>

      {/* Server URL & Network Connectivity */}
      <div className="p-6 rounded-3xl glass dark:glass border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Server Network Connection (iOS / iPadOS)
            </h3>
            <p className="text-xs text-slate-400">
              Set local IP or remote domain/Tailscale URL for handheld & mobile access
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            OmniAchievements Server URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={serverUrlInput}
              onChange={(e) => setServerUrlInput(e.target.value)}
              placeholder="e.g. http://192.168.1.100:3001 or https://games.yourdomain.com"
              className="flex-grow px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleSaveServerUrl}
              disabled={isTestingConnection}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 transition-colors"
            >
              {isTestingConnection ? 'Testing...' : 'Save & Test'}
            </button>
          </div>
          {connectionStatus && (
            <p className={`text-xs font-semibold ${connectionStatus.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>
              {connectionStatus}
            </p>
          )}
        </div>
      </div>

      {/* Backup & Disaster Recovery */}
      <div className="p-6 rounded-3xl glass dark:glass border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Save className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Database Backups & Disaster Recovery
            </h3>
            <p className="text-xs text-slate-400">
              Automated daily SQLite snapshots are saved in <code className="text-slate-400">./data/backups/</code>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportBackup}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isExporting ? 'Exporting...' : 'Download Full Backup (JSON)'}</span>
          </button>

          <label className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              disabled={isImporting}
              className="hidden"
            />
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isImporting ? 'Restoring...' : 'Restore from Backup (JSON)'}</span>
          </label>
        </div>

        {backupMsg && (
          <p className={`text-xs font-semibold ${backupMsg.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>
            {backupMsg}
          </p>
        )}
      </div>

      {/* 2. Decky Plugin (Legion Go S SteamOS Integration) */}
      <div className="p-6 rounded-3xl glass dark:glass border border-cyan-500/30 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Legion Go S / SteamOS Decky Plugin
            </h3>
            <p className="text-xs text-slate-400">
              Sync custom achievements with non-Steam games in SteamOS Quick Access Menu
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-300 space-y-2">
          <p>
            The <strong>OmniAchievements Decky Plugin</strong> is installed on your Legion Go or Steam Deck running SteamOS. It seamlessly injects achievements into non-Steam shortcuts just like official Steam achievements!
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>Open the Quick Access Menu (QAM) in SteamOS while playing any linked non-Steam game.</li>
            <li>Shows unlocked and locked trophies directly on the screen overlay.</li>
            <li>Connects directly to your self-hosted Docker server on your local network.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-300 block">
            Generate Decky Device Pairing Token:
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={pairingToken || 'Click "Generate Token" to pair Legion Go...'}
              className="flex-grow px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-cyan-300"
            />
            {pairingToken ? (
              <button
                type="button"
                onClick={handleCopyPairingToken}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedToken ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToken ? 'Copied' : 'Copy'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={generateDeckyPairingToken}
                disabled={isGeneratingPairToken}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold transition-colors"
              >
                {isGeneratingPairToken ? 'Generating...' : 'Generate Token'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Server Configuration & Master Password */}
      <div className="p-6 rounded-3xl glass dark:glass border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Server & Master Password Settings
            </h3>
            <p className="text-xs text-slate-400">Manage self-hosted Docker server credentials & API keys</p>
          </div>
        </div>

        <form onSubmit={handleUpdateServerSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Update Master Gateway Password
            </label>
            <input
              type="password"
              value={masterPasswordInput}
              onChange={(e) => setMasterPasswordInput(e.target.value)}
              placeholder="Enter new master password (min 6 characters)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Protects web access before profile selection. Saved to <code className="text-slate-400">data/config.json</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Global Steam Web API Key
              </label>
              <input
                type="text"
                value={steamApiKeyInput}
                onChange={(e) => setSteamApiKeyInput(e.target.value)}
                placeholder={serverSettings?.steamApiKeyMasked || 'Enter Steam Web API Key...'}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                SteamGridDB API Key
              </label>
              <input
                type="text"
                value={steamGridDbApiKeyInput}
                onChange={(e) => setSteamGridDbApiKeyInput(e.target.value)}
                placeholder={serverSettings?.steamGridDbApiKeyMasked || 'Enter SteamGridDB API Key...'}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Google Gemini API Key (AI Achievements)
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1"
                >
                  <span>Free Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={geminiApiKeyInput}
                onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                placeholder={serverSettings?.geminiApiKeyMasked || 'Enter Gemini API Key (for automatic AI achievement generation)...'}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {serverSuccessMsg && (
            <p className="text-xs font-semibold text-emerald-400">{serverSuccessMsg}</p>
          )}

          <button
            type="submit"
            disabled={isUpdatingServer}
            className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-md shadow-purple-600/30"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isUpdatingServer ? 'Saving...' : 'Save Server Settings'}</span>
          </button>
        </form>
      </div>

      {/* 4. Security Model Explanation */}
      <div className="p-6 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <ShieldCheck className="w-5 h-5" />
          <span>Steam Account Security Architecture</span>
        </div>
        <p>
          OmniAchievements is designed from the ground up to guarantee that your Steam account can never be compromised:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-400">
          <li><strong>Zero credential access:</strong> We never prompt for, intercept, or store your Steam password or Steam Guard authentication codes.</li>
          <li><strong>Read-only Web API:</strong> All synchronization uses Valve's official public API (`ISteamUserStats` & `IPlayerService`), which only grants read-only access to public achievements and playtime.</li>
          <li><strong>Self-hosted & Local:</strong> Your database resides on your own local server; no third-party cloud service has access to your library or profiles.</li>
        </ul>
      </div>
    </div>
  );
};
