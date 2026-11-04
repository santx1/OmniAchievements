import { Router, Response } from 'express';
import db from '../db/database.js';
import { masterAuth } from '../middleware/masterAuth.js';
import { profileAuth, AuthenticatedProfileRequest } from '../middleware/profileAuth.js';

const router = Router();

router.use(masterAuth);
router.use(profileAuth);

/**
 * Pull full snapshot or differential changes for offline sync
 */
router.get('/pull', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const since = req.query.since as string | undefined;

  const profile = db.prepare('SELECT id, name, avatar, theme, accent_color, language, steam_id, family_steam_ids, created_at, updated_at FROM profiles WHERE id = ?').get(profileId);

  let gamesQuery = 'SELECT * FROM games WHERE profile_id = ?';
  let achQuery = 'SELECT * FROM achievements WHERE profile_id = ?';
  let platQuery = 'SELECT * FROM custom_platforms WHERE profile_id = ?';
  let params = [profileId];

  if (since) {
    gamesQuery += ' AND updated_at > ?';
    achQuery += ' AND updated_at > ?';
    platQuery += ' AND updated_at > ?';
    params = [profileId, since];
  }

  const games = db.prepare(gamesQuery).all(...params);
  const achievements = db.prepare(achQuery).all(...params);
  const platforms = db.prepare(platQuery).all(...params);
  const blacklist = db.prepare('SELECT * FROM steam_blacklist WHERE profile_id = ?').all(profileId);

  res.json({
    timestamp: new Date().toISOString(),
    profile,
    games,
    achievements,
    platforms,
    blacklist
  });
});

/**
 * Push offline changes/batch mutations to cloud
 */
router.post('/push', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const { games = [], achievements = [], toggles = [], deletedGameIds = [] } = req.body;

  const now = new Date().toISOString();

  const syncTx = db.transaction(() => {
    // 1. Process achievement toggles from offline
    const updateAchStmt = db.prepare(`
      UPDATE achievements 
      SET is_unlocked = ?, unlocked_at = ?, updated_at = ?
      WHERE id = ? AND profile_id = ?
    `);

    for (const toggle of toggles) {
      updateAchStmt.run(
        toggle.is_unlocked ? 1 : 0,
        toggle.is_unlocked ? (toggle.unlocked_at || now) : null,
        now,
        toggle.id,
        profileId
      );

      // Re-calculate game counters
      const ach = db.prepare('SELECT game_id FROM achievements WHERE id = ?').get(toggle.id) as any;
      if (ach) {
        const counts = db.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_unlocked = 1 THEN 1 ELSE 0 END) as unlocked
          FROM achievements
          WHERE game_id = ?
        `).get(ach.game_id) as any;

        const total = counts?.total || 0;
        const unlocked = counts?.unlocked || 0;
        const autoStatus = (total > 0 && unlocked === total) ? 'completed_100' : undefined;

        if (autoStatus) {
          db.prepare('UPDATE games SET total_achievements = ?, unlocked_achievements = ?, status = ?, updated_at = ? WHERE id = ?')
            .run(total, unlocked, autoStatus, now, ach.game_id);
        } else {
          db.prepare('UPDATE games SET total_achievements = ?, unlocked_achievements = ?, updated_at = ? WHERE id = ?')
            .run(total, unlocked, now, ach.game_id);
        }
      }
    }

    // 2. Upsert games
    const upsertGameStmt = db.prepare(`
      INSERT INTO games (
        id, profile_id, title, platform, external_id, cover_image, banner_image,
        hero_image, icon_image, status, is_custom, is_family_shared, family_owner,
        playtime_minutes, total_achievements, unlocked_achievements, user_rating,
        notes, last_played_at, created_at, updated_at
      ) VALUES (
        @id, @profile_id, @title, @platform, @external_id, @cover_image, @banner_image,
        @hero_image, @icon_image, @status, @is_custom, @is_family_shared, @family_owner,
        @playtime_minutes, @total_achievements, @unlocked_achievements, @user_rating,
        @notes, @last_played_at, @created_at, @updated_at
      )
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        platform = excluded.platform,
        cover_image = excluded.cover_image,
        hero_image = excluded.hero_image,
        status = excluded.status,
        playtime_minutes = excluded.playtime_minutes,
        user_rating = excluded.user_rating,
        notes = excluded.notes,
        last_played_at = excluded.last_played_at,
        updated_at = excluded.updated_at
      WHERE updated_at < excluded.updated_at
    `);

    for (const g of games) {
      upsertGameStmt.run({
        id: g.id,
        profile_id: profileId,
        title: g.title,
        platform: g.platform,
        external_id: g.external_id || '',
        cover_image: g.cover_image || '',
        banner_image: g.banner_image || '',
        hero_image: g.hero_image || '',
        icon_image: g.icon_image || '',
        status: g.status || 'unplayed',
        is_custom: g.is_custom ? 1 : 0,
        is_family_shared: g.is_family_shared ? 1 : 0,
        family_owner: g.family_owner || null,
        playtime_minutes: g.playtime_minutes || 0,
        total_achievements: g.total_achievements || 0,
        unlocked_achievements: g.unlocked_achievements || 0,
        user_rating: g.user_rating || 0,
        notes: g.notes || '',
        last_played_at: g.last_played_at || '',
        created_at: g.created_at || now,
        updated_at: g.updated_at || now
      });
    }

    // 3. Delete games
    if (deletedGameIds.length > 0) {
      const delStmt = db.prepare('DELETE FROM games WHERE id = ? AND profile_id = ?');
      for (const id of deletedGameIds) {
        delStmt.run(id, profileId);
      }
    }
  });

  try {
    syncTx();
    res.json({
      success: true,
      syncedAt: now,
      message: 'Cloud sync push applied successfully'
    });
  } catch (err: any) {
    res.status(500).json({ error: `Sync push failed: ${err.message}` });
  }
});

export default router;
