import { Router, Response } from 'express';
import crypto from 'crypto';
import db from '../db/database.js';
import { SteamService } from '../services/steamService.js';
import { masterAuth } from '../middleware/masterAuth.js';
import { profileAuth, AuthenticatedProfileRequest } from '../middleware/profileAuth.js';

const router = Router();

router.use(masterAuth);
router.use(profileAuth);

/**
 * Trigger full library synchronization with Steam
 */
router.post('/sync', async (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const { steamId, apiKey } = req.body || {};

  try {
    const result = await SteamService.syncProfileLibrary(profileId, steamId, apiKey);
    res.json({
      success: true,
      message: `Sync completed! Found ${result.totalFound} games (${result.added} added, ${result.updated} updated, ${result.skippedBlacklisted} bloat/free games skipped).`,
      stats: result
    });
  } catch (err: any) {
    console.error('[SteamSync] Error:', err);
    res.status(500).json({
      error: err.message || 'Failed to sync with Steam Web API',
      code: 'STEAM_SYNC_ERROR'
    });
  }
});

/**
 * Resolve Vanity URL to 64-bit Steam ID
 */
router.post('/resolve-vanity', async (req: AuthenticatedProfileRequest, res: Response) => {
  const { vanityUrl, apiKey } = req.body;

  if (!vanityUrl) {
    return res.status(400).json({ error: 'Vanity URL or username is required' });
  }

  try {
    const steamId = await SteamService.resolveVanityUrl(vanityUrl, apiKey);
    res.json({ success: true, steamId });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Could not resolve Steam ID' });
  }
});

/**
 * Search/fetch achievements from Steam for any AppID
 * "lets me gather the achievements manually from the Steam API or add them myself"
 */
router.get('/schema/:appId', async (req: AuthenticatedProfileRequest, res: Response) => {
  const appId = String(req.params.appId);
  const { apiKey } = req.query as { apiKey?: string };

  try {
    const schema = await SteamService.getGameSchema(appId, apiKey);
    res.json({
      success: true,
      appId,
      totalAchievements: schema.length,
      achievements: schema.map((s) => ({
        api_name: s.name,
        display_name: s.displayName || s.name,
        description: s.description || '',
        icon_unlocked: s.icon || '',
        icon_locked: s.icongray || s.icon || '',
        is_unlocked: 0
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch Steam schema' });
  }
});

/**
 * Import Steam achievements directly into an existing manual game
 */
router.post('/import-to-game', async (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const { gameId, steamAppId, apiKey } = req.body;

  if (!gameId || !steamAppId) {
    return res.status(400).json({ error: 'gameId and steamAppId are required' });
  }

  const game = db.prepare('SELECT * FROM games WHERE id = ? AND profile_id = ?').get(gameId, profileId) as any;
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  try {
    const schema = await SteamService.getGameSchema(steamAppId, apiKey);
    if (!schema || schema.length === 0) {
      return res.status(404).json({ error: 'No achievements found on Steam for AppID ' + steamAppId });
    }

    const now = new Date().toISOString();
    const insertAch = db.prepare(`
      INSERT INTO achievements (
        id, game_id, profile_id, api_name, display_name, description,
        icon_unlocked, icon_locked, is_unlocked, unlocked_at,
        progress_current, progress_max, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, '', 0, 100, ?, ?)
    `);

    // Remove existing achievements if user replaces them
    db.prepare('DELETE FROM achievements WHERE game_id = ? AND profile_id = ?').run(gameId, profileId);

    for (const s of schema) {
      const achId = crypto.randomUUID();
      insertAch.run(
        achId,
        gameId,
        profileId,
        s.name,
        s.displayName || s.name,
        s.description || '',
        s.icon || '',
        s.icongray || s.icon || '',
        now,
        now
      );
    }

    db.prepare(`
      UPDATE games SET
        total_achievements = ?,
        unlocked_achievements = 0,
        external_id = COALESCE(NULLIF(external_id, ''), ?),
        updated_at = ?
      WHERE id = ?
    `).run(schema.length, String(steamAppId), now, gameId);

    res.json({
      success: true,
      message: `Imported ${schema.length} achievements from Steam AppID ${steamAppId}`,
      totalAchievements: schema.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to import achievements' });
  }
});

export default router;
