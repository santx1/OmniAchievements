import os
import json
import urllib.request
import urllib.error
import ssl

CONFIG_PATH = os.path.expanduser("~/.config/omni_achievements_decky.json")

class Plugin:
    def __init__(self):
        self.server_url = "http://192.168.1.100:3001"
        self.token = ""
        self.load_config()

    def load_config(self):
        if os.path.exists(CONFIG_PATH):
            try:
                with open(CONFIG_PATH, "r") as f:
                    data = json.load(f)
                    self.server_url = data.get("server_url", self.server_url)
                    self.token = data.get("token", self.token)
            except Exception as e:
                print(f"[OmniAchievements] Failed to load config: {e}")

    def save_config(self):
        try:
            os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
            with open(CONFIG_PATH, "w") as f:
                json.dump({"server_url": self.server_url, "token": self.token}, f)
        except Exception as e:
            print(f"[OmniAchievements] Failed to save config: {e}")

    def _api_request(self, endpoint, method="GET", body=None):
        url = f"{self.server_url.rstrip('/')}/api/decky{endpoint}"
        headers = {
            "Content-Type": "application/json",
            "X-Decky-Token": self.token
        }
        data = json.dumps(body).encode("utf-8") if body else None
        req = urllib.request.Request(url, data=data, headers=headers, method=method)

        # Allow local network self-signed SSL if user uses HTTPS on LAN
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        try:
            with urllib.request.urlopen(req, timeout=8, context=ctx) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            try:
                return json.loads(err_body)
            except:
                return {"error": f"HTTP {e.code}"}
        except Exception as e:
            return {"error": str(e)}

    # Async methods called from Decky Loader frontend
    async def configure(self, server_url, token):
        self.server_url = server_url.strip()
        self.token = token.strip()
        self.save_config()
        return await self.check_connection()

    async def get_config(self):
        return {
            "server_url": self.server_url,
            "has_token": bool(self.token)
        }

    async def check_connection(self):
        res = self._api_request("/ping")
        return {"online": res.get("status") == "online", "details": res}

    async def get_games(self):
        return self._api_request("/games")

    async def get_links(self):
        return self._api_request("/links")

    async def link_shortcut(self, steam_shortcut_id, game_id, shortcut_name):
        return self._api_request("/link", method="POST", body={
            "steamShortcutId": str(steam_shortcut_id),
            "gameId": str(game_id),
            "shortcutName": str(shortcut_name)
        })

    async def unlink_shortcut(self, link_id):
        return self._api_request(f"/link/{link_id}", method="DELETE")

    async def get_achievements(self, shortcut_id):
        return self._api_request(f"/achievements/{shortcut_id}")

    async def toggle_achievement(self, achievement_id, is_unlocked):
        return self._api_request("/toggle-achievement", method="POST", body={
            "achievementId": achievement_id,
            "isUnlocked": is_unlocked
        })

    # Lifecycle hooks
    async def _main(self):
        print("[OmniAchievements] Plugin loaded on SteamOS (Legion Go / Steam Deck)")

    async def _unload(self):
        print("[OmniAchievements] Plugin unloaded")
