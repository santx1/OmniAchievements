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
      language TEXT DEFAULT 'en',
      steam_id TEXT DEFAULT '',
      steam_api_key TEXT DEFAULT '',
      retro_username TEXT DEFAULT '',
      retro_api_key TEXT DEFAULT '',
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
      display_name_es TEXT DEFAULT '',
      description_es TEXT DEFAULT '',
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
    CREATE TABLE IF NOT EXISTS custom_platforms (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_decky_links_shortcut ON decky_links(steam_shortcut_id);
    CREATE INDEX IF NOT EXISTS idx_custom_platforms_profile ON custom_platforms(profile_id);
  `);

  // Migrations for existing DBs
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN retro_username TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN retro_api_key TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN family_steam_ids TEXT DEFAULT '[]'`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE games ADD COLUMN is_family_shared INTEGER DEFAULT 0`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE games ADD COLUMN family_owner TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN language TEXT DEFAULT 'en'`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE achievements ADD COLUMN display_name_es TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE achievements ADD COLUMN description_es TEXT DEFAULT ''`);
  } catch (e) {}
  // Replace old Unsplash avatars with neutral avatar
  try {
    const defaultAvatarSvg = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' rx='30' fill='%23cbd5e1'/%3E%3Ccircle cx='50' cy='36' r='15' fill='%23475569'/%3E%3Cpath d='M22 84 C22 66 34 58 50 58 C66 58 78 66 78 84 C78 88 74 90 70 90 L30 90 C26 90 22 88 22 84 Z' fill='%23475569'/%3E%3C/svg%3E";
    db.prepare(`UPDATE profiles SET avatar = ? WHERE avatar LIKE '%unsplash.com%'`).run(defaultAvatarSvg);
  } catch (e) {}

  // Create default admin/main profile if none exists
  const profileCount = db.prepare('SELECT COUNT(*) as count FROM profiles').get() as { count: number };
  if (profileCount.count === 0) {
    const defaultPinHash = bcrypt.hashSync('000000', 10);
    const now = new Date().toISOString();
    const defaultAvatarSvg = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' rx='30' fill='%23cbd5e1'/%3E%3Ccircle cx='50' cy='36' r='15' fill='%23475569'/%3E%3Cpath d='M22 84 C22 66 34 58 50 58 C66 58 78 66 78 84 C78 88 74 90 70 90 L30 90 C26 90 22 88 22 84 Z' fill='%23475569'/%3E%3C/svg%3E";
    db.prepare(`
      INSERT INTO profiles (id, name, avatar, pin_hash, theme, accent_color, steam_id, steam_api_key, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'default-profile',
      'Player One',
      defaultAvatarSvg,
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
