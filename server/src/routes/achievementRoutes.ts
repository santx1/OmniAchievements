import { Router, Response } from 'express';
import crypto from 'crypto';
import db from '../db/database.js';
import { masterAuth } from '../middleware/masterAuth.js';
import { profileAuth, AuthenticatedProfileRequest } from '../middleware/profileAuth.js';

const router = Router();

router.use(masterAuth);
router.use(profileAuth);

/**
 * Recalculate game achievement counts and 100% completion status
 */
function updateGameAchievementStats(gameId: string, profileId: string) {
  const counts = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_unlocked = 1 THEN 1 ELSE 0 END) as unlocked
    FROM achievements
    WHERE game_id = ? AND profile_id = ?
  `).get(gameId, profileId) as { total: number; unlocked: number };

  const total = counts.total || 0;
  const unlocked = counts.unlocked || 0;

  const game = db.prepare('SELECT status, platform FROM games WHERE id = ?').get(gameId) as any;
  let newStatus = game?.status || 'unplayed';

  // Automatic 100% classification rule:
  if (total > 0 && unlocked === total) {
    newStatus = 'completed_100';
  } else if (game?.status === 'completed_100' && unlocked < total) {
    // If was 100% but user locked an achievement, revert to playing
    newStatus = 'playing';
  }

  db.prepare(`
    UPDATE games SET
      total_achievements = ?,
      unlocked_achievements = ?,
      status = ?,
      updated_at = ?
    WHERE id = ?
  `).run(total, unlocked, newStatus, new Date().toISOString(), gameId);
}

/**
 * List achievements for a game
 */
router.get('/game/:gameId', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const gameId = String(req.params.gameId);

  const achievements = db.prepare(`
    SELECT * FROM achievements
    WHERE game_id = ? AND profile_id = ?
    ORDER BY is_unlocked DESC, unlocked_at DESC, display_name ASC
  `).all(gameId, profileId);

  res.json({ achievements });
});

/**
 * Manually create an achievement for a game
 */
router.post('/game/:gameId', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const gameId = String(req.params.gameId);
  const { display_name, description, icon_unlocked, icon_locked, is_unlocked } = req.body;

  if (!display_name || !display_name.trim()) {
    return res.status(400).json({ error: 'Achievement name is required' });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const unlocked = is_unlocked ? 1 : 0;

  db.prepare(`
    INSERT INTO achievements (
      id, game_id, profile_id, api_name, display_name, description,
      icon_unlocked, icon_locked, is_unlocked, unlocked_at,
      progress_current, progress_max, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 100, ?, ?)
  `).run(
    id,
    gameId,
    profileId,
    `custom_${Date.now()}`,
    display_name.trim(),
    description || '',
    icon_unlocked || '',
    icon_locked || icon_unlocked || '',
    unlocked,
    unlocked ? now : '',
    unlocked ? 100 : 0,
    now,
    now
  );

  updateGameAchievementStats(gameId, profileId);

  const created = db.prepare('SELECT * FROM achievements WHERE id = ?').get(id);
  res.status(201).json({ achievement: created });
});

/**
 * Toggle achievement unlock state
 */
router.patch('/:id/toggle', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const { id } = req.params;
  const { is_unlocked } = req.body;

  const achievement = db.prepare('SELECT * FROM achievements WHERE id = ? AND profile_id = ?').get(id, profileId) as any;
  if (!achievement) {
    return res.status(404).json({ error: 'Achievement not found' });
  }

  const nextUnlocked = is_unlocked !== undefined ? (is_unlocked ? 1 : 0) : (achievement.is_unlocked ? 0 : 1);
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
    id,
    profileId
  );

  updateGameAchievementStats(achievement.game_id, profileId);

  const updated = db.prepare('SELECT * FROM achievements WHERE id = ?').get(id);
  res.json({ achievement: updated });
});

/**
 * Delete achievement
 */
router.delete('/:id', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const { id } = req.params;

  const achievement = db.prepare('SELECT game_id FROM achievements WHERE id = ? AND profile_id = ?').get(id, profileId) as any;
  if (!achievement) {
    return res.status(404).json({ error: 'Achievement not found' });
  }

  db.prepare('DELETE FROM achievements WHERE id = ? AND profile_id = ?').run(id, profileId);
  updateGameAchievementStats(achievement.game_id, profileId);

  res.json({ success: true, message: 'Achievement deleted' });
});

export default router;
