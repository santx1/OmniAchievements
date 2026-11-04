import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import confetti from 'canvas-confetti';
import { useLanguage } from '../../context/LanguageContext.js';
import {
  X,
  Sparkles,
  Wand2,
  Download,
  Upload,
  Copy,
  Check,
  RefreshCw,
  Trophy,
  Shield,
  Trash2,
  Plus,
  Edit2,
  FileJson,
  Key,
  ExternalLink,
  ChevronDown,
  Layers,
  Palette,
  Globe
} from 'lucide-react';

interface AiAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId?: string;
  gameTitle?: string;
  platform?: string;
  onAchievementsApplied?: () => void;
  onAchievementsGenerated?: (achievements: GeneratedAchievement[]) => void;
}

export interface GeneratedAchievement {
  apiName: string;
  displayName: string;
  description: string;
  displayName_es?: string;
  description_es?: string;
  localizations?: {
    en?: { displayName?: string; description?: string };
    es?: { displayName?: string; description?: string };
  };
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'obsidian';
  points: number;
  category: 'story' | 'combat' | 'exploration' | 'mastery' | 'secret';
  iconSymbol: string;
  iconColor: string;
  secret: boolean;
  iconUnlocked?: string;
  iconLocked?: string;
}

const BADGE_SYMBOLS = [
  'sword', 'shield', 'trophy', 'crown', 'skull', 'star',
  'compass', 'scroll', 'flame', 'gem', 'heart', 'key',
  'lightning', 'potion', 'dice', 'feather', 'planet'
];

const PRESET_COLORS = [
  '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#8b5cf6', '#d946ef', '#64748b'
];

