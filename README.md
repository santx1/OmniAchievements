Disclaimer: This app has been 100% AI made, including documentation and all the code. If you want a human-made app, this is not for you.

<div align="center">

# 🎮 OmniAchievements
### The Definitive Cross-Platform Game & Achievement Hub

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](docker-compose.yml)
[![iOS & iPadOS](https://img.shields.io/badge/iOS_&_iPadOS-Capacitor-000000?style=for-the-badge&logo=apple&logoColor=white)](docs/IOS_IPA_BUILD_GUIDE.md)
[![SteamOS / Decky](https://img.shields.io/badge/SteamOS-Decky_Plugin-1a9fff?style=for-the-badge&logo=steam&logoColor=white)](docs/DECKY_PLUGIN_GUIDE.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](server/)
[![React 18](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](client/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](client/)

<p align="center">
  A self-hosted, multi-user ecosystem that synchronizes all your games, playtimes, and achievements across <strong>Steam, PlayStation, Xbox, Nintendo Switch, RetroArch/Emulators, Epic Games, and GOG</strong> into a single unified app for <strong>iOS, iPadOS, Web, and SteamOS (Legion Go / Steam Deck)</strong>.
</p>

</div>

---

## ✨ Key Features & Integrations

### 🍏 iOS, iPadOS & Web Version
- **Native iOS & iPadOS Experience**: Safe-area support (Dynamic Island, notch, Home bar), iPad split-view and responsive layout, smooth micro-interactions, and offline-capable architecture powered by Capacitor.
- **Web Gateway with Master Password**: Access the web version securely from anywhere. An immediate master password gate blocks unauthorized visitors before any profile or data is accessible.
- **Easy IPA Compilation**: Automated GitHub Actions workflow compiles the `.ipa` for your iPhone and iPad with 1-click in the cloud—no Mac required!

### 📡 Offline-First Architecture & Cloud Auto-Sync
- **Local IndexedDB Database**: Full offline persistence across iOS, iPadOS, and Web. Every profile, game, achievement badge, custom platform, and statistic is stored locally in client-side IndexedDB.
- **100% Offline Functionality**: Play, toggle achievement unlocks, edit game notes, or add custom games with zero internet connection while traveling or on airplanes.
- **Atomic Mutation Queue**: Offline actions are enqueued locally with optimistic UI updates. As soon as connectivity to your server is restored, mutations are automatically flushed to the cloud SQLite backend and synced differential snapshots are pulled.
- **Live Sync Navbar Indicator**: Real-time cloud sync status pill in the top navigation bar (🟢 Synced / 🔄 Syncing... / 🟡 Queued mutations / ⚪ Offline mode) with manual 1-click sync trigger.
- **Settings Storage Dashboard**: Real-time inspection of local cached games, achievements, queued offline actions, and last synchronization timestamp.

### 🔄 Steam API Synchronization, Family Sharing & Auto 100% Detection
- **Automatic Library Sync**: Imports owned games, playtime, and unlocked achievements directly using Valve's official Steam Web API.
- **Steam Family Sharing Multi-Account Sync**: Add family members' Steam accounts in your profile settings. OmniAchievements synchronizes both your own and shared family games with full playtime and achievement tracking.
- **Automatic 100% Classification**: Games with all achievements unlocked are automatically classified as `100% Completed` with gold crown badges and completion animations.
- **Free Bloatware Blacklist**: Easily delete unwanted free games from Steam with a persistent blacklist so they are never imported again during future syncs.

### 🎨 Manual Add, Custom Tags & SteamGridDB Artwork Picker
- **Cross-Platform Manual Game Addition**: Add games from PlayStation 5/4, Xbox Series/One, Nintendo Switch, RetroArch/Emulators, Epic Games, GOG, or Custom platforms.
- **Interactive SteamGridDB Artwork Chooser**: Browse and swap between official 600x900 vertical covers and 1920x620 wide hero banners directly inside any game's detail view.
- **Customizable Console & Platform Tags**: Create, edit (name, hex color), and delete custom console tags in settings. The library filter bar and game card badges adapt dynamically with custom styling.
- **Steam Schema Importer for Non-Steam Games**: Enter a Steam AppID to instantly import official achievements, localized badges, and descriptions for non-Steam games (e.g. console or emulator games).
- **Custom Achievement Creator**: Create custom achievements with custom titles, descriptions, and icons, and toggle unlock statuses anytime.

### 🤖 AI Achievement Architect & Vector Badge Engine
- **Generative AI Trophy Sets**: Create complete, authentic achievement lists for any game (retro, console, emulator, or indie) using Google Gemini (`gemini-2.5-flash`) or offline algorithmic fallbacks.
- **Procedural SVG Vector Badge Generator**: Generates high-res vector badges for locked and unlocked achievement states with glowing halos, tiered geometric crests, and vibrant colors without relying on external image hosts.
- **Universal `.omniachievements.json` Standard**: Export and import complete game achievement sets to share with the community or backup your custom libraries.

### 📊 Advanced Statistics & Visual Analytics
- **Interactive Visual Graphics**: Interactive Donut chart displaying your backlog breakdown: **Unplayed (Backlog)**, **Playing**, **Finished**, and **100% Completed**.
- **Platform Breakdown**: Bar graph comparing game distribution across consoles, PC, and emulators.
- **100% Hall of Fame**: Dedicated showcase highlighting games you have fully completed.
- **Metrics Dashboard**: Total playtime hours, achievement unlock rate, and recent unlock activity timeline.

### 👨‍👩‍👧‍👦 Multi-User Household Profiles
- **Independent Profiles**: Allow multiple people in the same household to maintain separate libraries, playtimes, achievements, and statistics.
- **Minimalist Neutral Avatars & Custom Picture URLs**: Choose from 8 minimalist silhouette color palettes or paste any custom web image URL (Steam, Discord, Gravatar, Imgur, etc.) with live preview.
- **6-Digit Security PIN**: Protect each profile with an iOS-style numeric keypad PIN.
- **Visual Style Modes**: High-contrast OLED dark mode, responsive light mode, system synchronized mode, and custom accent colors (Indigo, Cyan/Steam, Emerald, Amber/Gold, Crimson, Violet, Rose).

### 🕹️ Synchronized Decky Plugin for Legion Go S & Steam Deck
- **Handheld Integration**: Complete Decky Loader plugin for Lenovo Legion Go S and Steam Deck running SteamOS, Bazzite, or ChimeraOS.
- **Non-Steam Game Linking**: Detects running non-Steam shortcuts and links them to OmniAchievements titles.
- **In-Game Overlay**: Displays custom achievements directly inside the SteamOS Quick Access Menu (QAM) while playing!
- **1-Click In-Decky Self-Updater**: Update the plugin directly from the SteamOS Quick Access Menu without leaving Gaming Mode or touching a terminal (supports local server LAN distribution and GitHub channels).
- **Self-Contained & Resilient**: Standalone pre-compiled ES module bundle with zero external npm dependencies, eliminating webview loader crashes.

### 🛡️ Steam Account Safety Guarantee
- **Zero Credential Handling**: OmniAchievements **never asks for or stores your Steam password or Steam Guard codes**.
- **Read-Only API**: Uses Valve's public REST API (`ISteamUserStats` & `IPlayerService`). Your inventory, trade ability, and account security remain 100% untouchable and safe from theft.

---

## 🏗️ Architecture & Project Structure

```text
omniachievements/
├── client/                     # React 18 + TypeScript + Vite + Tailwind + Capacitor
│   ├── src/
│   │   ├── api/                # Transparent offline-first REST client
│   │   ├── components/
│   │   │   ├── auth/           # MasterPasswordGate, ProfileSelector, PinPadModal
│   │   │   ├── games/          # GameCard, GameDetailModal, AddGameModal, LibraryView
│   │   │   ├── layout/         # Navbar (Sync Pill), BottomTabBar, Sidebar
│   │   │   ├── stats/          # StatisticsView, DonutChart, HallOfFame
│   │   │   ├── steam/          # SteamSyncModal, BlacklistManagerModal
│   │   │   └── settings/       # SettingsView (Profiles, Sync Dashboard, Server)
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── utils/              # offlineStore (IndexedDB), syncEngine (Auto-Sync)
│   │   └── types/              # Unified TypeScript definitions
│   ├── capacitor.config.ts     # Capacitor iOS & iPadOS configuration
│   └── vite.config.ts
│
├── server/                     # Node.js + Express + TypeScript + SQLite (better-sqlite3)
│   ├── src/
│   │   ├── config/             # Environment & data/config.json loader
│   │   ├── db/                 # SQLite database initialization & migrations
│   │   ├── middleware/         # Master password auth & Profile PIN verification
│   │   ├── services/
│   │   │   ├── steamService.ts        # Steam Web API (games, achievements, schema)
│   │   │   └── steamGridDbService.ts  # SteamGridDB API (covers, heroes, icons)
│   │   ├── routes/             # REST endpoints (auth, profiles, games, stats, sync, decky)
│   │   └── index.ts
│   └── tsconfig.json
│
├── decky-plugin/               # Legion Go S / Steam Deck Decky Loader Plugin
│   ├── plugin.json             # Decky manifest
│   ├── main.py                 # Python backend running in SteamOS daemon
│   └── src/index.tsx           # React UI for SteamOS Quick Access Menu
│
├── .github/workflows/
│   └── build-ios.yml           # Automated macOS GitHub Actions workflow compiling IPA
│
├── docker/
│   └── Dockerfile              # Multi-stage production container
├── docker-compose.yml          # 1-command local deployment
├── .env.example                # Configuration template
└── docs/                       # Comprehensive documentation
    ├── SETUP_GUIDE.md          # Server self-hosting & reverse proxy setup
    ├── STEAM_API_GUIDE.md      # Steam Web API key & account security model
    ├── IOS_IPA_BUILD_GUIDE.md  # How to compile & sideload the IPA on iOS/iPadOS
    └── DECKY_PLUGIN_GUIDE.md   # Legion Go / SteamOS Decky plugin guide
```

---

## 🚀 Quickstart: Self-Hosting with Docker

### 1. Clone the repository
```bash
git clone https://github.com/your-username/omniachievements.git
cd omniachievements
```

### 2. Configure Environment
```bash
cp .env.example .env
nano .env
```
Set your `MASTER_PASSWORD`, `STEAM_API_KEY`, `STEAMGRIDDB_API_KEY`, and optional `GEMINI_API_KEY` (for the AI Achievement Architect).

### 3. Start the Server
```bash
docker compose up -d
```
The server will be available at:
👉 **`http://localhost:3001`** (or your server's local network IP).

---

## 📱 Compiling the iOS & iPadOS IPA

You can compile the iOS/iPadOS app using **GitHub Actions with zero Mac requirements**:
1. Push this repo to GitHub.
2. Go to **Actions > Build iOS & iPadOS IPA > Run workflow**.
3. Download the compiled `OmniAchievements.ipa` artifact.
4. Sideload via **SideStore**, **AltStore**, **TrollStore**, or **Sideloadly**.

📖 Read the complete [iOS & iPadOS IPA Compilation Guide](docs/IOS_IPA_BUILD_GUIDE.md).

---

## 🎮 Installing on Legion Go S & Steam Deck (Decky Plugin)

1. Copy the `decky-plugin/` folder to `~/homebrew/plugins/OmniAchievements` on your handheld.
2. Restart Decky: `sudo systemctl restart plugin_loader.service`.
3. Open the Quick Access Menu in game to link non-Steam titles and track achievements on your Legion Go!
4. **Future Updates**: Update directly from Decky with 1 click using the built-in **Plugin Self-Updater**!

📖 Read the complete [Legion Go & Steam Deck Plugin Guide](docs/DECKY_PLUGIN_GUIDE.md).

---

## 📚 Documentation
- [Self-Hosting & Reverse Proxy Guide](docs/SETUP_GUIDE.md)
- [Steam Web API, Security & Family Sharing Guide](docs/STEAM_API_GUIDE.md)
- [AI Achievement Architect & Vector Badges Guide](docs/AI_ACHIEVEMENTS_GUIDE.md)
- [iOS / iPadOS IPA Compilation Guide](docs/IOS_IPA_BUILD_GUIDE.md)
- [Legion Go / SteamOS Decky Plugin & Self-Updater Guide](docs/DECKY_PLUGIN_GUIDE.md)

---

## 📄 License
MIT License. Built for the gaming community.
