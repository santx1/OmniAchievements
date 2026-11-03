import { Router, Response } from 'express';
import crypto from 'crypto';
import db from '../db/database.js';
import { masterAuth } from '../middleware/masterAuth.js';
import { profileAuth, AuthenticatedProfileRequest } from '../middleware/profileAuth.js';

const router = Router();

router.use(masterAuth);
router.use(profileAuth);

/**
 * List games for the authenticated profile
 */
router.get('/', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const { platform, status, search, sort } = req.query;

  let query = `
    SELECT 
      id, profile_id, title, platform, external_id, cover_image, banner_image,
      hero_image, icon_image, status, is_custom, playtime_minutes,
      total_achievements, unlocked_achievements, user_rating, notes,
      last_played_at, created_at, updated_at
    FROM games
    WHERE profile_id = ?
  `;
  const params: any[] = [profileId];

  if (platform && typeof platform === 'string' && platform !== 'all') {
    query += ' AND platform = ?';
    params.push(platform);
  }

  if (status && typeof status === 'string' && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search && typeof search === 'string' && search.trim()) {
    query += ' AND title LIKE ?';
    params.push(`%${search.trim()}%`);
  }

  // Sorting
  switch (sort) {
    case 'title_asc':
      query += ' ORDER BY title COLLATE NOCASE ASC';
      break;
    case 'title_desc':
      query += ' ORDER BY title COLLATE NOCASE DESC';
      break;
    case 'playtime_desc':
      query += ' ORDER BY playtime_minutes DESC';
      break;
    case 'completion_desc':
      query += ' ORDER BY (CASE WHEN total_achievements > 0 THEN (CAST(unlocked_achievements AS REAL) / total_achievements) ELSE 0 END) DESC, unlocked_achievements DESC';
      break;
    case 'last_played':
      query += ' ORDER BY last_played_at DESC, updated_at DESC';
      break;
    default:
      query += ' ORDER BY updated_at DESC';
  }

  const games = db.prepare(query).all(...params);
  res.json({ games });
});

/**
 * Get single game details
 */
router.get('/:id', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const { id } = req.params;

  const game = db.prepare('SELECT * FROM games WHERE id = ? AND profile_id = ?').get(id, profileId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  const achievements = db.prepare(`
    SELECT * FROM achievements
    WHERE game_id = ? AND profile_id = ?
    ORDER BY is_unlocked DESC, unlocked_at DESC, display_name ASC
  `).all(id, profileId);

  res.json({ game, achievements });
});

/**
 * Manually add a game (PlayStation, Xbox, Switch, Retro, Steam, Epic, GOG, etc.)
 */
