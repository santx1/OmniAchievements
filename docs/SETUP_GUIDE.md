# 🚀 OmniAchievements Self-Hosting Guide

This guide walks you through deploying **OmniAchievements** on your home server, NAS, or local machine using Docker.

---

## 📋 Requirements
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/) installed
- (Optional) Free [Steam Web API Key](https://steamcommunity.com/dev/apikey)
- (Optional) Free [SteamGridDB API Key](https://www.steamgriddb.com/profile/preferences/api)

---

## ⚡ Quickstart Deployment

### Method A: Single Command with Pre-Built Image
```bash
docker run -d \
  --name omniachievements \
  --restart unless-stopped \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  -e MASTER_PASSWORD=MySecretPassword123! \
  ghcr.io/santx1/omniachievements:latest
```

### Method B: Docker Compose
#### 1. Clone the repository
```bash
git clone https://github.com/santx1/OmniAchievements.git
cd OmniAchievements
```

#### 2. Configure environment variables
Copy the example environment file:
```bash
cp .env.example .env
nano .env
```
Set your `MASTER_PASSWORD` (e.g. `MySecretPass2026!`). This password protects the web version and blocks unauthorized visitors before any profile or data is shown.

#### 3. Launch the container
```bash
docker compose up -d
```

### 4. Access the web app
Open your browser and navigate to:
```text
http://<YOUR_SERVER_IP>:3001
```
Enter your **Master Password** to unlock the server and select or create your player profile!

---

## 🔒 Configuration Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Local host port | `3001` |
| `MASTER_PASSWORD` | Gateway password required to open the web version | `changeme123` |
| `STEAM_API_KEY` | Valve Steam Web API Key for syncing games & achievements | `""` |
| `STEAMGRIDDB_API_KEY` | API Key for 600x900 box art, hero banners and logos | `""` |
| `GEMINI_API_KEY` | Google Gemini API Key for the AI Achievement Architect | `""` |
| `JWT_SECRET` | Secret key used for signing session tokens | Auto-generated |
| `DATA_DIR` | Directory where SQLite DB & config are persisted | `/app/data` |

---

## 🌐 Remote Access & Reverse Proxy (Optional)

If you want to access OmniAchievements securely from outside your home network, you can use:

### Option A: Cloudflare Tunnels (Easiest & Free)
1. Install `cloudflared` on your server.
2. Route a subdomain (e.g., `games.yourdomain.com`) to `http://localhost:3001`.
3. The Master Password gate automatically protects your server from public access!

### Option B: Caddy Reverse Proxy
```caddy
games.yourdomain.com {
    reverse_proxy localhost:3001
}
```

### Option C: Nginx
```nginx
server {
    listen 80;
    server_name games.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📡 Offline-First Storage & Cloud Synchronization

OmniAchievements features an **offline-first hybrid architecture**:

1. **Client-Side IndexedDB Storage**:
   - Every profile, game, achievement badge, custom platform, and statistic is stored locally in client-side IndexedDB on your iPhone, iPad, or browser.
   - You can launch the app, browse your entire library, inspect achievements, toggle trophies unlocked while playing on portable devices, edit notes, or add custom games with **zero network connectivity**.

2. **Automatic Reconciliation & Queued Mutations**:
   - When offline, modifications are executed optimistically and enqueued in an atomic IndexedDB mutation queue.
   - As soon as your device reconnects to your home server or internet, OmniAchievements automatically pushes queued mutations to the server in a single atomic transaction and pulls the latest cloud snapshot.

3. **Status Indicators**:
   - **Navbar Pill**: Displays live sync state: `Synced` (Green), `Syncing...` (Spinning blue), `N Queued` (Amber), or `Offline` (Gray).
   - **Settings Tab**: Go to **Settings > Local Storage & Cloud Synchronization** to view local trophy counts, pending queue depth, last sync time, and trigger manual syncs.

---

## 💾 Backups & Data Persistence
All your profiles, games, achievements, notes, and blacklists are stored in a single SQLite database file in `./data/omniachievements.sqlite`.

To backup your entire library:
```bash
cp -r ./data /path/to/backup/
```
To restore, simply place the `./data` folder back and run `docker compose up -d`.

---

## 🗄️ NAS Installation Guide (TrueNAS, Unraid, Synology)

### 🐬 TrueNAS SCALE

#### 1. Create a Dataset for Persistent Data
1. In the TrueNAS web UI, navigate to **Datasets**.
2. Select your storage pool (e.g., `tank`), click **Add Dataset**.
3. Name it: `omniachievements` (path: `/mnt/tank/omniachievements`).
4. Ensure standard read/write permissions for apps.

#### 2. Install the App
- **TrueNAS SCALE 24.10+ (Electric Eel / Docker Compose)**:
  1. Go to **Apps** > **Discover Apps** > **Custom App** (or **Install via Docker Compose**).
  2. Choose Docker Compose, name: `omniachievements`.
  3. Use the Compose YAML:
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
           - MASTER_PASSWORD=MySecretPassword123!
         volumes:
           - /mnt/tank/omniachievements:/app/data
     ```
  4. Click **Save** to start.

- **TrueNAS SCALE 24.04 and earlier (GUI Form)**:
  1. Go to **Apps** > **Discover Apps** > **Custom App**.
  2. Application Name: `omniachievements`.
  3. Image repository: `ghcr.io/santx1/omniachievements` (or Docker Hub), Tag: `latest`.
  4. Port forwarding: Container `3001` to Host `3001` (or Web Port `30301`).
  5. Storage: Add **Host Path Volume**, Host Path: `/mnt/tank/omniachievements`, Mount Path: `/app/data`.
  6. Environment variables: Add `MASTER_PASSWORD` with your password.
  7. Click **Save**.

Open `http://<TRUENAS_IP>:3001` in your browser!
