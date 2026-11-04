import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { StatsData } from '../../types/index.js';
import { useLanguage } from '../../context/LanguageContext.js';
import {
  Trophy,
  BarChart3,
  Clock,
  CheckCircle2,
  Gamepad2,
  Sparkles,
  PieChart as PieIcon,
  Flame,
  Award
} from 'lucide-react';

export const StatisticsView: React.FC = () => {
  const { t, getAchievementText } = useLanguage();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">{t('stats.loadingAnalytics')}</p>
      </div>
    );
  }

  if (!stats) return null;

  const { summary, platforms, hallOfFame, recentAchievements } = stats;

  const total = summary.totalGames || 1;
  const pUnplayed = Math.round((summary.unplayed / total) * 100);
  const pPlaying = Math.round((summary.playing / total) * 100);
  const pFinished = Math.round((summary.finished / total) * 100);
  const p100 = Math.round((summary.completed100 / total) * 100);

  // SVG Donut calculation
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  const strokeDash = (pct: number) => (pct / 100) * circumference;

  let offsetUnplayed = 0;
  let offsetPlaying = strokeDash(pUnplayed);
  let offsetFinished = offsetPlaying + strokeDash(pPlaying);
  let offset100 = offsetFinished + strokeDash(pFinished);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <BarChart3 className="w-7 h-7 text-indigo-500" />
          <span>{t('stats.title')}</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('stats.subtitle')}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Games */}
        <div className="p-5 rounded-3xl glass dark:glass border border-slate-200/50 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            {t('stats.totalGames')}
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 block">
            {summary.totalGames}
          </span>
        </div>

        {/* 100% Completed */}
        <div className="p-5 rounded-3xl glass dark:glass border border-amber-500/30 shadow-glow-gold relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
            <Trophy className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-amber-500 dark:text-amber-400 uppercase tracking-wider block">
            {t('library.statusCompleted')}
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 block">
            {summary.completed100}
          </span>
        </div>

        {/* Total Achievements */}
        <div className="p-5 rounded-3xl glass dark:glass border border-slate-200/50 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            {t('stats.totalAchievements')}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {summary.totalUnlockedAchievements}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              / {summary.totalAvailableAchievements} ({summary.completionPercentage}%)
            </span>
          </div>
        </div>

        {/* Total Playtime */}
        <div className="p-5 rounded-3xl glass dark:glass border border-slate-200/50 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            {t('stats.totalPlaytime')}
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 block">
            {summary.totalPlaytimeHours} <span className="text-sm font-semibold text-slate-400">{t('common.hours')}</span>
          </span>
        </div>
      </div>

      {/* Visual Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Status Distribution Graphic */}
        <div className="p-6 rounded-3xl glass dark:glass border border-slate-200/50 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieIcon className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {t('stats.statusDistribution')}
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            {/* SVG Interactive Donut Chart */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                {/* Background Track */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="16"
                />

                {/* Unplayed / Backlog Segment (Slate) */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#64748b"
                  strokeWidth="16"
                  strokeDasharray={`${strokeDash(pUnplayed)} ${circumference}`}
                  strokeDashoffset={-offsetUnplayed}
                  className="transition-all duration-700"
                />

                {/* Playing Segment (Indigo) */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#6366f1"
                  strokeWidth="16"
                  strokeDasharray={`${strokeDash(pPlaying)} ${circumference}`}
                  strokeDashoffset={-offsetPlaying}
                  className="transition-all duration-700"
                />

                {/* Finished Segment (Emerald) */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="16"
                  strokeDasharray={`${strokeDash(pFinished)} ${circumference}`}
                  strokeDashoffset={-offsetFinished}
                  className="transition-all duration-700"
                />

                {/* 100% Completed Segment (Gold) */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#f59e0b"
                  strokeWidth="16"
                  strokeDasharray={`${strokeDash(p100)} ${circumference}`}
                  strokeDashoffset={-offset100}
                  className="transition-all duration-700"
                />
              </svg>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {summary.totalGames}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t('stats.gamesLabel')}
                </span>
              </div>
            </div>

            {/* Legend & Percentages */}
            <div className="space-y-3 w-full sm:w-auto">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-glow-gold shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('stats.completed100Label')}</span>
                <span className="text-xs font-bold text-amber-500">{summary.completed100} ({p100}%)</span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('stats.finishedLabel')}</span>
                <span className="text-xs font-bold text-emerald-500">{summary.finished} ({pFinished}%)</span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('stats.playingLabel')}</span>
                <span className="text-xs font-bold text-indigo-500">{summary.playing} ({pPlaying}%)</span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('stats.backlogLabel')}</span>
                <span className="text-xs font-bold text-slate-400">{summary.unplayed} ({pUnplayed}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Distribution Bar Chart */}
        <div className="p-6 rounded-3xl glass dark:glass border border-slate-200/50 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Gamepad2 className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {t('stats.platformsBreakdown')}
            </h3>
          </div>

          <div className="space-y-4">
            {platforms.length === 0 ? (
              <p className="text-xs text-slate-400">{t('stats.noGamesAdded')}</p>
            ) : (
              platforms.map((p) => {
                const pct = Math.round((p.count / total) * 100);
                return (
                  <div key={p.platform} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span className="capitalize">{p.platform}</span>
                      <span>{t('stats.gamesCountPct', { count: p.count, pct })}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 100% Hall of Fame Showcase */}
      <div className="p-6 rounded-3xl glass dark:glass border border-amber-500/30 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t('stats.hallOfFame')}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black">
                  {hallOfFame.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('stats.hallOfFameSub')}
              </p>
            </div>
          </div>
        </div>

        {hallOfFame.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            {t('stats.noCompletedGames')}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
            {hallOfFame.map((g) => (
              <div
                key={g.id}
                className="group relative rounded-2xl overflow-hidden aspect-[2/3] border-2 border-amber-500/60 shadow-glow-gold bg-slate-900"
              >
                <img
                  src={g.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600'}
                  alt={g.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />
                <div className="absolute top-2 right-2 p-1.5 rounded-xl bg-amber-500 text-slate-950 shadow">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="font-bold text-xs text-white truncate drop-shadow">{g.title}</p>
                  <p className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                    <Trophy className="w-3 h-3" />
                    <span>{t('stats.achsCount', { count: g.unlocked_achievements })}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recently Unlocked Achievements Timeline */}
      <div className="p-6 rounded-3xl glass dark:glass border border-slate-200/50 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-rose-500" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            {t('stats.recentUnlocks')}
          </h3>
        </div>

        {recentAchievements.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            {t('stats.noRecentUnlocks')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentAchievements.map((ach) => {
              const achText = getAchievementText(ach);
              return (
                <div
                  key={ach.id}
                  className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
                    {ach.icon_unlocked ? (
                      <img src={ach.icon_unlocked} alt={achText.title} className="w-full h-full object-cover" />
                    ) : (
                      <Trophy className="w-5 h-5 text-amber-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-grow">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {achText.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {ach.game_title}
                    </p>
                    <span className="text-[10px] text-indigo-500 font-mono">
                      {ach.unlocked_at ? new Date(ach.unlocked_at).toLocaleDateString() : t('stats.recentBadge')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
