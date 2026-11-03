import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { PinPadModal } from './PinPadModal.js';
import { Profile } from '../../types/index.js';
import { api } from '../../api/client.js';
import { Users, Plus, Shield, Sparkles, X, Check, Palette } from 'lucide-react';
import { ACCENT_PRESETS } from '../../context/ThemeContext.js';
import { NEUTRAL_AVATARS, getAvatarUrl, DEFAULT_AVATAR } from '../../utils/avatars.js';

export const ProfileSelector: React.FC = () => {
  const { profiles, selectProfileWithPin, loadProfiles } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Profile Form
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState(DEFAULT_AVATAR);
  const [newPin, setNewPin] = useState('');
  const [newTheme, setNewTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [newAccent, setNewAccent] = useState('#6366f1');
  const [newSteamId, setNewSteamId] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleProfileClick = (profile: Profile) => {
    setSelectedProfile(profile);
    setIsPinModalOpen(true);
  };

  const handlePinSubmit = async (pin: string) => {
    if (!selectedProfile) return false;
    const ok = await selectProfileWithPin(selectedProfile.id, pin);
    if (ok) {
      setIsPinModalOpen(false);
    }
    return ok;
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError('Profile name is required');
      return;
    }
    if (!/^\d{6}$/.test(newPin.trim())) {
      setCreateError('PIN must be exactly 6 digits');
      return;
    }

    setCreateError(null);
    setIsCreating(true);

    try {
      const res = await api.createProfile({
        name: newName.trim(),
        avatar: newAvatar,
        pin: newPin.trim(),
        theme: newTheme,
        accent_color: newAccent,
        steam_id: newSteamId.trim()
      });

      await loadProfiles();
      setIsCreateModalOpen(false);

      // Auto prompt PIN for newly created profile
      setSelectedProfile(res.profile);
      setIsPinModalOpen(true);

      // Reset form
      setNewName('');
      setNewPin('');
      setNewSteamId('');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create profile');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl z-10 text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-indigo-400 mb-4 shadow-sm">
          <Users className="w-4 h-4" />
          <span>Multi-User Family Hub</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Who is playing?</h1>
        <p className="text-sm md:text-base text-slate-400 mt-2 font-normal">
          Select your profile to synchronize your games, achievements, and stats
        </p>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 w-full max-w-4xl z-10">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => handleProfileClick(profile)}
            className="group flex flex-col items-center p-5 rounded-3xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-glow cursor-pointer relative"
          >
            {/* Avatar container */}
            <div className="relative mb-4">
              <img
                src={getAvatarUrl(profile.avatar)}
                alt={profile.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-lg border-2 border-slate-700 group-hover:border-indigo-500 transition-colors"
              />
              <div className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 shadow group-hover:text-indigo-400 transition-colors">
                <Shield className="w-4 h-4" />
              </div>
            </div>

            <h3 className="font-bold text-base md:text-lg text-slate-200 group-hover:text-white transition-colors truncate max-w-full">
              {profile.name}
            </h3>

            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: profile.accent_color || '#6366f1' }}
              />
              <span className="capitalize">{profile.theme || 'dark'}</span>
            </div>
          </button>
        ))}

        {/* Add Profile Card */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="group flex flex-col items-center justify-center p-5 rounded-3xl bg-slate-900/30 hover:bg-slate-800/50 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 transition-all duration-200 transform hover:-translate-y-1 cursor-pointer min-h-[180px]"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800/60 group-hover:bg-indigo-500/20 text-slate-400 group-hover:text-indigo-400 flex items-center justify-center transition-colors mb-3">
            <Plus className="w-8 h-8" />
          </div>
          <span className="font-semibold text-sm md:text-base text-slate-400 group-hover:text-white transition-colors">
            Add Profile
          </span>
        </button>
      </div>

      {/* PIN Entry Modal */}
      <PinPadModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title={`Unlock ${selectedProfile?.name || 'Profile'}`}
        subtitle="Enter your 6-digit security PIN"
        onSuccess={handlePinSubmit}
      />

      {/* Create Profile Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-md p-6 rounded-3xl glass-dark border border-slate-700/60 shadow-2xl relative my-8">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">Create Family Profile</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Alex, Maria, Dad..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Choose Color Avatar
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-2">
                  {NEUTRAL_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setNewAvatar(av.dataUri)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all p-1 ${
                        newAvatar === av.dataUri
                          ? 'border-indigo-500 scale-105 shadow-glow'
                          : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: av.bg }}
                      title={av.name}
                    >
                      <img src={av.dataUri} alt={av.name} className="w-full h-10 object-contain" />
                      {newAvatar === av.dataUri && (
                        <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6-Digit PIN Setter */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  6-Digit Security PIN
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 123456"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm font-mono tracking-widest text-center focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Required to switch to this profile or edit settings.
                </p>
              </div>

              {/* Style & Theme Options */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Theme Mode
                  </label>
                  <select
                    value={newTheme}
                    onChange={(e) => setNewTheme(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="dark">Dark Mode</option>
                    <option value="light">Light Mode</option>
                    <option value="system">System Synchronized</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5" />
                    <span>Accent Color</span>
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {ACCENT_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setNewAccent(p.value)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          newAccent === p.value ? 'scale-125 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: p.value }}
                        title={p.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Steam ID */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  SteamID64 (Optional)
                </label>
                <input
                  type="text"
                  value={newSteamId}
                  onChange={(e) => setNewSteamId(e.target.value)}
                  placeholder="e.g. 76561198000000000"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {createError && (
                <p className="text-xs font-semibold text-rose-400">{createError}</p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
