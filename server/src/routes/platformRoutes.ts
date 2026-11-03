import { Router, Response } from 'express';
import crypto from 'crypto';
import db from '../db/database.js';
import { masterAuth } from '../middleware/masterAuth.js';
import { profileAuth, AuthenticatedProfileRequest } from '../middleware/profileAuth.js';

const router = Router();
router.use(masterAuth);
router.use(profileAuth);

const DEFAULT_PLATFORMS = [
  { id: 'steam', name: 'Steam', color: '#06b6d4', sort_order: 1 },
  { id: 'playstation', name: 'PlayStation', color: '#3b82f6', sort_order: 2 },
  { id: 'switch', name: 'Nintendo Switch', color: '#ef4444', sort_order: 3 },
  { id: 'xbox', name: 'Xbox', color: '#10b981', sort_order: 4 },
  { id: 'retro', name: 'Retro / Emulators', color: '#8b5cf6', sort_order: 5 },
  { id: 'epic', name: 'Epic Games', color: '#f59e0b', sort_order: 6 },
  { id: 'gog', name: 'GOG', color: '#d946ef', sort_order: 7 },
  { id: 'custom', name: 'Custom', color: '#64748b', sort_order: 8 }
];

/**
 * List custom console & platform tags for profile
 */
router.get('/', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;

  let platforms = db.prepare(`
    SELECT id, name, color, sort_order
    FROM custom_platforms
    WHERE profile_id = ?
    ORDER BY sort_order ASC, name ASC
  `).all(profileId) as any[];

  // If profile has no custom platforms initialized yet, seed with defaults
  if (platforms.length === 0) {
    const insertPlatform = db.prepare(`
      INSERT INTO custom_platforms (id, profile_id, name, color, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    for (const p of DEFAULT_PLATFORMS) {
      insertPlatform.run(p.id, profileId, p.name, p.color, p.sort_order, now);
    }

    platforms = db.prepare(`
      SELECT id, name, color, sort_order
      FROM custom_platforms
      WHERE profile_id = ?
      ORDER BY sort_order ASC, name ASC
    `).all(profileId) as any[];
  }

  res.json({ platforms });
});

/**
 * Add a new custom console/platform tag
 */
router.post('/', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const { name, color, id } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Platform name is required' });
  }

  const cleanName = name.trim();
  const slug = (id && id.trim())
    ? id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    : cleanName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

  const finalColor = color || '#6366f1';
  const now = new Date().toISOString();

  // Find max sort order
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM custom_platforms WHERE profile_id = ?').get(profileId) as any;
  const nextOrder = (maxOrder?.m || 0) + 1;

  db.prepare(`
    INSERT INTO custom_platforms (id, profile_id, name, color, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      color = excluded.color
  `).run(slug, profileId, cleanName, finalColor, nextOrder, now);

  const created = db.prepare('SELECT id, name, color, sort_order FROM custom_platforms WHERE id = ? AND profile_id = ?').get(slug, profileId);
  res.status(201).json({ platform: created });
});

/**
 * Update an existing console/platform tag
 */
router.put('/:id', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const { id } = req.params;
  const { name, color, sort_order } = req.body;

  const existing = db.prepare('SELECT * FROM custom_platforms WHERE id = ? AND profile_id = ?').get(id, profileId);
  if (!existing) {
    return res.status(404).json({ error: 'Platform not found' });
  }

  db.prepare(`
    UPDATE custom_platforms SET
      name = COALESCE(?, name),
      color = COALESCE(?, color),
      sort_order = COALESCE(?, sort_order)
    WHERE id = ? AND profile_id = ?
  `).run(name?.trim(), color, sort_order, id, profileId);

  const updated = db.prepare('SELECT id, name, color, sort_order FROM custom_platforms WHERE id = ? AND profile_id = ?').get(id, profileId);
  res.json({ platform: updated });
});

/**
 * Delete a console/platform tag
 */
router.delete('/:id', (req: AuthenticatedProfileRequest, res: Response) => {
  const profileId = req.profileId!;
  const { id } = req.params;

  // Reassign any games using this platform tag to 'custom'
  db.prepare(`UPDATE games SET platform = 'custom' WHERE profile_id = ? AND platform = ?`).run(profileId, id);

  db.prepare('DELETE FROM custom_platforms WHERE id = ? AND profile_id = ?').run(id, profileId);
  res.json({ success: true, message: 'Platform deleted' });
});

export default router;
