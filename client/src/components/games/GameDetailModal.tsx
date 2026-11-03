import React, { useState, useEffect } from 'react';
import { Game, Achievement, GameStatus } from '../../types/index.js';
import { api } from '../../api/client.js';
import confetti from 'canvas-confetti';
import { AiAchievementModal } from '../achievements/AiAchievementModal.js';
import {
  X,
  Trophy,
  Clock,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle2,
  Lock,
  Search,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Edit2,
  Save,
  Image as ImageIcon,
  Palette,
  Check,
  Users
} from 'lucide-react';

interface GameDetailModalProps {
  gameId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onGameUpdated: () => void;
  onGameDeleted: () => void;
}

export const GameDetailModal: React.FC<GameDetailModalProps> = ({
  gameId,
  isOpen,
  onClose,
  onGameUpdated,
  onGameDeleted
}) => {
  const [game, setGame] = useState<Game | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Status and edit state
  const [currentStatus, setCurrentStatus] = useState<GameStatus>('unplayed');
  const [playtimeMinutes, setPlaytimeMinutes] = useState(0);
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Delete modal state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [blacklistOnDelete, setBlacklistOnDelete] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add achievement modal state
  const [isAddAchOpen, setIsAddAchOpen] = useState(false);
  const [newAchTitle, setNewAchTitle] = useState('');
  const [newAchDesc, setNewAchDesc] = useState('');
  const [newAchIcon, setNewAchIcon] = useState('');
  const [isSavingAch, setIsSavingAch] = useState(false);

  // Steam import modal state
  const [isSteamImportOpen, setIsSteamImportOpen] = useState(false);
  const [steamAppIdInput, setSteamAppIdInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // SteamGridDB Custom Artwork Picker state
  const [isArtworkModalOpen, setIsArtworkModalOpen] = useState(false);
  const [artSearchQuery, setArtSearchQuery] = useState('');
  const [isSearchingArt, setIsSearchingArt] = useState(false);
  const [artSearchResults, setArtSearchResults] = useState<any[]>([]);
  const [selectedArtGameId, setSelectedArtGameId] = useState<number | null>(null);
  const [availableCovers, setAvailableCovers] = useState<any[]>([]);
  const [availableHeroes, setAvailableHeroes] = useState<any[]>([]);
  const [customCoverInput, setCustomCoverInput] = useState('');
  const [customHeroInput, setCustomHeroInput] = useState('');
  const [isSavingArtwork, setIsSavingArtwork] = useState(false);

  // AI Achievement Generator state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && gameId) {
      loadGameDetails(gameId);
    }
  }, [isOpen, gameId]);

  const loadGameDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await api.getGame(id);
      setGame(res.game);
      setAchievements(res.achievements || []);
      setCurrentStatus(res.game.status);
      setPlaytimeMinutes(res.game.playtime_minutes);
      setNotes(res.game.notes || '');
      setSteamAppIdInput(res.game.external_id || '');
    } catch (err) {
      console.error('Failed to load game details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: GameStatus) => {
    if (!game) return;
    setCurrentStatus(newStatus);
    try {
      await api.updateGame(game.id, { status: newStatus });
      if (newStatus === 'completed_100') {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
      onGameUpdated();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleToggleAchievement = async (ach: Achievement) => {
    if (!game) return;
    try {
      const res = await api.toggleAchievement(ach.id);
      const isNowUnlocked = res.achievement.is_unlocked === 1;

      if (isNowUnlocked) {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.7 }
        });
      }

      // Refresh game details
      await loadGameDetails(game.id);
      onGameUpdated();
    } catch (err) {
      console.error('Failed to toggle achievement', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!game) return;
    try {
      await api.updateGame(game.id, { notes, playtime_minutes: playtimeMinutes });
      setIsEditingNotes(false);
      onGameUpdated();
    } catch (err) {
      console.error('Failed to save notes', err);
    }
  };

  const handleDeleteGame = async () => {
    if (!game) return;
    setIsDeleting(true);
    try {
      await api.deleteGame(game.id, blacklistOnDelete, 'User deleted and blacklisted bloat game');
      setIsDeleteConfirmOpen(false);
      onClose();
      onGameDeleted();
    } catch (err) {
      console.error('Failed to delete game:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game || !newAchTitle.trim()) return;

    setIsSavingAch(true);
    try {
      await api.createAchievement(game.id, {
        display_name: newAchTitle.trim(),
        description: newAchDesc.trim(),
        icon_unlocked: newAchIcon.trim()
      });
      setIsAddAchOpen(false);
      setNewAchTitle('');
      setNewAchDesc('');
      setNewAchIcon('');
      await loadGameDetails(game.id);
      onGameUpdated();
    } catch (err) {
      console.error('Failed to create achievement', err);
    } finally {
      setIsSavingAch(false);
    }
  };

  const handleImportSteamAchievements = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game || !steamAppIdInput.trim()) return;

    setIsImporting(true);
    try {
      await api.importSteamAchievementsToGame(game.id, steamAppIdInput.trim());
      setIsSteamImportOpen(false);
      await loadGameDetails(game.id);
      onGameUpdated();
    } catch (err) {
      console.error('Failed to import Steam achievements', err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenArtworkPicker = () => {
    if (!game) return;
    setArtSearchQuery(game.title);
    setCustomCoverInput(game.cover_image || '');
    setCustomHeroInput(game.hero_image || '');
    setIsArtworkModalOpen(true);
    // Auto search on open
    searchArtwork(game.title);
  };

  const searchArtwork = async (query: string) => {
    if (!query.trim()) return;
    setIsSearchingArt(true);
    setArtSearchResults([]);
    setAvailableCovers([]);
    setAvailableHeroes([]);
    try {
      const res = await api.searchSteamGridDb(query.trim());
      setArtSearchResults(res.results || []);
      if (res.results && res.results.length > 0) {
        // Auto select first match
        await loadGridsForArtGame(res.results[0].id);
      }
    } catch (err) {
      console.warn('SteamGridDB search error:', err);
    } finally {
      setIsSearchingArt(false);
    }
  };

  const loadGridsForArtGame = async (gameId: number) => {
    setSelectedArtGameId(gameId);
    setIsSearchingArt(true);
    try {
      const [gridsRes, heroesRes] = await Promise.all([
        api.getSteamGridDbCovers(gameId),
        api.getSteamGridDbHeroes(gameId)
      ]);
      setAvailableCovers(gridsRes.grids || []);
      setAvailableHeroes(heroesRes.heroes || []);
    } catch (err) {
      console.error('Failed to load covers', err);
    } finally {
      setIsSearchingArt(false);
    }
  };

  const handleApplyCover = async (coverUrl: string) => {
    if (!game) return;
    setIsSavingArtwork(true);
    try {
      await api.updateGame(game.id, { cover_image: coverUrl });
      setGame((prev) => prev ? { ...prev, cover_image: coverUrl } : null);
      setCustomCoverInput(coverUrl);
      onGameUpdated();
    } catch (err) {
      console.error('Failed to update cover', err);
    } finally {
      setIsSavingArtwork(false);
    }
  };

  const handleApplyHero = async (heroUrl: string) => {
    if (!game) return;
    setIsSavingArtwork(true);
    try {
      await api.updateGame(game.id, { hero_image: heroUrl });
      setGame((prev) => prev ? { ...prev, hero_image: heroUrl } : null);
      setCustomHeroInput(heroUrl);
      onGameUpdated();
    } catch (err) {
      console.error('Failed to update hero banner', err);
    } finally {
      setIsSavingArtwork(false);
    }
  };

  const handleResetOfficialSteamArtwork = async () => {
    if (!game || !game.external_id) return;
    const officialCover = `https://cdn.akamai.steamstatic.com/steam/apps/${game.external_id}/library_600x900.jpg`;
    const officialHero = `https://cdn.akamai.steamstatic.com/steam/apps/${game.external_id}/library_hero.jpg`;
    const officialBanner = `https://cdn.akamai.steamstatic.com/steam/apps/${game.external_id}/header.jpg`;

    setIsSavingArtwork(true);
    try {
      await api.updateGame(game.id, {
        cover_image: officialCover,
        hero_image: officialHero,
        banner_image: officialBanner
      });
      setGame((prev) => prev ? { ...prev, cover_image: officialCover, hero_image: officialHero, banner_image: officialBanner } : null);
      setCustomCoverInput(officialCover);
      setCustomHeroInput(officialHero);
      onGameUpdated();
    } catch (err) {
      console.error('Failed to reset artwork', err);
    } finally {
      setIsSavingArtwork(false);
    }
  };

  if (!isOpen) return null;

  const filteredAchievements = achievements.filter((a) => {
    if (filter === 'unlocked' && a.is_unlocked !== 1) return false;
    if (filter === 'locked' && a.is_unlocked === 1) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.display_name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const percentage = game && game.total_achievements > 0
    ? Math.round((game.unlocked_achievements / game.total_achievements) * 100)
    : 0;

  const is100Percent = currentStatus === 'completed_100' || (game && game.total_achievements > 0 && game.unlocked_achievements === game.total_achievements);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xl overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl glass-dark border border-slate-700/60 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">Loading game details & achievements...</p>
          </div>
        ) : !game ? (
          <div className="p-12 text-center text-slate-400">
            <p>Game not found</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-white">
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Hero Banner Header */}
            <div className="relative h-56 sm:h-72 w-full overflow-hidden shrink-0 bg-slate-900">
              <img
                src={game.hero_image || game.banner_image || game.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200'}
                alt={game.title}
                className="w-full h-full object-cover object-center brightness-75 scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Info Overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
                {/* Box Art Thumbnail with Edit Artwork Button */}
                <div className="hidden sm:block relative w-24 h-36 rounded-xl overflow-hidden border-2 border-slate-700/80 shadow-2xl shrink-0 bg-slate-900 group">
                  <img
                    src={game.cover_image || game.banner_image}
                    alt={game.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleOpenArtworkPicker}
                    title="Change Cover from SteamGridDB"
                    className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white text-[10px] font-bold transition-opacity"
                  >
                    <ImageIcon className="w-5 h-5 text-indigo-400" />
                    <span>Change Art</span>
                  </button>
                </div>

                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                      {game.platform}
                    </span>
                    {is100Percent && (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/30 text-amber-300 border border-amber-500/50 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        <span>100% Completed</span>
                      </span>
                    )}
                    {game.is_family_shared === 1 && (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>Family Shared {game.family_owner ? `by ${game.family_owner}` : ''}</span>
                      </span>
                    )}
                    {game.is_custom === 1 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        Custom Added
                      </span>
                    )}
                  </div>

                  <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                    {game.title}
                  </h1>

                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{(playtimeMinutes / 60).toFixed(1)} hours played</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {game.unlocked_achievements} / {game.total_achievements} ({percentage}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-header Controls Bar */}
            <div className="p-4 bg-slate-900/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Status Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Status:</span>
                <select
                  value={currentStatus}
                  onChange={(e) => handleStatusChange(e.target.value as GameStatus)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="unplayed">Backlog (Unplayed)</option>
                  <option value="playing">Playing</option>
                  <option value="finished">Finished</option>
                  <option value="completed_100">100% Completed</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/40 hover:to-purple-600/40 border border-indigo-500/40 text-xs font-semibold text-indigo-300 flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Generate canon achievements & vector badges with Google Gemini AI"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI Achievements</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenArtworkPicker}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-purple-400 flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Choose custom box art & banners from SteamGridDB"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Custom Artwork</span>
                </button>

                <button
                  onClick={() => setIsAddAchOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Add Achievement</span>
                </button>

                <button
                  onClick={() => setIsSteamImportOpen(true)}
                  title="Import official achievements from Steam"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-cyan-400 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Fetch Steam Schema</span>
                </button>

                <button
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                  title="Delete game from library"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Achievements Section Header with Filters */}
            <div className="p-4 pb-2 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Achievements</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-indigo-400 font-semibold">
                    {game.unlocked_achievements}/{game.total_achievements}
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
                {/* Search */}
                <div className="relative flex-grow sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search achievements..."
                    className="w-full pl-8 pr-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Filter buttons */}
                <div className="flex items-center rounded-xl bg-slate-900 p-0.5 border border-slate-800 text-xs">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('unlocked')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filter === 'unlocked' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Unlocked
                  </button>
                  <button
                    onClick={() => setFilter('locked')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      filter === 'locked' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Locked
                  </button>
                </div>
              </div>
            </div>

            {/* Achievements List (Scrollable) */}
            <div className="p-4 overflow-y-auto flex-grow space-y-2">
              {filteredAchievements.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Trophy className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                  <p className="text-sm">No achievements found</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Add achievements manually or click "Fetch Steam Schema" to import official ones.
                  </p>
                </div>
              ) : (
                filteredAchievements.map((ach) => {
                  const isUnlocked = ach.is_unlocked === 1;
                  const iconUrl = isUnlocked
                    ? ach.icon_unlocked || ach.icon_locked
                    : ach.icon_locked || ach.icon_unlocked;

                  return (
                    <div
                      key={ach.id}
                      onClick={() => handleToggleAchievement(ach)}
                      className={`group p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isUnlocked
                          ? 'bg-slate-900/80 border-indigo-500/30 hover:border-indigo-500/60'
                          : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Achievement Icon */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center relative">
                          {iconUrl ? (
                            <img
                              src={iconUrl}
                              alt={ach.display_name}
                              className={`w-full h-full object-cover transition-all ${
                                !isUnlocked ? 'grayscale brightness-75' : ''
                              }`}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Trophy className={`w-5 h-5 ${isUnlocked ? 'text-amber-400' : 'text-slate-500'}`} />
                          )}
                          {!isUnlocked && (
                            <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                              <Lock className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                        </div>

                        {/* Title & Description */}
                        <div className="min-w-0">
                          <h4
                            className={`font-bold text-sm tracking-tight truncate ${
                              isUnlocked ? 'text-white' : 'text-slate-400'
                            }`}
                          >
                            {ach.display_name}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            {ach.description || 'No description provided'}
                          </p>
                          {isUnlocked && ach.unlocked_at && (
                            <p className="text-[10px] text-indigo-400 mt-1 font-mono">
                              Unlocked: {new Date(ach.unlocked_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Toggle status indicator */}
                      <button
                        type="button"
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-transform group-hover:scale-110 shrink-0 ${
                          isUnlocked
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-500 border-slate-700 group-hover:text-slate-300'
                        }`}
                      >
                        {isUnlocked ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Notes & Playtime bar at bottom */}
            <div className="p-4 bg-slate-900 border-t border-slate-800/80 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">Personal Notes & Tracker</span>
                {isEditingNotes ? (
                  <button
                    onClick={handleSaveNotes}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Notes & Playtime</span>
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Playtime (minutes):</label>
                    <input
                      type="number"
                      value={playtimeMinutes}
                      onChange={(e) => setPlaytimeMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                    <span className="text-xs text-slate-500">
                      ({(playtimeMinutes / 60).toFixed(1)} hrs)
                    </span>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write memories, walkthrough notes, or completion thoughts..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  {notes || 'No notes added yet. Click edit to add notes or adjust playtime.'}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* SteamGridDB Custom Artwork Picker Modal */}
      {isArtworkModalOpen && game && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl glass-dark border border-purple-500/30 shadow-2xl p-6 relative my-auto max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Choose Custom Artwork (SteamGridDB)</h3>
                  <p className="text-xs text-slate-400">Select community & official high-res posters and hero banners for {game.title}</p>
                </div>
              </div>
              <button
                onClick={() => setIsArtworkModalOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct URL Manual Inputs */}
            <div className="mb-4 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Paste Direct Image URLs:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    value={customCoverInput}
                    onChange={(e) => setCustomCoverInput(e.target.value)}
                    placeholder="Custom Cover URL (https://...)"
                    className="flex-grow px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    disabled={!customCoverInput.trim() || isSavingArtwork}
                    onClick={() => handleApplyCover(customCoverInput.trim())}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shrink-0 disabled:opacity-50"
                  >
                    Apply Cover
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    value={customHeroInput}
                    onChange={(e) => setCustomHeroInput(e.target.value)}
                    placeholder="Custom Hero URL (https://...)"
                    className="flex-grow px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    disabled={!customHeroInput.trim() || isSavingArtwork}
                    onClick={() => handleApplyHero(customHeroInput.trim())}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shrink-0 disabled:opacity-50"
                  >
                    Apply Hero
                  </button>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="flex gap-2 mb-4 shrink-0">
              <input
                type="text"
                value={artSearchQuery}
                onChange={(e) => setArtSearchQuery(e.target.value)}
                placeholder="Search game on SteamGridDB..."
                className="flex-grow px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => searchArtwork(artSearchQuery)}
                disabled={isSearchingArt || !artSearchQuery.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
              >
                {isSearchingArt ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Search</span>
              </button>
            </div>

            {/* Matched Games Selector */}
            {artSearchResults.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3 shrink-0">
                {artSearchResults.slice(0, 6).map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => loadGridsForArtGame(res.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-medium border transition-colors shrink-0 ${
                      selectedArtGameId === res.id
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {res.name}
                  </button>
                ))}
              </div>
            )}

            {/* Scrollable Posters & Heroes */}
            <div className="overflow-y-auto flex-grow space-y-4 pr-1">
              {/* Vertical Posters (600x900) */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Vertical Box Art (Click to Apply Cover):
                </span>
                {availableCovers.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">No custom covers found for this query.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {availableCovers.slice(0, 15).map((cov, idx) => {
                      const isSelected = game.cover_image === cov.url;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleApplyCover(cov.url)}
                          className={`group relative rounded-xl overflow-hidden aspect-[2/3] border-2 cursor-pointer transition-all hover:scale-105 ${
                            isSelected
                              ? 'border-purple-500 ring-2 ring-purple-500 shadow-glow'
                              : 'border-slate-800 hover:border-purple-400'
                          }`}
                        >
                          <img
                            src={cov.thumb || cov.url}
                            alt="SteamGridDB Cover"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                              <Check className="w-6 h-6 text-white drop-shadow" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold transition-opacity">
                            Set as Cover
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Wide Hero Banners (1920x620) */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Hero Backdrops (Click to Apply Banner):
                </span>
                {availableHeroes.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">No custom heroes found for this query.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableHeroes.slice(0, 6).map((hero, idx) => {
                      const isSelected = game.hero_image === hero.url;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleApplyHero(hero.url)}
                          className={`group relative rounded-xl overflow-hidden aspect-[16/6] border-2 cursor-pointer transition-all hover:scale-102 ${
                            isSelected
                              ? 'border-purple-500 ring-2 ring-purple-500 shadow-glow'
                              : 'border-slate-800 hover:border-purple-400'
                          }`}
                        >
                          <img
                            src={hero.thumb || hero.url}
                            alt="SteamGridDB Hero"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                              <Check className="w-6 h-6 text-white drop-shadow" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                            Set as Hero Banner
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls & Reset */}
            <div className="pt-4 mt-2 border-t border-slate-800 shrink-0 flex items-center justify-between gap-3">
              {game.platform === 'steam' && game.external_id ? (
                <button
                  type="button"
                  onClick={handleResetOfficialSteamArtwork}
                  disabled={isSavingArtwork}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Reset to Official Steam Art
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setIsArtworkModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (With Blacklist Checkbox for Bloatware) */}
      {isDeleteConfirmOpen && game && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl glass-dark border border-rose-500/30 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Delete "{game.title}"?</h3>
            <p className="text-sm text-slate-400 mb-4">
              Are you sure you want to remove this game and all tracked achievements from your library?
            </p>

            {/* Blacklist Option for Free Bloat Games */}
            {game.platform === 'steam' && (
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 mb-5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blacklistOnDelete}
                    onChange={(e) => setBlacklistOnDelete(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      Blacklist from future Steam syncs (Recommended)
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Prevents this free or bloatware game from ever being re-imported when synchronizing with Steam. You can un-blacklist it later in Settings.
                    </span>
                  </div>
                </label>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteGame}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Game'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Achievement Modal */}
      {isAddAchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl glass-dark border border-slate-700/60 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Add Custom Achievement</h3>
              <button
                onClick={() => setIsAddAchOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAchievement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newAchTitle}
                  onChange={(e) => setNewAchTitle(e.target.value)}
                  placeholder="e.g. Master of the Galaxy"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newAchDesc}
                  onChange={(e) => setNewAchDesc(e.target.value)}
                  placeholder="e.g. Defeat the final boss on hard difficulty"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Icon Image URL (Optional)</label>
                <input
                  type="url"
                  value={newAchIcon}
                  onChange={(e) => setNewAchIcon(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingAch}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/30"
                >
                  {isSavingAch ? 'Saving...' : 'Add Achievement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Steam Achievements Modal */}
      {isSteamImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl glass-dark border border-cyan-500/30 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-cyan-400" />
                <span>Fetch Steam Achievements</span>
              </h3>
              <button
                onClick={() => setIsSteamImportOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Enter the official Steam AppID for this game. We will automatically fetch all official achievements, localized descriptions, and high-res badges from the Steam Web API and assign them to this game!
            </p>

            <form onSubmit={handleImportSteamAchievements} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Steam AppID</label>
                <input
                  type="text"
                  required
                  value={steamAppIdInput}
                  onChange={(e) => setSteamAppIdInput(e.target.value)}
                  placeholder="e.g. 367520 (Hollow Knight), 1245620 (Elden Ring)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isImporting || !steamAppIdInput.trim()}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs shadow-md shadow-cyan-600/30 disabled:opacity-50"
              >
                {isImporting ? 'Fetching...' : 'Import Achievements'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Achievement Generator Modal */}
      {isAiModalOpen && game && (
        <AiAchievementModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          gameId={game.id}
          gameTitle={game.title}
          platform={game.platform}
          onAchievementsApplied={async () => {
            await loadGameDetails(game.id);
            onGameUpdated();
          }}
        />
      )}
    </div>
  );
};
