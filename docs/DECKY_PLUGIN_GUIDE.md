# 🎮 Steam Deck & Other Handhelds Decky Plugin Guide

The **OmniAchievements Decky Plugin** enables full achievement tracking for **non-Steam games** (such as games running through Emulators, Heroic Games Launcher, Epic Games, GOG, or native Linux titles) on your **Steam Deck & other handhelds** (Lenovo Legion Go, ASUS ROG Ally, MSI Claw, OneXPlayer, Ayaneo running SteamOS, Bazzite, or ChimeraOS).

---

## 🌟 What This Plugin Does
- **Native Steam-Like Overlay**: Shows custom achievements in the SteamOS Quick Access Menu (QAM) while playing.
- **Manual Shortcut Linking**: Detects the currently active non-Steam shortcut and lets you map it to any game in your OmniAchievements library.
- **Achievement Unlocks**: View locked and unlocked badges, descriptions, timestamps, and toggle unlocks directly from your handheld screen.
- **Direct Local Network Sync**: Communicates over your Wi-Fi directly with your self-hosted Docker server.

---

## 📥 Installation on Steam Deck & Other Handhelds

### Step 1: Ensure Decky Loader is installed
If you don't have Decky Loader installed yet:
1. Switch to **Desktop Mode** on your handheld.
2. Open your browser and go to [decky.xyz](https://decky.xyz).
3. Download the installer and run it.
4. Return to **Gaming Mode**.

### Step 2: Download or Copy the Plugin to your Handheld

#### Option A: Download Pre-Packaged Release (Recommended)
1. Download **`OmniAchievements-Decky.zip`** from [GitHub Releases](https://github.com/santx1/OmniAchievements/releases).
2. Extract the archive into `~/homebrew/plugins/OmniAchievements/`:
```bash
sudo mkdir -p ~/homebrew/plugins/OmniAchievements
sudo unzip -o OmniAchievements-Decky.zip -d ~/homebrew/plugins/OmniAchievements/
sudo chown -R deck:deck ~/homebrew/plugins/OmniAchievements
sudo systemctl restart plugin_loader.service
```

#### Option B: Copy from Local Repository
You can copy the `decky-plugin` folder to your handheld via SSH, SMB network share, or USB drive:

On your handheld terminal:
```bash
# Create directory in Decky plugins folder
sudo mkdir -p ~/homebrew/plugins/OmniAchievements

# Copy plugin files (plugin.json, main.py, dist/index.js) into the folder
sudo cp -r /path/to/decky-plugin/* ~/homebrew/plugins/OmniAchievements/
sudo chown -R deck:deck ~/homebrew/plugins/OmniAchievements

# Restart Decky Loader service
sudo systemctl restart plugin_loader.service
```

---

## 🔗 How to Connect & Link Non-Steam Games

### ⚡ Quick Pairing via Terminal (Fastest)
In the OmniAchievements Web App, go to **Settings > Steam Deck & Handhelds**, click **Generate Token**, and click **"Copy 1-Line Command"**.
Paste that single command into **Konsole** (or via SSH) on your handheld:
```bash
sudo mkdir -p ~/homebrew/settings/OmniAchievements ~/.config && echo '{"server_url":"http://192.168.1.XXX:3001","token":"YOUR_TOKEN_HERE"}' | sudo tee ~/homebrew/settings/OmniAchievements/config.json ~/.config/omni_achievements_decky.json >/dev/null && sudo systemctl restart plugin_loader.service
```
Restart Decky or open the menu, and it will be immediately connected!

### Manual Pairing via Quick Access Menu:
1. Press the **Quick Access Menu button** (`•••` or QAM button) on your handheld.
2. Select the **OmniAchievements** plugin (trophy icon 🏆).
3. Enter your home server address:
   ```text
   http://192.168.1.XXX:3001
   ```
4. Enter your **Pairing Token** and tap **Connect Server**.

### Linking a Game:
1. Launch any non-Steam game on your handheld (e.g., an emulator game or Epic Games title).
2. Open the Quick Access Menu > **OmniAchievements**.
3. Decky will detect the active game (e.g., "The Legend of Zelda" or "Bloodborne").
4. Select the corresponding title from your OmniAchievements library and tap **Link Game & Load Achievements**.
5. All custom achievements will immediately load on your screen with high-res badges and unlock states!

---

## ⚡ 1-Click In-Decky Self-Updater

You don't need to connect via SSH or use terminal commands to update the plugin when new releases arrive!

### How to Update directly from SteamOS:
1. Open the **Quick Access Menu** > **OmniAchievements**.
2. Scroll down to the **"Plugin Self-Updater"** section.
3. Choose your update channel:
   * **Auto (Recommended)**: Checks your local home server first, falling back to GitHub if you are away from home.
   * **Local OmniAchievements Server**: Downloads the update bundle directly across your Wi-Fi from your Docker container with zero latency and full offline capability.
   * **GitHub Repository**: Downloads the newest files from the official repository branch.
4. Tap **Check for Updates**.
5. If a new version is detected, tap **Update to Latest Now**.
6. The plugin downloads and safely updates its files atomically, firing a native Steam notification toast when complete.
7. Tap **Reload Decky Now** to apply the update immediately!

---

## 🛠️ Architecture & Troubleshooting

### Fixing "Permission Denied" on Update:
If you previously extracted the plugin using `sudo` or root permissions, run this single command in Konsole on your handheld to grant write permissions to your user:
```bash
sudo chown -R deck:deck ~/homebrew/plugins/OmniAchievements && chmod -R 755 ~/homebrew/plugins/OmniAchievements
```

### Self-Contained Standalone Bundle
* The plugin frontend is compiled as an ES module (`dist/index.js`) using Rollup with custom inline SVG icons.
* **Zero runtime npm packages**: Because SteamOS Chromium webviews do not provide Node packages, all UI components and dependencies are bundled directly into `dist/index.js` (and mirrored to `index.js`).
* **Resolving `frontend_bundle not OK`**: If you ever encounter a loader error in Decky, ensure `dist/index.js` is present in `/home/deck/homebrew/plugins/OmniAchievements/`.

### Checking Decky Loader Logs:
If you need to inspect debug logs on your handheld:
```bash
journalctl -u plugin_loader -b -f
```
Or view the plugin output in:
```bash
tail -f ~/.config/decky-loader/logs/OmniAchievements.log
```
