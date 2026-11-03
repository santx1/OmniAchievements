export type Platform = 'steam' | 'playstation' | 'xbox' | 'switch' | 'retro' | 'epic' | 'gog' | 'other';

export type GameStatus = 'unplayed' | 'playing' | 'finished' | 'completed_100';

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  theme: 'dark' | 'light' | 'system';
  accent_color: string;
  steam_id: string;
  retro_username?: string;
  retro_api_key?: string;
  hasCustomApiKey?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Game {
  id: string;
  profile_id: string;
  title: string;
  platform: Platform;
  external_id?: string;
  cover_image?: string;
  banner_image?: string;
  hero_image?: string;
  icon_image?: string;
  status: GameStatus;
  is_custom: number;
  playtime_minutes: number;
  total_achievements: number;
  unlocked_achievements: number;
  user_rating?: number;
  notes?: string;
  last_played_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  game_id: string;
  profile_id: string;
  api_name: string;
  display_name: string;
  description: string;
  icon_unlocked: string;
  icon_locked: string;
  is_unlocked: number;
  unlocked_at?: string;
  progress_current?: number;
  progress_max?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BlacklistItem {
  id: string;
  steam_app_id: string;
  title: string;
  reason: string;
  created_at: string;
}

export interface StatsSummary {
  totalGames: number;
  unplayed: number;
  playing: number;
  finished: number;
  completed100: number;
  totalPlaytimeHours: number;
  totalAvailableAchievements: number;
  totalUnlockedAchievements: number;
  completionPercentage: number;
}

export interface PlatformStat {
  platform: Platform;
  count: number;
}

export interface RecentAchievement extends Achievement {
  game_title: string;
  platform: Platform;
  cover_image: string;
}

export interface StatsData {
  summary: StatsSummary;
  platforms: PlatformStat[];
  hallOfFame: Game[];
  recentAchievements: RecentAchievement[];
}
