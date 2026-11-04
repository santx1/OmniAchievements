import { Router, Response } from 'express';
import crypto from 'crypto';
import db from '../db/database.js';
import { masterAuth } from '../middleware/masterAuth.js';
import { profileAuth, AuthenticatedProfileRequest } from '../middleware/profileAuth.js';
import { AiAchievementService, GeneratedAchievement, AchievementPack, BadgeSymbol, AchievementTier } from '../services/aiAchievementService.js';

const router = Router();
router.use(masterAuth);
router.use(profileAuth);

/**
 * Generate AI achievements pack
 */
router.post('/generate', async (req: AuthenticatedProfileRequest, res: Response) => {
  const { gameTitle, platform, genre, count, difficulty, style, apiKey } = req.body;

  if (!gameTitle || !gameTitle.trim()) {
    return res.status(400).json({ error: 'gameTitle is required' });
  }

  try {
    const pack = await AiAchievementService.generateAchievements({
      gameTitle: gameTitle.trim(),
      platform: platform?.trim() || 'Universal',
      genre: genre?.trim(),
      count: count ? parseInt(count, 10) : 20,
      difficulty,
      style,
      apiKey: apiKey?.trim() || undefined
    });

    res.json({ pack });
  } catch (err: any) {
    console.error('[AI] Generation failed:', err);
    res.status(500).json({ error: err.message || 'Failed to generate achievements' });
  }
});

/**
 * Apply generated achievements pack directly to a game in the library
 */
router.post('/apply', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const { gameId, achievements, replaceExisting = false } = req.body;

  if (!gameId || !achievements || !Array.isArray(achievements)) {
    return res.status(400).json({ error: 'gameId and achievements array are required' });
  }

  const game = db.prepare('SELECT id, title FROM games WHERE id = ? AND profile_id = ?').get(gameId, profileId) as any;
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  const now = new Date().toISOString();

  // If replacing existing custom achievements
  if (replaceExisting) {
    db.prepare('DELETE FROM achievements WHERE game_id = ? AND profile_id = ?').run(gameId, profileId);
  }

  const insertStmt = db.prepare(`
    INSERT INTO achievements (
      id, game_id, profile_id, api_name, display_name, description,
      icon_unlocked, icon_locked, is_unlocked, progress_current, progress_max,
      created_at, updated_at, display_name_es, description_es
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 100, ?, ?, ?, ?)
  `);

  let addedCount = 0;
  for (const ach of achievements) {
    const achId = crypto.randomUUID();
    const apiName = ach.apiName || `${ach.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`;
    const symbol: BadgeSymbol = ach.iconSymbol || 'trophy';
    const tier: AchievementTier = ach.tier || 'bronze';
    const color = ach.iconColor || '#6366f1';

    // If icon data URIs were not already generated, generate creative vector SVGs
    const iconUnlocked = ach.iconUnlocked || AiAchievementService.generateBadgeSvg(symbol, tier, color, true);
    const iconLocked = ach.iconLocked || AiAchievementService.generateBadgeSvg(symbol, tier, color, false);

    const displayNameEs = ach.displayName_es || ach.localizations?.es?.displayName || '';
    const descriptionEs = ach.description_es || ach.localizations?.es?.description || '';

    try {
      insertStmt.run(
        achId,
        gameId,
        profileId,
        apiName,
        ach.displayName,
        ach.description || '',
        iconUnlocked,
        iconLocked,
        now,
        now,
        displayNameEs,
        descriptionEs
      );
      addedCount++;
    } catch (e: any) {
      console.warn('[AI Apply] Achievement insert warning:', e.message);
    }
  }

  // Update game statistics (total and unlocked achievements)
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_unlocked = 1 THEN 1 ELSE 0 END) as unlocked
    FROM achievements
    WHERE game_id = ? AND profile_id = ?
  `).get(gameId, profileId) as any;

  db.prepare(`
    UPDATE games SET
      total_achievements = ?,
      unlocked_achievements = ?,
      updated_at = ?
    WHERE id = ? AND profile_id = ?
  `).run(stats.total || 0, stats.unlocked || 0, now, gameId, profileId);

  res.json({
    success: true,
    added: addedCount,
    totalAchievements: stats.total || 0,
    unlockedAchievements: stats.unlocked || 0
  });
});

/**
 * Export achievements of a game as a standard .omniachievements.json file
 */
router.get('/export/:gameId', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const { gameId } = req.params;

  const game = db.prepare('SELECT * FROM games WHERE id = ? AND profile_id = ?').get(gameId, profileId) as any;
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  const rows = db.prepare(`
    SELECT id, api_name, display_name, description, icon_unlocked, icon_locked, is_unlocked
    FROM achievements
    WHERE game_id = ? AND profile_id = ?
    ORDER BY created_at ASC
  `).all(gameId, profileId) as any[];

  const achievements: GeneratedAchievement[] = rows.map((r, idx) => ({
    apiName: r.api_name,
    displayName: r.display_name,
    description: r.description,
    tier: idx === rows.length - 1 ? 'platinum' : idx >= rows.length * 0.7 ? 'gold' : idx >= rows.length * 0.4 ? 'silver' : 'bronze',
    points: 15,
    category: 'story',
    iconSymbol: 'trophy',
    iconColor: '#6366f1',
    secret: false,
    iconUnlocked: r.icon_unlocked,
    iconLocked: r.icon_locked
  }));

  const pack: AchievementPack = {
    $schema: 'https://omniachievements.app/schema/v1/achievements.json',
    formatVersion: '1.0',
    gameTitle: game.title,
    platform: game.platform,
    totalAchievements: achievements.length,
    totalPoints: achievements.length * 15,
    generatedBy: 'OmniAchievements Hub Export',
    createdAt: new Date().toISOString(),
    achievements
  };

  const filename = `${game.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.omniachievements.json`;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.json(pack);
});

/**
 * Dynamic live badge generator preview
 */
router.post('/badge-preview', (req: AuthenticatedProfileRequest, res: Response) => {
  const { symbol = 'trophy', tier = 'bronze', color = '#6366f1', unlocked = true } = req.body;
  const svg = AiAchievementService.generateBadgeSvg(symbol as BadgeSymbol, tier as AchievementTier, color, unlocked);
  res.json({ dataUri: svg });
});

export default router;
