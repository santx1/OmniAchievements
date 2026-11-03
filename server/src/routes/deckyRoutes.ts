import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db/database.js';
import { config } from '../config/index.js';

const router = Router();

// Middleware to authenticate Decky requests using pairing token or master password
function deckyAuth(req: Request, res: Response, next: any) {
  const token = req.headers['x-decky-token'] as string;
  const masterKey = req.headers['x-master-password'] as string;

  if (masterKey && masterKey === config.masterPassword) {
    // If master key passed, look for X-Profile-Id
    (req as any).profileId = req.headers['x-profile-id'];
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: 'Decky authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    if (decoded.role === 'decky_client' && decoded.profileId) {
      (req as any).profileId = decoded.profileId;
      return next();
    }
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired Decky pairing token' });
  }

  res.status(401).json({ error: 'Unauthorized Decky request' });
}

/**
 * Ping endpoint to test connection from Legion Go
 */
router.get('/ping', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    appName: 'OmniAchievements',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

/**
 * Pair Decky plugin with a profile
 */
router.post('/pair', (req: Request, res: Response) => {
  const { masterPassword, profileId, pin } = req.body;

  if (masterPassword !== config.masterPassword) {
    return res.status(401).json({ error: 'Invalid master password' });
  }

  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId) as any;
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  if (pin && !bcrypt.compareSync(String(pin).trim(), profile.pin_hash)) {
    return res.status(401).json({ error: 'Invalid profile PIN' });
  }

  // Token valid for 1 year for Decky plugin
  const deckyToken = jwt.sign(
    { role: 'decky_client', profileId: profile.id, device: 'Legion Go SteamOS' },
    config.jwtSecret,
    { expiresIn: '365d' }
  );

  res.json({
    success: true,
    token: deckyToken,
    profile: {
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar
    }
  });
});

router.use(deckyAuth);

/**
 * List games for linking in Decky
 */
router.get('/games', (req: Request, res: Response) => {
  const profileId = (req as any).profileId;
  const games = db.prepare(`
    SELECT id, title, platform, cover_image, status, total_achievements, unlocked_achievements
    FROM games
    WHERE profile_id = ?
    ORDER BY title ASC
  `).all(profileId);

  res.json({ games });
});

/**
 * Get linked shortcuts
 */
router.get('/links', (req: Request, res: Response) => {
  const profileId = (req as any).profileId;
  const links = db.prepare(`
    SELECT dl.id, dl.steam_shortcut_id, dl.shortcut_name, dl.created_at,
           g.id as game_id, g.title as game_title, g.cover_image, g.total_achievements, g.unlocked_achievements
    FROM decky_links dl
    JOIN games g ON dl.game_id = g.id
    WHERE dl.profile_id = ?
  `).all(profileId);

  res.json({ links });
});

/**
 * Link a non-Steam shortcut in SteamOS to an OmniAchievements game
 */
router.post('/link', (req: Request, res: Response) => {
  const profileId = (req as any).profileId;
  const { steamShortcutId, gameId, shortcutName } = req.body;

  if (!steamShortcutId || !gameId) {
    return res.status(400).json({ error: 'steamShortcutId and gameId are required' });
  }

  // Remove existing link for this shortcut
  db.prepare('DELETE FROM decky_links WHERE profile_id = ? AND steam_shortcut_id = ?').run(profileId, String(steamShortcutId));

  const linkId = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO decky_links (id, profile_id, steam_shortcut_id, game_id, shortcut_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    linkId,
    profileId,
    String(steamShortcutId),
    gameId,
    shortcutName || 'Non-Steam Game',
    now
  );

  res.json({ success: true, linkId, message: 'Game linked successfully' });
});

/**
 * Unlink a shortcut
 */
router.delete('/link/:linkId', (req: Request, res: Response) => {
  const profileId = (req as any).profileId;
  const { linkId } = req.params;

  db.prepare('DELETE FROM decky_links WHERE profile_id = ? AND (id = ? OR steam_shortcut_id = ?)').run(profileId, linkId, linkId);
  res.json({ success: true });
});

