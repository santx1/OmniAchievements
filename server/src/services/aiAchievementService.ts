import axios from 'axios';
import { config } from '../config/index.js';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'obsidian';
export type BadgeSymbol =
  | 'sword'
  | 'shield'
  | 'trophy'
  | 'crown'
  | 'skull'
  | 'star'
  | 'compass'
  | 'scroll'
  | 'flame'
  | 'gem'
  | 'heart'
  | 'key'
  | 'lightning'
  | 'potion'
  | 'dice'
  | 'feather'
  | 'planet';

export interface GeneratedAchievement {
  apiName: string;
  displayName: string;
  description: string;
  displayName_es?: string;
  description_es?: string;
  localizations?: {
    en: { displayName: string; description: string };
    es: { displayName: string; description: string };
  };
  tier: AchievementTier;
  points: number;
  category: 'story' | 'combat' | 'exploration' | 'mastery' | 'secret';
  iconSymbol: BadgeSymbol;
  iconColor: string;
  secret: boolean;
  iconUnlocked?: string;
  iconLocked?: string;
}

export interface AchievementPack {
  $schema: string;
  formatVersion: '1.0';
  gameTitle: string;
  platform: string;
  genre?: string;
  totalAchievements: number;
  totalPoints: number;
  generatedBy: string;
  createdAt: string;
  achievements: GeneratedAchievement[];
}

// Pre-defined SVG Symbol Paths for the Creative Badge Generator
const SYMBOL_PATHS: Record<BadgeSymbol, string> = {
  sword:
    'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M19 13l2 2-7 7-2-2M7 17l-4 4M21 3l-6 6',
  shield:
    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  trophy:
    'M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34M6 4h12v6c0 3.31-2.69 6-6 6s-6-2.69-6-6V4z',
  crown:
    'M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z',
  skull:
    'M12 2a9 9 0 0 0-9 9c0 3.7 2.2 6.9 5.4 8.3L8 22h8l-.4-2.7C18.8 17.9 21 14.7 21 11a9 9 0 0 0-9-9zm-3 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z',
  star:
    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  compass:
    'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm4.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z',
  scroll:
    'M19 17V5a2 2 0 0 0-2-2H4M8 21h12a2 2 0 0 0 2-2v-2H10a2 2 0 0 0-2 2v2zM4 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4z',
  flame:
    'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  gem:
    'M6 3h12l4 6-10 12L2 9l4-6zm0 0l6 6 6-6M2 9h20',
  heart:
    'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  key:
    'M21 2l-2 2m-1.5 1.5L16 4l-2 2 2 2-1.5 1.5L13 8l-2 2 2 2-2.5 2.5A6.5 6.5 0 1 1 3 8a6.5 6.5 0 0 1 9.77-5.55L21 2z',
  lightning:
    'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  potion:
    'M10 2h4M12 2v4M8.5 8h7l4.5 11a2 2 0 0 1-1.85 2.76H5.85A2 2 0 0 1 4 19L8.5 8z',
  dice:
    'M4 4h16v16H4V4zm4 4h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01',
  feather:
    'M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5zM16 8L2 22M17.5 15H9',
  planet:
    'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-8.5 10c0-1.5.3-2.9.8-4.2l12.9 8.5c-.8.8-1.8 1.5-2.9 2L4.5 12.5c-.7-.1-.9-.3-1-.5z'
};

const TIER_METRICS = {
  bronze: {
    label: 'Bronze',
    outerGradient: ['#d97706', '#92400e', '#78350f'],
    innerGlow: '#fde68a',
    starCount: 1,
    ribbon: '#b45309'
  },
  silver: {
    label: 'Silver',
    outerGradient: ['#cbd5e1', '#64748b', '#334155'],
    innerGlow: '#f8fafc',
    starCount: 2,
    ribbon: '#475569'
  },
  gold: {
    label: 'Gold',
    outerGradient: ['#facc15', '#ca8a04', '#713f12'],
    innerGlow: '#fef08a',
    starCount: 3,
    ribbon: '#eab308'
  },
  platinum: {
    label: 'Platinum',
    outerGradient: ['#a855f7', '#06b6d4', '#1e1b4b'],
    innerGlow: '#e0e7ff',
    starCount: 4,
    ribbon: '#6366f1'
  },
  obsidian: {
    label: 'Secret',
    outerGradient: ['#6366f1', '#312e81', '#0f172a'],
    innerGlow: '#c7d2fe',
    starCount: 5,
    ribbon: '#4338ca'
  }
};