export const AiAchievementModal: React.FC<AiAchievementModalProps> = ({
  isOpen,
  onClose,
  gameId,
  gameTitle = '',
  platform = 'Universal',
  onAchievementsApplied,
  onAchievementsGenerated
}) => {
  const { language, t, getAchievementText } = useLanguage();
  // Generation parameters
  const [title, setTitle] = useState(gameTitle);
  const [gamePlatform, setGamePlatform] = useState(platform);
  const [genre, setGenre] = useState('Adventure / Action');
  const [count, setCount] = useState<number>(20);
  const [difficulty, setDifficulty] = useState<'casual' | 'balanced' | 'hardcore'>('balanced');
  const [style, setStyle] = useState<'canonical' | 'witty' | 'speedrun' | 'lore'>('canonical');
  const [apiKey, setApiKey] = useState(localStorage.getItem('omni_gemini_api_key') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [previewLang, setPreviewLang] = useState<'en' | 'es'>(language);

  // Results & UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [achievements, setAchievements] = useState<GeneratedAchievement[]>([]);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active editor index
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  useEffect(() => {
    if (gameTitle) setTitle(gameTitle);
    if (platform) setGamePlatform(platform);
  }, [gameTitle, platform]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!title.trim()) {
      setErrorMessage('Please enter a game title.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Save API key if provided
    if (apiKey.trim()) {
      localStorage.setItem('omni_gemini_api_key', apiKey.trim());
    }

    try {
      const res = await api.generateAiAchievements({
        gameTitle: title.trim(),
        platform: gamePlatform.trim(),
        genre: genre.trim(),
        count,
        difficulty,
        style,
        apiKey: apiKey.trim() || undefined
      });

      if (res.pack?.achievements) {
        setAchievements(res.pack.achievements);
        setSuccessMessage(`✓ Successfully generated ${res.pack.achievements.length} achievements!`);
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMessage(err.message || 'Failed to generate achievements with AI');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyToGame = async () => {
    if (!gameId || achievements.length === 0) return;
    setIsApplying(true);
    setErrorMessage(null);

    try {
      await api.applyAiAchievements(gameId, achievements, replaceExisting);
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });
      setSuccessMessage('✓ Achievements applied to game successfully!');
      if (onAchievementsApplied) {
        onAchievementsApplied();
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to apply achievements');
    } finally {
      setIsApplying(false);
    }
  };

  const handleExportJson = () => {
    if (achievements.length === 0) return;

    const pack = {
      $schema: 'https://omniachievements.app/schema/v1/achievements.json',
      formatVersion: '1.1',
      gameTitle: title,
      platform: gamePlatform,
      genre,
      totalAchievements: achievements.length,
      totalPoints: achievements.reduce((sum, a) => sum + (a.points || 15), 0),
      generatedBy: 'OmniAchievements AI Generator (Bilingual EN/ES)',
      createdAt: new Date().toISOString(),
      supportedLanguages: ['en', 'es'],
      achievements: achievements.map((a) => ({
        apiName: a.apiName,
        displayName: a.displayName,
        description: a.description,
        displayName_es: a.displayName_es || a.localizations?.es?.displayName || a.displayName,
        description_es: a.description_es || a.localizations?.es?.description || a.description,
        localizations: a.localizations || {
          en: { displayName: a.displayName, description: a.description },
          es: {
            displayName: a.displayName_es || a.displayName,
            description: a.description_es || a.description
          }
        },
        tier: a.tier,
        points: a.points,
        category: a.category,
        iconSymbol: a.iconSymbol,
        iconColor: a.iconColor,
        secret: a.secret,
        iconUnlocked: a.iconUnlocked,
        iconLocked: a.iconLocked
      }))
    };

    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.omniachievements.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const list = Array.isArray(data) ? data : data.achievements;
        if (Array.isArray(list) && list.length > 0) {
          const normalized: GeneratedAchievement[] = list.map((item: any, idx: number) => {
            const enTitle = item.displayName || item.display_name || item.localizations?.en?.displayName || `Achievement ${idx + 1}`;
            const enDesc = item.description || item.localizations?.en?.description || '';
            const esTitle = item.displayName_es || item.display_name_es || item.localizations?.es?.displayName || enTitle;
            const esDesc = item.description_es || item.localizations?.es?.description || enDesc;

            return {
              apiName: item.apiName || item.api_name || `ACH_${idx + 1}`,
              displayName: enTitle,
              description: enDesc,
              displayName_es: esTitle,
              description_es: esDesc,
              localizations: {
                en: { displayName: enTitle, description: enDesc },
                es: { displayName: esTitle, description: esDesc }
              },
              tier: item.tier || 'bronze',
              points: item.points || 15,
              category: item.category || 'story',
              iconSymbol: item.iconSymbol || item.icon_symbol || 'trophy',
              iconColor: item.iconColor || item.icon_color || '#6366f1',
              secret: !!item.secret,
              iconUnlocked: item.iconUnlocked || item.icon_unlocked,
              iconLocked: item.iconLocked || item.icon_locked
            };
          });

          setAchievements(normalized);
          if (data.gameTitle) setTitle(data.gameTitle);
          if (data.platform) setGamePlatform(data.platform);
          setSuccessMessage(`✓ Imported ${normalized.length} bilingual achievements from file!`);
        } else {
          setErrorMessage('Invalid file: no achievements array found.');
        }
      } catch (err) {
        setErrorMessage('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleCopyPrompt = () => {
    const promptText = `Please generate an official, lore-accurate, and engaging achievement list for the video game "${title}" (${gamePlatform}, Genre: ${genre}).
Generate ${count} achievements with difficulty ${difficulty} and style ${style}.
CRITICAL BILINGUAL REQUIREMENT:
Provide BOTH English and Spanish localizations for every achievement:
- displayName (in English)
- description (in English)
- displayName_es (in authentic Spanish gamer terminology)
- description_es (in authentic Spanish)
- localizations: {"en": {"displayName": "...", "description": "..."}, "es": {"displayName": "...", "description": "..."}}

Return ONLY a valid JSON array of objects with keys:
apiName, displayName, description, displayName_es, description_es, localizations, tier ("bronze"|"silver"|"gold"|"platinum"|"obsidian"), points (10 to 100), category ("story"|"combat"|"exploration"|"mastery"|"secret"), iconSymbol (one of sword, shield, trophy, crown, skull, star, compass, scroll, flame, gem, heart, key, lightning, potion, dice, feather, planet), iconColor (hex code), secret (boolean).`;

    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const updateAchievement = (index: number, updates: Partial<GeneratedAchievement>) => {
    setAchievements((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const removeAchievement = (index: number) => {
    setAchievements((prev) => prev.filter((_, i) => i !== index));
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'gold': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'silver': return 'text-slate-300 bg-slate-500/10 border-slate-500/30';
      case 'obsidian': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      case 'bronze':
      default: return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl glass-dark border border-indigo-500/40 shadow-2xl p-4 sm:p-6 my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 shrink-0 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {t('ai.modalTitle')}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {t('ai.bilingualBadge')}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t('ai.modalSub')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content split in 2 tabs / scrollable area */}
        <div className="overflow-y-auto flex-grow space-y-5 pr-1">
          {/* Generator Parameters Card */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Game Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Legend of Zelda: The Wind Waker"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Platform
                </label>
                <input
                  type="text"
                  value={gamePlatform}
                  onChange={(e) => setGamePlatform(e.target.value)}
                  placeholder="e.g. Nintendo GameCube, PS2, Switch"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Genre / Setting
                </label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g. Action RPG, Metroidvania, JRPG"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Count
                </label>
                <select
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={10}>10 (Compact)</option>
                  <option value={20}>20 (Standard)</option>
                  <option value={30}>30 (Extended)</option>
                  <option value={40}>40 (Completionist)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="casual">Casual (Story focused)</option>
                  <option value="balanced">Balanced (Official style)</option>
                  <option value="hardcore">Hardcore (Mastery)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Writing Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as any)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="canonical">Canonical & Lore-Accurate</option>
                  <option value="witty">Witty & Humorous</option>
                  <option value="speedrun">Speedrun & Challenges</option>
                  <option value="lore">Mysterious & Secret Lore</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300 hover:text-white flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Gemini Key</span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showApiKeyInput ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Optional Gemini API Key Drawer */}
            {showApiKeyInput && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300">
                    Google Gemini API Key (Optional)
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Free Key (Google AI Studio)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste AI Studio API Key here (or leave blank to use server key / curated engine)"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white placeholder-slate-500"
                />
              </div>
            )}

            {/* Primary Action Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !title.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  <span>{isGenerating ? 'Generating with AI...' : 'Generate Achievements'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Copy ready-to-use prompt for ChatGPT, Claude or Gemini web"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPrompt ? 'Copied Prompt!' : 'Copy Prompt'}</span>
                </button>
              </div>

              {/* Import / Export Controls */}
              <div className="flex items-center gap-2">
                <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Import .json</span>
                  <input
                    type="file"
                    accept=".json,.omniachievements.json"
                    onChange={handleImportJsonFile}
                    className="hidden"
                  />
                </label>

                {achievements.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Export achievements with embedded vector badge artwork as JSON"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export .json</span>
                  </button>
                )}
              </div>
            </div>

            {errorMessage && (
              <p className="text-xs font-semibold text-rose-400">{errorMessage}</p>
            )}
            {successMessage && (
              <p className="text-xs font-semibold text-emerald-400">{successMessage}</p>
            )}
          </div>

          {/* Generated Achievements List Preview */}
          {achievements.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>
                    {t('ai.previewTitle', {
                      count: achievements.length,
                      points: achievements.reduce((sum, a) => sum + (a.points || 15), 0)
                    })}
                  </span>
                </span>

                {/* Bilingual Preview Switcher */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <Globe className="w-3.5 h-3.5 text-indigo-400 ml-1" />
                  <span className="text-[10px] text-slate-400 px-1">{t('ai.previewLangToggle')}</span>
                  <button
                    type="button"
                    onClick={() => setPreviewLang('en')}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors ${
                      previewLang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewLang('es')}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors ${
                      previewLang === 'es' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Español
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {achievements.map((ach, idx) => {
                  const isEditingThis = editingIdx === idx;
                  const tierStyle = getTierColor(ach.tier);

                  const displayedTitle = previewLang === 'es' && (ach.displayName_es || ach.localizations?.es?.displayName)
                    ? (ach.displayName_es || ach.localizations?.es?.displayName)
                    : ach.displayName;
                  const displayedDesc = previewLang === 'es' && (ach.description_es || ach.localizations?.es?.description)
                    ? (ach.description_es || ach.localizations?.es?.description)
                    : ach.description;

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all flex items-start gap-3 relative group"
                    >
                      {/* Creative Vector Badge Icon Thumbnail */}
                      <button
                        type="button"
                        onClick={() => setEditingIdx(isEditingThis ? null : idx)}
                        className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-700 bg-slate-950 p-1 hover:scale-105 transition-transform relative group/badge"
                        title="Click to customize badge symbol & color"
                      >
                        <img
                          src={ach.iconUnlocked}
                          alt={displayedTitle}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/badge:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-opacity">
                          <Palette className="w-3.5 h-3.5" />
                        </div>
                      </button>

                      {/* Content */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider border ${tierStyle}`}>
                              {ach.tier}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-800 text-slate-400">
                              {ach.points || 15} pts
                            </span>
                            {ach.secret && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-indigo-900/40 text-indigo-300 border border-indigo-700/50">
                                Secret
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingIdx(isEditingThis ? null : idx)}
                              className="text-slate-500 hover:text-white p-1"
                              title="Edit achievement"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAchievement(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Remove achievement"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {isEditingThis ? (
                          <div className="space-y-2 mt-2 pt-2 border-t border-slate-800">
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Title (EN):</label>
                              <input
                                type="text"
                                value={ach.displayName}
                                onChange={(e) => updateAchievement(idx, { displayName: e.target.value })}
                                className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white mb-1"
                              />
                              <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Título (ES):</label>
                              <input
                                type="text"
                                value={ach.displayName_es || ''}
                                onChange={(e) => updateAchievement(idx, { displayName_es: e.target.value })}
                                placeholder="Nombre en español..."
                                className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Description (EN):</label>
                              <textarea
                                rows={2}
                                value={ach.description}
                                onChange={(e) => updateAchievement(idx, { description: e.target.value })}
                                className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white mb-1"
                              />
                              <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Descripción (ES):</label>
                              <textarea
                                rows={2}
                                value={ach.description_es || ''}
                                onChange={(e) => updateAchievement(idx, { description_es: e.target.value })}
                                placeholder="Descripción en español..."
                                className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                              />
                            </div>

                            {/* Badge Symbol Chooser */}
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                                Choose Badge Symbol:
                              </span>
                              <div className="flex gap-1.5 overflow-x-auto pb-1">
                                {BADGE_SYMBOLS.map((sym) => (
                                  <button
                                    key={sym}
                                    type="button"
                                    onClick={() => updateAchievement(idx, { iconSymbol: sym })}
                                    className={`px-2 py-0.5 rounded text-[10px] capitalize font-medium shrink-0 ${
                                      ach.iconSymbol === sym
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {sym}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h4 className="font-bold text-xs text-white line-clamp-1">
                              {displayedTitle}
                            </h4>
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                              {displayedDesc}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="pt-4 mt-3 border-t border-slate-800 shrink-0 flex flex-wrap items-center justify-between gap-3">
          {gameId && (
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
              />
              <span>Replace existing custom achievements</span>
            </label>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              {t('common.close')}
            </button>

            {gameId && achievements.length > 0 && (
              <button
                type="button"
                onClick={handleApplyToGame}
                disabled={isApplying}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
              >
                {isApplying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isApplying ? t('ai.applying') : `${t('ai.applyToGameBtn')} (${achievements.length})`}</span>
              </button>
            )}

            {!gameId && onAchievementsGenerated && achievements.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onAchievementsGenerated(achievements);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('ai.applyToGameBtn')} ({achievements.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
