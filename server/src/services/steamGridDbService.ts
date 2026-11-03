import axios from 'axios';
import { config } from '../config/index.js';

export interface SteamGridDbGame {
  id: number;
  name: string;
  types: string[];
  verified: boolean;
}

export interface SteamGridItem {
  id: number;
  score: number;
  style: string;
  width: number;
  height: number;
  nsfw: boolean;
  humor: boolean;
  url: string;
  thumb: string;
  author: {
    name: string;
    steam64: string;
    avatar: string;
  };
}

export class SteamGridDbService {
  private static BASE_URL = 'https://www.steamgriddb.com/api/v2';

  private static getHeaders() {
    return {
      Authorization: `Bearer ${config.steamGridDbApiKey}`
    };
  }

  /**
   * Search SteamGridDB for games matching a query
   */
  static async searchGames(query: string): Promise<SteamGridDbGame[]> {
    if (!config.steamGridDbApiKey) {
      // Fallback search using public Steam search API
      return this.fallbackSearchSteam(query);
    }

    try {
      const res = await axios.get(`${this.BASE_URL}/search/autocomplete/${encodeURIComponent(query)}`, {
        headers: this.getHeaders(),
        timeout: 8000
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err: any) {
      console.warn('[SteamGridDB] Search failed, falling back to Steam search:', err.message);
      return this.fallbackSearchSteam(query);
    }
  }

  /**
   * Get vertical grid covers (600x900) for a game
   */
  static async getGrids(gameId: number | string): Promise<SteamGridItem[]> {
    if (!config.steamGridDbApiKey) {
      // Return default Steam CDN grid if numeric Steam AppID
      if (/^\d+$/.test(String(gameId))) {
        return [
          {
            id: Number(gameId),
            score: 100,
            style: 'alternate',
            width: 600,
            height: 900,
            nsfw: false,
            humor: false,
            url: `https://cdn.akamai.steamstatic.com/steam/apps/${gameId}/library_600x900.jpg`,
            thumb: `https://cdn.akamai.steamstatic.com/steam/apps/${gameId}/library_600x900.jpg`,
            author: { name: 'Steam', steam64: '', avatar: '' }
          }
        ];
      }
      return [];
    }

    try {
      const res = await axios.get(`${this.BASE_URL}/grids/game/${gameId}`, {
        headers: this.getHeaders(),
        params: { dimensions: ['600x900'], nsfw: false },
        timeout: 8000
      });

      return res.data?.data || [];
    } catch (err: any) {
      console.warn('[SteamGridDB] Get grids failed:', err.message);
      return [];
    }
  }

  /**
   * Get hero banners (1920x620) for a game
   */
  static async getHeroes(gameId: number | string): Promise<SteamGridItem[]> {
    if (!config.steamGridDbApiKey) {
      if (/^\d+$/.test(String(gameId))) {
        return [
          {
            id: Number(gameId),
            score: 100,
            style: 'alternate',
            width: 1920,
            height: 620,
            nsfw: false,
            humor: false,
            url: `https://cdn.akamai.steamstatic.com/steam/apps/${gameId}/library_hero.jpg`,
            thumb: `https://cdn.akamai.steamstatic.com/steam/apps/${gameId}/library_hero.jpg`,
            author: { name: 'Steam', steam64: '', avatar: '' }
          }
        ];
      }
      return [];
    }

    try {
      const res = await axios.get(`${this.BASE_URL}/heroes/game/${gameId}`, {
        headers: this.getHeaders(),
        params: { nsfw: false },
        timeout: 8000
      });

      return res.data?.data || [];
    } catch (err: any) {
      return [];
    }
  }

  /**
   * Get logos/icons for a game
   */
  static async getIcons(gameId: number | string): Promise<SteamGridItem[]> {
    if (!config.steamGridDbApiKey) {
      if (/^\d+$/.test(String(gameId))) {
        return [
          {
            id: Number(gameId),
            score: 100,
            style: 'official',
            width: 128,
            height: 128,
            nsfw: false,
            humor: false,
            url: `https://cdn.akamai.steamstatic.com/steam/apps/${gameId}/logo.png`,
            thumb: `https://cdn.akamai.steamstatic.com/steam/apps/${gameId}/logo.png`,
            author: { name: 'Steam', steam64: '', avatar: '' }
          }
        ];
      }
      return [];
    }

    try {
      const res = await axios.get(`${this.BASE_URL}/icons/game/${gameId}`, {
        headers: this.getHeaders(),
        params: { nsfw: false },
        timeout: 8000
      });

      return res.data?.data || [];
    } catch (err: any) {
      return [];
    }
  }

  /**
   * Fallback search querying Steam store search API
   */
  private static async fallbackSearchSteam(query: string): Promise<SteamGridDbGame[]> {
    try {
      const res = await axios.get('https://store.steampowered.com/api/storesearch/', {
        params: { term: query, l: 'english', cc: 'US' },
        timeout: 8000
      });

      if (res.data?.items && Array.isArray(res.data.items)) {
        return res.data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          types: ['steam'],
          verified: true
        }));
      }
      return [];
    } catch (err: any) {
      return [];
    }
  }
}
