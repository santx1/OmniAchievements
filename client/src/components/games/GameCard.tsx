import React from 'react';
import { Game } from '../../types/index.js';
import { Trophy, Clock, Sparkles } from 'lucide-react';

interface GameCardProps {
  game: Game;
  onClick: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
  const percentage = game.total_achievements > 0
    ? Math.round((game.unlocked_achievements / game.total_achievements) * 100)
    : 0;

  const is100Percent = game.status === 'completed_100' || (game.total_achievements > 0 && game.unlocked_achievements === game.total_achievements);

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'steam':
        return { label: 'Steam', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
      case 'playstation':
        return { label: 'PlayStation', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'xbox':
        return { label: 'Xbox', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'switch':
        return { label: 'Switch', bg: 'bg-red-500/20 text-red-400 border-red-500/30' };
      case 'retro':
        return { label: 'Retro / Emu', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      case 'epic':
        return { label: 'Epic Games', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'gog':
        return { label: 'GOG', bg: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30' };
      default:
        return { label: 'Custom', bg: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed_100':
        return { label: '100% Completed', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'finished':
        return { label: 'Finished', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'playing':
        return { label: 'Playing', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case 'unplayed':
      default:
        return { label: 'Backlog', bg: 'bg-slate-700/40 text-slate-400 border-slate-700/60' };
    }
  };

  const platformBadge = getPlatformBadge(game.platform);
  const statusBadge = getStatusBadge(game.status);

  const hours = (game.playtime_minutes / 60).toFixed(1);

  // Fallback box art if cover_image is missing
  const coverUrl = game.cover_image || game.banner_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80';

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col rounded-2xl overflow-hidden bg-card-light dark:bg-card-dark border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer ${
        is100Percent
          ? 'border-amber-500/50 hover:border-amber-400 hover:shadow-glow-gold'
          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-glow'
      }`}
    >
      {/* Box Art Container with 2:3 aspect ratio */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
        <img
          src={coverUrl}
          alt={game.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80';
          }}
        />

        {/* Gradient overlay at bottom of image */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-sm ${platformBadge.bg}`}
          >
            {platformBadge.label}
          </span>

          {is100Percent ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-slate-950 shadow-md">
              <Trophy className="w-3 h-3 fill-slate-950" />
              <span>100%</span>
            </div>
          ) : (
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium backdrop-blur-md border ${statusBadge.bg}`}
            >
              {statusBadge.label}
            </span>
          )}
        </div>

        {/* Playtime on hover/bottom of cover */}
        {game.playtime_minutes > 0 && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-[11px] font-medium text-slate-300 drop-shadow">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{hours} hrs</span>
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className="p-3 flex flex-col flex-grow justify-between bg-white dark:bg-[#131b2e]">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
            {game.title}
          </h3>
        </div>

        {/* Achievements Progress Bar */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between text-[11px] mb-1 font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Trophy className={`w-3 h-3 ${is100Percent ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
              <span>{game.unlocked_achievements}/{game.total_achievements}</span>
            </span>
            <span className={`font-semibold ${is100Percent ? 'text-amber-400' : ''}`}>
              {percentage}%
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700/60 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                is100Percent
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-300 shadow-glow-gold'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
