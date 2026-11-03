import { Router, Request, Response } from 'express';
import { BackupService } from '../services/backupService.js';
import { masterAuth } from '../middleware/masterAuth.js';

const router = Router();
router.use(masterAuth);

/**
 * Download JSON backup of entire database
 */
router.get('/export', (req: Request, res: Response) => {
  try {
    const backup = BackupService.exportFullBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="omniachievements-backup-${new Date().toISOString().split('T')[0]}.json"`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Export failed' });
  }
});

/**
 * Restore JSON backup
 */
router.post('/import', (req: Request, res: Response) => {
  try {
    const data = req.body;
    BackupService.importFullBackup(data);
    res.json({ success: true, message: 'Library and achievements restored successfully!' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Import failed' });
  }
});

/**
 * Trigger manual SQLite snapshot
 */
router.post('/snapshot', (req: Request, res: Response) => {
  try {
    BackupService.createDatabaseSnapshot();
    res.json({ success: true, message: 'SQLite database snapshot created' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
