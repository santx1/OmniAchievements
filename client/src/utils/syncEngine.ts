import React from 'react';
import { offlineStore, QueuedMutation } from './offlineStore.js';
import { api } from '../api/client.js';

export type SyncState = 'synced' | 'syncing' | 'pending' | 'offline' | 'error';

export interface SyncEngineStatus {
  isOnline: boolean;
  syncState: SyncState;
  pendingCount: number;
  lastSyncTime: string | null;
  errorMessage: string | null;
}

type SyncListener = (status: SyncEngineStatus) => void;

class SyncEngine {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncState: SyncState = 'synced';
  private pendingCount: number = 0;
  private lastSyncTime: string | null = null;
  private errorMessage: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private isSyncing: boolean = false;
  private heartbeatTimer: any = null;

  constructor() {
    this.init();
  }

  private async init() {
    if (typeof window === 'undefined') return;

    // Load initial metadata
    const activeProfileId = api.getActiveProfileId();
    if (activeProfileId) {
      this.lastSyncTime = await offlineStore.getMeta(`last_sync_${activeProfileId}`);
      this.pendingCount = await offlineStore.getPendingCount(activeProfileId);
    }

    if (!this.isOnline) {
      this.syncState = 'offline';
    } else if (this.pendingCount > 0) {
      this.syncState = 'pending';
    } else {
      this.syncState = 'synced';
    }

    this.notify();

    // Event listeners
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notify();
      this.syncWithCloud();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.syncState = 'offline';
      this.notify();
    });

    // Sync on app visibility change (when user returns to app)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isOnline) {
        this.syncWithCloud();
      }
    });

    // Periodic heartbeat sync every 45s
    this.heartbeatTimer = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncWithCloud(true);
      }
    }, 45 * 1000);
  }

  getStatus(): SyncEngineStatus {
    return {
      isOnline: this.isOnline,
      syncState: this.syncState,
      pendingCount: this.pendingCount,
      lastSyncTime: this.lastSyncTime,
      errorMessage: this.errorMessage
    };
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((fn) => fn(status));
  }

  setOnlineStatus(online: boolean) {
    this.isOnline = online;
    if (!online) {
      this.syncState = 'offline';
    } else if (this.pendingCount > 0) {
      this.syncState = 'pending';
    } else {
      this.syncState = 'synced';
    }
    this.notify();
  }

  async updatePendingCount(profileId?: string) {
    const pId = profileId || api.getActiveProfileId();
    if (pId) {
      this.pendingCount = await offlineStore.getPendingCount(pId);
      if (this.isOnline) {
        this.syncState = this.pendingCount > 0 ? 'pending' : 'synced';
      }
      this.notify();
    }
  }

  /**
   * Main synchronization routine:
   * 1. Replays queued offline mutations to cloud server.
   * 2. Pulls fresh cloud snapshot into IndexedDB.
   */
  async syncWithCloud(isSilentHeartbeat: boolean = false): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) {
      return { success: false, message: 'Sync already in progress' };
    }

    const activeProfileId = api.getActiveProfileId();
    if (!activeProfileId || !api.getMasterToken()) {
      return { success: false, message: 'User not authenticated' };
    }

    // Ping server connection first
    const conn = await api.testConnection();
    if (!conn.online) {
      this.isOnline = false;
      this.syncState = 'offline';
      this.notify();
      return { success: false, message: 'Server is currently unreachable (offline mode)' };
    }

    this.isOnline = true;
    this.isSyncing = true;
    this.syncState = 'syncing';
    this.errorMessage = null;
    this.notify();

    try {
      // Step 1: Drain pending offline mutations
      const mutations = await offlineStore.getPendingMutations(activeProfileId);
      let flushedCount = 0;

      for (const m of mutations) {
        try {
          await this.executeMutationOnServer(m);
          await offlineStore.removeMutation(m.id);
          flushedCount++;
        } catch (mErr: any) {
          console.warn('[SyncEngine] Failed to replay mutation', m, mErr);
          // If server error 4xx (client error), discard to avoid clogging queue
          if (mErr.status && mErr.status >= 400 && mErr.status < 500) {
            await offlineStore.removeMutation(m.id);
          } else {
            // Network connection dropped mid-sync
            throw mErr;
          }
        }
      }

      // Step 2: Pull latest authoritative cloud data
      const pullRes = await api.pullSyncSnapshot();
      if (pullRes && pullRes.games) {
        await offlineStore.cacheGames(activeProfileId, pullRes.games);
        if (pullRes.achievements) {
          // Group achievements by game_id
          const achByGame: Record<string, any[]> = {};
          for (const ach of pullRes.achievements) {
            if (!achByGame[ach.game_id]) achByGame[ach.game_id] = [];
            achByGame[ach.game_id].push(ach);
          }
          for (const [gId, achs] of Object.entries(achByGame)) {
            await offlineStore.cacheAchievements(gId, achs);
          }
        }
        if (pullRes.platforms) {
          await offlineStore.cachePlatforms(pullRes.platforms);
        }
        if (pullRes.profile) {
          await offlineStore.cacheProfiles([pullRes.profile]);
        }
      }

      // Step 3: Complete sync
      const nowIso = new Date().toISOString();
      this.lastSyncTime = nowIso;
      await offlineStore.setMeta(`last_sync_${activeProfileId}`, nowIso);

      this.pendingCount = await offlineStore.getPendingCount(activeProfileId);
      this.syncState = this.pendingCount > 0 ? 'pending' : 'synced';
      this.isSyncing = false;
      this.notify();

      // Dispatch event for UI views to refresh
      window.dispatchEvent(new CustomEvent('omni:sync_completed', {
        detail: { flushedCount, timestamp: nowIso }
      }));

      return {
        success: true,
        message: `Synced with cloud successfully! (${flushedCount} pending changes uploaded)`
      };
    } catch (err: any) {
      console.warn('[SyncEngine] Sync failed:', err);
      this.isSyncing = false;
      this.errorMessage = err.message || 'Synchronization failed';
      this.pendingCount = await offlineStore.getPendingCount(activeProfileId);
      this.syncState = this.isOnline ? (this.pendingCount > 0 ? 'pending' : 'error') : 'offline';
      this.notify();
      return { success: false, message: err.message || 'Sync failed' };
    }
  }

  private async executeMutationOnServer(m: QueuedMutation): Promise<any> {
    const base = api.getServerUrl() ? `${api.getServerUrl()}/api` : '/api';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (api.getMasterToken()) {
      headers['Authorization'] = `Bearer ${api.getMasterToken()}`;
    }
    if (api.getProfileToken()) {
      headers['X-Profile-Token'] = api.getProfileToken()!;
    }
    if (m.profileId) {
      headers['X-Profile-Id'] = m.profileId;
    }

    const res = await fetch(`${base}${m.endpoint}`, {
      method: m.method,
      headers,
      body: m.body ? JSON.stringify(m.body) : undefined
    });

    if (!res.ok) {
      const error: any = new Error(`Server returned ${res.status}`);
      error.status = res.status;
      throw error;
    }

    return res.json().catch(() => ({}));
  }
}

export const syncEngine = new SyncEngine();

/**
 * React Hook to subscribe to cloud sync status
 */
export function useSyncStatus(): SyncEngineStatus & { triggerSync: () => Promise<any> } {
  const [status, setStatus] = React.useState<SyncEngineStatus>(syncEngine.getStatus());

  React.useEffect(() => {
    return syncEngine.subscribe((newStatus) => {
      setStatus(newStatus);
    });
  }, []);

  const triggerSync = React.useCallback(async () => {
    return syncEngine.syncWithCloud();
  }, []);

  return { ...status, triggerSync };
}
