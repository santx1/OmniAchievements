import axios from 'axios';
import db from '../db/database.js';
import crypto from 'crypto';

export class RetroAchievementsService {
  private static BASE_URL = 'https://retroachievements.org/API';

  /**
   * Search for games on RetroAchievements by title
   */
  static async searchGames(title: string, username: string, apiKey: string): Promise<any[]> {
    if (!username || !apiKey) {
      throw new Error('RetroAchievements username and API key are required.');
    }

    try {
      // API_GetGameList.php?z={username}&y={apiKey}&i={consoleId} or title search
      // RetroAchievements search endpoint
      const res = await axios.get('https://retroachievements.org/dorequest.php', {
        params: {
          r: 'gamefind',
          g: title
        },
        timeout: 10000
      });

      if (Array.isArray(res.data)) {
        return res.data.map((g: any) => ({
          id: g.ID,
          title: g.Title,
          console: g.ConsoleName,
          icon: g.ImageIcon ? `https://media.retroachievements.org${g.ImageIcon}` : ''
        }));
      }
      return [];
    } catch (err: any) {
      console.warn('[RetroAchievements] Search error:', err.message);
      return [];
    }
  }

  /**
   * Fetch game info, achievements schema, and player unlock progress
   */
  static async getGameProgress(gameId: number | string, username: string, apiKey: string) {
    if (!username || !apiKey) {
      throw new Error('RetroAchievements username and Web API key are required.');
    }

    const res = await axios.get(`${this.BASE_URL}/API_GetGameInfoAndUserProgress.php`, {
      params: {
        z: username,
        y: apiKey,
        g: gameId,
        u: username
      },
      timeout: 12000
    });

    return res.data;
  }

  /**
   * Import or sync achievements from RetroAchievements for a game
   */
  static async syncGameAchievements(profileId: string, gameId: string, raGameId: number | string, username: string, apiKey: string) {
    const data = await this.getGameProgress(raGameId, username, apiKey);
    if (!data || !data.Achievements) {
      throw new Error('No achievements found for this RetroAchievements game ID.');
    }

    const achs = Object.values(data.Achievements) as any[];
    const now = new Date().toISOString();

    const insertOrUpdateAch = db.prepare(`
      INSERT INTO achievements (
        id, game_id, profile_id, api_name, display_name, description,
        icon_unlocked, icon_locked, is_unlocked, unlocked_at,
        progress_current, progress_max, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 100, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        display_name = excluded.display_name,
        description = excluded.description,
        icon_unlocked = excluded.icon_unlocked,
        icon_locked = excluded.icon_locked,
        is_unlocked = excluded.is_unlocked,
        unlocked_at = excluded.unlocked_at,
        updated_at = excluded.updated_at
    `);

    let unlockedCount = 0;

    for (const a of achs) {
      const isUnlocked = a.DateEarned ? 1 : 0;
      if (isUnlocked) unlockedCount++;

      const unlockedAt = a.DateEarned ? new Date(a.DateEarned).toISOString() : '';
      const achId = crypto.createHash('md5').update(`${gameId}:ra_${a.ID}`).digest('hex');

      const iconUnlocked = a.BadgeName ? `https://media.retroachievements.org/Badge/${a.BadgeName}.png` : '';
      const iconLocked = a.BadgeName ? `https://media.retroachievements.org/Badge/${a.BadgeName}_lock.png` : '';

      insertOrUpdateAch.run(
        achId,
        gameId,
        profileId,
        `ra_${a.ID}`,
        a.Title || 'Achievement',
        a.Description || '',
        iconUnlocked,
        iconLocked,
        isUnlocked,
        unlockedAt,
        isUnlocked ? 100 : 0,
        now,
        now
      );
    }

    const totalCount = achs.length;

    // Smart 100% rule: auto-promote to 100% if all unlocked
    const currentGame = db.prepare('SELECT status FROM games WHERE id = ?').get(gameId) as any;
    let status = currentGame?.status || 'unplayed';
    if (totalCount > 0 && unlockedCount === totalCount) {
      status = 'completed_100';
    } else if (unlockedCount > 0 && status === 'unplayed') {
      status = 'playing';
    }

    db.prepare(`
      UPDATE games SET
        total_achievements = ?,
        unlocked_achievements = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?
    `).run(totalCount, unlockedCount, status, now, gameId);

    return { total: totalCount, unlocked: unlockedCount, status };
  }
}
