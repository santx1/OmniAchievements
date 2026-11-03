import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db/database.js';
import { config } from '../config/index.js';
import { masterAuth } from '../middleware/masterAuth.js';

const router = Router();

// All profile routes require master authentication
router.use(masterAuth);

/**
 * List all profiles
 */
router.get('/', (req: Request, res: Response) => {
  const profiles = db.prepare(`
    SELECT id, name, avatar, theme, accent_color, steam_id, retro_username, family_steam_ids, created_at, updated_at
    FROM profiles
    ORDER BY created_at ASC
  `).all();

  res.json({ profiles });
});

/**
 * Create a new profile
 */
router.post('/', (req: Request, res: Response) => {
  const { name, avatar, pin, theme, accent_color, steam_id } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Profile name is required' });
  }

  // Pin validation: 6 digits
  const cleanPin = String(pin || '').trim();
  if (!/^\d{6}$/.test(cleanPin)) {
    return res.status(400).json({ error: 'PIN must be exactly 6 digits (0-9)' });
  }

  const id = crypto.randomUUID();
  const pinHash = bcrypt.hashSync(cleanPin, 10);
  const now = new Date().toISOString();
  const defaultAvatar = avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

  db.prepare(`
    INSERT INTO profiles (id, name, avatar, pin_hash, theme, accent_color, steam_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    name.trim(),
    defaultAvatar,
    pinHash,
    theme || 'dark',
    accent_color || '#6366f1',
    steam_id ? steam_id.trim() : '',
    now,
    now
  );

  const created = db.prepare('SELECT id, name, avatar, theme, accent_color, steam_id, created_at FROM profiles WHERE id = ?').get(id);
  res.status(201).json({ profile: created });
});

/**
 * Verify profile 6-digit PIN and get session token
 */
router.post('/:id/verify-pin', (req: Request, res: Response) => {
  const { id } = req.params;
  const { pin } = req.body;

  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as any;
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const cleanPin = String(pin || '').trim();
  const isMatch = bcrypt.compareSync(cleanPin, profile.pin_hash);

  if (!isMatch) {
    return res.status(401).json({ error: 'Incorrect 6-digit PIN', code: 'INVALID_PIN' });
  }

  // Generate Profile Session Token
  const profileToken = jwt.sign(
    { profileId: profile.id, role: 'profile_user', name: profile.name },
    config.jwtSecret,
    { expiresIn: '30d' }
  );

  res.json({
    success: true,
    profileToken,
    profile: {
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      theme: profile.theme,
      accent_color: profile.accent_color,
      steam_id: profile.steam_id,
      hasCustomApiKey: !!profile.steam_api_key
    }
  });
});

/**
 * Get profile details
 */
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const profile = db.prepare(`
    SELECT id, name, avatar, theme, accent_color, steam_id, created_at, updated_at
    FROM profiles WHERE id = ?
  `).get(id) as any;

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  res.json({ profile });
});

/**
 * Update profile settings (name, avatar, pin, theme, accent_color, steam_id, steam_api_key)
 */
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    avatar,
    pin,
    currentPin,
    theme,
    accent_color,
    steam_id,
    steam_api_key,
    retro_username,
    retro_api_key,
    family_steam_ids
  } = req.body;

  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as any;
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  // If changing PIN, verify current PIN or master
  let newPinHash = profile.pin_hash;
  if (pin) {
    const cleanNewPin = String(pin).trim();
    if (!/^\d{6}$/.test(cleanNewPin)) {
      return res.status(400).json({ error: 'New PIN must be exactly 6 digits' });
    }

    if (currentPin) {
      if (!bcrypt.compareSync(String(currentPin).trim(), profile.pin_hash)) {
        return res.status(401).json({ error: 'Current PIN is incorrect' });
      }
    }
    newPinHash = bcrypt.hashSync(cleanNewPin, 10);
  }

  const updatedName = name !== undefined ? name.trim() : profile.name;
  const updatedAvatar = avatar !== undefined ? avatar : profile.avatar;
  const updatedTheme = theme !== undefined ? theme : profile.theme;
  const updatedAccent = accent_color !== undefined ? accent_color : profile.accent_color;
  const updatedSteamId = steam_id !== undefined ? steam_id.trim() : profile.steam_id;
  const updatedApiKey = steam_api_key !== undefined ? steam_api_key.trim() : profile.steam_api_key;
  const updatedRetroUser = retro_username !== undefined ? retro_username.trim() : (profile.retro_username || '');
  const updatedRetroKey = retro_api_key !== undefined ? retro_api_key.trim() : (profile.retro_api_key || '');
  const updatedFamilyIds = family_steam_ids !== undefined ? (typeof family_steam_ids === 'string' ? family_steam_ids : JSON.stringify(family_steam_ids)) : (profile.family_steam_ids || '[]');
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE profiles SET
      name = ?,
      avatar = ?,
      pin_hash = ?,
      theme = ?,
      accent_color = ?,
      steam_id = ?,
      steam_api_key = ?,
      retro_username = ?,
      retro_api_key = ?,
      family_steam_ids = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    updatedName,
    updatedAvatar,
    newPinHash,
    updatedTheme,
    updatedAccent,
    updatedSteamId,
    updatedApiKey,
    updatedRetroUser,
    updatedRetroKey,
    updatedFamilyIds,
    now,
    id
  );

  const updatedProfile = db.prepare(`
    SELECT id, name, avatar, theme, accent_color, steam_id, retro_username, family_steam_ids, created_at, updated_at
    FROM profiles WHERE id = ?
  `).get(id);

  res.json({ profile: updatedProfile });
});

/**
 * Delete profile
 */
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  // Prevent deleting the last profile
  const count = db.prepare('SELECT COUNT(*) as count FROM profiles').get() as { count: number };
  if (count.count <= 1) {
    return res.status(400).json({ error: 'Cannot delete the only existing profile' });
  }

  db.prepare('DELETE FROM profiles WHERE id = ?').run(id);
  res.json({ success: true, message: 'Profile deleted successfully' });
});

export default router;
