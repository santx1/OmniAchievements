import { Game, Achievement, Profile, StatsData, BlacklistItem, Platform, GameStatus, CustomPlatform } from '../types/index.js';

const DEFAULT_API_BASE = '/api';

class ApiClient {
  private serverUrl: string = localStorage.getItem('omni_server_url') || '';
  private masterToken: string | null = localStorage.getItem('omni_master_token');
  private profileToken: string | null = localStorage.getItem('omni_profile_token');
  private activeProfileId: string | null = localStorage.getItem('omni_active_profile_id');

  setServerUrl(url: string) {
    this.serverUrl = url.trim().replace(/\/+$/, '');
    if (this.serverUrl) {
      localStorage.setItem('omni_server_url', this.serverUrl);
    } else {
      localStorage.removeItem('omni_server_url');
    }
  }

  getServerUrl(): string {
    return this.serverUrl;
  }

  async testConnection(url?: string): Promise<{ online: boolean; latencyMs: number }> {
    const target = (url || this.serverUrl || '').trim().replace(/\/+$/, '');
    const endpoint = target ? `${target}/api/health` : '/api/health';
    const start = Date.now();
    try {
      const res = await fetch(endpoint, { method: 'GET' });
      const data = await res.json();
      return { online: data?.status === 'healthy', latencyMs: Date.now() - start };
    } catch (e) {
      return { online: false, latencyMs: 0 };
    }
  }

  setMasterToken(token: string | null) {
    this.masterToken = token;
    if (token) {
      localStorage.setItem('omni_master_token', token);
    } else {
      localStorage.removeItem('omni_master_token');
    }
  }

  getMasterToken(): string | null {
    return this.masterToken;
  }

  setProfileToken(token: string | null, profileId: string | null) {
    this.profileToken = token;
    this.activeProfileId = profileId;
    if (token && profileId) {
      localStorage.setItem('omni_profile_token', token);
      localStorage.setItem('omni_active_profile_id', profileId);
    } else {
      localStorage.removeItem('omni_profile_token');
      localStorage.removeItem('omni_active_profile_id');
    }
  }

  getProfileToken(): string | null {
    return this.profileToken;
  }

  getActiveProfileId(): string | null {
    return this.activeProfileId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.masterToken) {
      headers['Authorization'] = `Bearer ${this.masterToken}`;
    }

    if (this.profileToken) {
      headers['X-Profile-Token'] = this.profileToken;
    }

    if (this.activeProfileId) {
      headers['X-Profile-Id'] = this.activeProfileId;
    }

