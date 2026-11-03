import { Router, Response } from 'express';
import db from '../db/database.js';
import { RetroAchievementsService } from '../services/retroAchievementsService.js';
import { masterAuth } from '../middleware/masterAuth.js';
import { profileAuth, AuthenticatedProfileRequest } from '../middleware/profileAuth.js';

const router = Router();
router.use(masterAuth);
router.use(profileAuth);

/**
 * Search RetroAchievements for games
 */
router.get('/search', async (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const title = String(req.query.title || '');

  if (!title.trim()) {
    return res.status(400).json({ error: 'Search title is required' });
  }

  const profile = db.prepare('SELECT retro_username, retro_api_key FROM profiles WHERE id = ?').get(profileId) as any;
  const username = profile?.retro_username || '';
  const apiKey = profile?.retro_api_key || '';

  try {
    const results = await RetroAchievementsService.searchGames(title.trim(), username, apiKey);
    res.json({ results });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'RetroAchievements search error' });
  }
});

/**
 * Sync achievements from RetroAchievements for a game
 */
router.post('/sync', async (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const { gameId, retroGameId } = req.body;

  if (!gameId || !retroGameId) {
    return res.status(400).json({ error: 'gameId and retroGameId are required' });
  }

  const profile = db.prepare('SELECT retro_username, retro_api_key FROM profiles WHERE id = ?').get(profileId) as any;
  const username = profile?.retro_username;
  const apiKey = profile?.retro_api_key;

  if (!username || !apiKey) {
    return res.status(400).json({
      error: 'Please configure your RetroAchievements username and Web API Key in Profile Settings first.'
    });
  }

  try {
    const result = await RetroAchievementsService.syncGameAchievements(
      profileId,
      gameId,
      retroGameId,
      username,
      apiKey
    );
    res.json({
      success: true,
      message: `Synchronized ${result.total} achievements (${result.unlocked} unlocked)`,
      result
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to sync with RetroAchievements' });
  }
});

export default router;
