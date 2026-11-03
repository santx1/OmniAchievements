import axios from 'axios';
import db from '../db/database.js';
import { config } from '../config/index.js';
import crypto from 'crypto';

export interface SteamGameInfo {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
  rtime_last_played?: number;
}

export interface SteamAchievementSchema {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  icongray: string;
  hidden: number;
}

export interface SteamPlayerAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
}

export class SteamService {
  private static getEffectiveApiKey(profileApiKey?: string): string {
    return profileApiKey && profileApiKey.trim() !== '' ? profileApiKey : config.steamApiKey;
  }

  /**
   * Resolve Steam vanity URL (e.g. "gabelogell") to 64-bit Steam ID
   */
  static async resolveVanityUrl(vanityUrl: string, profileApiKey?: string): Promise<string> {
    const key = this.getEffectiveApiKey(profileApiKey);
    if (!key) throw new Error('Steam API Key is required');

    // Clean up input if user pasted full URL
    let cleanVanity = vanityUrl.trim();
    if (cleanVanity.includes('steamcommunity.com/id/')) {
      cleanVanity = cleanVanity.split('steamcommunity.com/id/')[1].replace('/', '');
    } else if (cleanVanity.includes('steamcommunity.com/profiles/')) {
      return cleanVanity.split('steamcommunity.com/profiles/')[1].replace('/', '');
    }

    // If it's already a 17-digit numeric steamID64
    if (/^\d{17}$/.test(cleanVanity)) {
      return cleanVanity;
    }

    const res = await axios.get('https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/', {
      params: { key, vanityurl: cleanVanity }
    });

    if (res.data?.response?.success === 1 && res.data.response.steamid) {
      return res.data.response.steamid;
    }

    throw new Error('Could not resolve Steam vanity URL. Please enter your 17-digit SteamID64.');
  }

  /**
   * Fetch all owned games from Steam
   */
  static async getOwnedGames(steamId: string, profileApiKey?: string): Promise<SteamGameInfo[]> {
    const key = this.getEffectiveApiKey(profileApiKey);
    if (!key) throw new Error('Steam Web API Key is not configured. Set it in Settings or .env file.');

    const res = await axios.get('https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/', {
      params: {
        key,
        steamid: steamId,
        include_appinfo: 1,
        include_played_free_games: 1,
        format: 'json'
      },
      timeout: 15000
    });

    return res.data?.response?.games || [];
  }

  /**
   * Fetch achievement schema (names, descriptions, icons) for a Steam AppID
   */
  static async getGameSchema(appId: number | string, profileApiKey?: string): Promise<SteamAchievementSchema[]> {
    const key = this.getEffectiveApiKey(profileApiKey);
    if (!key) return [];

    try {
      const res = await axios.get('https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/', {
        params: { key, appid: appId },
        timeout: 10000
      });
      return res.data?.game?.availableGameStats?.achievements || [];
    } catch (err: any) {
      // Some games do not support achievements or have restricted schemas
      return [];
    }
  }

  /**
   * Fetch player's unlocked achievements for an AppID
   */
  static async getPlayerAchievements(
    steamId: string,
    appId: number | string,
    profileApiKey?: string
  ): Promise<SteamPlayerAchievement[]> {
    const key = this.getEffectiveApiKey(profileApiKey);
    if (!key) return [];

    try {
      const res = await axios.get('https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/', {
        params: { key, steamid: steamId, appid: appId },
        timeout: 10000
      });
      return res.data?.playerstats?.achievements || [];
    } catch (err: any) {
      // 400 status usually means game has no achievements or profile privacy is set to private
      return [];
    }
  }

  /**
   * Sync complete Steam library for a profile
   */
  static async syncProfileLibrary(profileId: string, customSteamId?: string, customApiKey?: string) {
    const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId) as any;
    if (!profile) throw new Error('Profile not found');

    const steamId = customSteamId || profile.steam_id;
    const apiKey = customApiKey || profile.steam_api_key || config.steamApiKey;

    if (!steamId) {
      throw new Error('Steam ID is not set for this profile. Please enter your SteamID in Settings.');
    }
    if (!apiKey) {
      throw new Error('Steam API Key is missing. Please set it in Settings or server configuration.');
    }

    // Update profile with Steam ID if provided
    if (customSteamId && customSteamId !== profile.steam_id) {
      db.prepare('UPDATE profiles SET steam_id = ?, updated_at = ? WHERE id = ?').run(
        steamId,
        new Date().toISOString(),
        profileId
      );
    }

    // 1. Fetch blacklisted games to skip
    const blacklist = db.prepare('SELECT steam_app_id FROM steam_blacklist WHERE profile_id = ?').all(profileId) as {
      steam_app_id: string;
    }[];
    const blacklistedIds = new Set(blacklist.map((b) => b.steam_app_id));

    // 2. Fetch owned games
    const games = await this.getOwnedGames(steamId, apiKey);
    console.log(`[SteamSync] Found ${games.length} games for Steam ID: ${steamId}`);

    let addedCount = 0;
    let updatedCount = 0;
    let skippedBloatCount = 0;

    const now = new Date().toISOString();