    const base = this.serverUrl ? `${this.serverUrl}/api` : '/api';
    const response = await fetch(`${base}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      const err = await response.json().catch(() => ({}));
      if (err.code === 'MASTER_AUTH_REQUIRED' || err.code === 'TOKEN_EXPIRED') {
        this.setMasterToken(null);
        window.dispatchEvent(new CustomEvent('omni:master_auth_expired'));
      }
      throw new Error(err.error || 'Authentication required');
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  // Auth & Master Password
  async checkAuthStatus(): Promise<{ authenticated: boolean }> {
    return this.request('/auth/status');
  }

  async masterLogin(masterPassword: string): Promise<{ success: boolean; token: string }> {
    const res = await this.request<{ success: boolean; token: string }>('/auth/master-login', {
      method: 'POST',
      body: JSON.stringify({ masterPassword })
    });
    this.setMasterToken(res.token);
    return res;
  }

  async getSettings(): Promise<any> {
    return this.request('/auth/settings');
  }

  async updateSettings(settings: { masterPassword?: string; steamApiKey?: string; steamGridDbApiKey?: string }): Promise<any> {
    return this.request('/auth/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  }

  // Profiles
  async getProfiles(): Promise<{ profiles: Profile[] }> {
    return this.request('/profiles');
  }

  async createProfile(data: { name: string; avatar?: string; pin: string; theme?: string; accent_color?: string; steam_id?: string }): Promise<{ profile: Profile }> {
    return this.request('/profiles', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async verifyProfilePin(id: string, pin: string): Promise<{ success: boolean; profileToken: string; profile: Profile }> {
    const res = await this.request<{ success: boolean; profileToken: string; profile: Profile }>(`/profiles/${id}/verify-pin`, {
      method: 'POST',
      body: JSON.stringify({ pin })
    });
    this.setProfileToken(res.profileToken, res.profile.id);
    return res;
  }

  async updateProfile(id: string, data: Partial<Profile> & { pin?: string; currentPin?: string }): Promise<{ profile: Profile }> {
    return this.request(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteProfile(id: string): Promise<any> {
    return this.request(`/profiles/${id}`, {
      method: 'DELETE'
    });
  }

  // Games
  async getGames(params?: { platform?: string; status?: string; search?: string; sort?: string }): Promise<{ games: Game[] }> {
    const searchParams = new URLSearchParams();
    if (params?.platform) searchParams.append('platform', params.platform);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.sort) searchParams.append('sort', params.sort);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/games${query}`);
  }

  async getGame(id: string): Promise<{ game: Game; achievements: Achievement[] }> {
    return this.request(`/games/${id}`);
  }

  async createGame(data: {
    title: string;
    platform: Platform;
    external_id?: string;
    cover_image?: string;
    banner_image?: string;
    hero_image?: string;
    icon_image?: string;
    status?: GameStatus;
    is_family_shared?: number;
    family_owner?: string;
    playtime_minutes?: number;
    user_rating?: number;
    notes?: string;
    initialAchievements?: Partial<Achievement>[];
  }): Promise<{ game: Game }> {
    return this.request('/games', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateGame(id: string, data: Partial<Game>): Promise<{ game: Game }> {
    return this.request(`/games/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteGame(id: string, blacklist: boolean = false, reason?: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/games/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ blacklist, reason })
    });
  }

  async getBlacklist(): Promise<{ blacklist: BlacklistItem[] }> {
    return this.request('/games/blacklist/list');
  }

  async removeFromBlacklist(appId: string): Promise<{ success: boolean }> {
    return this.request(`/games/blacklist/${appId}`, {
      method: 'DELETE'
    });
  }

  // Achievements
  async getAchievements(gameId: string): Promise<{ achievements: Achievement[] }> {
    return this.request(`/achievements/game/${gameId}`);
  }

  async createAchievement(gameId: string, data: { display_name: string; description?: string; icon_unlocked?: string; icon_locked?: string; is_unlocked?: boolean }): Promise<{ achievement: Achievement }> {
    return this.request(`/achievements/game/${gameId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async toggleAchievement(id: string, isUnlocked?: boolean): Promise<{ achievement: Achievement }> {
    return this.request(`/achievements/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ is_unlocked: isUnlocked })
    });
  }

  async deleteAchievement(id: string): Promise<any> {
    return this.request(`/achievements/${id}`, {
      method: 'DELETE'
    });
  }

  // Steam Sync & API
  async syncSteam(steamId?: string, apiKey?: string): Promise<{ success: boolean; message: string; stats: any }> {
    return this.request('/steam/sync', {
      method: 'POST',
      body: JSON.stringify({ steamId, apiKey })
    });
  }

  async resolveSteamVanity(vanityUrl: string, apiKey?: string): Promise<{ success: boolean; steamId: string }> {
    return this.request('/steam/resolve-vanity', {
      method: 'POST',
      body: JSON.stringify({ vanityUrl, apiKey })
    });
  }

  async getSteamSchema(appId: string | number, apiKey?: string): Promise<{ success: boolean; appId: string; totalAchievements: number; achievements: any[] }> {
    const query = apiKey ? `?apiKey=${encodeURIComponent(apiKey)}` : '';
    return this.request(`/steam/schema/${appId}${query}`);
  }

  async importSteamAchievementsToGame(gameId: string, steamAppId: string | number, apiKey?: string): Promise<{ success: boolean; message: string; totalAchievements: number }> {
    return this.request('/steam/import-to-game', {
      method: 'POST',
      body: JSON.stringify({ gameId, steamAppId, apiKey })
    });
  }

  // SteamGridDB
  async searchSteamGridDb(query: string): Promise<{ results: any[] }> {
    return this.request(`/steamgriddb/search?query=${encodeURIComponent(query)}`);
  }

  async getSteamGridDbCovers(gameId: number | string): Promise<{ grids: any[] }> {
    return this.request(`/steamgriddb/grids/${gameId}`);
  }

  async getSteamGridDbHeroes(gameId: number | string): Promise<{ heroes: any[] }> {
    return this.request(`/steamgriddb/heroes/${gameId}`);
  }

  async getSteamGridDbIcons(gameId: number | string): Promise<{ icons: any[] }> {
    return this.request(`/steamgriddb/icons/${gameId}`);
  }

  // Statistics
  async getStats(): Promise<StatsData> {
    return this.request('/stats');
  }

  // Decky Pairing
  async pairDecky(profileId: string): Promise<{ success: boolean; token: string }> {
    return this.request('/decky/pair', {
      method: 'POST',
      body: JSON.stringify({
        masterPassword: this.masterToken,
        profileId
      })
    });
  }

  // RetroAchievements
  async searchRetroAchievements(title: string): Promise<{ results: any[] }> {
    return this.request(`/retro/search?title=${encodeURIComponent(title)}`);
  }

  async syncRetroAchievements(gameId: string, retroGameId: number | string): Promise<any> {
    return this.request('/retro/sync', {
      method: 'POST',
      body: JSON.stringify({ gameId, retroGameId })
    });
  }

  // Custom Console / Platform Tags
  async getPlatforms(): Promise<{ platforms: CustomPlatform[] }> {
    return this.request('/platforms');
  }

  async createPlatform(data: { name: string; color: string; id?: string }): Promise<{ platform: CustomPlatform }> {
    return this.request('/platforms', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updatePlatform(id: string, data: Partial<CustomPlatform>): Promise<{ platform: CustomPlatform }> {
    return this.request(`/platforms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deletePlatform(id: string): Promise<{ success: boolean }> {
    return this.request(`/platforms/${id}`, {
      method: 'DELETE'
    });
  }

  // Backups
  async exportBackup(): Promise<any> {
    return this.request('/backup/export');
  }

  async importBackup(data: any): Promise<any> {
    return this.request('/backup/import', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // AI Achievement Generator
  async generateAiAchievements(params: {
    gameTitle: string;
    platform?: string;
    genre?: string;
    count?: number;
    difficulty?: 'casual' | 'balanced' | 'hardcore';
    style?: 'canonical' | 'witty' | 'speedrun' | 'lore';
    apiKey?: string;
  }): Promise<{ pack: any }> {
    return this.request('/ai/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async applyAiAchievements(gameId: string, achievements: any[], replaceExisting: boolean = false): Promise<any> {
    return this.request('/ai/apply', {
      method: 'POST',
      body: JSON.stringify({ gameId, achievements, replaceExisting })
    });
  }

  async exportAiAchievements(gameId: string): Promise<any> {
    return this.request(`/ai/export/${gameId}`);
  }
}

export const api = new ApiClient();
