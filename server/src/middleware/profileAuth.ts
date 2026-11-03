import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface AuthenticatedProfileRequest extends Request {
  profileId?: string;
  isMasterAuthenticated?: boolean;
}

export function profileAuth(req: AuthenticatedProfileRequest, res: Response, next: NextFunction): void {
  // Allow OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Profile token can be passed in X-Profile-Token header or profileId in X-Profile-Id
  const profileToken = req.headers['x-profile-token'] as string;
  const profileIdHeader = req.headers['x-profile-id'] as string;

  if (profileToken) {
    try {
      const decoded = jwt.verify(profileToken, config.jwtSecret) as { profileId: string };
      req.profileId = decoded.profileId;
      return next();
    } catch (err) {
      // Fall through to check profileId header if master authenticated
    }
  }

  // If already master-authenticated, profileId header can be used directly
  if (profileIdHeader) {
    req.profileId = profileIdHeader;
    return next();
  }

  // If query parameter profileId is passed
  if (req.query.profileId && typeof req.query.profileId === 'string') {
    req.profileId = req.query.profileId;
    return next();
  }

  res.status(401).json({ error: 'Profile authorization required', code: 'PROFILE_AUTH_REQUIRED' });
}
