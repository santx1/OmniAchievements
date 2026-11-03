import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import bcrypt from 'bcryptjs';

const db = new Database(config.dbPath);

// Performance & integrity pragmas
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      theme TEXT DEFAULT 'dark',
      accent_color TEXT DEFAULT '#6366f1',
      steam_id TEXT DEFAULT '',
      steam_api_key TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      title TEXT NOT NULL,
      platform TEXT NOT NULL,
      external_id TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      banner_image TEXT DEFAULT '',
      hero_image TEXT DEFAULT '',
      icon_image TEXT DEFAULT '',
      status TEXT DEFAULT 'unplayed',
      is_custom INTEGER DEFAULT 0,
      playtime_minutes INTEGER DEFAULT 0,
      total_achievements INTEGER DEFAULT 0,
      unlocked_achievements INTEGER DEFAULT 0,
      user_rating REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      last_played_at TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      api_name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon_unlocked TEXT DEFAULT '',
      icon_locked TEXT DEFAULT '',
      is_unlocked INTEGER DEFAULT 0,
      unlocked_at TEXT DEFAULT '',
      progress_current REAL DEFAULT 0,
      progress_max REAL DEFAULT 100,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS steam_blacklist (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      steam_app_id TEXT NOT NULL,
      title TEXT NOT NULL,
      reason TEXT DEFAULT 'User removed free/bloat game',
      created_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
      UNIQUE(profile_id, steam_app_id)
    );

    CREATE TABLE IF NOT EXISTS decky_links (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      steam_shortcut_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      shortcut_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_games_profile ON games(profile_id);
    CREATE INDEX IF NOT EXISTS idx_games_platform ON games(platform);
    CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
    CREATE INDEX IF NOT EXISTS idx_achievements_game ON achievements(game_id);
    CREATE INDEX IF NOT EXISTS idx_achievements_profile ON achievements(profile_id);
    CREATE INDEX IF NOT EXISTS idx_blacklist_profile_app ON steam_blacklist(profile_id, steam_app_id);
    CREATE INDEX IF NOT EXISTS idx_decky_links_shortcut ON decky_links(steam_shortcut_id);
  `);

  // Create default admin/main profile if none exists
  const profileCount = db.prepare('SELECT COUNT(*) as count FROM profiles').get() as { count: number };
  if (profileCount.count === 0) {
    const defaultPinHash = bcrypt.hashSync('000000', 10);
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO profiles (id, name, avatar, pin_hash, theme, accent_color, steam_id, steam_api_key, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'default-profile',
      'Player One',
      'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
      defaultPinHash,
      'dark',
      '#6366f1',
      '',
      '',
      now,
      now
    );
    console.log('Created default profile "Player One" (PIN: 000000)');
  }
}

export default db;
