import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  TextField,
  ProgressBar,
  Focusable,
  staticClasses,
  Router,
  showModal,
  ModalRoot
} from "@decky/ui";
import React, { FC, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Self-contained icons for SteamOS Decky Loader (no external npm dependencies required)
const TrophyIcon = ({ color = "#f59e0b", size = 16 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
    <path d="M6 4h12v6c0 3.31-2.69 6-6 6s-6-2.69-6-6V4z" fill={color} fillOpacity="0.3" />
  </svg>
);

const CheckCircleIcon = ({ color = "#10b981", size = 16 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const LockIcon = ({ color = "#666", size = 16 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

interface Achievement {
  id: string;
  display_name: string;
  description: string;
  display_name_es?: string;
  description_es?: string;
  icon_unlocked: string;
  icon_locked: string;
  is_unlocked: number;
}

interface ConnectionState {
  checked: boolean;
  loading: boolean;
  online: boolean;
  authenticated: boolean;
  message?: string;
  warning?: string;
  error?: string;
  gameCount?: number;
  serverVersion?: string;
}

// Global reference for serverApi if provided by legacy/eval loader
let globalServerApi: any = null;

// Universal backend invocation bridge supporting Decky v2, v3, and standalone loaders
async function callBackend(method: string, args: Record<string, any> = {}): Promise<any> {
  // 1. Try serverApi if passed to definePlugin
  if (globalServerApi && typeof globalServerApi.callPluginMethod === "function") {
    try {
      const res = await globalServerApi.callPluginMethod(method, args);
      return res?.result !== undefined ? res.result : res;
    } catch (e) {
      console.warn(`[OmniAchievements] globalServerApi.callPluginMethod("${method}") failed:`, e);
    }
  }

  // 2. Try window.DeckyBackend if available
  try {
    const deckyBackend = (window as any).DeckyBackend;
    if (deckyBackend && typeof deckyBackend.call === "function") {
      const res = await deckyBackend.call("loader/call_plugin_method", "OmniAchievements", method, args);
      return res?.result !== undefined ? res.result : res;
    }
  } catch (e) {
    console.warn(`[OmniAchievements] DeckyBackend.call("${method}") failed:`, e);
  }

  // 3. Try window.__DECKY_SECRET_INTERNALS_... if available
  try {
    const loaderInit = (window as any).__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
    if (loaderInit && typeof loaderInit.connect === "function") {
      const api = loaderInit.connect(2, "OmniAchievements");
      if (api && typeof api.call === "function") {
        const res = await api.call(method, args);
        return res?.result !== undefined ? res.result : res;
      }
    }
  } catch (e) {
    console.warn(`[OmniAchievements] loaderInit.connect("${method}") failed:`, e);
  }

  return { error: "No backend communication method available" };
}

const Content: FC<{ serverApi?: any }> = ({ serverApi }) => {
  if (serverApi) {
    globalServerApi = serverApi;
  }

  // Instant restoration from localStorage so closing the menu never blanks the inputs
  const [serverUrl, setServerUrl] = useState(() => {
    try {
      return localStorage.getItem("omni_decky_server_url") || "http://192.168.1.100:3001";
    } catch {
      return "http://192.168.1.100:3001";
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("omni_decky_token") || "";
    } catch {
      return "";
    }
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>({
    checked: false,
    loading: false,
    online: false,
    authenticated: false
  });

  const [activeShortcutId, setActiveShortcutId] = useState<string>("");
  const [activeShortcutName, setActiveShortcutName] = useState<string>("");

  const [availableGames, setAvailableGames] = useState<any[]>([]);
  const [suggestedMatch, setSuggestedMatch] = useState<any | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [linkedGame, setLinkedGame] = useState<any | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Self-Updater state
  const [currentVersion, setCurrentVersion] = useState("0.3.0");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateSource, setUpdateSource] = useState<"auto" | "server" | "github">("auto");
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const [updateStatusMsg, setUpdateStatusMsg] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const showToast = (title: string, body: string) => {
    try {
      if (globalServerApi?.toaster?.toast) {
        globalServerApi.toaster.toast({ title, body });
      } else if ((window as any).DeckyPluginLoader?.toaster?.toast) {
        (window as any).DeckyPluginLoader.toaster.toast({ title, body });
      }
    } catch (_) {}
  };

  // Synchronize on mount
  useEffect(() => {
    // 1. Load config from persistent Python backend
    callBackend("get_config").then((res: any) => {
      if (res) {
        if (res.server_url) {
          setServerUrl(res.server_url);
          try { localStorage.setItem("omni_decky_server_url", res.server_url); } catch {}
        }
        if (res.token) {
          setToken(res.token);
          try { localStorage.setItem("omni_decky_token", res.token); } catch {}
        }
      }

      // Automatically test connection on mount
      testConnectionStatus();
    });

    callBackend("get_plugin_version").then((res: any) => {
      if (res?.version) {
        setCurrentVersion(res.version);
      }
    });

    detectRunningGame();

    // Check running game periodically while menu is open (every 4 seconds)
    const gameDetectInterval = setInterval(() => {
      detectRunningGame();
    }, 4000);

    // Periodic playtime logger every 5 minutes while gaming
    const playtimeInterval = setInterval(() => {
      if (activeShortcutId && linkedGame) {
        callBackend("log_playtime", {
          shortcut_id: activeShortcutId,
          game_id: linkedGame.id,
          minutes: 5
        });
      }
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(gameDetectInterval);
      clearInterval(playtimeInterval);
    };
  }, [activeShortcutId, linkedGame]);

  const testConnectionStatus = async () => {
    try {
      const conn: any = await callBackend("check_connection");
      if (conn) {
        setConnectionStatus({
          checked: true,
          loading: false,
          online: Boolean(conn.online),
          authenticated: Boolean(conn.authenticated),
          message: conn.message,
          warning: conn.warning,
          error: conn.error,
          gameCount: conn.game_count,
          serverVersion: conn.server_version
        });
        if (conn.authenticated) {
          loadGames();
        }
      }
    } catch (e: any) {
      setConnectionStatus({
        checked: true,
        loading: false,
        online: false,
        authenticated: false,
        error: String(e?.message || e)
      });
    }
  };

  // Comprehensive multi-layer game detector
  const detectRunningGame = async (userInitiated = false) => {
    let appId = "";
    let appTitle = "";

    // Method 1: Router.MainRunningApp from @decky/ui
    try {
      const dfl = (window as any).DFL;
      const router = Router || dfl?.Router || (window as any).Router;
      const mainApp = router?.MainRunningApp;
      if (mainApp) {
        const rawId = mainApp.appid ?? mainApp.nAppId ?? mainApp.m_unAppId;
        if (rawId && String(rawId) !== "0" && String(rawId) !== "769") {
          appId = String(rawId);
          appTitle = mainApp.display_name || mainApp.strDisplayName || mainApp.name || "";
        }
      }

      // Method 2: Router.RunningApps
      if (!appId && router?.RunningApps) {
        const apps = Array.isArray(router.RunningApps)
          ? router.RunningApps
          : typeof router.RunningApps.values === "function"
          ? Array.from(router.RunningApps.values())
          : [];
        const running = apps.find((a: any) => {
          const id = String(a.appid ?? a.nAppId ?? "");
          return id && id !== "0" && id !== "769";
        });
        if (running) {
          appId = String(running.appid ?? running.nAppId);
          appTitle = running.display_name || running.strDisplayName || running.name || "";
        }
      }
    } catch (e) {
      console.warn("[OmniAchievements] Router running apps error:", e);
    }

    // Method 3: SteamClient Apps / GameSessions
    if (!appId) {
      try {
        const sc = (window as any).SteamClient;
        const activeApp = sc?.Apps?.GetActiveGameInfo?.() || sc?.GameSessions?.GetActiveGameSession?.();
        if (activeApp && activeApp.nAppId && String(activeApp.nAppId) !== "0" && String(activeApp.nAppId) !== "769") {
          appId = String(activeApp.nAppId);
          appTitle = activeApp.strGameTitle || "";
        }
      } catch (e) {
        console.warn("[OmniAchievements] SteamClient active game check error:", e);
      }
    }

    // Method 4: appOverviewStore / SteamUIStore
    if (!appId) {
      try {
        const store = (window as any).appOverviewStore || (window as any).SteamUIStore;
        if (store?.RunningApps) {
          const apps = Array.isArray(store.RunningApps) ? store.RunningApps : [];
          const running = apps.find((a: any) => String(a.appid) !== "769" && String(a.appid) !== "0");
          if (running) {
            appId = String(running.appid ?? running.nAppId);
            appTitle = running.display_name || running.strDisplayName || "";
          }
        }
      } catch (_) {}
    }

    // Method 5: Python Backend /proc environment scanning for SteamAppId
    if (!appId) {
      try {
        const pyRes: any = await callBackend("detect_running_game");
        if (pyRes && pyRes.app_id) {
          appId = String(pyRes.app_id);
          appTitle = pyRes.app_title || pyRes.process_name || `Shortcut ${appId}`;
        }
      } catch (e) {
        console.warn("[OmniAchievements] Python backend detect_running_game error:", e);
      }
    }

    if (appId) {
      setActiveShortcutId(appId);
      setActiveShortcutName(appTitle || `Shortcut ${appId}`);

      // Query achievements for this shortcut
      const achRes: any = await callBackend("get_achievements", { shortcut_id: appId });
      if (achRes && achRes.linked) {
        setLinkedGame(achRes.game);
        setAchievements(achRes.achievements || []);
      } else {
        // Search auto fuzzy match
        if (appTitle) {
          const matchRes: any = await callBackend("match_game", { shortcut_name: appTitle });
          if (matchRes?.matches?.length > 0) {
            setSuggestedMatch(matchRes.matches[0]);
          }
        }
      }

      if (userInitiated) {
        showToast("Game Detected", `${appTitle || appId} active!`);
      }
    } else {
      if (userInitiated) {
        showToast("OmniAchievements", "No running game detected yet. Start a game or pick from library.");
      }
    }
  };

  const handleSaveConfig = async () => {
    setIsLoading(true);
    setConnectionStatus({
      checked: true,
      loading: true,
      online: false,
      authenticated: false,
      message: `Connecting to ${serverUrl}...`
    });

    // Save to localStorage immediately
    try {
      localStorage.setItem("omni_decky_server_url", serverUrl);
      if (token) localStorage.setItem("omni_decky_token", token);
    } catch {}

    const res: any = await callBackend("configure", {
      server_url: serverUrl,
      token: token
    });

    setIsLoading(false);

    if (res && res.online) {
      if (res.authenticated) {
        setConnectionStatus({
          checked: true,
          loading: false,
          online: true,
          authenticated: true,
          message: res.message || `Connected to server (v${res.server_version || ""})`,
          gameCount: res.game_count,
          serverVersion: res.server_version
        });
        showToast("OmniAchievements", `Connected! ${res.game_count ?? 0} games synced.`);
        loadGames();
        detectRunningGame();
      } else {
        setConnectionStatus({
          checked: true,
          loading: false,
          online: true,
          authenticated: false,
          warning: res.warning || res.error || "Server reachable, but Pairing Token is invalid or missing."
        });
        showToast("OmniAchievements", res.warning || "Pairing token needed to sync games.");
      }
    } else {
      setConnectionStatus({
        checked: true,
        loading: false,
        online: false,
        authenticated: false,
        error: res?.error || `Could not connect to ${serverUrl}. Check IP, port, and Wi-Fi.`
      });
      showToast("OmniAchievements Connection Error", res?.error || "Cannot reach server");
    }
  };

  const loadGames = async () => {
    const res: any = await callBackend("get_games");
    if (res && Array.isArray(res.games)) {
      setAvailableGames(res.games);
    }
  };

  const loadAchievementsForApp = async (appIdOrGameId: string) => {
    setIsLoading(true);
    const res: any = await callBackend("get_achievements", { shortcut_id: appIdOrGameId });
    setIsLoading(false);
    if (res && res.linked) {
      setLinkedGame(res.game);
      setAchievements(res.achievements || []);
    } else {
      setLinkedGame(null);
      setAchievements([]);
    }
  };

  const handleLinkGame = async () => {
    if (!activeShortcutId || !selectedGameId) return;
    setIsLoading(true);
    await callBackend("link_shortcut", {
      steam_shortcut_id: activeShortcutId,
      game_id: selectedGameId,
      shortcut_name: activeShortcutName
    });
    await loadAchievementsForApp(activeShortcutId);
    setIsLoading(false);
    showToast("Game Linked", `Linked to ${activeShortcutName}!`);
  };

  const handleToggleAchievement = async (ach: Achievement) => {
    const nextUnlocked = ach.is_unlocked === 1 ? false : true;
    await callBackend("toggle_achievement", {
      achievement_id: ach.id,
      is_unlocked: nextUnlocked
    });
    if (activeShortcutId) {
      await loadAchievementsForApp(activeShortcutId);
    } else if (linkedGame) {
      await loadAchievementsForApp(linkedGame.id);
    }
  };

  const handleCheckUpdate = async (source = updateSource) => {
    setIsCheckingUpdate(true);
    setUpdateStatusMsg("Checking for updates...");
    setUpdateSuccess(false);
    try {
      const data: any = await callBackend("check_for_updates", { source });
      if (data) {
        setCurrentVersion(data.current_version || currentVersion);
        setLatestVersion(data.latest_version);
        setUpdateAvailable(Boolean(data.update_available));
        if (data.update_available) {
          setUpdateStatusMsg(`⚡ Update Available: v${data.latest_version} (from ${data.source})`);
        } else if (data.error) {
          setUpdateStatusMsg(`✕ ${data.error}`);
        } else {
          setUpdateStatusMsg(`✓ Plugin is up to date (v${data.current_version})`);
        }
      }
    } catch (e: any) {
      setUpdateStatusMsg(`✕ Check failed: ${e.message || String(e)}`);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleApplyUpdate = async () => {
    setIsApplyingUpdate(true);
    setUpdateStatusMsg("Downloading and applying update files...");
    try {
      const data: any = await callBackend("apply_update", { source: updateSource });
      if (data?.success) {
        setUpdateSuccess(true);
        setCurrentVersion(data.new_version);
        setUpdateAvailable(false);
        setUpdateStatusMsg(`✓ Successfully updated to v${data.new_version}! Reload Decky to apply.`);
        showToast("OmniAchievements Updated", `Plugin updated to v${data.new_version}!`);
      } else {
        setUpdateStatusMsg(`✕ Update error: ${data?.error || "Unknown error"}`);
      }
    } catch (e: any) {
      setUpdateStatusMsg(`✕ Failed: ${e.message || String(e)}`);
    } finally {
      setIsApplyingUpdate(false);
    }
  };

  const handleReloadDecky = () => {
    try {
      if ((window as any).DeckyPluginLoader?.reloadPlugin) {
        (window as any).DeckyPluginLoader.reloadPlugin("OmniAchievements");
      } else {
        window.location.reload();
      }
    } catch (e) {
      window.location.reload();
    }
  };

  const unlockedCount = achievements.filter((a) => a.is_unlocked === 1).length;
  const totalCount = achievements.length;
  const progressPct = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return (
    <>
      <PanelSection title="OmniAchievements Sync">
        {/* Connection Status Box */}
        <PanelSectionRow>
          <div
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              backgroundColor: connectionStatus.loading
                ? "rgba(99, 102, 241, 0.15)"
                : connectionStatus.authenticated
                ? "rgba(16, 185, 129, 0.15)"
                : connectionStatus.online
                ? "rgba(245, 158, 11, 0.15)"
                : connectionStatus.error
                ? "rgba(239, 68, 68, 0.15)"
                : "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${
                connectionStatus.loading
                  ? "rgba(99, 102, 241, 0.5)"
                  : connectionStatus.authenticated
                  ? "rgba(16, 185, 129, 0.5)"
                  : connectionStatus.online
                  ? "rgba(245, 158, 11, 0.5)"
                  : connectionStatus.error
                  ? "rgba(239, 68, 68, 0.5)"
                  : "rgba(255, 255, 255, 0.1)"
              }`,
              color: connectionStatus.loading
                ? "#a5b4fc"
                : connectionStatus.authenticated
                ? "#34d399"
                : connectionStatus.online
                ? "#fbbf24"
                : connectionStatus.error
                ? "#f87171"
                : "#aaa"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", marginBottom: "4px" }}>
              <span>
                {connectionStatus.loading
                  ? "⏳ Testing Connection..."
                  : connectionStatus.authenticated
                  ? "🟢 Connected & Paired"
                  : connectionStatus.online
                  ? "🟡 Server Online (Pairing Token Needed)"
                  : connectionStatus.error
                  ? "🔴 Disconnected"
                  : "⚪ Not Tested Yet"}
              </span>
            </div>
            <div style={{ fontSize: "11px", wordBreak: "break-word", lineHeight: "1.4" }}>
              {connectionStatus.message ||
                connectionStatus.warning ||
                connectionStatus.error ||
                "Configure your server URL and Pairing Token, then click Connect Server."}
            </div>
          </div>
        </PanelSectionRow>

        {/* Server Configuration Fields */}
        <PanelSectionRow>
          <TextField
            label="Server URL (IP:Port)"
            value={serverUrl}
            onChange={(e) => {
              setServerUrl(e.target.value);
              try { localStorage.setItem("omni_decky_server_url", e.target.value); } catch {}
            }}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <TextField
            label="Pairing Token"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              try { localStorage.setItem("omni_decky_token", e.target.value); } catch {}
            }}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <div style={{ fontSize: "10px", color: "#888", width: "100%", padding: "0 2px" }}>
            💡 <em>Get your Pairing Token in OmniAchievements Web/iOS App: <strong>Settings &gt; Steam Deck &amp; Handhelds</strong></em>
          </div>
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={handleSaveConfig}
            disabled={isLoading}
          >
            {isLoading ? "Connecting to server..." : connectionStatus.authenticated ? "Reconnect / Test Connection" : "Connect Server"}
          </ButtonItem>
        </PanelSectionRow>

        {/* Active Game & Detection Section */}
        <PanelSectionRow>
          <div style={{ padding: "8px 0", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", color: "#888" }}>Detected Running Game:</span>
              <span style={{ fontSize: "11px", color: activeShortcutId ? "#34d399" : "#888", fontWeight: "bold" }}>
                {activeShortcutId ? "🎮 Active" : "⏸ Idle"}
              </span>
            </div>
            <div style={{ fontSize: "14px", fontWeight: "bold", wordBreak: "break-word" }}>
              {activeShortcutName || "No game running currently"}
            </div>
            {activeShortcutId && (
              <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>AppID: {activeShortcutId}</div>
            )}
            <div style={{ marginTop: "8px" }}>
              <ButtonItem
                layout="below"
                onClick={() => detectRunningGame(true)}
              >
                🔄 Refresh Game Detection
              </ButtonItem>
            </div>
          </div>
        </PanelSectionRow>

        {/* 1-Click Auto-Detect & Fuzzy Match Suggestion */}
        {!linkedGame && suggestedMatch && activeShortcutId && (
          <PanelSectionRow>
            <div style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(99, 102, 241, 0.5)" }}>
              <div style={{ fontSize: "11px", color: "#a5b4fc", fontWeight: "bold" }}>Suggested Match Found:</div>
              <div style={{ fontSize: "13px", fontWeight: "bold", margin: "4px 0" }}>
                {suggestedMatch.title} ({suggestedMatch.platform})
              </div>
              <ButtonItem
                layout="below"
                onClick={async () => {
                  setIsLoading(true);
                  await callBackend("link_shortcut", {
                    steam_shortcut_id: activeShortcutId,
                    game_id: suggestedMatch.id,
                    shortcut_name: activeShortcutName
                  });
                  await loadAchievementsForApp(activeShortcutId);
                  setSuggestedMatch(null);
                  setIsLoading(false);
                  showToast("OmniAchievements", `Linked to ${suggestedMatch.title}!`);
                }}
              >
                1-Click Link to {suggestedMatch.title}
              </ButtonItem>
            </div>
          </PanelSectionRow>
        )}

        {/* Manual Library Browser / Game Selector */}
        {!linkedGame && (
          <PanelSectionRow>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
              <span style={{ fontSize: "11px", color: "#888" }}>
                {activeShortcutId ? "Link Shortcut to OmniAchievements Game:" : "Browse & View Achievements for Game:"}
              </span>
              <select
                style={{ padding: "8px", borderRadius: "8px", background: "#222", color: "#fff", width: "100%", fontSize: "12px" }}
                value={selectedGameId}
                onChange={(e) => {
                  const gId = e.target.value;
                  setSelectedGameId(gId);
                  if (gId) {
                    loadAchievementsForApp(gId);
                  }
                }}
              >
                <option value="">-- Choose game from library ({availableGames.length}) --</option>
                {availableGames.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.platform})
                  </option>
                ))}
              </select>
              {activeShortcutId && selectedGameId && (
                <ButtonItem layout="below" onClick={handleLinkGame}>
                  Link Game &amp; Load Achievements
                </ButtonItem>
              )}
            </div>
          </PanelSectionRow>
        )}

        {/* Achievements Overlay List */}
        {linkedGame && (
          <>
            <PanelSectionRow>
              <div style={{ width: "100%", padding: "4px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ fontWeight: "bold" }}>{linkedGame.title}</span>
                  <span>{unlockedCount} / {totalCount} ({Math.round(progressPct)}%)</span>
                </div>
                <ProgressBar nProgress={progressPct} />
              </div>
            </PanelSectionRow>

            <PanelSectionRow>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", maxHeight: "300px", overflowY: "auto" }}>
                {achievements.map((ach) => {
                  const isUnlocked = ach.is_unlocked === 1;
                  return (
                    <Focusable
                      key={ach.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px",
                        borderRadius: "8px",
                        backgroundColor: isUnlocked ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.05)",
                        border: isUnlocked ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)"
                      }}
                      onClick={() => handleToggleAchievement(ach)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            overflow: "hidden",
                            backgroundColor: "#333",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          {ach.icon_unlocked ? (
                            <img
                              src={isUnlocked ? ach.icon_unlocked : (ach.icon_locked || ach.icon_unlocked)}
                              style={{ width: "100%", height: "100%", filter: isUnlocked ? "none" : "grayscale(100%)" }}
                            />
                          ) : (
                            <TrophyIcon color={isUnlocked ? "#f59e0b" : "#888"} />
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {ach.display_name_es || ach.display_name}
                          </div>
                          <div style={{ fontSize: "10px", color: "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {ach.description_es || ach.description}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isUnlocked ? <CheckCircleIcon color="#10b981" /> : <LockIcon color="#666" />}
                      </div>
                    </Focusable>
                  );
                })}
              </div>
            </PanelSectionRow>

            {/* Unlink / Change Game Option */}
            <PanelSectionRow>
              <ButtonItem
                layout="below"
                onClick={() => {
                  setLinkedGame(null);
                  setAchievements([]);
                }}
              >
                Change Selected Game
              </ButtonItem>
            </PanelSectionRow>
          </>
        )}
      </PanelSection>

      {/* In-Decky Self-Updater Section */}
      <PanelSection title="Plugin Self-Updater">
        <PanelSectionRow>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", fontSize: "12px", padding: "4px 0" }}>
            <span style={{ color: "#aaa" }}>Installed Version:</span>
            <span style={{ fontWeight: "bold", background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "10px" }}>
              v{currentVersion}
            </span>
          </div>
        </PanelSectionRow>

        <PanelSectionRow>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
            <span style={{ fontSize: "11px", color: "#888" }}>Update Channel:</span>
            <select
              style={{ padding: "6px 8px", borderRadius: "6px", background: "#222", color: "#fff", fontSize: "12px" }}
              value={updateSource}
              onChange={(e) => setUpdateSource(e.target.value as any)}
            >
              <option value="auto">Auto (Server with GitHub fallback)</option>
              <option value="server">Local OmniAchievements Server</option>
              <option value="github">GitHub Repo (santx1/OmniAchievements)</option>
            </select>
          </div>
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => handleCheckUpdate()}
            disabled={isCheckingUpdate || isApplyingUpdate}
          >
            {isCheckingUpdate ? "Checking for updates..." : "Check for Updates"}
          </ButtonItem>
        </PanelSectionRow>

        {updateStatusMsg && (
          <PanelSectionRow>
            <div
              style={{
                fontSize: "11px",
                padding: "8px 10px",
                borderRadius: "6px",
                backgroundColor: updateSuccess
                  ? "rgba(16, 185, 129, 0.15)"
                  : updateAvailable
                  ? "rgba(245, 158, 11, 0.15)"
                  : "rgba(255, 255, 255, 0.05)",
                border: updateSuccess
                  ? "1px solid rgba(16, 185, 129, 0.4)"
                  : updateAvailable
                  ? "1px solid rgba(245, 158, 11, 0.4)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
                color: updateSuccess ? "#34d399" : updateAvailable ? "#fbbf24" : "#ccc",
                width: "100%",
                wordBreak: "break-word"
              }}
            >
              {updateStatusMsg}
            </div>
          </PanelSectionRow>
        )}

        {updateAvailable && !updateSuccess && (
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={handleApplyUpdate}
              disabled={isApplyingUpdate}
            >
              {isApplyingUpdate ? "Updating Plugin Files..." : `Update to v${latestVersion} Now`}
            </ButtonItem>
          </PanelSectionRow>
        )}

        {updateSuccess && (
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={handleReloadDecky}>
              Reload Decky Now
            </ButtonItem>
          </PanelSectionRow>
        )}
      </PanelSection>
    </>
  );
};

// ============================================================================
// STEAM-NATIVE "YOUR STUFF" ACHIEVEMENTS INJECTION ENGINE
// ============================================================================

function injectNativeStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("omni-achievements-native-styles")) return;

  const styleEl = document.createElement("style");
  styleEl.id = "omni-achievements-native-styles";
  styleEl.textContent = `
    .omni-your-stuff-section {
      margin: 14px 0 24px 0;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--gp-body-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      animation: omniFadeIn 0.25s ease-out;
    }
    @keyframes omniFadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .omni-section-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      color: #8b929a;
      margin-bottom: 8px;
      padding: 0 4px;
    }
    .omni-heading-progress {
      font-size: 12px;
      font-weight: 600;
      color: #cbd5e1;
      text-transform: none;
      letter-spacing: normal;
    }
    .omni-achievements-card {
      background: rgba(30, 36, 44, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 16px 18px;
      cursor: pointer;
      transition: all 0.15s cubic-bezier(0.2, 0, 0, 1);
      outline: none;
      user-select: none;
      box-sizing: border-box;
      display: block;
      width: 100%;
      color: #ffffff;
      text-decoration: none;
      position: relative;
    }
    .omni-achievements-card:focus,
    .omni-achievements-card:focus-visible,
    .omni-achievements-card:hover,
    .omni-achievements-card.gpfocus {
      border-color: #1a9fff !important;
      background: rgba(45, 55, 68, 0.9) !important;
      box-shadow: 0 0 0 2px #1a9fff, 0 4px 20px rgba(26, 159, 255, 0.45) !important;
      transform: scale(1.008);
    }
    .omni-card-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .omni-card-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .omni-card-title {
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
    }
    .omni-card-pct-badge {
      font-size: 12px;
      font-weight: 700;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.15);
      padding: 2px 8px;
      border-radius: 9999px;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .omni-progress-track {
      width: 100%;
      height: 7px;
      background: rgba(0, 0, 0, 0.45);
      border-radius: 4px;
      overflow: hidden;
      margin: 10px 0 14px 0;
    }
    .omni-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #0ea5e9, #38bdf8);
      border-radius: 4px;
      transition: width 0.4s ease;
    }
    .omni-card-bottom-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .omni-badge-strip {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: nowrap;
      overflow: hidden;
    }
    .omni-badge-item {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: 6px;
      overflow: hidden;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
    }
    .omni-badge-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .omni-badge-thumb.locked {
      filter: grayscale(100%) opacity(0.35);
    }
    .omni-badge-lock-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.4);
    }
    .omni-card-action {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #94a3b8;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }
    .omni-achievements-card:focus .omni-card-action,
    .omni-achievements-card:hover .omni-card-action {
      color: #38bdf8;
    }
    .omni-controller-glyph {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #1a9fff;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      line-height: 1;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    }

    /* Full Achievements Modal View */
    .omni-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(10, 14, 20, 0.92);
      backdrop-filter: blur(24px);
      display: flex;
      flex-direction: column;
      padding: 32px 48px;
      box-sizing: border-box;
      font-family: var(--gp-body-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      color: #ffffff;
      overflow: hidden;
    }
    .omni-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 16px;
    }
    .omni-modal-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #ffffff;
    }
    .omni-modal-subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .omni-modal-filter-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .omni-filter-btn {
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.05);
      color: #cbd5e1;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      outline: none;
    }
    .omni-filter-btn:focus,
    .omni-filter-btn.active {
      background: #1a9fff !important;
      border-color: #1a9fff !important;
      color: #ffffff !important;
      box-shadow: 0 0 12px rgba(26, 159, 255, 0.5);
    }
    .omni-modal-list {
      flex: 1;
      overflow-y: auto;
      padding-right: 8px;
      margin-bottom: 16px;
    }
    .omni-achievement-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 16px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      margin-bottom: 8px;
      transition: all 0.15s ease;
      cursor: pointer;
      outline: none;
    }
    .omni-achievement-row:focus,
    .omni-achievement-row:hover,
    .omni-achievement-row.gpfocus {
      background: rgba(45, 55, 68, 0.85) !important;
      border-color: #1a9fff !important;
      box-shadow: 0 0 0 2px #1a9fff, 0 4px 16px rgba(26, 159, 255, 0.35) !important;
      transform: scale(1.005);
    }
    .omni-row-icon {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      object-fit: cover;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.12);
      flex-shrink: 0;
    }
    .omni-row-icon.locked {
      filter: grayscale(100%) opacity(0.35);
    }
    .omni-row-content {
      flex: 1;
      min-width: 0;
    }
    .omni-row-name {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 4px;
    }
    .omni-row-desc {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.4;
      margin-bottom: 6px;
    }
    .omni-row-status {
      font-size: 11px;
      font-weight: 600;
    }
    .omni-row-status.unlocked {
      color: #10b981;
    }
    .omni-row-status.locked {
      color: #64748b;
    }
    .omni-modal-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .omni-close-btn {
      padding: 8px 18px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      outline: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .omni-close-btn:focus,
    .omni-close-btn:hover {
      background: #ef4444;
      border-color: #ef4444;
    }
  `;
  document.head.appendChild(styleEl);
}

function findYourStuffContainer(): { container: HTMLElement; insertBefore: HTMLElement | null } | null {
  if (typeof window === "undefined" || !window.location.href.includes("/library/app/")) {
    return null;
  }

  // 1. Locate tabs to confirm if "Your Stuff" is currently the active tab
  const tabs = Array.from(document.querySelectorAll<HTMLElement>('[role="tab"], button[class*="Tab"]'));
  if (tabs.length > 0) {
    const activeTab = tabs.find(t =>
      t.getAttribute("aria-selected") === "true" ||
      t.classList.contains("active") ||
      t.className.includes("Active") ||
      t.className.includes("Selected")
    );

    if (activeTab) {
      const text = activeTab.textContent?.toLowerCase() || "";
      const isYourStuff =
        text.includes("your stuff") ||
        text.includes("tus cosas") ||
        text.includes("stuff") ||
        text.includes("cosas") ||
        text.includes("affaires") ||
        text.includes("sachen") ||
        tabs.indexOf(activeTab) === 1; // Tab at index 1 is standard "Your Stuff"

      if (!isYourStuff) {
        return null;
      }
    }
  }

  // 2. Locate the active tabpanel container
  const tabPanel = document.querySelector<HTMLElement>('[role="tabpanel"]');
  if (tabPanel) {
    const playtime = tabPanel.querySelector<HTMLElement>('[class*="playtime"], [class*="Playtime"], [class*="PlayTime"]');
    if (playtime) {
      return { container: tabPanel, insertBefore: playtime.nextElementSibling as HTMLElement | null };
    }
    const screenshots = tabPanel.querySelector<HTMLElement>('[class*="screenshot"], [class*="Screenshot"], [class*="media"], [class*="Media"]');
    if (screenshots) {
      return { container: tabPanel, insertBefore: screenshots };
    }
    return { container: tabPanel, insertBefore: null };
  }

  // 3. Fallback: Search by class name matching yourstuff
  const yourStuffByClass = document.querySelector<HTMLElement>('[class*="appdetailsyourstuff"], [class*="AppDetailsYourStuff"], [class*="yourstuff"], [class*="YourStuff"]');
  if (yourStuffByClass) {
    const playtime = yourStuffByClass.querySelector<HTMLElement>('[class*="playtime"], [class*="Playtime"]');
    return { container: yourStuffByClass, insertBefore: playtime ? (playtime.nextElementSibling as HTMLElement | null) : null };
  }

  // 4. Fallback: Find playtime element's parent container
  const allPlaytime = document.querySelector<HTMLElement>('[class*="playtime"], [class*="Playtime"], [class*="PlayTime"]');
  if (allPlaytime && allPlaytime.parentElement) {
    return { container: allPlaytime.parentElement, insertBefore: allPlaytime.nextElementSibling as HTMLElement | null };
  }

  return null;
}

const AchievementsBrowserModal: FC<{
  gameTitle: string;
  achievements: Achievement[];
  onClose: () => void;
}> = ({ gameTitle, achievements, onClose }) => {
  const isSpanish = (typeof navigator !== "undefined" && navigator.language?.startsWith("es")) || false;
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  const unlockedCount = achievements.filter(a => a.is_unlocked === 1).length;
  const totalCount = achievements.length;
  const progressPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const filtered = achievements.filter(a => {
    if (filter === "unlocked") return a.is_unlocked === 1;
    if (filter === "locked") return a.is_unlocked !== 1;
    return true;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "GamepadB" || e.code === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="omni-modal-overlay">
      <div className="omni-modal-header">
        <div>
          <div className="omni-modal-title">
            🏆 {gameTitle} {isSpanish ? "- Logros" : "- Achievements"}
          </div>
          <div className="omni-modal-subtitle">
            {isSpanish
              ? `${unlockedCount} de ${totalCount} logros desbloqueados (${progressPct}%)`
              : `${unlockedCount} of ${totalCount} achievements unlocked (${progressPct}%)`}
          </div>
        </div>
        <button className="omni-close-btn Focusable" tabIndex={0} onClick={onClose}>
          <span className="omni-controller-glyph" style={{ background: "#ef4444" }}>B</span>
          {isSpanish ? "Cerrar" : "Close"}
        </button>
      </div>

      <div className="omni-progress-track" style={{ height: "9px", marginBottom: "16px" }}>
        <div className="omni-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="omni-modal-filter-bar">
        <button
          className={`omni-filter-btn Focusable ${filter === "all" ? "active" : ""}`}
          tabIndex={0}
          onClick={() => setFilter("all")}
        >
          {isSpanish ? "Todos" : "All"} ({totalCount})
        </button>
        <button
          className={`omni-filter-btn Focusable ${filter === "unlocked" ? "active" : ""}`}
          tabIndex={0}
          onClick={() => setFilter("unlocked")}
        >
          {isSpanish ? "Desbloqueados" : "Unlocked"} ({unlockedCount})
        </button>
        <button
          className={`omni-filter-btn Focusable ${filter === "locked" ? "active" : ""}`}
          tabIndex={0}
          onClick={() => setFilter("locked")}
        >
          {isSpanish ? "Bloqueados" : "Locked"} ({totalCount - unlockedCount})
        </button>
      </div>

      <div className="omni-modal-list">
        {filtered.map(ach => {
          const isUnlocked = ach.is_unlocked === 1;
          const name = (isSpanish && ach.display_name_es) ? ach.display_name_es : ach.display_name;
          const desc = (isSpanish && ach.description_es) ? ach.description_es : ach.description;
          const icon = isUnlocked
            ? (ach.icon_unlocked || ach.icon_locked)
            : (ach.icon_locked || ach.icon_unlocked);

          return (
            <div
              key={ach.id}
              className="omni-achievement-row Focusable"
              tabIndex={0}
            >
              <img
                src={icon}
                className={`omni-row-icon ${isUnlocked ? "unlocked" : "locked"}`}
                alt={name}
              />
              <div className="omni-row-content">
                <div className="omni-row-name">{name}</div>
                <div className="omni-row-desc">{desc}</div>
                <div className={`omni-row-status ${isUnlocked ? "unlocked" : "locked"}`}>
                  {isUnlocked
                    ? (isSpanish ? "✓ Desbloqueado" : "✓ Unlocked")
                    : (isSpanish ? "🔒 Bloqueado" : "🔒 Locked")}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="omni-modal-footer">
        <div style={{ fontSize: "12px", color: "#64748b" }}>
          🎮 {isSpanish ? "Cruceta / Stick para navegar • (B) para salir" : "D-pad or stick to browse • (B) to exit"}
        </div>
      </div>
    </div>
  );
};

const openFullAchievementsModal = (gameTitle: string, achievements: Achievement[]) => {
  injectNativeStyles();

  // 1. Try using showModal from @decky/ui
  try {
    if (typeof showModal === "function") {
      let modalRes: any = null;
      modalRes = showModal(
        <AchievementsBrowserModal
          gameTitle={gameTitle}
          achievements={achievements}
          onClose={() => {
            if (modalRes?.Close) modalRes.Close();
          }}
        />,
        window
      );
      if (modalRes) return;
    }
  } catch (e) {
    console.warn("[OmniAchievements] showModal error, falling back to overlay root:", e);
  }

  // 2. Direct DOM overlay root fallback
  let container = document.getElementById("omni-achievements-modal-root");
  if (!container) {
    container = document.createElement("div");
    container.id = "omni-achievements-modal-root";
    document.body.appendChild(container);
  }

  const handleClose = () => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };

  const reactDOM = (window as any).SP_REACTDOM || (window as any).ReactDOM;
  if (reactDOM?.createRoot) {
    const root = reactDOM.createRoot(container);
    root.render(
      <AchievementsBrowserModal
        gameTitle={gameTitle}
        achievements={achievements}
        onClose={() => {
          handleClose();
          root.unmount();
        }}
      />
    );
  } else if (reactDOM?.render) {
    reactDOM.render(
      <AchievementsBrowserModal
        gameTitle={gameTitle}
        achievements={achievements}
        onClose={handleClose}
      />,
      container
    );
  }
};

const NativeSteamAchievementsSection: FC<{
  gameTitle: string;
  achievements: Achievement[];
  shortcutId: string;
  targetInfo?: { container: HTMLElement; insertBefore: HTMLElement | null };
}> = ({ gameTitle, achievements, targetInfo }) => {
  const isSpanish = (typeof navigator !== "undefined" && navigator.language?.startsWith("es")) || false;
  const sectionRef = useRef<HTMLDivElement>(null);

  const unlockedCount = achievements.filter(a => a.is_unlocked === 1).length;
  const totalCount = achievements.length;
  const progressPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const unlocked = achievements.filter(a => a.is_unlocked === 1);
  const locked = achievements.filter(a => a.is_unlocked !== 1);
  const recentBadges = [...unlocked, ...locked].slice(0, 5);

  useEffect(() => {
    if (sectionRef.current && targetInfo?.container && targetInfo?.insertBefore) {
      if (sectionRef.current.nextElementSibling !== targetInfo.insertBefore) {
        targetInfo.container.insertBefore(sectionRef.current, targetInfo.insertBefore);
      }
    }
  }, [targetInfo]);

  const handleClick = () => {
    openFullAchievementsModal(gameTitle, achievements);
  };

  return (
    <div
      ref={sectionRef}
      className="omni-your-stuff-section"
      id="omniachievements-your-stuff-section"
    >
      <div className="omni-section-heading">
        <span>{isSpanish ? "LOGROS" : "ACHIEVEMENTS"}</span>
        <span className="omni-heading-progress">
          {unlockedCount} / {totalCount} ({progressPct}%)
        </span>
      </div>

      <div
        className="omni-achievements-card Focusable"
        tabIndex={0}
        role="button"
        aria-label={`${gameTitle} Achievements: ${unlockedCount} of ${totalCount} unlocked. Press A to view all.`}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "GamepadA") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div className="omni-card-top-row">
          <div className="omni-card-title-group">
            <TrophyIcon size={18} color="#f59e0b" />
            <span className="omni-card-title">
              {isSpanish ? "Progreso de Logros" : "Achievements Progress"}
            </span>
          </div>
          <div className="omni-card-pct-badge">
            {progressPct}%
          </div>
        </div>

        <div className="omni-progress-track">
          <div className="omni-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="omni-card-bottom-row">
          <div className="omni-badge-strip">
            {recentBadges.map(ach => (
              <div key={ach.id} className="omni-badge-item" title={ach.display_name}>
                <img
                  src={ach.is_unlocked === 1 ? (ach.icon_unlocked || ach.icon_locked) : (ach.icon_locked || ach.icon_unlocked)}
                  className={`omni-badge-thumb ${ach.is_unlocked === 1 ? "unlocked" : "locked"}`}
                  alt={ach.display_name}
                />
                {ach.is_unlocked !== 1 && (
                  <div className="omni-badge-lock-overlay">
                    <LockIcon size={12} color="#ffffff" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="omni-card-action">
            <span className="omni-action-text">
              {isSpanish ? "Ver todos los logros" : "View all achievements"}
            </span>
            <span className="omni-controller-glyph">A</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const YourStuffInjector: FC = () => {
  const [targetInfo, setTargetInfo] = useState<{ container: HTMLElement; insertBefore: HTMLElement | null } | null>(null);
  const [gameTitle, setGameTitle] = useState<string>("");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const lastCheckedAppIdRef = useRef<string>("");
  const cachedAchievementsRef = useRef<Map<string, { title: string; list: Achievement[] }>>(new Map());

  useEffect(() => {
    injectNativeStyles();

    let isDestroyed = false;

    const checkState = async () => {
      if (isDestroyed) return;

      const url = window.location.href || "";
      const match = url.match(/\/library\/app\/([0-9]+)/);
      if (!match) {
        if (targetInfo) setTargetInfo(null);
        return;
      }

      const appId = match[1];

      // If app ID changed, fetch achievements
      if (lastCheckedAppIdRef.current !== appId) {
        lastCheckedAppIdRef.current = appId;

        if (cachedAchievementsRef.current.has(appId)) {
          const cached = cachedAchievementsRef.current.get(appId)!;
          setGameTitle(cached.title);
          setAchievements(cached.list);
        } else {
          let title = "";
          try {
            const details = (window as any).appDetailsStore?.GetAppDetails?.(Number(appId));
            title = details?.strDisplayName || "";
          } catch (_) {}

          if (!title) {
            const titleElem = document.querySelector<HTMLElement>('h1, [class*="HeaderTitle"], [class*="AppTitle"], [class*="game_title"]');
            if (titleElem) title = titleElem.textContent?.trim() || "";
          }

          try {
            const res = await callBackend("get_achievements", { shortcut_id: appId, title });
            if (res && res.linked && Array.isArray(res.achievements) && res.achievements.length > 0) {
              const fetchedTitle = res.game?.title || title || "Game";
              cachedAchievementsRef.current.set(appId, { title: fetchedTitle, list: res.achievements });
              setGameTitle(fetchedTitle);
              setAchievements(res.achievements);
            } else {
              setAchievements([]);
            }
          } catch (_) {
            setAchievements([]);
          }
        }
      }

      const found = findYourStuffContainer();
      if (found) {
        if (!targetInfo || targetInfo.container !== found.container || targetInfo.insertBefore !== found.insertBefore) {
          setTargetInfo(found);
        }
      } else {
        if (targetInfo) setTargetInfo(null);
      }
    };

    checkState();
    const interval = setInterval(checkState, 400);

    return () => {
      isDestroyed = true;
      clearInterval(interval);
    };
  }, [targetInfo]);

  if (!targetInfo || achievements.length === 0) return null;

  return createPortal(
    <NativeSteamAchievementsSection
      gameTitle={gameTitle}
      achievements={achievements}
      shortcutId={lastCheckedAppIdRef.current}
      targetInfo={targetInfo}
    />,
    targetInfo.container
  );
};

// Standalone observer controller for maximum compatibility across all Decky versions
let standaloneInterval: any = null;
let standaloneRoot: any = null;

function startStandaloneObserver() {
  injectNativeStyles();
  if (standaloneInterval) return;

  let currentAppId = "";
  let gameTitle = "";
  let achievements: Achievement[] = [];
  const cache = new Map<string, { title: string; list: Achievement[] }>();

  standaloneInterval = setInterval(async () => {
    const url = window.location.href || "";
    const match = url.match(/\/library\/app\/([0-9]+)/);
    if (!match) {
      if (standaloneRoot) {
        const el = document.getElementById("omniachievements-your-stuff-section");
        if (el?.parentNode) el.parentNode.removeChild(el);
      }
      return;
    }

    const appId = match[1];
    if (appId !== currentAppId) {
      currentAppId = appId;
      if (cache.has(appId)) {
        const c = cache.get(appId)!;
        gameTitle = c.title;
        achievements = c.list;
      } else {
        let title = "";
        try {
          const details = (window as any).appDetailsStore?.GetAppDetails?.(Number(appId));
          title = details?.strDisplayName || "";
        } catch (_) {}

        if (!title) {
          const titleElem = document.querySelector<HTMLElement>('h1, [class*="HeaderTitle"], [class*="AppTitle"], [class*="game_title"]');
          if (titleElem) title = titleElem.textContent?.trim() || "";
        }

        try {
          const res = await callBackend("get_achievements", { shortcut_id: appId, title });
          if (res && res.linked && Array.isArray(res.achievements) && res.achievements.length > 0) {
            gameTitle = res.game?.title || title || "Game";
            achievements = res.achievements;
            cache.set(appId, { title: gameTitle, list: achievements });
          } else {
            achievements = [];
          }
        } catch (_) {
          achievements = [];
        }
      }
    }

    if (achievements.length === 0) {
      const existing = document.getElementById("omniachievements-your-stuff-section");
      if (existing?.parentNode) existing.parentNode.removeChild(existing);
      return;
    }

    const found = findYourStuffContainer();
    if (found) {
      const existing = document.getElementById("omniachievements-your-stuff-section");
      if (!existing) {
        const mountDiv = document.createElement("div");
        if (found.insertBefore) {
          found.container.insertBefore(mountDiv, found.insertBefore);
        } else {
          found.container.prepend(mountDiv);
        }

        const reactDOM = (window as any).SP_REACTDOM || (window as any).ReactDOM;
        if (reactDOM?.createRoot) {
          standaloneRoot = reactDOM.createRoot(mountDiv);
          standaloneRoot.render(
            <NativeSteamAchievementsSection
              gameTitle={gameTitle}
              achievements={achievements}
              shortcutId={currentAppId}
              targetInfo={found}
            />
          );
        } else if (reactDOM?.render) {
          reactDOM.render(
            <NativeSteamAchievementsSection
              gameTitle={gameTitle}
              achievements={achievements}
              shortcutId={currentAppId}
              targetInfo={found}
            />,
            mountDiv
          );
        }
      }
    } else {
      const existing = document.getElementById("omniachievements-your-stuff-section");
      if (existing?.parentNode) existing.parentNode.removeChild(existing);
    }
  }, 450);
}

function stopStandaloneObserver() {
  if (standaloneInterval) {
    clearInterval(standaloneInterval);
    standaloneInterval = null;
  }
  const existing = document.getElementById("omniachievements-your-stuff-section");
  if (existing?.parentNode) existing.parentNode.removeChild(existing);
}

// Official Decky definePlugin helper
function defineDeckyPlugin(fn: (serverApi?: any) => any) {
  return (...args: any[]) => fn(...args);
}

export default defineDeckyPlugin((serverApi?: any) => {
  if (serverApi) {
    globalServerApi = serverApi;
  }

  // 1. Try registering global component with routerHook
  try {
    const rHook = serverApi?.routerHook || (window as any).DeckyPluginLoader?.routerHook;
    if (rHook?.addGlobalComponent) {
      rHook.addGlobalComponent("OmniAchievementsYourStuffInjector", YourStuffInjector);
    }
  } catch (e) {
    console.warn("[OmniAchievements] routerHook.addGlobalComponent not available, using standalone observer:", e);
  }

  // 2. Start standalone observer controller for guaranteed injection
  startStandaloneObserver();

  return {
    name: "OmniAchievements",
    title: <div className={staticClasses.Title}>OmniAchievements</div>,
    titleView: <div className={staticClasses.Title}>OmniAchievements</div>,
    content: <Content serverApi={serverApi} />,
    icon: <TrophyIcon />,
    onDismount() {
      try {
        const rHook = serverApi?.routerHook || (window as any).DeckyPluginLoader?.routerHook;
        if (rHook?.removeGlobalComponent) {
          rHook.removeGlobalComponent("OmniAchievementsYourStuffInjector");
        }
      } catch (_) {}
      stopStandaloneObserver();
    }
  };
});
