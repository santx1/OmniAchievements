import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface AuthenticatedMasterRequest extends Request {
  isMasterAuthenticated?: boolean;
}

export function masterAuth(req: AuthenticatedMasterRequest, res: Response, next: NextFunction): void {
  // Allow OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization;
  const masterKeyHeader = req.headers['x-master-password'];

  // Direct password check in header (convenient for local CLI / Decky plugin / scripts)
  if (masterKeyHeader && masterKeyHeader === config.masterPassword) {
    req.isMasterAuthenticated = true;
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Master authentication required', code: 'MASTER_AUTH_REQUIRED' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { role: string; type: string };
    if (decoded.role === 'master' || decoded.type === 'master_access') {
      req.isMasterAuthenticated = true;
      return next();
    }
    res.status(403).json({ error: 'Invalid master token', code: 'INVALID_TOKEN' });
  } catch (err) {
    res.status(401).json({ error: 'Session expired or invalid master token', code: 'TOKEN_EXPIRED' });
  }
}
