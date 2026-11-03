import React, { useState } from 'react';
import { api } from '../../api/client.js';
import { Platform, GameStatus } from '../../types/index.js';
import {
  X,
  Search,
  Image,
  RefreshCw,
  Trophy,
  Check,
  Plus,
  Gamepad2,
  Sparkles
} from 'lucide-react';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameAdded: () => void;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({
  isOpen,
  onClose,
  onGameAdded
}) => {
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<Platform>('playstation');
  const [status, setStatus] = useState<GameStatus>('unplayed');
  const [playtimeHours, setPlaytimeHours] = useState('0');

  // Media
  const [coverImage, setCoverImage] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [heroImage, setHeroImage] = useState('');

  // SteamGridDB search
  const [isSearchingGrid, setIsSearchingGrid] = useState(false);
  const [gridSearchResults, setGridSearchResults] = useState<any[]>([]);
  const [selectedGridGameId, setSelectedGridGameId] = useState<number | null>(null);
  const [availableCovers, setAvailableCovers] = useState<any[]>([]);
  const [availableHeroes, setAvailableHeroes] = useState<any[]>([]);

  // Steam achievements
  const [steamAppId, setSteamAppId] = useState('');
  const [isFetchingSteamSchema, setIsFetchingSteamSchema] = useState(false);
  const [fetchedAchievements, setFetchedAchievements] = useState<any[]>([]);
  const [steamFetchMessage, setSteamFetchMessage] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Search SteamGridDB for box art & heroes
  const handleSearchSteamGridDb = async () => {
    if (!title.trim()) return;
    setIsSearchingGrid(true);
    setGridSearchResults([]);
    setAvailableCovers([]);
    try {
      const res = await api.searchSteamGridDb(title.trim());
      setGridSearchResults(res.results || []);
    } catch (err: any) {
      console.warn('SteamGridDB search error:', err);
    } finally {
      setIsSearchingGrid(false);
    }
  };

  const handleSelectGridGame = async (gameId: number) => {
    setSelectedGridGameId(gameId);
    setIsSearchingGrid(true);
    try {
      const [gridsRes, heroesRes] = await Promise.all([
        api.getSteamGridDbCovers(gameId),
        api.getSteamGridDbHeroes(gameId)
      ]);

      const covers = gridsRes.grids || [];
      const heroes = heroesRes.heroes || [];

      setAvailableCovers(covers);
      setAvailableHeroes(heroes);

      if (covers.length > 0 && !coverImage) {
        setCoverImage(covers[0].url);
      }
      if (heroes.length > 0 && !heroImage) {
        setHeroImage(heroes[0].url);
      }
    } catch (err) {
      console.error('Failed to get grid items', err);
    } finally {
      setIsSearchingGrid(false);
    }
  };

  // Fetch Steam achievements schema for this game
  const handleFetchSteamSchema = async () => {
    if (!steamAppId.trim()) return;
    setIsFetchingSteamSchema(true);
    setSteamFetchMessage(null);
    try {
      const res = await api.getSteamSchema(steamAppId.trim());
      if (res.success && res.achievements?.length > 0) {
        setFetchedAchievements(res.achievements);
        setSteamFetchMessage(`✓ Found ${res.achievements.length} official Steam achievements!`);

        // If cover image not set yet, use Steam's standard library cover
        if (!coverImage) {
          setCoverImage(`https://cdn.akamai.steamstatic.com/steam/apps/${steamAppId.trim()}/library_600x900.jpg`);
        }
        if (!heroImage) {
          setHeroImage(`https://cdn.akamai.steamstatic.com/steam/apps/${steamAppId.trim()}/library_hero.jpg`);
        }
      } else {
        setSteamFetchMessage('No achievements found for this Steam AppID.');
      }
    } catch (err: any) {
      setSteamFetchMessage('Failed to fetch Steam achievements. Check the AppID.');
    } finally {
      setIsFetchingSteamSchema(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Game title is required');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const playtimeMinutes = Math.round(parseFloat(playtimeHours || '0') * 60);

      await api.createGame({
        title: title.trim(),
        platform,
        external_id: steamAppId.trim(),
        cover_image: coverImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600',
        banner_image: bannerImage || heroImage,
        hero_image: heroImage,
        status,
        playtime_minutes: playtimeMinutes,
        initialAchievements: fetchedAchievements
      });

      onGameAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add game');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl glass border border-slate-700/60 shadow-2xl p-6 relative my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add Game to Library</h2>
              <p className="text-xs text-slate-400">PlayStation, Xbox, Switch, Emulators, PC & More</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Platform Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Platform / Console
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'playstation', label: 'PlayStation', color: 'border-blue-500/40 text-blue-400' },
                { id: 'switch', label: 'Nintendo Switch', color: 'border-red-500/40 text-red-400' },
                { id: 'xbox', label: 'Xbox', color: 'border-emerald-500/40 text-emerald-400' },
                { id: 'retro', label: 'RetroArch / Emu', color: 'border-purple-500/40 text-purple-400' },
                { id: 'steam', label: 'Steam', color: 'border-cyan-500/40 text-cyan-400' },
                { id: 'epic', label: 'Epic Games', color: 'border-amber-500/40 text-amber-400' },
                { id: 'gog', label: 'GOG', color: 'border-fuchsia-500/40 text-fuchsia-400' },
                { id: 'other', label: 'Other / Custom', color: 'border-slate-500/40 text-slate-300' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id as Platform)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                    platform === p.id
                      ? `bg-slate-800 ring-2 ring-indigo-500 text-white shadow-md`
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title and SteamGridDB Search */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Game Title & Artwork Search
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Bloodborne, The Legend of Zelda, Halo..."
                className="flex-grow px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleSearchSteamGridDb}
                disabled={isSearchingGrid || !title.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
              >
                {isSearchingGrid ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Search Artwork</span>
              </button>
            </div>
          </div>

          {/* SteamGridDB Game Results */}
          {gridSearchResults.length > 0 && (
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400">
                SteamGridDB Results (Select one to fetch covers):
              </span>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                {gridSearchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => handleSelectGridGame(res.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      selectedGridGameId === res.id
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {res.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Available Cover Art Pickers */}
          {availableCovers.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400">
                Select Cover Art (600x900):
              </span>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {availableCovers.slice(0, 8).map((cov, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCoverImage(cov.url)}
                    className={`relative w-24 h-36 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      coverImage === cov.url
                        ? 'border-indigo-500 scale-105 shadow-glow ring-2 ring-indigo-500'
                        : 'border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={cov.thumb || cov.url} alt="Cover preview" className="w-full h-full object-cover" />
                    {coverImage === cov.url && (
                      <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Cover URL input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Cover Image URL</label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Hero Backdrop URL</label>
              <input
                type="url"
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-600"
              />
            </div>
          </div>

          {/* Steam Achievements Auto-Fetch Integration */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/30 to-indigo-950/30 border border-cyan-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Gather Achievements from Steam Web API
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mb-3">
              If this game also exists on Steam, enter its Steam AppID to instantly import all official achievements, localized badges, and icons into this game!
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={steamAppId}
                onChange={(e) => setSteamAppId(e.target.value)}
                placeholder="e.g. 367520 (Hollow Knight), 105600 (Terraria)..."
                className="flex-grow px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono placeholder-slate-600"
              />
              <button
                type="button"
                onClick={handleFetchSteamSchema}
                disabled={isFetchingSteamSchema || !steamAppId.trim()}
                className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold flex items-center gap-1 shrink-0 disabled:opacity-50"
              >
                {isFetchingSteamSchema ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Fetch Achievements</span>
              </button>
            </div>
            {steamFetchMessage && (
              <p className="text-xs font-semibold text-cyan-300 mt-2">{steamFetchMessage}</p>
            )}
          </div>

          {/* Status & Playtime */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GameStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white"
              >
                <option value="unplayed">Backlog (Unplayed)</option>
                <option value="playing">Playing</option>
                <option value="finished">Finished</option>
                <option value="completed_100">100% Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Playtime (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={playtimeHours}
                onChange={(e) => setPlaytimeHours(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-rose-400">{error}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding Game...' : 'Save Game to Library'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
