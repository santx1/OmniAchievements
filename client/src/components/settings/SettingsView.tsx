import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme, ACCENT_PRESETS } from '../../context/ThemeContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
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
  RefreshCw,
  Globe,
  Terminal
} from 'lucide-react';
import { NEUTRAL_AVATARS, getAvatarUrl, DEFAULT_AVATAR } from '../../utils/avatars.js';
import { useSyncStatus } from '../../utils/syncEngine.js';
import { offlineStore } from '../../utils/offlineStore.js';

export const SettingsView: React.FC = () => {
  const { activeProfile, refreshActiveProfile } = useAuth();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  // Profile fields
  const [name, setName] = useState(activeProfile?.name || '');
  const [avatar, setAvatar] = useState(getAvatarUrl(activeProfile?.avatar) || DEFAULT_AVATAR);
  const [profileLang, setProfileLang] = useState<'en' | 'es'>(activeProfile?.language || language || 'en');
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
  const [copiedCmd, setCopiedCmd] = useState(false);

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
    setSyncMsg(t('settings.syncingCloudMsg'));
    try {
      const res = await triggerSync();
      setSyncMsg(res.message);
      await loadStorageSummary();
    } catch (e: any) {
      setSyncMsg(`${t('common.error')}: ${e.message}`);
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
      setPlatformMsg(t('settings.platformAddedSuccess'));
    } catch (err: any) {
      setPlatformMsg(`✕ ${t('common.error')}: ${err.message}`);
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
      setPlatformMsg(t('settings.platformUpdatedSuccess'));
    } catch (err: any) {
      setPlatformMsg(`✕ ${t('common.error')}: ${err.message}`);
    }
  };

  const handleDeletePlatform = async (id: string) => {
    try {
      await api.deletePlatform(id);
      setPlatforms((prev) => prev.filter((p) => p.id !== id));
      setPlatformMsg(t('settings.platformDeletedSuccess'));
    } catch (err: any) {
      setPlatformMsg(`✕ ${t('common.error')}: ${err.message}`);
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
      { name: newFamilyName.trim() || (language === 'es' ? 'Familiar' : 'Family Member'), steamId: resolvedId }
    ];

    try {
      await api.updateProfile(activeProfile.id, {
        family_steam_ids: JSON.stringify(updated)
      });
      setFamilyAccounts(updated);
      setNewFamilyName('');
      setNewFamilySteamId('');
      await refreshActiveProfile();
      setFamilyMsg(t('settings.familyAddedSuccess'));
    } catch (err: any) {
      setFamilyMsg(`✕ ${t('common.error')}: ${err.message}`);
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
      setFamilyMsg(t('settings.familyRemovedSuccess'));
    } catch (err: any) {
      setFamilyMsg(`✕ ${t('common.error')}: ${err.message}`);
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
        language: profileLang,
        steam_id: steamId.trim(),
        retro_username: retroUsername.trim(),
        retro_api_key: retroApiKey.trim()
      };

      if (newPin) {
        if (!/^\d{6}$/.test(newPin.trim())) {
          setProfileErrorMsg(t('settings.pinLengthError'));
          setIsUpdatingProfile(false);
          return;
        }
        payload.pin = newPin.trim();
        payload.currentPin = currentPin.trim();
      }

      await api.updateProfile(activeProfile.id, payload);
      setLanguage(profileLang);
      await refreshActiveProfile();
      setProfileSuccessMsg(t('settings.profileSuccess'));
      setNewPin('');
      setCurrentPin('');
    } catch (err: any) {
      setProfileErrorMsg(err.message || t('settings.profileError'));
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
      setServerSuccessMsg(t('settings.serverSettingsSavedSuccess'));
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
      setConnectionStatus(t('settings.connectedSuccess', { latency: res.latencyMs }));
    } else {
      setConnectionStatus(t('settings.connectionFailed'));
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
      setBackupMsg(t('settings.backupDownloadedSuccess'));
    } catch (err: any) {
      setBackupMsg(`✕ ${t('common.error')}: ${err.message}`);
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
      setBackupMsg(t('settings.backupRestoredSuccess'));
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setBackupMsg(`✕ ${t('common.error')}: ${err.message}`);
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
          <span>{t('settings.pageTitle')}</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('settings.pageSubtitle')}
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
              {t('settings.profileHeading', { name: activeProfile?.name || '' })}
            </h3>
            <p className="text-xs text-slate-400">{t('settings.profileSub')}</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {/* Name & Steam ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                {t('settings.profileNameLabel')}
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
                {t('settings.steamId64Label')}
              </label>
              <input
                type="text"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                placeholder={t('settings.steamId64Placeholder')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Avatar Chooser */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              {t('settings.avatarColorLabel')}
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
                <span>{t('settings.avatarCustomUrlLabel')}</span>
                {avatar && !avatar.startsWith('data:') && (
                  <span className="text-[10px] text-indigo-500 font-medium">{t('settings.avatarCustomActive')}</span>
                )}
              </label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex-shrink-0 flex items-center justify-center">
                  <img
                    src={avatar || DEFAULT_AVATAR}
                    alt={t('settings.avatarPreview')}
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
                  placeholder={t('settings.avatarUrlPlaceholder')}
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                {t('settings.avatarUrlHelp')}
              </p>
            </div>
          </div>

          {/* Theme & Accent Customizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                {t('settings.themeModeLabel')}
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
              >
                <option value="dark">{t('settings.themeDark')}</option>
                <option value="light">{t('settings.themeLight')}</option>
                <option value="system">{t('settings.themeSystem')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>{t('settings.accentColorLabel')}</span>
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

          {/* Application Language Selector */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-500" />
              <span>{t('settings.languageLabel')}</span>
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
              {t('settings.languageSub')}
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              <button
                type="button"
                onClick={() => setProfileLang('en')}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                  profileLang === 'en'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-white'
                }`}
              >
                <span>English</span>
                {profileLang === 'en' && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
              <button
                type="button"
                onClick={() => setProfileLang('es')}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                  profileLang === 'es'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-white'
                }`}
              >
                <span>Español</span>
                {profileLang === 'es' && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            </div>
          </div>

          {/* RetroAchievements Integration */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-2">
              {t('settings.retroHeading')}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">{t('settings.retroUsername')}</label>
                <input
                  type="text"
                  value={retroUsername}
                  onChange={(e) => setRetroUsername(e.target.value)}
                  placeholder={t('settings.retroUsernamePlaceholder')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">{t('settings.retroApiKey')}</label>
                <input
                  type="password"
                  value={retroApiKey}
                  onChange={(e) => setRetroApiKey(e.target.value)}
                  placeholder={t('settings.retroApiKeyPlaceholder')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Change 6-Digit PIN */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
              {t('settings.pinHeading')}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('settings.currentPinPlaceholder')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <input
                  type="password"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('settings.newPinPlaceholder')}
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
            <span>{isUpdatingProfile ? t('common.saving') : t('settings.saveProfileBtn')}</span>
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
              {t('settings.platformsHeading')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('settings.platformsSub')}
            </p>
          </div>
        </div>

        {/* Existing Platform Tags List */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
            {t('settings.activeConsoles')}
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
                          title={t('settings.editConsoleTooltip')}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlatform(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                          title={t('settings.deleteConsoleTooltip')}
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
            {t('settings.addNewConsole')}
          </span>
          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-[11px] text-slate-500">{t('settings.tagColorLabel')}</label>
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
              placeholder={t('settings.newPlatformPlaceholder')}
              className="flex-grow px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!newPlatformName.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('settings.addConsoleTagBtn')}</span>
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
              {t('settings.familyHeading')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('settings.familySub')}
            </p>
          </div>
        </div>

        {/* Informational Guidance Box */}
        <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-xs text-slate-300 space-y-1.5">
          <p className="font-semibold text-purple-300">
            {t('settings.familyHowTitle')}
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
            <li>
              {t('settings.familyHow1')}
            </li>
            <li>
              {t('settings.familyHow2')}
            </li>
            <li>
              {t('settings.familyHow3')}
            </li>
            <li>
              {t('settings.familyHow4')}
            </li>
          </ul>
        </div>

        {/* Existing Family Accounts */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
            {t('settings.configuredFamily', { count: familyAccounts.length })}
          </span>

          {familyAccounts.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-1">
              {t('settings.noFamilyConfiguredMsg')}
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
                    title={t('settings.removeFamilyTooltip')}
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
            {t('settings.addFamilyMemberLabel')}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <input
              type="text"
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
              placeholder={t('settings.familyNicknamePlaceholder')}
              className="sm:col-span-4 px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400"
            />
            <input
              type="text"
              value={newFamilySteamId}
              onChange={(e) => setNewFamilySteamId(e.target.value)}
              placeholder={t('settings.familySteamIdInputPlaceholder')}
              className="sm:col-span-6 px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={isAddingFamily || !newFamilySteamId.trim()}
              className="sm:col-span-2 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingFamily ? t('settings.syncingCloud') : t('common.add')}</span>
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
                <span>{t('settings.localStorageHeading')}</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  isOnline ? 'bg-emerald-500/15 text-emerald-500' : 'bg-slate-500/15 text-slate-400'
                }`}>
                  {isOnline ? t('settings.onlineBadge') : t('settings.offlineBadge')}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('settings.localStorageSub')}
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
            <span>{isManualSyncing ? t('settings.syncingCloud') : t('settings.syncCloudNow')}</span>
          </button>
        </div>

        {/* Status Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">{t('settings.localGames')}</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
              {storageSummary?.gamesCount ?? '—'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">{t('settings.localTrophies')}</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
              {storageSummary?.achievementsCount ?? '—'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">{t('settings.pendingSync')}</span>
            <span className={`text-lg font-black font-mono ${pendingCount > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
              {t('settings.pendingChangesCount', { count: pendingCount })}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">{t('settings.lastCloudSync')}</span>
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block truncate">
              {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : t('settings.never')}
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
              {t('settings.serverNetworkHeading')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('settings.serverNetworkSub')}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {t('settings.serverUrlLabel')}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={serverUrlInput}
              onChange={(e) => setServerUrlInput(e.target.value)}
              placeholder={t('settings.serverUrlPlaceholder')}
              className="flex-grow px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleSaveServerUrl}
              disabled={isTestingConnection}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 transition-colors"
            >
              {isTestingConnection ? t('settings.testingConnection') : t('settings.saveAndTest')}
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
              {t('settings.backupsHeading')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('settings.backupsSub')}
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
            <span>{isExporting ? t('settings.exportingBackup') : t('settings.downloadBackup')}</span>
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
            <span>{isImporting ? t('settings.restoringBackup') : t('settings.restoreBackup')}</span>
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
              {t('settings.deckyPluginHeading')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('settings.deckyPluginSub')}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-300 space-y-2">
          <p>
            {t('settings.deckyIntro')}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>{t('settings.deckyBullet1')}</li>
            <li>{t('settings.deckyBullet2')}</li>
            <li>{t('settings.deckyBullet3')}</li>
          </ul>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-300 block">
            {t('settings.deckyPairingTokenLabel')}
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={pairingToken || t('settings.deckyPairingTokenPlaceholder')}
              className="flex-grow px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-cyan-300"
            />
            {pairingToken ? (
              <button
                type="button"
                onClick={handleCopyPairingToken}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedToken ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToken ? t('settings.copiedTokenBtn') : t('settings.copyTokenBtn')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={generateDeckyPairingToken}
                disabled={isGeneratingPairToken}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold transition-colors"
              >
                {isGeneratingPairToken ? t('settings.generatingTokenBtn') : t('settings.generateTokenBtn')}
              </button>
            )}
          </div>

          {pairingToken && (
            <div className="mt-3 p-3 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  ⚡ Quick SteamOS Setup (SSH or Konsole Terminal):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const serverOrigin = window.location.origin.replace(/^http:\/\/localhost/, 'http://' + window.location.hostname);
                    const cmd = `mkdir -p ~/.config && echo '{"server_url":"${serverOrigin}","token":"${pairingToken}"}' > ~/.config/omni_achievements_decky.json`;
                    navigator.clipboard.writeText(cmd);
                    setCopiedCmd(true);
                    setTimeout(() => setCopiedCmd(false), 2000);
                  }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
                >
                  {copiedCmd ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd ? "Copied 1-Line Command!" : "Copy 1-Line Command"}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Run this single command on your Steam Deck / Legion Go to configure the Decky plugin instantly without typing:
              </p>
              <code className="text-[10px] font-mono text-cyan-200 block break-all bg-black/50 p-2 rounded-xl select-all border border-slate-800">
                mkdir -p ~/.config &amp;&amp; echo '{JSON.stringify({ server_url: window.location.origin, token: pairingToken })}' &gt; ~/.config/omni_achievements_decky.json
              </code>
            </div>
          )}
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
              {t('settings.serverConfigHeading')}
            </h3>
            <p className="text-xs text-slate-400">{t('settings.serverConfigSub')}</p>
          </div>
        </div>

        <form onSubmit={handleUpdateServerSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              {t('settings.updateMasterPasswordLabel')}
            </label>
            <input
              type="password"
              value={masterPasswordInput}
              onChange={(e) => setMasterPasswordInput(e.target.value)}
              placeholder={t('settings.updateMasterPasswordPlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              {t('settings.masterPasswordHelp')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                {t('settings.globalSteamApiKeyLabel')}
              </label>
              <input
                type="text"
                value={steamApiKeyInput}
                onChange={(e) => setSteamApiKeyInput(e.target.value)}
                placeholder={serverSettings?.steamApiKeyMasked || t('settings.globalSteamApiKeyPlaceholder')}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                {t('settings.steamGridDbApiKeyLabel')}
              </label>
              <input
                type="text"
                value={steamGridDbApiKeyInput}
                onChange={(e) => setSteamGridDbApiKeyInput(e.target.value)}
                placeholder={serverSettings?.steamGridDbApiKeyMasked || t('settings.steamGridDbApiKeyPlaceholder')}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.geminiApiKeyLabel')}
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1"
                >
                  <span>{t('settings.freeKey')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={geminiApiKeyInput}
                onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                placeholder={serverSettings?.geminiApiKeyMasked || t('settings.geminiApiKeyPlaceholder')}
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
            <span>{isUpdatingServer ? t('common.saving') : t('settings.saveServerSettingsBtn')}</span>
          </button>
        </form>
      </div>

      {/* 4. Security Model Explanation */}
      <div className="p-6 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <ShieldCheck className="w-5 h-5" />
          <span>{t('settings.securityArchitectureHeading')}</span>
        </div>
        <p>
          {t('settings.securityArchitectureIntro')}
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-400">
          <li>{t('settings.securityBullet1')}</li>
          <li>{t('settings.securityBullet2')}</li>
          <li>{t('settings.securityBullet3')}</li>
        </ul>
      </div>
    </div>
  );
};
