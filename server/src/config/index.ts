import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load .env if present (check current directory and parent directory)
dotenv.config();
if (fs.existsSync(path.resolve(process.cwd(), '../.env'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Master password file or env variable
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

interface StoredConfig {
  masterPassword?: string;
  steamApiKey?: string;
  steamGridDbApiKey?: string;
  jwtSecret?: string;
}

let storedConfig: StoredConfig = {};
if (fs.existsSync(CONFIG_FILE)) {
  try {
    storedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch (err) {
    console.error('Failed to read config.json, using defaults', err);
  }
}

// Prefer environment variable MASTER_PASSWORD if explicitly set
if (process.env.MASTER_PASSWORD) {
  storedConfig.masterPassword = process.env.MASTER_PASSWORD;
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(storedConfig, null, 2));
  } catch (err) {
    console.error('Failed to write updated config.json', err);
  }
} else if (!storedConfig.masterPassword) {
  storedConfig.masterPassword = 'changeme123';
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(storedConfig, null, 2));
  } catch (err) {
    console.error('Failed to write default config.json', err);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  dataDir: DATA_DIR,
  dbPath: path.join(DATA_DIR, 'omniachievements.sqlite'),
  configFile: CONFIG_FILE,
  masterPassword: process.env.MASTER_PASSWORD || storedConfig.masterPassword || 'changeme123',
  steamApiKey: process.env.STEAM_API_KEY || storedConfig.steamApiKey || '',
  steamGridDbApiKey: process.env.STEAMGRIDDB_API_KEY || storedConfig.steamGridDbApiKey || '',
  jwtSecret: process.env.JWT_SECRET || storedConfig.jwtSecret || 'omni_achievements_secure_jwt_secret_9948271',
  isProduction: process.env.NODE_ENV === 'production',
  
  updateConfig(updates: Partial<StoredConfig>) {
    storedConfig = { ...storedConfig, ...updates };
    if (updates.masterPassword) {
      this.masterPassword = updates.masterPassword;
    }
    if (updates.steamApiKey !== undefined) {
      this.steamApiKey = updates.steamApiKey;
    }
    if (updates.steamGridDbApiKey !== undefined) {
      this.steamGridDbApiKey = updates.steamGridDbApiKey;
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(storedConfig, null, 2));
  }
};
