# 🏆 OmniAchievements Decky Loader Plugin

Synchronize and display custom achievements on non-Steam games in SteamOS on your **Steam Deck & other handhelds** (Legion Go, ROG Ally, Bazzite, etc.).

---

## 🚀 Quick Installation

1. Make sure you have [Decky Loader](https://decky.xyz/) installed on your handheld.
2. In Desktop Mode or via SSH / SMB:
   - Extract this archive to `~/homebrew/plugins/OmniAchievements`:
     ```bash
     sudo mkdir -p ~/homebrew/plugins/OmniAchievements
     sudo cp -r * ~/homebrew/plugins/OmniAchievements/
     sudo chown -R deck:deck ~/homebrew/plugins/OmniAchievements
     ```
3. Restart Decky:
   ```bash
   sudo systemctl restart plugin_loader.service
   ```
4. Return to Gaming Mode. Open the Quick Access Menu (••• / Legion button), navigate to the trophy icon 🏆, enter your home server URL, and connect!

---

## 🔄 Updating the Plugin

You can update this plugin directly from the **SteamOS Quick Access Menu** under **Plugin Updates** with 1 click!
