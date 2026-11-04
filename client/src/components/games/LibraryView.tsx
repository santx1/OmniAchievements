import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { Game, Platform, GameStatus } from '../../types/index.js';
import { GameCard } from './GameCard.js';
import { GameDetailModal } from './GameDetailModal.js';
import {
  Search,
  Filter,
  Gamepad2,
  Trophy,
  RefreshCw,
  Plus,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Sparkles,
  Clock,
  Users
} from 'lucide-react';
import { CustomPlatform } from '../../types/index.js';

interface LibraryViewProps {
  onOpenAddGame: () => void;
  onOpenSteamSync: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onOpenAddGame,
  onOpenSteamSync
}) => {
  const [games, setGames] = useState<Game[]>([]);
  const [customPlatforms, setCustomPlatforms] = useState<CustomPlatform[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Sorting
  const [platform, setPlatform] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<string>('last_played');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Selected game for modal
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  useEffect(() => {
    loadPlatforms();

    const handleSyncComplete = () => {
      loadGames();
      loadPlatforms();
    };

    window.addEventListener('omni:sync_completed', handleSyncComplete);
    return () => window.removeEventListener('omni:sync_completed', handleSyncComplete);
  }, []);

  const loadPlatforms = async () => {
    try {
      const res = await api.getPlatforms();
      setCustomPlatforms(res.platforms || []);
    } catch (e) {}
  };

  useEffect(() => {
    loadGames();
  }, [platform, status, sort]);

  const loadGames = async () => {
    setIsLoading(true);
    try {
      const isFamilyFilter = platform === 'family_shared';
      const res = await api.getGames({
        platform: isFamilyFilter ? undefined : platform,
        status,
        search,
        sort
      });
      let resultGames = res.games || [];
      if (isFamilyFilter) {
        resultGames = resultGames.filter((g) => g.is_family_shared === 1);
      }
      setGames(resultGames);
    } catch (err) {
      console.error('Failed to load games:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadGames();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Gamepad2 className="w-7 h-7 text-indigo-500" />
            <span>Game Library</span>
            <span className="text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
              {games.length}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Universal backlog & achievements across Steam, PlayStation, Xbox, Switch & Emulators
          </p>
        </div>

        {/* Search & View Switcher */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-grow sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search library..."
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
            />
          </form>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-2xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-xl transition-colors ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Sorting Bar */}
      <div className="space-y-3">
        {/* Platform Horizontal Scrollable Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setPlatform('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              platform === 'all'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            All Platforms
          </button>

          {/* Family Shared Filter Pill */}
          <button
            onClick={() => setPlatform('family_shared')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              platform === 'family_shared'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                : 'bg-white dark:bg-slate-900 border border-purple-500/30 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Family Shared</span>
          </button>

          {customPlatforms.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPlatform(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                platform === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tab.color }} />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Status Filter Pills & Sort Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'unplayed', label: 'Backlog (Unplayed)' },
              { id: 'playing', label: 'Playing' },
              { id: 'finished', label: 'Finished' },
              { id: 'completed_100', label: '★ 100% Completed' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatus(st.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  status === st.id
                    ? st.id === 'completed_100'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-glow-gold'
                      : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="last_played">Recently Played</option>
              <option value="completion_desc">Highest Completion %</option>
              <option value="playtime_desc">Most Playtime</option>
              <option value="title_asc">Title (A - Z)</option>
              <option value="title_desc">Title (Z - A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Games Display (Grid or List) */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">Loading your gaming universe...</p>
        </div>
      ) : games.length === 0 ? (
        <div className="py-20 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No games found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {search || platform !== 'all' || status !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'Your library is empty. Sync with Steam to import your PC games or add console games manually.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenSteamSync}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Steam</span>
            </button>
            <button
              onClick={onOpenAddGame}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Game Manually</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {games.map((game) => {
            const plat = customPlatforms.find((cp) => cp.id === game.platform);
            return (
              <GameCard
                key={game.id}
                game={game}
                platformColor={plat?.color}
                platformName={plat?.name}
                onClick={() => setSelectedGameId(game.id)}
              />
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-3xl glass dark:glass border border-slate-200/50 dark:border-slate-800/80 overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {games.map((game) => {
              const pct = game.total_achievements > 0
                ? Math.round((game.unlocked_achievements / game.total_achievements) * 100)
                : 0;
              const is100 = game.status === 'completed_100' || (game.total_achievements > 0 && game.unlocked_achievements === game.total_achievements);

              return (
                <div
                  key={game.id}
                  onClick={() => setSelectedGameId(game.id)}
                  className="p-3.5 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={game.cover_image || game.banner_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150'}
                      alt={game.title}
                      className="w-12 h-16 rounded-xl object-cover shrink-0 shadow-sm border border-slate-200 dark:border-slate-800"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {game.platform}
                        </span>
                        {is100 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            100%
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {game.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{(game.playtime_minutes / 60).toFixed(1)} hrs</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-amber-400" />
                          <span>{game.unlocked_achievements}/{game.total_achievements}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar pill */}
                  <div className="w-24 sm:w-36 shrink-0 text-right">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                      {pct}%
                    </span>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          is100
                            ? 'bg-amber-400'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Game Detail Modal */}
      <GameDetailModal
        gameId={selectedGameId}
        isOpen={!!selectedGameId}
        onClose={() => setSelectedGameId(null)}
        onGameUpdated={loadGames}
        onGameDeleted={() => {
          setSelectedGameId(null);
          loadGames();
        }}
      />
    </div>
  );
};
