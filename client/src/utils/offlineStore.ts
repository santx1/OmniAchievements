import { Game, Achievement, Profile, StatsData, CustomPlatform } from '../types/index.js';

export interface QueuedMutation {
  id: string;
  profileId: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  timestamp: number;
  description: string;
  retryCount: number;
}

const DB_NAME = 'omniachievements_offline_db';
const DB_VERSION = 1;

class OfflineStore {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not available in this environment'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Profiles Store
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }

        // Games Store
        if (!db.objectStoreNames.contains('games')) {
          const gameStore = db.createObjectStore('games', { keyPath: 'id' });
          gameStore.createIndex('profile_id', 'profile_id', { unique: false });
          gameStore.createIndex('platform', 'platform', { unique: false });
          gameStore.createIndex('status', 'status', { unique: false });
        }

        // Achievements Store
        if (!db.objectStoreNames.contains('achievements')) {
          const achStore = db.createObjectStore('achievements', { keyPath: 'id' });
          achStore.createIndex('game_id', 'game_id', { unique: false });
          achStore.createIndex('profile_id', 'profile_id', { unique: false });
        }

        // Platforms Store
        if (!db.objectStoreNames.contains('platforms')) {
          const platStore = db.createObjectStore('platforms', { keyPath: 'id' });
          platStore.createIndex('profile_id', 'profile_id', { unique: false });
        }

        // Stats Store
        if (!db.objectStoreNames.contains('stats')) {
          db.createObjectStore('stats', { keyPath: 'profileId' });
        }

        // Sync Queue Store (Mutations to replay to the server on reconnect)
        if (!db.objectStoreNames.contains('sync_queue')) {
          const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          queueStore.createIndex('profileId', 'profileId', { unique: false });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Metadata Store
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // --- Profiles Cache ---
  async cacheProfiles(profiles: Profile[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('profiles', 'readwrite');
      const store = tx.objectStore('profiles');
      for (const p of profiles) {
        store.put(p);
      }
    } catch (e) {
      console.warn('[OfflineStore] Failed to cache profiles', e);
    }
  }

  async getCachedProfiles(): Promise<Profile[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('profiles', 'readonly');
        const req = tx.objectStore('profiles').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }

  // --- Games Cache ---
  async cacheGames(profileId: string, games: Game[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('games', 'readwrite');
      const store = tx.objectStore('games');
      for (const g of games) {
        store.put({ ...g, profile_id: profileId });
      }
    } catch (e) {
      console.warn('[OfflineStore] Failed to cache games', e);
    }
  }

  async getCachedGames(profileId: string, filters?: { platform?: string; status?: string; search?: string; sort?: string }): Promise<Game[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('games', 'readonly');
        const index = tx.objectStore('games').index('profile_id');
        const req = index.getAll(profileId);

        req.onsuccess = () => {
          let games: Game[] = req.result || [];

          if (filters?.platform && filters.platform !== 'all') {
            games = games.filter((g) => g.platform === filters.platform);
          }
          if (filters?.status && filters.status !== 'all') {
            games = games.filter((g) => g.status === filters.status);
          }
          if (filters?.search && filters.search.trim()) {
            const q = filters.search.trim().toLowerCase();
            games = games.filter((g) => g.title.toLowerCase().includes(q));
          }

          // Sort
          switch (filters?.sort) {
            case 'title_asc':
              games.sort((a, b) => a.title.localeCompare(b.title));
              break;
            case 'title_desc':
              games.sort((a, b) => b.title.localeCompare(a.title));
              break;
            case 'playtime_desc':
              games.sort((a, b) => (b.playtime_minutes || 0) - (a.playtime_minutes || 0));
              break;
            case 'completion_desc':
              games.sort((a, b) => {
                const pctA = a.total_achievements ? (a.unlocked_achievements / a.total_achievements) : 0;
                const pctB = b.total_achievements ? (b.unlocked_achievements / b.total_achievements) : 0;
                return pctB - pctA;
              });
              break;
            case 'last_played':
            default:
              games.sort((a, b) => (b.last_played_at || b.created_at || '').localeCompare(a.last_played_at || a.created_at || ''));
              break;
          }

          resolve(games);
        };
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }

  async getCachedGame(gameId: string): Promise<Game | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('games', 'readonly');
        const req = tx.objectStore('games').get(gameId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  async saveCachedGame(game: Game): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('games', 'readwrite');
      tx.objectStore('games').put(game);
    } catch (e) {
      console.warn('[OfflineStore] Failed to save game', e);
    }
  }

  async deleteCachedGame(gameId: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(['games', 'achievements'], 'readwrite');
      tx.objectStore('games').delete(gameId);

      // Delete associated achievements
      const achIndex = tx.objectStore('achievements').index('game_id');
      const req = achIndex.getAll(gameId);
      req.onsuccess = () => {
        const achStore = tx.objectStore('achievements');
        for (const ach of req.result || []) {
          achStore.delete(ach.id);
        }
      };
    } catch (e) {
      console.warn('[OfflineStore] Failed to delete game', e);
    }
  }

  // --- Achievements Cache ---
  async cacheAchievements(gameId: string, achievements: Achievement[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('achievements', 'readwrite');
      const store = tx.objectStore('achievements');
      for (const ach of achievements) {
        store.put({ ...ach, game_id: gameId });
      }
    } catch (e) {
      console.warn('[OfflineStore] Failed to cache achievements', e);
    }
  }

  async getCachedAchievements(gameId: string): Promise<Achievement[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('achievements', 'readonly');
        const index = tx.objectStore('achievements').index('game_id');
        const req = index.getAll(gameId);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }

  async toggleCachedAchievement(achievementId: string, isUnlocked?: boolean): Promise<{ achievement: Achievement; game?: Game } | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(['achievements', 'games'], 'readwrite');
        const achStore = tx.objectStore('achievements');
        const gameStore = tx.objectStore('games');

        const getAchReq = achStore.get(achievementId);
        getAchReq.onsuccess = () => {
          const ach: Achievement = getAchReq.result;
          if (!ach) return resolve(null);

          const nextStatus = isUnlocked !== undefined ? (isUnlocked ? 1 : 0) : (ach.is_unlocked === 1 ? 0 : 1);
          ach.is_unlocked = nextStatus;
          ach.unlocked_at = nextStatus === 1 ? (ach.unlocked_at || new Date().toISOString()) : undefined;
          achStore.put(ach);

          // Update game counter
          const getGameReq = gameStore.get(ach.game_id);
          getGameReq.onsuccess = () => {
            const game: Game = getGameReq.result;
            if (game) {
              const diff = nextStatus === 1 ? 1 : -1;
              game.unlocked_achievements = Math.max(0, Math.min(game.total_achievements, (game.unlocked_achievements || 0) + diff));
              if (game.total_achievements > 0 && game.unlocked_achievements === game.total_achievements) {
                game.status = 'completed_100';
              }
              gameStore.put(game);
              resolve({ achievement: ach, game });
            } else {
              resolve({ achievement: ach });
            }
          };
        };
        getAchReq.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  // --- Platforms Cache ---
  async cachePlatforms(platforms: CustomPlatform[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('platforms', 'readwrite');
      const store = tx.objectStore('platforms');
      for (const p of platforms) {
        store.put(p);
      }
    } catch (e) {}
  }

  async getCachedPlatforms(): Promise<CustomPlatform[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('platforms', 'readonly');
        const req = tx.objectStore('platforms').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }

  // --- Stats Cache ---
  async cacheStats(profileId: string, stats: StatsData): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('stats', 'readwrite');
      tx.objectStore('stats').put({ profileId, ...stats });
    } catch (e) {}
  }

  async getCachedStats(profileId: string): Promise<StatsData | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('stats', 'readonly');
        const req = tx.objectStore('stats').get(profileId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  // --- Sync Mutation Queue ---
  async enqueueMutation(mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount'>): Promise<QueuedMutation> {
    const item: QueuedMutation = {
      ...mutation,
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    try {
      const db = await this.getDB();
      const tx = db.transaction('sync_queue', 'readwrite');
      tx.objectStore('sync_queue').put(item);
    } catch (e) {
      console.warn('[OfflineStore] Failed to enqueue mutation', e);
    }

    return item;
  }

  async getPendingMutations(profileId?: string): Promise<QueuedMutation[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('sync_queue', 'readonly');
        const req = tx.objectStore('sync_queue').getAll();
        req.onsuccess = () => {
          let list: QueuedMutation[] = req.result || [];
          if (profileId) {
            list = list.filter((m) => !m.profileId || m.profileId === profileId);
          }
          list.sort((a, b) => a.timestamp - b.timestamp);
          resolve(list);
        };
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }

  async removeMutation(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('sync_queue', 'readwrite');
      tx.objectStore('sync_queue').delete(id);
    } catch (e) {}
  }

  async getPendingCount(profileId?: string): Promise<number> {
    const list = await this.getPendingMutations(profileId);
    return list.length;
  }

  // --- Metadata (Last Sync, etc.) ---
  async setMeta(key: string, value: any): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('meta', 'readwrite');
      tx.objectStore('meta').put({ key, value });
    } catch (e) {}
  }

  async getMeta(key: string): Promise<any> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('meta', 'readonly');
        const req = tx.objectStore('meta').get(key);
        req.onsuccess = () => resolve(req.result ? req.result.value : null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  // --- Storage Summary ---
  async getStorageSummary(profileId: string): Promise<{
    gamesCount: number;
    achievementsCount: number;
    pendingCount: number;
    lastCloudSync: string | null;
  }> {
    const games = await this.getCachedGames(profileId);
    const pending = await this.getPendingCount(profileId);
    const lastSync = await this.getMeta(`last_sync_${profileId}`);

    let totalAch = 0;
    try {
      const db = await this.getDB();
      totalAch = await new Promise((resolve) => {
        const tx = db.transaction('achievements', 'readonly');
        const req = tx.objectStore('achievements').count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(0);
      });
    } catch (e) {}

    return {
      gamesCount: games.length,
      achievementsCount: totalAch,
      pendingCount: pending,
      lastCloudSync: lastSync || null
    };
  }
}

export const offlineStore = new OfflineStore();
