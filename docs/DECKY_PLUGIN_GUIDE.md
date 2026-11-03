# 🎮 Legion Go S / SteamOS Decky Plugin Guide

The **OmniAchievements Decky Plugin** enables full achievement tracking for **non-Steam games** (such as games running through Emulators, Heroic Games Launcher, Epic Games, GOG, or native Linux titles) on your **Lenovo Legion Go (SteamOS / Bazzite / ChimeraOS)** or **Steam Deck**.

---

## 🌟 What This Plugin Does
- **Native Steam-Like Overlay**: Shows custom achievements in the SteamOS Quick Access Menu (QAM) while playing.
- **Manual Shortcut Linking**: Detects the currently active non-Steam shortcut and lets you map it to any game in your OmniAchievements library.
- **Achievement Unlocks**: View locked and unlocked badges, descriptions, timestamps, and toggle unlocks directly from your handheld screen.
- **Direct Local Network Sync**: Communicates over your Wi-Fi directly with your self-hosted Docker server.

---

## 📥 Installation on Legion Go / Steam Deck

### Step 1: Ensure Decky Loader is installed
If you don't have Decky Loader installed yet:
1. Switch to **Desktop Mode** on your Legion Go / Steam Deck.
2. Open your browser and go to [decky.xyz](https://decky.xyz).
3. Download the installer and run it.
4. Return to **Gaming Mode**.

### Step 2: Copy the Plugin to your Handheld
You can copy the `decky-plugin` folder to your handheld via SSH, SMB network share, or USB drive:

On your Legion Go / Steam Deck terminal:
```bash
# Create directory in Decky plugins folder
mkdir -p ~/homebrew/plugins/OmniAchievements

# Copy plugin files (plugin.json, main.py, dist/index.js) into the folder
cp -r /path/to/decky-plugin/* ~/homebrew/plugins/OmniAchievements/

# Restart Decky Loader service
sudo systemctl restart plugin_loader.service
```

---

## 🔗 How to Connect & Link Non-Steam Games

1. Press the **Quick Access Menu button** (or Legion button) on your Legion Go to open the Decky sidebar.
2. Select the **OmniAchievements** plugin (trophy icon 🏆).
3. Enter your home server address:
   ```text
   http://192.168.1.XXX:3001
   ```
4. In the OmniAchievements Web or iOS app, go to **Settings > Legion Go S / SteamOS Decky Plugin** and copy your **Device Pairing Token**.
5. Paste the token in Decky and tap **Connect Server**.

### Linking a Game:
1. Launch any non-Steam game on your Legion Go (e.g., an emulator game or Epic Games title).
2. Open the Quick Access Menu > **OmniAchievements**.
3. Decky will detect the active game (e.g., "The Legend of Zelda" or "Bloodborne").
4. Select the corresponding title from your OmniAchievements library and tap **Link Game & Load Achievements**.
5. All custom achievements will immediately load on your screen with high-res badges and unlock states!
