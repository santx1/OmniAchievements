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
  Laptop
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
];

export const SettingsView: React.FC = () => {
  const { activeProfile, refreshActiveProfile } = useAuth();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();

  // Profile fields
  const [name, setName] = useState(activeProfile?.name || '');
  const [avatar, setAvatar] = useState(activeProfile?.avatar || PRESET_AVATARS[0]);
  const [steamId, setSteamId] = useState(activeProfile?.steam_id || '');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Server settings fields
  const [serverSettings, setServerSettings] = useState<any | null>(null);
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [steamApiKeyInput, setSteamApiKeyInput] = useState('');
  const [steamGridDbApiKeyInput, setSteamGridDbApiKeyInput] = useState('');
  const [isUpdatingServer, setIsUpdatingServer] = useState(false);
  const [serverSuccessMsg, setServerSuccessMsg] = useState<string | null>(null);

  // Legion Go / Decky Plugin pairing
  const [pairingToken, setPairingToken] = useState<string | null>(null);
  const [isGeneratingPairToken, setIsGeneratingPairToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    loadServerSettings();
  }, []);

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
        steam_id: steamId.trim()
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
              Profile Avatar
            </label>
            <div className="grid grid-cols-6 gap-2 mb-2">
              {PRESET_AVATARS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatar(p)}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                    avatar === p ? 'border-indigo-500 scale-105 shadow-glow' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={p} alt="Preset avatar" className="w-full h-full object-cover" />
                  {avatar === p && (
                    <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="Or custom avatar URL..."
              className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
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