router.post('/', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const {
    title,
    platform,
    external_id,
    cover_image,
    banner_image,
    hero_image,
    icon_image,
    status,
    playtime_minutes,
    user_rating,
    notes,
    initialAchievements
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Game title is required' });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const validStatus = ['unplayed', 'playing', 'finished', 'completed_100'].includes(status) ? status : 'unplayed';

  db.prepare(`
    INSERT INTO games (
      id, profile_id, title, platform, external_id, cover_image, banner_image, hero_image, icon_image,
      status, is_custom, playtime_minutes, total_achievements, unlocked_achievements, user_rating, notes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 0, 0, ?, ?, ?, ?)
  `).run(
    id,
    profileId,
    title.trim(),
    platform || 'other',
    external_id || '',
    cover_image || '',
    banner_image || '',
    hero_image || '',
    icon_image || '',
    validStatus,
    playtime_minutes || 0,
    user_rating || 0,
    notes || '',
    now,
    now
  );

  // If initial achievements were provided (e.g. copied from Steam or custom list)
  let totalAchs = 0;
  let unlockedAchs = 0;

  if (Array.isArray(initialAchievements) && initialAchievements.length > 0) {
    const insertAch = db.prepare(`
      INSERT INTO achievements (
        id, game_id, profile_id, api_name, display_name, description,
        icon_unlocked, icon_locked, is_unlocked, unlocked_at,
        progress_current, progress_max, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const ach of initialAchievements) {
      const achId = crypto.randomUUID();
      const isUnlocked = ach.is_unlocked ? 1 : 0;
      if (isUnlocked) unlockedAchs++;
      totalAchs++;

      insertAch.run(
        achId,
        id,
        profileId,
        ach.api_name || `ach_${Date.now()}_${Math.random()}`,
        ach.display_name || 'Achievement',
        ach.description || '',
        ach.icon_unlocked || '',
        ach.icon_locked || '',
        isUnlocked,
        isUnlocked ? (ach.unlocked_at || now) : '',
        ach.progress_current || 0,
        ach.progress_max || 100,
        now,
        now
      );
    }

    // Auto-update status if 100% completed
    let finalStatus = validStatus;
    if (totalAchs > 0 && unlockedAchs === totalAchs) {
      finalStatus = 'completed_100';
    }

    db.prepare(`
      UPDATE games SET
        total_achievements = ?,
        unlocked_achievements = ?,
        status = ?
      WHERE id = ?
    `).run(totalAchs, unlockedAchs, finalStatus, id);
  }

  const createdGame = db.prepare('SELECT * FROM games WHERE id = ?').get(id);
  res.status(201).json({ game: createdGame });
});

/**
 * Update game details / status
 */
router.put('/:id', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const { id } = req.params;
  const {
    title,
    platform,
    external_id,
    cover_image,
    banner_image,
    hero_image,
    icon_image,
    status,
    playtime_minutes,
    user_rating,
    notes
  } = req.body;

  const game = db.prepare('SELECT * FROM games WHERE id = ? AND profile_id = ?').get(id, profileId) as any;
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  const now = new Date().toISOString();

  // If status is passed, validate it
  const validStatus = status && ['unplayed', 'playing', 'finished', 'completed_100'].includes(status)
    ? status
    : game.status;

  db.prepare(`
    UPDATE games SET
      title = COALESCE(?, title),
      platform = COALESCE(?, platform),
      external_id = COALESCE(?, external_id),
      cover_image = COALESCE(?, cover_image),
      banner_image = COALESCE(?, banner_image),
      hero_image = COALESCE(?, hero_image),
      icon_image = COALESCE(?, icon_image),
      status = ?,
      playtime_minutes = COALESCE(?, playtime_minutes),
      user_rating = COALESCE(?, user_rating),
      notes = COALESCE(?, notes),
      updated_at = ?
    WHERE id = ? AND profile_id = ?
  `).run(
    title,
    platform,
    external_id,
    cover_image,
    banner_image,
    hero_image,
    icon_image,
    validStatus,
    playtime_minutes,
    user_rating,
    notes,
    now,
    id,
    profileId
  );

  const updatedGame = db.prepare('SELECT * FROM games WHERE id = ?').get(id);
  res.json({ game: updatedGame });
});

/**
 * Delete game with optional blacklist for Steam games
 * "A manual delete button, so I can remove the Steam free bloat games and it saves them for future synchronizations not to be added again."
 */
router.delete('/:id', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const { id } = req.params;
  const { blacklist, reason } = req.body || {};

  const game = db.prepare('SELECT * FROM games WHERE id = ? AND profile_id = ?').get(id, profileId) as any;
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  // If game is a Steam game and blacklist requested (or blacklist is true by default for Steam games when requested)
  if (blacklist && game.platform === 'steam' && game.external_id) {
    const blacklistId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO steam_blacklist (id, profile_id, steam_app_id, title, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(profile_id, steam_app_id) DO UPDATE SET
        title = excluded.title,
        reason = excluded.reason
    `).run(
      blacklistId,
      profileId,
      game.external_id,
      game.title,
      reason || 'User deleted game and blacklisted from future syncs',
      now
    );
  }

  // Delete game (achievements will cascade delete)
  db.prepare('DELETE FROM games WHERE id = ? AND profile_id = ?').run(id, profileId);

  res.json({
    success: true,
    message: blacklist && game.platform === 'steam'
      ? `Game deleted and blacklisted from future Steam syncs.`
      : 'Game deleted successfully.'
  });
});

/**
 * List blacklisted games for profile
 */
router.get('/blacklist/list', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const blacklist = db.prepare(`
    SELECT id, steam_app_id, title, reason, created_at
    FROM steam_blacklist
    WHERE profile_id = ?
    ORDER BY created_at DESC
  `).all(profileId);

  res.json({ blacklist });
});

/**
 * Remove game from blacklist (allowing it to be synced again)
 */
router.delete('/blacklist/:appId', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const { appId } = req.params;

  db.prepare(`
    DELETE FROM steam_blacklist
    WHERE profile_id = ? AND (steam_app_id = ? OR id = ?)
  `).run(profileId, appId, appId);

  res.json({ success: true, message: 'Game removed from blacklist. It will sync again next time.' });
});

export default router;
