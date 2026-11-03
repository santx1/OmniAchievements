import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config/index.js';
import { initDatabase } from './db/database.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import steamRoutes from './routes/steamRoutes.js';
import steamGridDbRoutes from './routes/steamGridDbRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import deckyRoutes from './routes/deckyRoutes.js';
import retroRoutes from './routes/retroRoutes.js';
import backupRoutes from './routes/backupRoutes.js';
import { BackupService } from './services/backupService.js';

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Profile-Id', 'X-Profile-Token', 'X-Master-Password', 'X-Decky-Token']
}));

// Body Parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Initialize DB schema & default profile
initDatabase();
BackupService.initBackupSystem();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/steam', steamRoutes);
app.use('/api/steamgriddb', steamGridDbRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/decky', deckyRoutes);
app.use('/api/retro', retroRoutes);
app.use('/api/backup', backupRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    app: 'OmniAchievements',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build if exists (for unified Docker container / self-hosting)
const clientBuildPath = path.resolve(process.cwd(), '../client/dist');
const localClientBuildPath = path.resolve(process.cwd(), 'client-dist');

const staticPath = fs.existsSync(clientBuildPath)
  ? clientBuildPath
  : fs.existsSync(localClientBuildPath)
    ? localClientBuildPath
    : null;

if (staticPath) {
  console.log(`Serving static web app from ${staticPath}`);
  app.use(express.static(staticPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ServerError]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start Server
app.listen(config.port, '0.0.0.0', () => {
  console.log('====================================================');
  console.log(`🎮 OmniAchievements Server running on http://0.0.0.0:${config.port}`);
  console.log(`🔒 Master Password configured in: ${config.configFile}`);
  console.log(`📁 Persistent Data Directory: ${config.dataDir}`);
  console.log('====================================================');
});
