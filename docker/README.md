# 🐳 OmniAchievements Docker Image

Official multi-architecture Docker container for **OmniAchievements** — the self-hosted cross-platform game & achievement synchronizer for iOS, iPadOS, Web, and SteamOS (Legion Go & Steam Deck).

[![Image Size](https://img.shields.io/badge/Multi--Arch-amd64%20%7C%20arm64-blue?logo=docker)](https://github.com/santx1/OmniAchievements/pkgs/container/omniachievements)
[![GitHub Container Registry](https://img.shields.io/badge/GHCR-ghcr.io%2Fsantx1%2Fomniachievements-2496ED?logo=github)](https://github.com/santx1/OmniAchievements/pkgs/container/omniachievements)

---

## 🖥️ Supported Architectures

This image is built natively for multiple CPU architectures:
- **`linux/amd64`**: x86_64 PCs, Home Servers, NAS (Synology, QNAP, Unraid, TrueNAS), VPS (DigitalOcean, Linode, Hetzner, AWS).
- **`linux/arm64`**: Raspberry Pi 4/5, Apple Silicon (M1/M2/M3/M4), ARM64 Cloud Servers (Oracle Ampere, AWS Graviton).

---

## ⚡ Quickstart

### Option 1: 1-Line Command (`docker run`)

Run this single command to pull and start OmniAchievements immediately:

```bash
docker run -d \
  --name omniachievements \
  --restart unless-stopped \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  -e MASTER_PASSWORD=MySecretPassword123! \
  ghcr.io/santx1/omniachievements:latest
```

Open your browser at **`http://localhost:3001`** (or your server's IP address) and log in with your master password!

---

### Option 2: Docker Compose (Recommended)

Save the following content as `docker-compose.yml` in any directory on your server:

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
      - MASTER_PASSWORD=MySecretPassword123!   # Change this! Protects the web UI
      - STEAM_API_KEY=                        # (Optional) From https://steamcommunity.com/dev/apikey
      - STEAMGRIDDB_API_KEY=                  # (Optional) From https://www.steamgriddb.com/profile/preferences/api
      - GEMINI_API_KEY=                       # (Optional) For AI Achievement Architect
      - JWT_SECRET=change_to_a_random_string  # Secret for session tokens
    volumes:
      - ./data:/app/data
```

Start the container in the background:

```bash
docker compose up -d
```

To view logs:
```bash
docker compose logs -f
```

---

## ⚙️ Environment Variables Reference

| Variable | Description | Default / Example | Required? |
|---|---|---|---|
| `MASTER_PASSWORD` | Web security gate password. Protects your profiles and data from unauthorized visitors. | `changeme123` | **Yes (Change it!)** |
| `PORT` | Internal HTTP listening port. | `3001` | No |
| `DATA_DIR` | Internal directory where SQLite database and configs are stored. | `/app/data` | No |
| `STEAM_API_KEY` | Valve Steam Web API Key to automatically sync games, playtimes, and achievements. | Get free key at [Steam API](https://steamcommunity.com/dev/apikey) | Optional |
| `STEAMGRIDDB_API_KEY` | SteamGridDB API key to search and download official game covers and hero banners. | Get free key at [SteamGridDB](https://www.steamgriddb.com/profile/preferences/api) | Optional |
| `GEMINI_API_KEY` | Google Gemini API key to generate custom achievements and badges with AI. | Get free key at [Google AI Studio](https://aistudio.google.com/) | Optional |
| `JWT_SECRET` | Secret key used to sign session and Decky pairing tokens. | Any random string | Recommended |

---

## 🔄 Updating the Container

To update to the latest release:

```bash
# Pull the latest image
docker compose pull

# Restart container with the new version (zero data loss)
docker compose up -d
```

If using `docker run`:
```bash
docker stop omniachievements
docker rm omniachievements
docker pull ghcr.io/santx1/omniachievements:latest
# Re-run your docker run command with the same -v $(pwd)/data:/app/data volume mount
```

---

## 💾 Data Persistence & Backups

All player profiles, custom games, achievements, badges, and settings are saved inside the container at `/app/data/`.

By mapping `-v ./data:/app/data` (or `-v $(pwd)/data:/app/data`):
- All data resides safely on your host filesystem in the `./data` directory.
- Upgrading or deleting the Docker container **never loses your data**.
- To **backup** your library, simply copy the `./data` folder to a safe place.
- To **restore**, copy the `./data` folder back and restart the container.

---

## 🗄️ NAS Deployment (TrueNAS SCALE, Unraid, Synology)

### 🐬 TrueNAS SCALE

#### 1. Create a Dataset for Persistent Data
1. In the TrueNAS web UI, navigate to **Datasets**.
2. Select your pool (e.g. `tank` or `pool1`), click **Add Dataset**.
3. Name it `omniachievements` (path will be e.g. `/mnt/tank/omniachievements`).
4. Ensure the dataset has read & write permissions (ACL: standard POSIX read/write).

#### 2. Install the App

##### Option A: TrueNAS SCALE 24.10+ (Electric Eel - Docker Compose)
1. Go to **Apps** > **Discover Apps** > **Custom App** (or **Install via Compose**).
2. Set the Application Name: `omniachievements`.
3. Paste the Compose configuration:
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
         - STEAM_API_KEY=
         - STEAMGRIDDB_API_KEY=
         - GEMINI_API_KEY=
         - JWT_SECRET=random_jwt_secret_phrase
       volumes:
         - /mnt/tank/omniachievements:/app/data
   ```
4. Click **Save** / **Install**.

##### Option B: TrueNAS SCALE 24.04 and earlier (GUI Custom App Form)
1. Go to **Apps** > **Discover Apps** > click **Custom App** in the top-right corner.
2. **Application Name**: `omniachievements`.
3. **Image Details**:
   - Image repository: `ghcr.io/santx1/omniachievements` (or your Docker Hub image).
   - Image tag: `latest`.
4. **Port Configuration**:
   - Container Port: `3001`.
   - Node Port / Web Port: `3001` (or any available port, e.g. `3001` or `30301`).
5. **Environment Variables**:
   - Add `MASTER_PASSWORD` with your chosen password.
   - (Optional) Add `STEAM_API_KEY`, `STEAMGRIDDB_API_KEY`, etc.
6. **Storage / Volume Mount**:
   - Type: **Host Path**.
   - Host Path: `/mnt/tank/omniachievements`.
   - Mount Path: `/app/data`.
7. Click **Save** to deploy.

---

### 🟠 Unraid
1. In the Unraid WebGUI, navigate to the **Docker** tab and click **Add Container**.
2. Set **Name**: `omniachievements`.
3. Set **Repository**: `ghcr.io/santx1/omniachievements:latest` (or Docker Hub).
4. Add **Port mapping**: Host `3001` -> Container `3001`.
5. Add **Path mapping**: Host `/mnt/user/appdata/omniachievements` -> Container `/app/data`.
6. Add **Variable**: Key `MASTER_PASSWORD` -> Value `MySecretPassword123!`.
7. Click **Apply**.

---

### 📦 Synology NAS (Container Manager)
1. Open **Container Manager** on DSM.
2. Go to **Project** > **Create**.
3. Name: `omniachievements`, Path: select a folder (e.g. `/docker/omniachievements`).
4. Select **Create docker-compose.yml** and paste the Compose file from [Option 2 above](#option-2-docker-compose-recommended), replacing `./data` with your folder path.
5. Click **Next** and **Done**.

---

## 🌐 Reverse Proxy & SSL Setup

### Nginx Example
```nginx
server {
    listen 80;
    server_name achievements.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name achievements.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Caddy Example
```caddy
achievements.yourdomain.com {
    reverse_proxy 127.0.0.1:3001
}
```

---

## 📱 Connecting Clients to your Docker Server

- **Web Browser**: Navigate to `http://<YOUR_SERVER_IP>:3001` (or your domain).
- **iOS & iPadOS**: Install the PWA or native IPA from [GitHub Releases](https://github.com/santx1/OmniAchievements/releases), open Settings, and enter your server URL (`http://<YOUR_SERVER_IP>:3001`).
- **SteamOS / Legion Go / Steam Deck**: Install the OmniAchievements Decky plugin from [GitHub Releases](https://github.com/santx1/OmniAchievements/releases), open the Quick Access Menu, enter your server URL, and paste your device Pairing Token from **Settings > Legion Go / Decky** in the web app.