export class AiAchievementService {
  /**
   * Creative Vector Badge Generator (SVG data URI)
   * Generates high-detail gaming emblems with metallic rim bevels, tier stars, and game iconography.
   */
  static generateBadgeSvg(
    symbol: BadgeSymbol,
    tier: AchievementTier = 'bronze',
    themeColor: string = '#6366f1',
    unlocked: boolean = true
  ): string {
    const t = TIER_METRICS[tier] || TIER_METRICS.bronze;
    const path = SYMBOL_PATHS[symbol] || SYMBOL_PATHS.trophy;

    // Palette adjustments based on unlocked state
    const gradStart = unlocked ? t.outerGradient[0] : '#475569';
    const gradMid = unlocked ? t.outerGradient[1] : '#334155';
    const gradEnd = unlocked ? t.outerGradient[2] : '#1e293b';
    const iconColor = unlocked ? (themeColor || '#ffffff') : '#94a3b8';
    const bgRadial = unlocked ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.98)';
    const glowOpacity = unlocked ? '0.45' : '0.1';

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <!-- Outer Rim Metallic Gradient -->
    <linearGradient id="rimGrad_${tier}_${unlocked}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStart}"/>
      <stop offset="50%" stop-color="${gradMid}"/>
      <stop offset="100%" stop-color="${gradEnd}"/>
    </linearGradient>

    <!-- Inner Radial Glow -->
    <radialGradient id="innerGlow_${tier}_${unlocked}" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${t.innerGlow}" stop-opacity="${glowOpacity}"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0.95"/>
    </radialGradient>

    <!-- Drop Shadow -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Outer Octagonal / Shield Frame -->
  <polygon points="60,6 98,22 114,60 98,98 60,114 22,98 6,60 22,22"
           fill="url(#rimGrad_${tier}_${unlocked})"
           filter="url(#shadow)"/>

  <!-- Bevel Highlight -->
  <polygon points="60,10 94,24 108,60 94,96 60,110 26,96 12,60 26,24"
           fill="none"
           stroke="#ffffff"
           stroke-opacity="${unlocked ? '0.25' : '0.08'}"
           stroke-width="1.5"/>

  <!-- Inner Badge Chamber -->
  <polygon points="60,14 90,26 102,60 90,94 60,106 30,94 18,60 30,26"
           fill="${bgRadial}"/>
  <polygon points="60,14 90,26 102,60 90,94 60,106 30,94 18,60 30,26"
           fill="url(#innerGlow_${tier}_${unlocked})"/>

  <!-- Center Decorative Glow Ring -->
  <circle cx="60" cy="58" r="30" fill="none" stroke="${iconColor}" stroke-opacity="${unlocked ? '0.3' : '0.1'}" stroke-dasharray="2,3"/>

  <!-- Scaled Icon Symbol (24x24 centered and scaled to 40x40 at (40, 38)) -->
  <g transform="translate(40, 38) scale(1.66)" fill="none" stroke="${iconColor}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="${path}"/>
  </g>

  <!-- Tier Bottom Plate Banner -->
  <path d="M40 102 L60 97 L80 102 L76 110 L60 107 L44 110 Z" fill="${t.ribbon}" opacity="${unlocked ? '1' : '0.4'}"/>

