# 🤖 AI Achievement Architect & Vector Badge Engine

OmniAchievements includes an **AI Achievement Architect** designed to generate authentic, balanced, and creative achievement sets for any non-Steam game, emulator title, console exclusive, or homebrew project.

---

## 🌟 Key Capabilities

### 1. Google Gemini 2.5 Flash Integration
* When configured with a `GEMINI_API_KEY`, OmniAchievements uses Google's `gemini-2.5-flash` model to analyze the game title, genre, story progression, and iconic secrets.
* Produces structured trophy lists matching standard industry distribution:
  * **Story & Progression**: Milestones, bosses, story acts.
  * **Mastery & Skill**: Speedruns, no-damage challenges, high combos.
  * **Exploration & Collectibles**: Hidden easter eggs, secret areas, 100% item discovery.
  * **Platinum Pinnacle**: Final triumph unlocked only upon completing all challenges.
* **Offline Fallback Engine**: If no API key is configured or the system is offline, an algorithmic generator constructs a balanced, thematic 10-trophy set automatically.

---

## 🎨 Procedural SVG Vector Badge Generator

Unlike external web services where badge icons can break or suffer from 404 dead links, OmniAchievements generates **self-contained procedural SVG vector badges** for every achievement:
* **Dynamic Color Theming**: Badges adapt to the game's theme and rarity tiers:
  * 🥉 **Bronze**: Deep metallic copper and amber glow.
  * 🥈 **Silver**: Gleaming platinum steel and frost highlights.
  * 🥇 **Gold**: Radiant yellow-gold with dual-ring star halos.
  * 💎 **Platinum / Diamond**: Ultra-rare cosmic purple and diamond aura.
* **Locked & Unlocked States**:
  * *Locked*: High-contrast muted slate with embossed padlock and darkened silhouette.
  * *Unlocked*: Fully saturated geometric shields, radiant particle accents, and sharp vector geometry rendered crisply on any Retina or OLED display.
* **Base64 Data URIs**: Stored directly in the SQLite database, guaranteeing instant offline rendering without network requests.

---

## 📦 The `.omniachievements.json` File Standard

To facilitate community sharing, backups, and emulator integration, custom achievement sets can be exported and imported using the `.omniachievements.json` standard format:

```json
{
  "$schema": "https://omniachievements.local/schemas/v1.json",
  "game": {
    "title": "The Legend of Zelda: Ocarina of Time",
    "platform": "Nintendo 64",
    "developer": "Nintendo EAD",
    "releaseYear": 1998
  },
  "metadata": {
    "exportedAt": "2026-11-03T23:00:00Z",
    "author": "AI Achievement Architect",
    "totalCount": 24,
    "version": "1.0.0"
  },
  "achievements": [
    {
      "id": "ach_oot_01",
      "displayName": "The Hero Awakens",
      "description": "Receive the Fairy Ocarina from Saria and leave Kokiri Forest.",
      "category": "story",
      "points": 10,
      "tier": "bronze",
      "iconUnlocked": "data:image/svg+xml;utf8,...",
      "iconLocked": "data:image/svg+xml;utf8,..."
    },
    {
      "id": "ach_oot_24",
      "displayName": "Hero of Time",
      "description": "Defeat Ganondorf, seal the King of Evil, and restore peace to Hyrule.",
      "category": "mastery",
      "points": 100,
      "tier": "platinum",
      "iconUnlocked": "data:image/svg+xml;utf8,...",
      "iconLocked": "data:image/svg+xml;utf8,..."
    }
  ]
}
```

---

## 🚀 How to Generate Achievements with AI

1. Open OmniAchievements and click on any custom or non-Steam game.
2. In the game modal, tap **AI Architect** (sparkle icon ✨).
3. (Optional) Provide special instructions or themes (e.g. *"Focus on speedrun challenges and secret Easter eggs"*).
4. Tap **Generate Achievement List**.
5. Review the proposed trophies and badges.
6. Click **Save to Game Library** or **Export to `.omniachievements.json`**.
