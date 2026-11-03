import { Router, Response } from 'express';
import db from '../db/database.js';
import { masterAuth } from '../middleware/masterAuth.js';
import { profileAuth, AuthenticatedProfileRequest } from '../middleware/profileAuth.js';

const router = Router();

router.use(masterAuth);
router.use(profileAuth);

/**
 * Get comprehensive statistics for the authenticated profile
 */
router.get('/', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;

  // 1. Total games and status breakdown
  const statusStats = db.prepare(`
    SELECT
      COUNT(*) as totalGames,
      SUM(CASE WHEN status = 'unplayed' THEN 1 ELSE 0 END) as unplayed,
      SUM(CASE WHEN status = 'playing' THEN 1 ELSE 0 END) as playing,
      SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END) as finished,
      SUM(CASE WHEN status = 'completed_100' THEN 1 ELSE 0 END) as completed100,
      SUM(playtime_minutes) as totalPlaytimeMinutes,
      SUM(total_achievements) as totalAvailableAchievements,
      SUM(unlocked_achievements) as totalUnlockedAchievements
    FROM games
    WHERE profile_id = ?
  `).get(profileId) as any;

  // 2. Platform distribution
  const platformStats = db.prepare(`
    SELECT platform, COUNT(*) as count
    FROM games
    WHERE profile_id = ?
    GROUP BY platform
    ORDER BY count DESC
  `).all(profileId);

  // 3. Hall of Fame (100% completed games)
  const hallOfFame = db.prepare(`
    SELECT id, title, platform, cover_image, hero_image, total_achievements, unlocked_achievements, playtime_minutes, updated_at
    FROM games
    WHERE profile_id = ? AND status = 'completed_100'
    ORDER BY updated_at DESC
  `).all(profileId);

  // 4. Recently unlocked achievements
  const recentAchievements = db.prepare(`
    SELECT 
      a.id, a.display_name, a.description, a.icon_unlocked, a.unlocked_at,
      g.id as game_id, g.title as game_title, g.platform, g.cover_image
    FROM achievements a
    JOIN games g ON a.game_id = g.id
    WHERE a.profile_id = ? AND a.is_unlocked = 1 AND a.unlocked_at != ''
    ORDER BY a.unlocked_at DESC
    LIMIT 10
  `).all(profileId);

  // 5. Completion rate calculation
  const totalAvailable = statusStats.totalAvailableAchievements || 0;
  const totalUnlocked = statusStats.totalUnlockedAchievements || 0;
  const completionPercentage = totalAvailable > 0
    ? Math.round((totalUnlocked / totalAvailable) * 100)
    : 0;

  res.json({
    summary: {
      totalGames: statusStats.totalGames || 0,
      unplayed: statusStats.unplayed || 0,
      playing: statusStats.playing || 0,
      finished: statusStats.finished || 0,
      completed100: statusStats.completed100 || 0,
      totalPlaytimeHours: Math.round(((statusStats.totalPlaytimeMinutes || 0) / 60) * 10) / 10,
      totalAvailableAchievements: totalAvailable,
      totalUnlockedAchievements: totalUnlocked,
      completionPercentage
    },
    platforms: platformStats,
    hallOfFame,
    recentAchievements
  });
});

export default router;