  <!-- Stars Count in Banner -->
  ${Array.from({ length: t.starCount })
    .map((_, i) => {
      const offset = (i - (t.starCount - 1) / 2) * 8;
      return `<circle cx="${60 + offset}" cy="103" r="1.5" fill="#ffffff" opacity="${unlocked ? '0.9' : '0.3'}"/>`;
    })
    .join('')}
</svg>
`.trim();

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  /**
   * Request structured AI achievements from Gemini API (or algorithmic fallback)
   */
  static async generateAchievements(params: {
    gameTitle: string;
    platform?: string;
    genre?: string;
    count?: number;
    difficulty?: 'casual' | 'balanced' | 'hardcore';
    style?: 'canonical' | 'witty' | 'speedrun' | 'lore';
    apiKey?: string;
  }): Promise<AchievementPack> {
    const {
      gameTitle,
      platform = 'Universal',
      genre = 'Adventure',
      count = 20,
      difficulty = 'balanced',
      style = 'canonical',
      apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY
    } = params;

    let achievementsData: GeneratedAchievement[] = [];

    if (apiKey) {
      try {
        achievementsData = await this.callGeminiApi(gameTitle, platform, genre, count, difficulty, style, apiKey);
      } catch (err: any) {
        console.warn(`[AI Service] Gemini API call failed (${err.message}), falling back to smart curated generator.`);
        achievementsData = this.generateCuratedFallback(gameTitle, genre, count, difficulty);
      }
    } else {
      achievementsData = this.generateCuratedFallback(gameTitle, genre, count, difficulty);
    }

    // Enrich all achievements with both unlocked and locked generated SVG badges
    const enriched = achievementsData.map((ach, idx) => {
      const symbol = ach.iconSymbol || this.pickSymbolFromText(ach.displayName + ' ' + ach.description);
      const tier = ach.tier || this.calculateTier(idx, achievementsData.length);
      const color = ach.iconColor || this.pickColorForTier(tier);

      return {
        ...ach,
        tier,
        iconSymbol: symbol,
        iconColor: color,
        iconUnlocked: this.generateBadgeSvg(symbol, tier, color, true),
        iconLocked: this.generateBadgeSvg(symbol, tier, color, false)
      };
    });

    const totalPoints = enriched.reduce((sum, a) => sum + (a.points || 15), 0);

    return {
      $schema: 'https://omniachievements.app/schema/v1/achievements.json',
      formatVersion: '1.0',
      gameTitle,
      platform,
      genre,
      totalAchievements: enriched.length,
      totalPoints,
      generatedBy: apiKey ? 'OmniAchievements AI (Google Gemini 2.5 Flash)' : 'OmniAchievements Curated Engine',
      createdAt: new Date().toISOString(),
      achievements: enriched
    };
  }

  /**
   * Call Google Gemini API with JSON Schema
   */
  private static async callGeminiApi(
    gameTitle: string,
    platform: string,
    genre: string,
    count: number,
    difficulty: string,
    style: string,
    apiKey: string
  ): Promise<GeneratedAchievement[]> {
    const prompt = `
You are an expert game designer, historian, and bilingual trophy architect.
Create an official, exciting, and authentic achievement/trophy list for the video game "${gameTitle}" (${platform}, Genre: ${genre}).

Requirements:
1. Generate exactly ${count} achievements.
2. Tone/Style: ${style} (authentic canonical game lore, witty titles, clear instructions).
3. Difficulty distribution: ${difficulty} (story milestones, optional challenges, secrets, exploration, and a mastery completionist trophy).
4. For each achievement, select the most relevant icon symbol strictly from this list:
   ['sword', 'shield', 'trophy', 'crown', 'skull', 'star', 'compass', 'scroll', 'flame', 'gem', 'heart', 'key', 'lightning', 'potion', 'dice', 'feather', 'planet']
5. Assign a distinct hex accent color (e.g. #3b82f6, #10b981, #f59e0b, #ef4444, #8b5cf6, #06b6d4, #ec4899).
6. Tiers must be distributed: ~50% bronze (10-15 pts), ~30% silver (25-30 pts), ~15% gold (50-75 pts), ~5% platinum/obsidian (100 pts).
7. BILINGUAL LOCALIZATIONS: Every single achievement MUST provide full titles and descriptions in BOTH English ('en') and Spanish ('es'). Use natural, idiomatically accurate gamer terminology in Spanish.

Respond ONLY with a valid JSON array of objects adhering to this schema:
[
  {
    "apiName": "unique_snake_case_id",
    "displayName": "Clever Achievement Title in English",
    "description": "Clear condition on how to unlock this achievement in English",
    "displayName_es": "Título ingenioso del logro en español",
    "description_es": "Condición clara de cómo desbloquear este logro en español",
    "localizations": {
      "en": {
        "displayName": "Clever Achievement Title in English",
        "description": "Clear condition on how to unlock this achievement in English"
      },
      "es": {
        "displayName": "Título ingenioso del logro en español",
        "description": "Condición clara de cómo desbloquear este logro en español"
      }
    },
    "tier": "bronze" | "silver" | "gold" | "platinum" | "obsidian",
    "points": 15,
    "category": "story" | "combat" | "exploration" | "mastery" | "secret",
    "iconSymbol": "sword",
    "iconColor": "#6366f1",
    "secret": false
  }
]
`.trim();

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const res = await axios.post(
      url,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 25000
      }
    );

    const candidates = res.data?.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidate returned from Gemini API');
    }

    const rawText = candidates[0].content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response text from Gemini');

    const parsed = JSON.parse(rawText);
    if (!Array.isArray(parsed)) {
      throw new Error('Gemini response was not a JSON array');
    }

    return parsed.map((item: any) => {
      const enTitle = item.displayName || item.localizations?.en?.displayName || 'Achievement';
      const enDesc = item.description || item.localizations?.en?.description || '';
      const esTitle = item.displayName_es || item.localizations?.es?.displayName || enTitle;
      const esDesc = item.description_es || item.localizations?.es?.description || enDesc;

      return {
        ...item,
        displayName: enTitle,
        description: enDesc,
        displayName_es: esTitle,
        description_es: esDesc,
        localizations: {
          en: { displayName: enTitle, description: enDesc },
          es: { displayName: esTitle, description: esDesc }
        }
      };
    });
  }

  /**
   * Curated algorithmic archetype fallback (works 100% offline without API key)
   */
  private static generateCuratedFallback(
    gameTitle: string,
    genre: string,
    count: number,
    difficulty: string
  ): GeneratedAchievement[] {
    const list: GeneratedAchievement[] = [
      {
        apiName: `${this.slugify(gameTitle)}_first_steps`,
        displayName: 'First Steps',
        description: `Complete the tutorial or prologue in ${gameTitle}.`,
        displayName_es: 'Primeros Pasos',
        description_es: `Completa el tutorial o prólogo en ${gameTitle}.`,
        localizations: {
          en: { displayName: 'First Steps', description: `Complete the tutorial or prologue in ${gameTitle}.` },
          es: { displayName: 'Primeros Pasos', description: `Completa el tutorial o prólogo en ${gameTitle}.` }
        },
        tier: 'bronze',
        points: 10,
        category: 'story',
        iconSymbol: 'compass',
        iconColor: '#3b82f6',
        secret: false
      },
      {
        apiName: `${this.slugify(gameTitle)}_first_blood`,
        displayName: 'Proof of Mettle',
        description: 'Defeat your first major enemy or boss encounter.',
        displayName_es: 'Prueba de Temple',
        description_es: 'Derrota a tu primer enemigo importante o jefe.',
        localizations: {
          en: { displayName: 'Proof of Mettle', description: 'Defeat your first major enemy or boss encounter.' },
          es: { displayName: 'Prueba de Temple', description: 'Derrota a tu primer enemigo importante o jefe.' }
        },
        tier: 'bronze',
        points: 15,
        category: 'combat',
        iconSymbol: 'sword',
        iconColor: '#ef4444',
        secret: false
      },
      {
        apiName: `${this.slugify(gameTitle)}_explorer`,
        displayName: 'Uncharted Territory',
        description: 'Discover your first hidden area or secret cache.',
        displayName_es: 'Territorio Desconocido',
        description_es: 'Descubre tu primera zona oculta o alijo secreto.',
        localizations: {
          en: { displayName: 'Uncharted Territory', description: 'Discover your first hidden area or secret cache.' },
          es: { displayName: 'Territorio Desconocido', description: 'Descubre tu primera zona oculta o alijo secreto.' }
        },
        tier: 'bronze',
        points: 15,
        category: 'exploration',
        iconSymbol: 'key',
        iconColor: '#10b981',
        secret: false
      },
      {
        apiName: `${this.slugify(gameTitle)}_halfway_there`,
        displayName: 'Point of No Return',
        description: 'Reach the midpoint of the main quest or narrative.',
        displayName_es: 'Punto de No Retorno',
        description_es: 'Alcanza el punto medio de la trama principal.',
        localizations: {
          en: { displayName: 'Point of No Return', description: 'Reach the midpoint of the main quest or narrative.' },
          es: { displayName: 'Punto de No Retorno', description: 'Alcanza el punto medio de la trama principal.' }
        },
        tier: 'silver',
        points: 30,
        category: 'story',
        iconSymbol: 'scroll',
        iconColor: '#8b5cf6',
        secret: false
      },
      {
        apiName: `${this.slugify(gameTitle)}_arsenal`,
        displayName: 'Armed to the Teeth',
        description: 'Acquire all core equipment, abilities, or weapon upgrades.',
        displayName_es: 'Armado Hasta los Dientes',
        description_es: 'Consigue todo el equipamiento clave, habilidades o mejoras de armas.',
        localizations: {
          en: { displayName: 'Armed to the Teeth', description: 'Acquire all core equipment, abilities, or weapon upgrades.' },
          es: { displayName: 'Armado Hasta los Dientes', description: 'Consigue todo el equipamiento clave, habilidades o mejoras de armas.' }
        },
        tier: 'silver',
        points: 30,
        category: 'mastery',
        iconSymbol: 'shield',
        iconColor: '#06b6d4',
        secret: false
      },
      {
        apiName: `${this.slugify(gameTitle)}_speedy`,
        displayName: 'Adrenaline Rush',
        description: 'Clear a challenging stage or boss without taking critical damage.',
        displayName_es: 'Subidón de Adrenalina',
        description_es: 'Supera una fase desafiante o jefe sin sufrir daños críticos.',
        localizations: {
          en: { displayName: 'Adrenaline Rush', description: 'Clear a challenging stage or boss without taking critical damage.' },
          es: { displayName: 'Subidón de Adrenalina', description: 'Supera una fase desafiante o jefe sin sufrir daños críticos.' }
        },
        tier: 'silver',
        points: 35,
        category: 'combat',
        iconSymbol: 'lightning',
        iconColor: '#f59e0b',
        secret: false
      },
      {
        apiName: `${this.slugify(gameTitle)}_treasure`,
        displayName: 'Deep Pockets',
        description: 'Collect 100% of the collectible treasures or special tokens.',
        displayName_es: 'Bolsillos Llenos',
        description_es: 'Consigue el 100% de los tesoros coleccionables o fichas especiales.',
        localizations: {
          en: { displayName: 'Deep Pockets', description: 'Collect 100% of the collectible treasures or special tokens.' },
          es: { displayName: 'Bolsillos Llenos', description: 'Consigue el 100% de los tesoros coleccionables o fichas especiales.' }
        },
        tier: 'gold',
        points: 50,
        category: 'exploration',
        iconSymbol: 'gem',
        iconColor: '#ec4899',
        secret: false
      },
      {
        apiName: `${this.slugify(gameTitle)}_conqueror`,
        displayName: 'Legendary Champion',
        description: `Defeat the final boss and view the end credits of ${gameTitle}.`,
        displayName_es: 'Campeón Legendario',
        description_es: `Derrota al jefe final y contempla los créditos de ${gameTitle}.`,
        localizations: {
          en: { displayName: 'Legendary Champion', description: `Defeat the final boss and view the end credits of ${gameTitle}.` },
          es: { displayName: 'Campeón Legendario', description: `Derrota al jefe final y contempla los créditos de ${gameTitle}.` }
        },
        tier: 'gold',
        points: 75,
        category: 'story',
        iconSymbol: 'trophy',
        iconColor: '#eab308',
        secret: false
      },
      {
        apiName: `${this.slugify(gameTitle)}_secret_lore`,
        displayName: 'Keeper of Secrets',
        description: 'Uncover the optional secret post-game dungeon or hidden boss.',
        displayName_es: 'Guardián de Secretos',
        description_es: 'Descubre la mazmorra secreta opcional o jefe oculto posterior al juego.',
        localizations: {
          en: { displayName: 'Keeper of Secrets', description: 'Uncover the optional secret post-game dungeon or hidden boss.' },
          es: { displayName: 'Guardián de Secretos', description: 'Descubre la mazmorra secreta opcional o jefe oculto posterior al juego.' }
        },
        tier: 'obsidian',
        points: 90,
        category: 'secret',
        iconSymbol: 'skull',
        iconColor: '#6366f1',
        secret: true
      },
      {
        apiName: `${this.slugify(gameTitle)}_perfection`,
        displayName: 'Absolute Completion',
        description: `Unlock all other achievements in ${gameTitle}. A true masterpiece achieved!`,
        displayName_es: 'Perfección Absoluta',
        description_es: `Desbloquea todos los demás logros en ${gameTitle}. ¡Una auténtica obra maestra!`,
        localizations: {
          en: { displayName: 'Absolute Completion', description: `Unlock all other achievements in ${gameTitle}. A true masterpiece achieved!` },
          es: { displayName: 'Perfección Absoluta', description: `Desbloquea todos los demás logros en ${gameTitle}. ¡Una auténtica obra maestra!` }
        },
        tier: 'platinum',
        points: 100,
        category: 'mastery',
        iconSymbol: 'crown',
        iconColor: '#a855f7',
        secret: false
      }
    ];

    // If requested count > 10, expand dynamically
    while (list.length < count) {
      const num = list.length + 1;
      const symbols: BadgeSymbol[] = ['star', 'flame', 'heart', 'potion', 'dice', 'feather', 'planet'];
      const sym = symbols[num % symbols.length];
      list.splice(list.length - 1, 0, {
        apiName: `${this.slugify(gameTitle)}_milestone_${num}`,
        displayName: `Heroic Feat #${num}`,
        description: `Overcome stage challenge ${num} with skill and finesse in ${gameTitle}.`,
        displayName_es: `Proeza Heroica #${num}`,
        description_es: `Supera el desafío de fase ${num} con destreza y maestría en ${gameTitle}.`,
        localizations: {
          en: { displayName: `Heroic Feat #${num}`, description: `Overcome stage challenge ${num} with skill and finesse in ${gameTitle}.` },
          es: { displayName: `Proeza Heroica #${num}`, description: `Supera el desafío de fase ${num} con destreza y maestría en ${gameTitle}.` }
        },
        tier: num % 5 === 0 ? 'gold' : num % 2 === 0 ? 'silver' : 'bronze',
        points: num % 5 === 0 ? 50 : 25,
        category: 'mastery',
        iconSymbol: sym,
        iconColor: '#6366f1',
        secret: false
      });
    }

    return list.slice(0, count);
  }

  private static slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24);
  }

  private static calculateTier(index: number, total: number): AchievementTier {
    if (index === total - 1) return 'platinum';
    if (index >= total - 3) return 'gold';
    if (index >= total * 0.5) return 'silver';
    return 'bronze';
  }

  private static pickColorForTier(tier: AchievementTier): string {
    switch (tier) {
      case 'platinum': return '#a855f7';
      case 'gold': return '#eab308';
      case 'silver': return '#94a3b8';
      case 'obsidian': return '#6366f1';
      case 'bronze':
      default: return '#f59e0b';
    }
  }

  private static pickSymbolFromText(text: string): BadgeSymbol {
    const lower = text.toLowerCase();
    if (lower.includes('boss') || lower.includes('kill') || lower.includes('defeat') || lower.includes('strike')) return 'sword';
    if (lower.includes('shield') || lower.includes('parry') || lower.includes('defend')) return 'shield';
    if (lower.includes('secret') || lower.includes('hidden') || lower.includes('skull')) return 'skull';
    if (lower.includes('final') || lower.includes('master') || lower.includes('100%')) return 'crown';
    if (lower.includes('explore') || lower.includes('find') || lower.includes('map')) return 'compass';
    if (lower.includes('treasure') || lower.includes('coin') || lower.includes('gem')) return 'gem';
    if (lower.includes('lore') || lower.includes('story') || lower.includes('read')) return 'scroll';
    if (lower.includes('speed') || lower.includes('fast') || lower.includes('fire')) return 'flame';
    if (lower.includes('complete') || lower.includes('win') || lower.includes('victory')) return 'trophy';
    return 'star';
  }
}