/**
 * Get achievements for currently running shortcut / game in SteamOS
 */
router.get('/achievements/:shortcutId', (req: Request, res: Response) => {
  const profileId = (req as any).profileId;
  const { shortcutId } = req.params;

  // 1. Look for a linked non-Steam game
  let link = db.prepare(`
    SELECT dl.game_id, g.title, g.cover_image, g.total_achievements, g.unlocked_achievements
    FROM decky_links dl
    JOIN games g ON dl.game_id = g.id
    WHERE dl.profile_id = ? AND dl.steam_shortcut_id = ?
  `).get(profileId, String(shortcutId)) as any;

  // 2. If no direct link, check if shortcutId matches external_id (e.g. Steam AppID)
  if (!link) {
    link = db.prepare(`
      SELECT id as game_id, title, cover_image, total_achievements, unlocked_achievements
      FROM games
      WHERE profile_id = ? AND external_id = ?
    `).get(profileId, String(shortcutId)) as any;
  }

  if (!link) {
    return res.status(404).json({
      linked: false,
      message: 'No game linked to this Steam shortcut ID. Use the Decky menu to link it.'
    });
  }

  const achievements = db.prepare(`
    SELECT id, api_name, display_name, description, icon_unlocked, icon_locked, is_unlocked, unlocked_at, progress_current, progress_max
    FROM achievements
    WHERE game_id = ? AND profile_id = ?
    ORDER BY is_unlocked DESC, unlocked_at DESC, display_name ASC
  `).all(link.game_id, profileId);

  res.json({
    linked: true,
    game: {
      id: link.game_id,
      title: link.title,
      cover_image: link.cover_image,
      total_achievements: link.total_achievements,
      unlocked_achievements: link.unlocked_achievements
    },
    achievements
  });
});

/**
 * Toggle achievement unlock from Decky overlay
 */
router.post('/toggle-achievement', (req: Request, res: Response) => {
  const profileId = (req as any).profileId;
  const { achievementId, isUnlocked } = req.body;

  const achievement = db.prepare('SELECT * FROM achievements WHERE id = ? AND profile_id = ?').get(achievementId, profileId) as any;
  if (!achievement) {
    return res.status(404).json({ error: 'Achievement not found' });
  }

  const nextUnlocked = isUnlocked !== undefined ? (isUnlocked ? 1 : 0) : (achievement.is_unlocked ? 0 : 1);
  const now = new Date().toISOString();
  const unlockedAt = nextUnlocked ? (achievement.unlocked_at || now) : '';

  db.prepare(`
    UPDATE achievements SET
      is_unlocked = ?,
      unlocked_at = ?,
      progress_current = ?,
      updated_at = ?
    WHERE id = ? AND profile_id = ?
  `).run(
    nextUnlocked,
    unlockedAt,
    nextUnlocked ? 100 : 0,
    now,
    achievementId,
    profileId
  );

  // Recalculate game stats
  const counts = db.prepare(`
    SELECT COUNT(*) as total, SUM(CASE WHEN is_unlocked = 1 THEN 1 ELSE 0 END) as unlocked
    FROM achievements WHERE game_id = ? AND profile_id = ?
  `).get(achievement.game_id, profileId) as { total: number; unlocked: number };

  const total = counts.total || 0;
  const unlocked = counts.unlocked || 0;
  const status = total > 0 && unlocked === total ? 'completed_100' : 'playing';

  db.prepare(`
    UPDATE games SET total_achievements = ?, unlocked_achievements = ?, status = ?, updated_at = ? WHERE id = ?
  `).run(total, unlocked, status, now, achievement.game_id);

  res.json({
    success: true,
    isUnlocked: nextUnlocked === 1,
    unlockedAt,
    gameStats: { total, unlocked, status }
  });
});

export default router;
