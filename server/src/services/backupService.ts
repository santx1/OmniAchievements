import fs from 'fs';
import path from 'path';
import db from '../db/database.js';
import { config } from '../config/index.js';

export class BackupService {
  private static BACKUP_DIR = path.join(config.dataDir, 'backups');

  static initBackupSystem() {
    if (!fs.existsSync(this.BACKUP_DIR)) {
      fs.mkdirSync(this.BACKUP_DIR, { recursive: true });
    }

    // Run snapshot once on boot and schedule every 24 hours
    this.createDatabaseSnapshot();
    setInterval(() => {
      this.createDatabaseSnapshot();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Create an automated SQLite database snapshot
   */
  static createDatabaseSnapshot() {
    try {
      if (!fs.existsSync(this.BACKUP_DIR)) {
        fs.mkdirSync(this.BACKUP_DIR, { recursive: true });
      }

      const today = new Date().toISOString().split('T')[0];
      const backupFile = path.join(this.BACKUP_DIR, `omniachievements-${today}.sqlite`);

      // SQLite online backup API through better-sqlite3
      db.backup(backupFile)
        .then(() => {
          console.log(`[BackupService] Daily SQLite snapshot saved: ${backupFile}`);
          this.cleanOldBackups(30);
        })
        .catch((err) => {
          console.warn('[BackupService] Backup failed:', err.message);
        });
    } catch (err: any) {
      console.warn('[BackupService] Error initiating backup:', err.message);
    }
  }

  /**
   * Delete backups older than maxDays
   */
  private static cleanOldBackups(maxDays: number) {
    try {
      const files = fs.readdirSync(this.BACKUP_DIR);
      const now = Date.now();
      const maxAgeMs = maxDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        if (file.endsWith('.sqlite')) {
          const filePath = path.join(this.BACKUP_DIR, file);
          const stats = fs.statSync(filePath);
          if (now - stats.mtimeMs > maxAgeMs) {
            fs.unlinkSync(filePath);
            console.log(`[BackupService] Removed old backup: ${file}`);
          }
        }
      }
    } catch (err) {
      // ignore
    }
  }

  /**
   * Export all user data to portable JSON format
   */
  static exportFullBackup() {
    const profiles = db.prepare('SELECT id, name, avatar, theme, accent_color, steam_id, created_at, updated_at FROM profiles').all();
    const games = db.prepare('SELECT * FROM games').all();
    const achievements = db.prepare('SELECT * FROM achievements').all();
    const blacklist = db.prepare('SELECT * FROM steam_blacklist').all();
    const deckyLinks = db.prepare('SELECT * FROM decky_links').all();

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      profiles,
      games,
      achievements,
      blacklist,
      deckyLinks
    };
  }

  /**
   * Restore full backup from JSON
   */
  static importFullBackup(data: any) {
    if (!data || !Array.isArray(data.profiles) || !Array.isArray(data.games)) {
      throw new Error('Invalid backup file format');
    }

    const tx = db.transaction(() => {
      // Upsert profiles
      const upsertProfile = db.prepare(`
        INSERT INTO profiles (id, name, avatar, pin_hash, theme, accent_color, steam_id, created_at, updated_at)
        VALUES (@id, @name, @avatar, COALESCE(@pin_hash, ''), @theme, @accent_color, @steam_id, @created_at, @updated_at)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          avatar = excluded.avatar,
          theme = excluded.theme,
          accent_color = excluded.accent_color,
          steam_id = excluded.steam_id,
          updated_at = excluded.updated_at
      `);

      for (const p of data.profiles) {
        upsertProfile.run({
          ...p,
          pin_hash: p.pin_hash || ''
        });
      }

      // Upsert games
      const upsertGame = db.prepare(`
        INSERT INTO games (
          id, profile_id, title, platform, external_id, cover_image, banner_image, hero_image, icon_image,
          status, is_custom, playtime_minutes, total_achievements, unlocked_achievements, user_rating, notes,
          last_played_at, created_at, updated_at
        ) VALUES (
          @id, @profile_id, @title, @platform, @external_id, @cover_image, @banner_image, @hero_image, @icon_image,
          @status, @is_custom, @playtime_minutes, @total_achievements, @unlocked_achievements, @user_rating, @notes,
          @last_played_at, @created_at, @updated_at
        ) ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          status = excluded.status,
          playtime_minutes = excluded.playtime_minutes,
          total_achievements = excluded.total_achievements,
          unlocked_achievements = excluded.unlocked_achievements,
          updated_at = excluded.updated_at
      `);

      for (const g of data.games) {
        upsertGame.run(g);
      }

      // Upsert achievements
      if (Array.isArray(data.achievements)) {
        const upsertAch = db.prepare(`
          INSERT INTO achievements (
            id, game_id, profile_id, api_name, display_name, description,
            icon_unlocked, icon_locked, is_unlocked, unlocked_at,
            progress_current, progress_max, created_at, updated_at
          ) VALUES (
            @id, @game_id, @profile_id, @api_name, @display_name, @description,
            @icon_unlocked, @icon_locked, @is_unlocked, @unlocked_at,
            @progress_current, @progress_max, @created_at, @updated_at
          ) ON CONFLICT(id) DO UPDATE SET
            display_name = excluded.display_name,
            description = excluded.description,
            is_unlocked = excluded.is_unlocked,
            unlocked_at = excluded.unlocked_at,
            updated_at = excluded.updated_at
        `);

        for (const a of data.achievements) {
          upsertAch.run(a);
        }
      }
    });

    tx();
    return { success: true };
  }
}