    for (const g of games) {
      const appIdStr = g.appid.toString();

      // Check if user manually deleted/blacklisted this free or bloat game
      if (blacklistedIds.has(appIdStr)) {
        skippedBloatCount++;
        continue;
      }

      // High-res cover art URLs from official Steam CDN
      const coverImage = `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/library_600x900.jpg`;
      const bannerImage = `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/header.jpg`;
      const heroImage = `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/library_hero.jpg`;
      const iconImage = g.img_icon_url
        ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg`
        : `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/logo.png`;

      // Check if game already in DB
      const existingGame = db
        .prepare('SELECT id, status, total_achievements, unlocked_achievements FROM games WHERE profile_id = ? AND external_id = ?')
        .get(profileId, appIdStr) as any;

      let gameId = existingGame?.id;
      let lastPlayed = g.rtime_last_played ? new Date(g.rtime_last_played * 1000).toISOString() : '';

      if (!existingGame) {
        gameId = crypto.randomUUID();
        db.prepare(`
          INSERT INTO games (
            id, profile_id, title, platform, external_id, cover_image, banner_image, hero_image, icon_image,
            status, is_custom, playtime_minutes, total_achievements, unlocked_achievements, last_played_at,
            created_at, updated_at
          ) VALUES (?, ?, ?, 'steam', ?, ?, ?, ?, ?, 'unplayed', 0, ?, 0, 0, ?, ?, ?)
        `).run(
          gameId,
          profileId,
          g.name,
          appIdStr,
          coverImage,
          bannerImage,
          heroImage,
          iconImage,
          g.playtime_forever,
          lastPlayed,
          now,
          now
        );
        addedCount++;
      } else {
        db.prepare(`
          UPDATE games SET
            title = ?,
            playtime_minutes = ?,
            last_played_at = COALESCE(NULLIF(?, ''), last_played_at),
            cover_image = COALESCE(NULLIF(cover_image, ''), ?),
            banner_image = COALESCE(NULLIF(banner_image, ''), ?),
            hero_image = COALESCE(NULLIF(hero_image, ''), ?),
            icon_image = COALESCE(NULLIF(icon_image, ''), ?),
            updated_at = ?
          WHERE id = ?
        `).run(
          g.name,
          g.playtime_forever,
          lastPlayed,
          coverImage,
          bannerImage,
          heroImage,
          iconImage,
          now,
          gameId
        );
        updatedCount++;
      }

      // Sync achievements for games with playtime or recent activity or on first add
      try {
        await this.syncAchievementsForGame(profileId, gameId, steamId, g.appid, apiKey);
      } catch (err: any) {
        // Continue syncing other games
      }
    }

    return {
      totalFound: games.length,
      added: addedCount,
      updated: updatedCount,
      skippedBlacklisted: skippedBloatCount
    };
  }

  /**
   * Sync achievements for a specific game
   */
  static async syncAchievementsForGame(
    profileId: string,
    gameId: string,
    steamId: string,
    appId: number | string,
    profileApiKey?: string
  ) {
    const [schemaList, playerAchs] = await Promise.all([
      this.getGameSchema(appId, profileApiKey),
      this.getPlayerAchievements(steamId, appId, profileApiKey)
    ]);

    if (!schemaList || schemaList.length === 0) {
      // Game has no achievements or no public schema
      return;
    }

    const playerMap = new Map<string, SteamPlayerAchievement>();
    for (const pa of playerAchs) {
      playerMap.set(pa.apiname, pa);
    }

    let unlockedCount = 0;
    const now = new Date().toISOString();

    const insertOrUpdateAch = db.prepare(`
      INSERT INTO achievements (
        id, game_id, profile_id, api_name, display_name, description,
        icon_unlocked, icon_locked, is_unlocked, unlocked_at,
        progress_current, progress_max, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 100, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        display_name = excluded.display_name,
        description = excluded.description,
        icon_unlocked = excluded.icon_unlocked,
        icon_locked = excluded.icon_locked,
        is_unlocked = excluded.is_unlocked,
        unlocked_at = excluded.unlocked_at,
        updated_at = excluded.updated_at
    `);

    for (const schema of schemaList) {
      const pa = playerMap.get(schema.name);
      const isUnlocked = pa?.achieved === 1 ? 1 : 0;
      if (isUnlocked) unlockedCount++;

      const unlockedAt = pa?.unlocktime && pa.unlocktime > 0 ? new Date(pa.unlocktime * 1000).toISOString() : '';

      // Stable ID based on gameId + api_name
      const achId = crypto.createHash('md5').update(`${gameId}:${schema.name}`).digest('hex');

      insertOrUpdateAch.run(
        achId,
        gameId,
        profileId,
        schema.name,
        schema.displayName || schema.name,
        schema.description || '',
        schema.icon || '',
        schema.icongray || schema.icon || '',
        isUnlocked,
        unlockedAt,
        isUnlocked ? 100 : 0,
        now,
        now
      );
    }

    const totalAchs = schemaList.length;

    // Automatic 100% classification rule:
    // If all achievements unlocked and total > 0, classify automatically as completed_100!
    const currentGame = db.prepare('SELECT status, playtime_minutes FROM games WHERE id = ?').get(gameId) as any;
    let newStatus = currentGame?.status || 'unplayed';

    if (totalAchs > 0 && unlockedCount === totalAchs) {
      newStatus = 'completed_100';
    } else if (unlockedCount > 0 && newStatus === 'unplayed') {
      newStatus = 'playing';
    } else if (currentGame?.playtime_minutes > 0 && newStatus === 'unplayed') {
      newStatus = 'playing';
    }

    db.prepare(`
      UPDATE games SET
        total_achievements = ?,
        unlocked_achievements = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?
    `).run(totalAchs, unlockedCount, newStatus, now, gameId);
  }
}
