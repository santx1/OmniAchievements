# 🛡️ Steam API & Account Security Guide

OmniAchievements provides automatic synchronization with your Steam library, playtime, and achievements. This document explains how the integration works and why **your Steam account is 100% safe from theft**.

---

## 🔑 1. How to Get a Steam Web API Key

Valve provides free Web API keys to Steam users for application development:

1. Visit the official Valve Steam Developer page:  
   👉 [https://steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)
2. Log in with your Steam account if prompted.
3. In the **Domain Name** field, you can enter anything (e.g. `localhost` or `omniachievements.local`).
4. Agree to the Steam Web API Terms of Use and click **Register**.
5. Copy your 32-character key and enter it in OmniAchievements:
   - Either in the server `.env` as `STEAM_API_KEY=...`
   - Or directly in the app under **Settings > Server Settings**.

---

## 🆔 2. How to Find Your SteamID64

Your SteamID64 is a 17-digit number unique to your Steam account (e.g., `76561198012345678`).

### Method A: Use OmniAchievements Automatic Resolver
In the Steam Sync modal in OmniAchievements, simply paste your Steam profile link (e.g., `https://steamcommunity.com/id/yourname`) and click **Resolve**. The app will automatically convert it to your numeric SteamID64!

### Method B: Steam Client
1. Open Steam > Click your profile name at the top.
2. The URL displayed at the top or in your browser contains your SteamID.
3. You can also look up your profile on [steamid.io](https://steamid.io).

---

## 🔒 3. Steam Account Security Architecture

Security is the #1 priority when synchronizing external gaming accounts. Here is how OmniAchievements ensures your account **cannot be stolen, banned, or compromised**:

### 🚫 1. We NEVER ask for your Steam Password
OmniAchievements **never prompts for, intercepts, or handles your Steam password, username, email, or Steam Guard 2FA codes**. There is literally no authentication credential that could be stolen.

### 📖 2. Read-Only Public API
The Steam Web API endpoints used by OmniAchievements:
- `IPlayerService/GetOwnedGames` (fetches game titles, AppIDs, and playtime)
- `ISteamUserStats/GetPlayerAchievements` (fetches unlocked achievement names and timestamps)
- `ISteamUserStats/GetSchemaForGame` (fetches public achievement badges and descriptions)

These endpoints are **strictly read-only**. They do not have permissions to modify your Steam account, perform trades, sell items, change passwords, or send messages.

### 🛡️ 3. Safe from VAC and Game Bans
OmniAchievements does **not** inject any code into running game processes, does not hook into DirectX/Vulkan/OpenGL, and does not alter Steam binaries. It is an independent web & mobile client communicating through Valve's HTTP REST endpoints. You can never receive a VAC ban from using it.

### 🏡 4. 100% Self-Hosted & Local Network
Your library data, credentials, and configuration reside exclusively in your local Docker container SQLite database. No third-party cloud analytics or foreign servers ever receive your data.
