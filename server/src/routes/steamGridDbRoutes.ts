import { Router, Request, Response } from 'express';
import { SteamGridDbService } from '../services/steamGridDbService.js';
import { masterAuth } from '../middleware/masterAuth.js';

const router = Router();
router.use(masterAuth);

/**
 * Search SteamGridDB by title
 */
router.get('/search', async (req: Request, res: Response) => {
  const { query } = req.query;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const results = await SteamGridDbService.searchGames(query.trim());
    res.json({ results });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'SteamGridDB search error' });
  }
});

/**
 * Fetch vertical grids (600x900)
 */
router.get('/grids/:gameId', async (req: Request, res: Response) => {
  const gameId = String(req.params.gameId);
  try {
    const grids = await SteamGridDbService.getGrids(gameId);
    res.json({ grids });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch grids' });
  }
});

/**
 * Fetch hero banners (1920x620)
 */
router.get('/heroes/:gameId', async (req: Request, res: Response) => {
  const gameId = String(req.params.gameId);
  try {
    const heroes = await SteamGridDbService.getHeroes(gameId);
    res.json({ heroes });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch heroes' });
  }
});

/**
 * Fetch icons
 */
router.get('/icons/:gameId', async (req: Request, res: Response) => {
  const gameId = String(req.params.gameId);
  try {
    const icons = await SteamGridDbService.getIcons(gameId);
    res.json({ icons });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch icons' });
  }
});

export default router;
