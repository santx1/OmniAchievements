import os
import json
import urllib.request
import urllib.error
import urllib.parse
import ssl
import re

CONFIG_PATH = os.path.expanduser("~/.config/omni_achievements_decky.json")
PLUGIN_DIR = os.path.dirname(os.path.realpath(__file__))

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

    # Async methods called from Decky Loader frontend (supporting both args, kwargs, and dict payloads)
    async def configure(self, *args, **kwargs):
        server_url = self.server_url
        token = self.token
        if len(args) == 1 and isinstance(args[0], dict):
            kwargs.update(args[0])
        elif len(args) >= 2:
            server_url = str(args[0])
            token = str(args[1])
        if "server_url" in kwargs:
            server_url = str(kwargs["server_url"])
        if "token" in kwargs:
            token = str(kwargs["token"])

        self.server_url = server_url.strip()
        self.token = token.strip()
        self.save_config()
        return await self.check_connection()

    async def get_config(self, *args, **kwargs):
        return {
            "server_url": self.server_url,
            "has_token": bool(self.token)
        }

    async def check_connection(self, *args, **kwargs):
        res = self._api_request("/ping")
        return {"online": res.get("status") == "online", "details": res}

    async def get_games(self, *args, **kwargs):
        return self._api_request("/games")

    async def get_links(self, *args, **kwargs):
        return self._api_request("/links")

    async def link_shortcut(self, *args, **kwargs):
        data = {}
        if len(args) == 1 and isinstance(args[0], dict):
            data = args[0]
        elif len(args) >= 3:
            data = {"steam_shortcut_id": args[0], "game_id": args[1], "shortcut_name": args[2]}
        data.update(kwargs)
        steam_shortcut_id = data.get("steam_shortcut_id") or data.get("steamShortcutId")
        game_id = data.get("game_id") or data.get("gameId")
        shortcut_name = data.get("shortcut_name") or data.get("shortcutName", "")
        return self._api_request("/link", method="POST", body={
            "steamShortcutId": str(steam_shortcut_id),
            "gameId": str(game_id),
            "shortcutName": str(shortcut_name)
        })

    async def unlink_shortcut(self, *args, **kwargs):
        link_id = args[0] if args else (kwargs.get("link_id") or kwargs.get("linkId"))
        return self._api_request(f"/link/{link_id}", method="DELETE")

    async def get_achievements(self, *args, **kwargs):
        shortcut_id = None
        if len(args) == 1 and isinstance(args[0], dict):
            shortcut_id = args[0].get("shortcut_id") or args[0].get("shortcutId")
        elif args:
            shortcut_id = args[0]
        else:
            shortcut_id = kwargs.get("shortcut_id") or kwargs.get("shortcutId")
        return self._api_request(f"/achievements/{shortcut_id}")

    async def toggle_achievement(self, *args, **kwargs):
        data = {}
        if len(args) == 1 and isinstance(args[0], dict):
            data = args[0]
        elif len(args) >= 2:
            data = {"achievement_id": args[0], "is_unlocked": args[1]}
        data.update(kwargs)
        achievement_id = data.get("achievement_id") or data.get("achievementId")
        is_unlocked = data.get("is_unlocked") if "is_unlocked" in data else data.get("isUnlocked", True)
        return self._api_request("/toggle-achievement", method="POST", body={
            "achievementId": achievement_id,
            "isUnlocked": is_unlocked
        })

    async def match_game(self, *args, **kwargs):
        shortcut_name = ""
        if len(args) == 1 and isinstance(args[0], dict):
            shortcut_name = args[0].get("shortcut_name", "")
        elif args:
            shortcut_name = str(args[0])
        else:
            shortcut_name = kwargs.get("shortcut_name", "")
        return self._api_request(f"/match?name={urllib.parse.quote(str(shortcut_name))}")

    async def log_playtime(self, *args, **kwargs):
        data = {}
        if len(args) == 1 and isinstance(args[0], dict):
            data = args[0]
        elif len(args) >= 3:
            data = {"shortcut_id": args[0], "game_id": args[1], "minutes": args[2]}
        data.update(kwargs)
        shortcut_id = data.get("shortcut_id") or data.get("shortcutId")
        game_id = data.get("game_id") or data.get("gameId")
        minutes = data.get("minutes", 5)
        return self._api_request("/log-playtime", method="POST", body={
            "shortcutId": str(shortcut_id),
            "gameId": str(game_id) if game_id else None,
            "minutes": minutes
        })

    def get_local_version(self):
        try:
            plugin_path = os.path.join(PLUGIN_DIR, "plugin.json")
            if os.path.exists(plugin_path):
                with open(plugin_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get("version", "0.2.2")
        except Exception as e:
            print(f"[OmniAchievements] Error reading local version: {e}")
        return "0.2.2"

    def _compare_versions(self, v1, v2):
        try:
            p1 = [int(x) for x in re.sub(r'[^0-9.]', '', str(v1)).split('.') if x.isdigit()]
            p2 = [int(x) for x in re.sub(r'[^0-9.]', '', str(v2)).split('.') if x.isdigit()]
            ml = max(len(p1), len(p2))
            p1 += [0] * (ml - len(p1))
            p2 += [0] * (ml - len(p2))
            if p1 > p2: return 1
            if p1 < p2: return -1
            return 0
        except Exception:
            return 1 if str(v1) != str(v2) else 0

    async def get_plugin_version(self, *args, **kwargs):
        return {
            "version": self.get_local_version(),
            "plugin_dir": PLUGIN_DIR
        }

    async def check_for_updates(self, *args, **kwargs):
        source = "auto"
        if len(args) == 1 and isinstance(args[0], dict):
            source = args[0].get("source", "auto")
        elif args:
            source = str(args[0])
        else:
            source = kwargs.get("source", "auto")

        current_ver = self.get_local_version()
        result = {
            "current_version": current_ver,
            "latest_version": current_ver,
            "update_available": False,
            "source": source,
            "changelog": "",
            "error": None
        }

        # 1. Check Local Server
        if source in ("server", "auto"):
            try:
                server_info = self._api_request("/plugin-info")
                if "version" in server_info:
                    latest_ver = server_info["version"]
                    cmp_res = self._compare_versions(latest_ver, current_ver)
                    result["latest_version"] = latest_ver
                    result["update_available"] = cmp_res > 0
                    result["changelog"] = server_info.get("changelog", "Update from local server")
                    result["source"] = "server"
                    result["updated_at"] = server_info.get("updatedAt", "")
                    return result
            except Exception as e:
                print(f"[OmniAchievements] Server update check failed: {e}")
                if source == "server":
                    result["error"] = f"Server update check failed: {str(e)}"
                    return result

        # 2. Check GitHub Repository (fallback or direct)
        if source in ("github", "auto"):
            try:
                gh_url = "https://raw.githubusercontent.com/santx1/OmniAchievements/main/decky-plugin/plugin.json"
                req = urllib.request.Request(gh_url, headers={"User-Agent": "OmniAchievements-Decky"})
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                with urllib.request.urlopen(req, timeout=8, context=ctx) as r:
                    data = json.loads(r.read().decode("utf-8"))
                    latest_ver = data.get("version", current_ver)
                    cmp_res = self._compare_versions(latest_ver, current_ver)
                    result["latest_version"] = latest_ver
                    result["update_available"] = cmp_res > 0
                    result["changelog"] = "Latest release from GitHub main branch"
                    result["source"] = "github"
                    return result
            except Exception as e:
                print(f"[OmniAchievements] GitHub update check failed: {e}")
                result["error"] = f"GitHub check failed: {str(e)}"

        return result

    async def apply_update(self, *args, **kwargs):
        source = "auto"
        if len(args) == 1 and isinstance(args[0], dict):
            source = args[0].get("source", "auto")
        elif args:
            source = str(args[0])
        else:
            source = kwargs.get("source", "auto")

        current_ver = self.get_local_version()
        updated_files = []
        try:
            use_source = source
            if use_source == "auto":
                check = await self.check_for_updates("server")
                if not check.get("error") and "version" in check:
                    use_source = "server"
                else:
                    use_source = "github"

            if use_source == "server":
                bundle = self._api_request("/plugin-bundle")
                if not bundle or "files" not in bundle:
                    return {"success": False, "error": bundle.get("error", "No files in server update bundle")}

                files_dict = bundle.get("files", {})
                for rel_path, content in files_dict.items():
                    target_path = os.path.join(PLUGIN_DIR, rel_path)
                    os.makedirs(os.path.dirname(target_path), exist_ok=True)
                    tmp_path = target_path + ".new"
                    with open(tmp_path, "w", encoding="utf-8") as f:
                        f.write(content)
                    os.replace(tmp_path, target_path)
                    updated_files.append(rel_path)

            else:  # GitHub
                base_gh = "https://raw.githubusercontent.com/santx1/OmniAchievements/main/decky-plugin"
                files_to_download = [
                    "plugin.json",
                    "package.json",
                    "main.py",
                    "index.js",
                    "dist/index.js"
                ]
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE

                for rel_path in files_to_download:
                    target_path = os.path.join(PLUGIN_DIR, rel_path)
                    os.makedirs(os.path.dirname(target_path), exist_ok=True)
                    req = urllib.request.Request(f"{base_gh}/{rel_path}", headers={"User-Agent": "OmniAchievements-Decky"})
                    with urllib.request.urlopen(req, timeout=12, context=ctx) as resp:
                        content = resp.read()
                        tmp_path = target_path + ".new"
                        with open(tmp_path, "wb") as f:
                            f.write(content)
                        os.replace(tmp_path, target_path)
                        updated_files.append(rel_path)

            new_ver = self.get_local_version()
            return {
                "success": True,
                "old_version": current_ver,
                "new_version": new_ver,
                "source": use_source,
                "files_updated": updated_files,
                "message": f"Successfully updated to v{new_ver}!"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Update failed: {str(e)}"
            }

    # Lifecycle hooks
    async def _main(self):
        print("[OmniAchievements] Plugin loaded on SteamOS (Legion Go / Steam Deck)")

    async def _unload(self):
        print("[OmniAchievements] Plugin unloaded")
