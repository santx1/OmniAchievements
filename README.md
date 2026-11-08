Disclaimer: This app has been 100% AI made, including documentation and all the code. If you want a human-made app, this is not for you.

<div align="center">

# 🎮 OmniAchievements
### The Definitive Self-Hosted Cross-Platform Game & Achievement Hub

[![Docker](https://img.shields.io/badge/Docker-Multi--Arch%20(amd64%20%7C%20arm64)-2496ED?style=for-the-badge&logo=docker&logoColor=white)](docker-compose.yml)
[![GHCR](https://img.shields.io/badge/GHCR-ghcr.io%2Fsantx1%2Fomniachievements-blue?style=for-the-badge&logo=github)](https://github.com/santx1/OmniAchievements/pkgs/container/omniachievements)
[![iOS & iPadOS](https://img.shields.io/badge/iOS_&_iPadOS-PWA_%7C_IPA-000000?style=for-the-badge&logo=apple&logoColor=white)](docs/IOS_IPA_BUILD_GUIDE.md)
[![SteamOS / Decky](https://img.shields.io/badge/SteamOS-Decky_Plugin-1a9fff?style=for-the-badge&logo=steam&logoColor=white)](docs/DECKY_PLUGIN_GUIDE.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](server/)
[![React 18](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](client/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](client/)

<p align="center">
  A self-hosted, multi-user ecosystem that synchronizes all your games, playtimes, and achievements across <strong>Steam, PlayStation, Xbox, Nintendo Switch, RetroArch/Emulators, Epic Games, and GOG</strong> into a single unified app for <strong>iOS, iPadOS, Web, and SteamOS (Steam Deck & other handhelds)</strong>.
</p>

</div>

---

## 📱 Supported Devices & Operating Systems

| Platform | Recommended Client | Key Capabilities |
|---|---|---|
| **Web Browser (PC, Mac, Linux)** | Web Dashboard (`http://server:3001`) | Full desktop layout, master password protection, library management, statistics, profile switching. |
| **iPhone & iPad** | **PWA** (Add to Home Screen) or **Native IPA** | Full screen, offline IndexedDB sync, Dynamic Island safe-area support, atomic mutation queue. |
| **Steam Deck & Other Handhelds** *(Steam Deck LCD/OLED, ROG Ally, Legion Go, MSI Claw running SteamOS, Bazzite, ChimeraOS)* | **Decky Loader Plugin** (`OmniAchievements-Decky.zip`) | Quick Access Menu overlay while playing, in-game achievement notifications, links non-Steam titles, 1-click self-updater. |
| **Home Servers & NAS** *(Ubuntu, Debian, TrueNAS SCALE, Unraid, Synology, Raspberry Pi 4/5, Apple Silicon)* | **Docker Image** (`ghcr.io/santx1/omniachievements:latest`) | Native `amd64` and `arm64` builds, persistent SQLite storage, zero external database setup required. |

---

## ✨ Key Features

### 🍏 iOS, iPadOS & Web Experience
- **Progressive Web App (PWA)**: Add to Home Screen in 10 seconds with zero 7-day certificate resigning and instant automatic updates whenever the server updates.
- **Native Sideloaded IPA**: Standalone `.ipa` binary ready for **SideStore**, **AltStore**, **TrollStore**, or **Sideloadly**.
- **Web Security Gate**: An immediate Master Password gate blocks unauthorized visitors before any profile or game data is shown.

### 📡 Offline-First Architecture & Cloud Auto-Sync
- **Local IndexedDB Storage**: Every profile, game, achievement badge, and note is cached locally on client devices.
- **100% Offline Capable**: Play, unlock achievements, or organize your backlog with zero internet connection while traveling.
- **Atomic Mutation Queue**: Offline actions are queued locally with optimistic UI updates. When reconnecting to your home server, changes are automatically pushed in an atomic batch and synced cloud snapshots are pulled.
- **Live Sync Navbar Indicator**: Live pill in top navigation bar (🟢 Synced / 🔄 Syncing... / 🟡 N Queued / ⚪ Offline).

### 🔄 Steam API Synchronization, Family Sharing & Auto 100%
- **Automatic Library Sync**: Imports owned games, playtime, and unlocked achievements directly using Valve's official Steam Web API.
- **Steam Family Sharing Multi-Account Sync**: Add family members' Steam IDs in your profile to track both owned and shared family games with full playtime and achievement progress.
- **Automatic 100% Classification**: Games with all achievements unlocked are automatically classified as `100% Completed` with gold crown badges.
- **Free Game Blacklist**: Easily delete unwanted free-to-play or test games with a persistent blacklist so they are never re-imported.
- **100% Steam Account Safety**: Never asks for Steam passwords or Steam Guard codes. Uses read-only Valve public APIs.

### 🎨 Manual Games, Custom Tags & SteamGridDB Artwork
- **Add Any Game from Any Console**: PlayStation 5/4, Xbox Series/One, Nintendo Switch, RetroArch/Emulators, Epic Games, GOG, or Custom platforms.
- **Interactive SteamGridDB Artwork Chooser**: Browse and swap between official vertical 600x900 box covers and 1920x620 wide hero banners directly inside any game's detail view.
- **Customizable Console & Platform Tags**: Create, edit (name, hex color), and delete custom console tags. The library filter bar and game card badges adapt dynamically.
- **Steam Schema Importer for Non-Steam Games**: Enter any Steam AppID to instantly import official achievements, localized badges, and descriptions for non-Steam console or emulator games.

### 🤖 AI Achievement Architect & Vector Badges
- **Generative AI Trophy Sets**: Create authentic, structured achievement sets for any retro, console, emulator, or indie game using Google Gemini (`gemini-2.5-flash`) or offline algorithmic fallbacks.
- **Procedural SVG Vector Badge Generator**: Generates high-res vector badges for locked and unlocked states with glowing halos, tiered geometric crests, and vibrant colors without relying on external image hosts.
- **Universal `.omniachievements.json` Standard**: Export and import complete achievement sets to share with friends or backup your custom libraries.

### 🕹️ Steam Deck & Handhelds Decky Loader Plugin
- **In-Game Overlay**: Displays unlocked and locked achievements directly inside the SteamOS Quick Access Menu (QAM) while playing non-Steam titles!
- **Auto-Detection**: Multi-layer process detection automatically detects running games and links them to your OmniAchievements library.
- **1-Click Self-Updater**: Update the plugin directly from the SteamOS Quick Access Menu without leaving Gaming Mode or touching a terminal.
- **Resilient ES Module Bundle**: Pre-compiled standalone bundle with zero external npm dependencies, eliminating webview loader crashes.

### 👨‍👩‍👧‍👦 Multi-User Household Profiles
- **Independent Profiles**: Separate libraries, playtimes, achievements, and statistics for everyone in your household.
- **Custom Avatars & 6-Digit PIN**: Choose from minimalist silhouette color palettes or paste any web image URL (Steam, Discord, Gravatar). Protect profiles with an iOS-style numeric keypad PIN.
- **Theme Accents & Dark Mode**: High-contrast OLED dark mode, responsive light mode, and customizable accent presets (Cyan, Indigo, Emerald, Amber, Crimson, Violet, Rose).

---

## 🚀 Quickstart: Server Deployment (Docker)

OmniAchievements is packaged as a multi-arch container image (**`linux/amd64`** and **`linux/arm64`**) ready to deploy in seconds.

### Method 1: Instant 1-Line Run (Pre-Built Image)
Run this single command to start the server immediately:
```bash
docker run -d \
  --name omniachievements \
  --restart unless-stopped \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  -e MASTER_PASSWORD=MySecretPassword123! \
  ghcr.io/santx1/omniachievements:latest
```

---

### Method 2: Docker Compose (Recommended)
Create a `docker-compose.yml` file on your server or PC:

```yaml
services:
  omniachievements:
    container_name: omniachievements
    image: ghcr.io/santx1/omniachievements:latest
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATA_DIR=/app/data
      - MASTER_PASSWORD=MySecretPassword123!   # Gateway password (change this!)
      - STEAM_API_KEY=                        # (Optional) https://steamcommunity.com/dev/apikey
      - STEAMGRIDDB_API_KEY=                  # (Optional) https://www.steamgriddb.com/profile/preferences/api
      - GEMINI_API_KEY=                       # (Optional) https://aistudio.google.com/
      - JWT_SECRET=change_to_a_random_string  # Secret for signing session tokens
    volumes:
      - ./data:/app/data
```

Start the container in the background:
```bash
docker compose up -d
```
Open your browser at:
👉 **`http://localhost:3001`** (or your server's local network IP).

---

### Method 3: TrueNAS SCALE Deployment

#### 1. Create a Dataset for Persistent Storage
1. In TrueNAS web UI, navigate to **Datasets**.
2. Select your pool (e.g. `tank`), click **Add Dataset**, and name it `omniachievements` (path: `/mnt/tank/omniachievements`).
3. Ensure standard read/write permissions.

#### 2. Install the App
- **TrueNAS SCALE 24.10+ (Electric Eel / Docker Compose)**:
  1. Go to **Apps** > **Discover Apps** > **Custom App**.
  2. Choose **Install via Docker Compose**, name: `omniachievements`.
  3. Paste the Compose configuration above, replacing `./data` with `/mnt/tank/omniachievements`.
  4. Click **Save** to launch.

- **TrueNAS SCALE 24.04 and earlier (GUI Form)**:
  1. Go to **Apps** > **Discover Apps** > **Custom App**.
  2. Set Name: `omniachievements`.
  3. Image repository: `ghcr.io/santx1/omniachievements`, Tag: `latest`.
  4. Port Forwarding: Container `3001` -> Host `3001` (or NodePort `30301`).
  5. Storage: Add **Host Path Volume**, Host: `/mnt/tank/omniachievements`, Container: `/app/data`.
  6. Environment variables: Add `MASTER_PASSWORD` with your password.
  7. Click **Save**.

---

### Method 4: Unraid & Synology NAS

- **Unraid**: Go to **Docker** tab > **Add Container** > Name: `omniachievements` > Repository: `ghcr.io/santx1/omniachievements:latest` > Port: `3001:3001` > Volume: `/mnt/user/appdata/omniachievements` to `/app/data` > Add variable `MASTER_PASSWORD`. Click **Apply**.
- **Synology (Container Manager)**: Go to **Project** > **Create** > Name: `omniachievements` > Choose folder (e.g. `/docker/omniachievements`) > Paste the `docker-compose.yml` above > Click **Done**.

---

## ⚙️ Environment Variables Reference

| Variable | Description | Default / Example | Required? |
|---|---|---|---|
| `MASTER_PASSWORD` | Security gate password. Blocks unauthorized visitors before any profile or data is shown. | `changeme123` | **Yes (Change it!)** |
| `PORT` | Internal HTTP listening port. | `3001` | No |
| `DATA_DIR` | Internal directory where SQLite database, backups, and configs are stored. | `/app/data` | No |
| `STEAM_API_KEY` | Valve Web API key to sync Steam games, playtime, and official achievements. | Free at [Steam Dev](https://steamcommunity.com/dev/apikey) | Optional |
| `STEAMGRIDDB_API_KEY` | Key to search and choose official vertical covers & hero banners. | Free at [SteamGridDB](https://www.steamgriddb.com/profile/preferences/api) | Optional |
| `GEMINI_API_KEY` | Google Gemini key to generate custom retro/indie achievements with AI. | Free at [Google AI Studio](https://aistudio.google.com/) | Optional |
| `JWT_SECRET` | Secret key used to sign session and Decky pairing tokens. | Any random string | Recommended |

---

## 🌐 Remote Access & Tunnels (TCP vs UDP)

OmniAchievements is an HTTP/REST application running on port `3001`. All communication (Web dashboard, iOS synchronization, and Decky handheld plugin) operates exclusively over **TCP**. **UDP is not used or needed.**

### Option A: Cloudflare Tunnel (Free & Easiest Remote Access)
1. Install `cloudflared` on your home server or NAS.
2. Route a public hostname (e.g. `achievements.yourdomain.com`) to service: **`HTTP`**, URL: **`http://localhost:3001`**.
3. Cloudflare gives you a free HTTPS certificate with zero open ports on your home router! Your Master Password gate secures public access.

### Option B: Tailscale
If using Tailscale on your devices and server, simply open:
`http://<SERVER_TAILSCALE_IP>:3001`
Tailscale automatically encrypts and routes all TCP traffic seamlessly.

### Option C: Reverse Proxy (Nginx / Caddy)
- **Caddy**:
  ```caddy
  achievements.yourdomain.com {
      reverse_proxy 127.0.0.1:3001
  }
  ```
- **Nginx**:
  ```nginx
  location / {
      proxy_pass http://127.0.0.1:3001;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
  }
  ```

### Option D: Router Port Forwarding
If forwarding ports manually on your router:
- Port: **`3001`**
- Protocol: **`TCP`** (UDP can stay closed).

---

## 📱 Client Setup Guides

### 1. Web Browser
Navigate to `http://<YOUR_SERVER_IP>:3001` (or your domain) and enter your Master Password to get started.

---

### 2. iPhone & iPad

#### Option A: Progressive Web App (PWA) — Recommended
1. Open **Safari** on your iPhone or iPad and navigate to `http://<YOUR_SERVER_IP>:3001`.
2. Tap the **Share** button (box with upward arrow) and select **"Add to Home Screen"**.
3. Launch from your Home Screen: runs full-screen, offline-capable, and updates automatically whenever the server updates.

#### Option B: Native Sideloaded IPA
1. Download **`OmniAchievements.ipa`** from [GitHub Releases](https://github.com/santx1/OmniAchievements/releases).
2. Install via **SideStore**, **AltStore**, **TrollStore**, or **Sideloadly**.
3. On first launch, expand the **Server Connection** panel, enter your server URL (`http://<YOUR_SERVER_IP>:3001`), and log in.

---

### 3. Steam Deck & Other Handhelds (Decky Plugin)
*(Steam Deck LCD/OLED, Lenovo Legion Go, ASUS ROG Ally, MSI Claw, OneXPlayer, Ayaneo running SteamOS, Bazzite, or ChimeraOS)*

#### Quick Installation:
1. Download **`OmniAchievements-Decky.zip`** from [GitHub Releases](https://github.com/santx1/OmniAchievements/releases).
2. Extract the archive into:
   ```bash
   mkdir -p ~/homebrew/plugins/OmniAchievements
   unzip -o OmniAchievements-Decky.zip -d ~/homebrew/plugins/OmniAchievements
   ```
3. Restart Decky Loader:
   ```bash
   sudo systemctl restart plugin_loader.service
   ```

#### ⚡ Quick Pairing (Bypasses Virtual Keyboard):
In the OmniAchievements Web App, go to **Settings > Legion Go / Decky**, click **Generate Token**, and click **"Copy 1-Line Command"**. 
Run that single command in **Konsole** (or via SSH):
```bash
mkdir -p ~/.config && echo '{"server_url":"http://<YOUR_SERVER_IP>:3001","token":"<YOUR_TOKEN>"}' > ~/.config/omni_achievements_decky.json
```
Your server URL and pairing token are now permanently configured!

#### 🔧 Fixing Permissions If Update Gives "Permission Denied":
If you previously installed the plugin as `root` and the in-menu updater reports a permission error, run this 1-line command on your handheld:
```bash
sudo chown -R deck:deck ~/homebrew/plugins/OmniAchievements && chmod -R 755 ~/homebrew/plugins/OmniAchievements
```

---

## 💾 Backups & Data Persistence

All profiles, custom games, retro achievements, custom tags, and settings are saved inside the container at `/app/data/omniachievements.sqlite`.

By mapping `-v ./data:/app/data`:
- Upgrading or deleting the Docker container **never loses your data**.
- **Backup**:
  ```bash
  cp -r ./data /path/to/backup/
  ```
- **Restore**: Place `./data` back into your folder and run `docker compose up -d`.
- **Web Export**: You can also download a complete JSON backup anytime from **Settings > Backups**.

---

## 🔄 Updating OmniAchievements

### Updating the Docker Server:
```bash
docker compose pull
docker compose up -d
```
*(Your data in `./data` is completely untouched)*.

### Updating the Decky Handheld Plugin:
Open the Quick Access Menu on your Steam Deck or handheld, navigate to OmniAchievements, scroll to **Plugin Self-Updater**, and click **"Update to Latest Now"**!

---

## 🏗️ Architecture & Project Structure

```text
omniachievements/
├── client/                     # React 18 + TypeScript + Vite + Tailwind + Capacitor (PWA / iOS)
│   ├── src/
│   │   ├── api/                # Offline-first transparent REST API client
│   │   ├── components/
│   │   │   ├── auth/           # MasterPasswordGate, ProfileSelector, PinPadModal
│   │   │   ├── games/          # GameCard, GameDetailModal, AddGameModal, LibraryView
│   │   │   ├── layout/         # Navbar (Sync Status Pill), BottomTabBar, Sidebar
│   │   │   ├── stats/          # StatisticsView, DonutChart, HallOfFame
│   │   │   └── settings/       # SettingsView (Profiles, Handhelds, Cloud Sync, Backups)
│   │   ├── utils/              # offlineStore (IndexedDB), syncEngine (Auto-Sync)
│   │   └── types/
│   └── capacitor.config.ts     # Capacitor iOS configuration
│
├── server/                     # Node.js + Express + TypeScript + SQLite (better-sqlite3)
│   ├── src/
│   │   ├── db/                 # SQLite database initialization & migrations
│   │   ├── middleware/         # Master password auth & Profile PIN verification
│   │   ├── services/           # Steam Web API, SteamGridDB, AI Gemini Trophy Engine
│   │   └── routes/             # REST endpoints (auth, profiles, games, stats, sync, decky)
│   └── package.json
│
├── decky-plugin/               # Steam Deck & Other Handhelds Decky Loader Plugin
│   ├── plugin.json             # Decky manifest
│   ├── main.py                 # Python backend with auto-detection & self-updater
│   └── src/index.tsx           # React UI for SteamOS Quick Access Menu
│
├── docker/
│   ├── Dockerfile              # Multi-arch production container (amd64 / arm64)
│   └── README.md               # Dedicated container documentation
├── docker-compose.yml          # Production compose file
└── docs/                       # Detailed guides
    ├── SETUP_GUIDE.md          # Server self-hosting & reverse proxy setup
    ├── STEAM_API_GUIDE.md      # Steam Web API key & account security model
    ├── IOS_IPA_BUILD_GUIDE.md  # How to compile & sideload the IPA on iOS/iPadOS
    └── DECKY_PLUGIN_GUIDE.md   # Steam Deck & handhelds Decky plugin guide
```

---

## 🏷️ Versioning Scheme (`a.b.c`)
- **`a`**: Main architecture version (`0` currently)
- **`b`**: Big feature updates (major integrations, new platforms, sync engines)
- **`c`**: Minor enhancements and bug fixes

---

## 📚 Documentation & Guides
- [Server Setup & Reverse Proxy Guide](docs/SETUP_GUIDE.md)
- [Steam Web API, Security & Family Sharing Guide](docs/STEAM_API_GUIDE.md)
- [iOS / iPadOS IPA Compilation & Sideloading Guide](docs/IOS_IPA_BUILD_GUIDE.md)
- [Steam Deck & Handhelds Decky Plugin Guide](docs/DECKY_PLUGIN_GUIDE.md)
- [Docker Hub / GHCR Container Documentation](docker/README.md)

---

## 📄 License
MIT License. Built for the gaming and self-hosting community.
