import React from 'react';
import { Game } from '../../types/index.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { Trophy, Clock, Users } from 'lucide-react';

interface GameCardProps {
  game: Game;
  onClick: () => void;
  platformColor?: string;
  platformName?: string;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onClick, platformColor, platformName }) => {
  const { t } = useLanguage();
  const percentage = game.total_achievements > 0
    ? Math.round((game.unlocked_achievements / game.total_achievements) * 100)
    : 0;

  const is100Percent = game.status === 'completed_100' || (game.total_achievements > 0 && game.unlocked_achievements === game.total_achievements);

  const getPlatformBadge = (platform: string) => {
    if (platformName && platformColor) {
      return { label: platformName, bg: 'text-white border-white/20', customColor: platformColor };
    }
    switch (platform) {
      case 'steam':
        return { label: 'Steam', bg: 'text-cyan-300 border-cyan-500/40', customColor: '#06b6d4' };
      case 'playstation':
        return { label: 'PlayStation', bg: 'text-blue-300 border-blue-500/40', customColor: '#3b82f6' };
      case 'xbox':
        return { label: 'Xbox', bg: 'text-emerald-300 border-emerald-500/40', customColor: '#10b981' };
      case 'switch':
        return { label: 'Switch', bg: 'text-red-300 border-red-500/40', customColor: '#ef4444' };
      case 'retro':
        return { label: 'Retro / Emu', bg: 'text-purple-300 border-purple-500/40', customColor: '#8b5cf6' };
      case 'epic':
        return { label: 'Epic Games', bg: 'text-amber-300 border-amber-500/40', customColor: '#f59e0b' };
      case 'gog':
        return { label: 'GOG', bg: 'text-fuchsia-300 border-fuchsia-500/40', customColor: '#d946ef' };
      default:
        return { label: platform.toUpperCase(), bg: 'text-slate-200 border-slate-500/40', customColor: '#64748b' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed_100':
        return { label: t('library.statusCompleted'), bg: 'bg-amber-500 text-slate-950 font-bold' };
      case 'finished':
        return { label: t('library.statusFinished'), bg: 'bg-emerald-500/80 text-white font-medium' };
      case 'playing':
        return { label: t('library.statusPlaying'), bg: 'bg-indigo-600/85 text-white font-medium' };
      case 'unplayed':
      default:
        return { label: t('library.statusBacklog'), bg: 'bg-slate-900/80 text-slate-300 font-medium' };
    }
  };

  const platformBadge = getPlatformBadge(game.platform);
  const statusBadge = getStatusBadge(game.status);
  const isFamilyShared = game.is_family_shared === 1;

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
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none flex-wrap">
          <div className="flex items-center gap-1">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-sm ${platformBadge.bg}`}
              style={{ backgroundColor: `${platformBadge.customColor}cc` }}
            >
              {platformBadge.label}
            </span>

            {isFamilyShared && (
              <span
                className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-purple-600/90 text-white backdrop-blur-md flex items-center gap-0.5 shadow-sm"
                title={game.family_owner ? `Family Shared by ${game.family_owner}` : t('library.familySharedBadge')}
              >
                <Users className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">{t('library.familySharedBadge')}</span>
              </span>
            )}
          </div>

          {is100Percent ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-slate-950 shadow-md">
              <Trophy className="w-3 h-3 fill-slate-950" />
              <span>100%</span>
            </div>
          ) : (
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] backdrop-blur-md border border-white/10 shadow-sm ${statusBadge.bg}`}
            >
              {statusBadge.label}
            </span>
          )}
        </div>

        {/* Playtime on hover/bottom of cover */}
        {game.playtime_minutes > 0 && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-[11px] font-medium text-slate-300 drop-shadow">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{t('gameCard.playtime', { hours })}</span>
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
