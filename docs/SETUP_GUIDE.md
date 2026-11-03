# 🚀 OmniAchievements Self-Hosting Guide

This guide walks you through deploying **OmniAchievements** on your home server, NAS, or local machine using Docker.

---

## 📋 Requirements
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/) installed
- (Optional) Free [Steam Web API Key](https://steamcommunity.com/dev/apikey)
- (Optional) Free [SteamGridDB API Key](https://www.steamgriddb.com/profile/preferences/api)

---

## ⚡ Quickstart Deployment

### 1. Clone the repository
```bash
git clone https://github.com/your-username/omniachievements.git
cd omniachievements
```

### 2. Configure environment variables
Copy the example environment file:
```bash
cp .env.example .env
```
Edit `.env` using your favorite text editor:
```bash
nano .env
```
Set your `MASTER_PASSWORD` (e.g. `MySecretPass2026!`). This password protects the web version and blocks unauthorized visitors before any profile or data is shown.

### 3. Launch the container
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

## 💾 Backups & Data Persistence
All your profiles, games, achievements, notes, and blacklists are stored in a single SQLite database file in `./data/omniachievements.sqlite`.

To backup your entire library:
```bash
cp -r ./data /path/to/backup/
```
To restore, simply place the `./data` folder back and run `docker compose up -d`.
