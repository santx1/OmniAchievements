import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { masterAuth } from '../middleware/masterAuth.js';

const router = Router();

/**
 * Check authentication status
 */
router.get('/status', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ authenticated: false });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    if (decoded.role === 'master' || decoded.type === 'master_access') {
      return res.json({ authenticated: true });
    }
  } catch (err) {
    // expired or invalid
  }

  res.json({ authenticated: false });
});

/**
 * Login with Master Password
 */
router.post('/master-login', (req: Request, res: Response) => {
  const { masterPassword } = req.body;

  if (!masterPassword || masterPassword !== config.masterPassword) {
    return res.status(401).json({ error: 'Invalid master password', code: 'INVALID_MASTER_PASSWORD' });
  }

  // Token valid for 30 days
  const token = jwt.sign(
    { role: 'master', type: 'master_access', createdAt: Date.now() },
    config.jwtSecret,
    { expiresIn: '30d' }
  );

  res.json({
    success: true,
    token,
    expiresIn: '30d'
  });
});

/**
 * Get system config (requires master token)
 */
router.get('/settings', masterAuth, (req: Request, res: Response) => {
  res.json({
    hasSteamApiKey: !!config.steamApiKey,
    steamApiKeyMasked: config.steamApiKey ? `${config.steamApiKey.substring(0, 4)}...${config.steamApiKey.slice(-4)}` : '',
    hasSteamGridDbApiKey: !!config.steamGridDbApiKey,
    steamGridDbApiKeyMasked: config.steamGridDbApiKey ? `${config.steamGridDbApiKey.substring(0, 4)}...${config.steamGridDbApiKey.slice(-4)}` : '',
    port: config.port,
    isProduction: config.isProduction
  });
});

/**
 * Update system keys or master password
 */
router.post('/settings', masterAuth, (req: Request, res: Response) => {
  const { masterPassword, steamApiKey, steamGridDbApiKey } = req.body;

  const updates: any = {};
  if (masterPassword && masterPassword.trim().length >= 6) {
    updates.masterPassword = masterPassword.trim();
  }
  if (steamApiKey !== undefined) {
    updates.steamApiKey = steamApiKey.trim();
  }
  if (steamGridDbApiKey !== undefined) {
    updates.steamGridDbApiKey = steamGridDbApiKey.trim();
  }

  config.updateConfig(updates);
  res.json({ success: true, message: 'Settings updated successfully' });
});

export default router;
