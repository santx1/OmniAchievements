// Self-contained icons for SteamOS Decky Loader (no external npm dependencies required)
const TrophyIcon = ({ color = "#f59e0b", size = 16 }) => (SP_JSX.jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { display: "inline-block", verticalAlign: "middle" }, children: [SP_JSX.jsx("path", { d: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6" }), SP_JSX.jsx("path", { d: "M18 9h1.5a2.5 2.5 0 0 0 0-5H18" }), SP_JSX.jsx("path", { d: "M4 22h16" }), SP_JSX.jsx("path", { d: "M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" }), SP_JSX.jsx("path", { d: "M6 4h12v6c0 3.31-2.69 6-6 6s-6-2.69-6-6V4z", fill: color, fillOpacity: "0.3" })] }));
const CheckCircleIcon = ({ color = "#10b981", size = 16 }) => (SP_JSX.jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { display: "inline-block", verticalAlign: "middle" }, children: [SP_JSX.jsx("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }), SP_JSX.jsx("polyline", { points: "22 4 12 14.01 9 11.01" })] }));
const LockIcon = ({ color = "#666", size = 16 }) => (SP_JSX.jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { display: "inline-block", verticalAlign: "middle" }, children: [SP_JSX.jsx("rect", { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }), SP_JSX.jsx("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })] }));
// Global reference for serverApi if provided by legacy/eval loader
let globalServerApi = null;
// Universal backend invocation bridge supporting Decky v2, v3, and standalone loaders
async function callBackend(method, args = {}) {
    // 1. Try serverApi if passed to definePlugin
    if (globalServerApi && typeof globalServerApi.callPluginMethod === "function") {
        try {
            const res = await globalServerApi.callPluginMethod(method, args);
            return res?.result !== undefined ? res.result : res;
        }
        catch (e) {
            console.warn(`[OmniAchievements] globalServerApi.callPluginMethod("${method}") failed:`, e);
        }
    }
    // 2. Try window.DeckyBackend if available
    try {
        const deckyBackend = window.DeckyBackend;
        if (deckyBackend && typeof deckyBackend.call === "function") {
            const res = await deckyBackend.call("loader/call_plugin_method", "OmniAchievements", method, args);
            return res?.result !== undefined ? res.result : res;
        }
    }
    catch (e) {
        console.warn(`[OmniAchievements] DeckyBackend.call("${method}") failed:`, e);
    }
    // 3. Try window.__DECKY_SECRET_INTERNALS_... if available
    try {
        const loaderInit = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
        if (loaderInit && typeof loaderInit.connect === "function") {
            const api = loaderInit.connect(2, "OmniAchievements");
            if (api && typeof api.call === "function") {
                const res = await api.call(method, args);
                return res?.result !== undefined ? res.result : res;
            }
        }
    }
    catch (e) {
        console.warn(`[OmniAchievements] loaderInit.connect("${method}") failed:`, e);
    }
    return { error: "No backend communication method available" };
}
const Content = ({ serverApi }) => {
    if (serverApi) {
        globalServerApi = serverApi;
    }
    // Instant restoration from localStorage so closing the menu never blanks the inputs
    const [serverUrl, setServerUrl] = SP_REACT.useState(() => {
        try {
            return localStorage.getItem("omni_decky_server_url") || "http://192.168.1.100:3001";
        }
        catch {
            return "http://192.168.1.100:3001";
        }
    });
    const [token, setToken] = SP_REACT.useState(() => {
        try {
            return localStorage.getItem("omni_decky_token") || "";
        }
        catch {
            return "";
        }
    });
    const [connectionStatus, setConnectionStatus] = SP_REACT.useState({
        checked: false,
        loading: false,
        online: false,
        authenticated: false
    });
    const [activeShortcutId, setActiveShortcutId] = SP_REACT.useState("");
    const [activeShortcutName, setActiveShortcutName] = SP_REACT.useState("");
    const [availableGames, setAvailableGames] = SP_REACT.useState([]);
    const [suggestedMatch, setSuggestedMatch] = SP_REACT.useState(null);
    const [selectedGameId, setSelectedGameId] = SP_REACT.useState("");
    const [linkedGame, setLinkedGame] = SP_REACT.useState(null);
    const [achievements, setAchievements] = SP_REACT.useState([]);
    const [isLoading, setIsLoading] = SP_REACT.useState(false);
    // Self-Updater state
    const [currentVersion, setCurrentVersion] = SP_REACT.useState("0.2.5");
    const [latestVersion, setLatestVersion] = SP_REACT.useState(null);
    const [updateAvailable, setUpdateAvailable] = SP_REACT.useState(false);
    const [updateSource, setUpdateSource] = SP_REACT.useState("auto");
    const [isCheckingUpdate, setIsCheckingUpdate] = SP_REACT.useState(false);
    const [isApplyingUpdate, setIsApplyingUpdate] = SP_REACT.useState(false);
    const [updateStatusMsg, setUpdateStatusMsg] = SP_REACT.useState(null);
    const [updateSuccess, setUpdateSuccess] = SP_REACT.useState(false);
    const showToast = (title, body) => {
        try {
            if (globalServerApi?.toaster?.toast) {
                globalServerApi.toaster.toast({ title, body });
            }
            else if (window.DeckyPluginLoader?.toaster?.toast) {
                window.DeckyPluginLoader.toaster.toast({ title, body });
            }
        }
        catch (_) { }
    };
    // Synchronize on mount
    SP_REACT.useEffect(() => {
        // 1. Load config from persistent Python backend
        callBackend("get_config").then((res) => {
            if (res) {
                if (res.server_url) {
                    setServerUrl(res.server_url);
                    try {
                        localStorage.setItem("omni_decky_server_url", res.server_url);
                    }
                    catch { }
                }
                if (res.token) {
                    setToken(res.token);
                    try {
                        localStorage.setItem("omni_decky_token", res.token);
                    }
                    catch { }
                }
            }
            // Automatically test connection on mount
            testConnectionStatus();
        });
        callBackend("get_plugin_version").then((res) => {
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
            const conn = await callBackend("check_connection");
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
        }
        catch (e) {
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
            const dfl = window.DFL;
            const router = DFL.Router || dfl?.Router || window.Router;
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
                const running = apps.find((a) => {
                    const id = String(a.appid ?? a.nAppId ?? "");
                    return id && id !== "0" && id !== "769";
                });
                if (running) {
                    appId = String(running.appid ?? running.nAppId);
                    appTitle = running.display_name || running.strDisplayName || running.name || "";
                }
            }
        }
        catch (e) {
            console.warn("[OmniAchievements] Router running apps error:", e);
        }
        // Method 3: SteamClient Apps / GameSessions
        if (!appId) {
            try {
                const sc = window.SteamClient;
                const activeApp = sc?.Apps?.GetActiveGameInfo?.() || sc?.GameSessions?.GetActiveGameSession?.();
                if (activeApp && activeApp.nAppId && String(activeApp.nAppId) !== "0" && String(activeApp.nAppId) !== "769") {
                    appId = String(activeApp.nAppId);
                    appTitle = activeApp.strGameTitle || "";
                }
            }
            catch (e) {
                console.warn("[OmniAchievements] SteamClient active game check error:", e);
            }
        }
        // Method 4: appOverviewStore / SteamUIStore
        if (!appId) {
            try {
                const store = window.appOverviewStore || window.SteamUIStore;
                if (store?.RunningApps) {
                    const apps = Array.isArray(store.RunningApps) ? store.RunningApps : [];
                    const running = apps.find((a) => String(a.appid) !== "769" && String(a.appid) !== "0");
                    if (running) {
                        appId = String(running.appid ?? running.nAppId);
                        appTitle = running.display_name || running.strDisplayName || "";
                    }
                }
            }
            catch (_) { }
        }
        // Method 5: Python Backend /proc environment scanning for SteamAppId
        if (!appId) {
            try {
                const pyRes = await callBackend("detect_running_game");
                if (pyRes && pyRes.app_id) {
                    appId = String(pyRes.app_id);
                    appTitle = pyRes.app_title || pyRes.process_name || `Shortcut ${appId}`;
                }
            }
            catch (e) {
                console.warn("[OmniAchievements] Python backend detect_running_game error:", e);
            }
        }
        if (appId) {
            setActiveShortcutId(appId);
            setActiveShortcutName(appTitle || `Shortcut ${appId}`);
            // Query achievements for this shortcut
            const achRes = await callBackend("get_achievements", { shortcut_id: appId });
            if (achRes && achRes.linked) {
                setLinkedGame(achRes.game);
                setAchievements(achRes.achievements || []);
            }
            else {
                // Search auto fuzzy match
                if (appTitle) {
                    const matchRes = await callBackend("match_game", { shortcut_name: appTitle });
                    if (matchRes?.matches?.length > 0) {
                        setSuggestedMatch(matchRes.matches[0]);
                    }
                }
            }
            if (userInitiated) {
                showToast("Game Detected", `${appTitle || appId} active!`);
            }
        }
        else {
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
            if (token)
                localStorage.setItem("omni_decky_token", token);
        }
        catch { }
        const res = await callBackend("configure", {
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
            }
            else {
                setConnectionStatus({
                    checked: true,
                    loading: false,
                    online: true,
                    authenticated: false,
                    warning: res.warning || res.error || "Server reachable, but Pairing Token is invalid or missing."
                });
                showToast("OmniAchievements", res.warning || "Pairing token needed to sync games.");
            }
        }
        else {
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
        const res = await callBackend("get_games");
        if (res && Array.isArray(res.games)) {
            setAvailableGames(res.games);
        }
    };
    const loadAchievementsForApp = async (appIdOrGameId) => {
        setIsLoading(true);
        const res = await callBackend("get_achievements", { shortcut_id: appIdOrGameId });
        setIsLoading(false);
        if (res && res.linked) {
            setLinkedGame(res.game);
            setAchievements(res.achievements || []);
        }
        else {
            setLinkedGame(null);
            setAchievements([]);
        }
    };
    const handleLinkGame = async () => {
        if (!activeShortcutId || !selectedGameId)
            return;
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
    const handleToggleAchievement = async (ach) => {
        const nextUnlocked = ach.is_unlocked === 1 ? false : true;
        await callBackend("toggle_achievement", {
            achievement_id: ach.id,
            is_unlocked: nextUnlocked
        });
        if (activeShortcutId) {
            await loadAchievementsForApp(activeShortcutId);
        }
        else if (linkedGame) {
            await loadAchievementsForApp(linkedGame.id);
        }
    };
    const handleCheckUpdate = async (source = updateSource) => {
        setIsCheckingUpdate(true);
        setUpdateStatusMsg("Checking for updates...");
        setUpdateSuccess(false);
        try {
            const data = await callBackend("check_for_updates", { source });
            if (data) {
                setCurrentVersion(data.current_version || currentVersion);
                setLatestVersion(data.latest_version);
                setUpdateAvailable(Boolean(data.update_available));
                if (data.update_available) {
                    setUpdateStatusMsg(`⚡ Update Available: v${data.latest_version} (from ${data.source})`);
                }
                else if (data.error) {
                    setUpdateStatusMsg(`✕ ${data.error}`);
                }
                else {
                    setUpdateStatusMsg(`✓ Plugin is up to date (v${data.current_version})`);
                }
            }
        }
        catch (e) {
            setUpdateStatusMsg(`✕ Check failed: ${e.message || String(e)}`);
        }
        finally {
            setIsCheckingUpdate(false);
        }
    };
    const handleApplyUpdate = async () => {
        setIsApplyingUpdate(true);
        setUpdateStatusMsg("Downloading and applying update files...");
        try {
            const data = await callBackend("apply_update", { source: updateSource });
            if (data?.success) {
                setUpdateSuccess(true);
                setCurrentVersion(data.new_version);
                setUpdateAvailable(false);
                setUpdateStatusMsg(`✓ Successfully updated to v${data.new_version}! Reload Decky to apply.`);
                showToast("OmniAchievements Updated", `Plugin updated to v${data.new_version}!`);
            }
            else {
                setUpdateStatusMsg(`✕ Update error: ${data?.error || "Unknown error"}`);
            }
        }
        catch (e) {
            setUpdateStatusMsg(`✕ Failed: ${e.message || String(e)}`);
        }
        finally {
            setIsApplyingUpdate(false);
        }
    };
    const handleReloadDecky = () => {
        try {
            if (window.DeckyPluginLoader?.reloadPlugin) {
                window.DeckyPluginLoader.reloadPlugin("OmniAchievements");
            }
            else {
                window.location.reload();
            }
        }
        catch (e) {
            window.location.reload();
        }
    };
    const unlockedCount = achievements.filter((a) => a.is_unlocked === 1).length;
    const totalCount = achievements.length;
    const progressPct = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: "OmniAchievements Sync", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: {
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
                                border: `1px solid ${connectionStatus.loading
                                    ? "rgba(99, 102, 241, 0.5)"
                                    : connectionStatus.authenticated
                                        ? "rgba(16, 185, 129, 0.5)"
                                        : connectionStatus.online
                                            ? "rgba(245, 158, 11, 0.5)"
                                            : connectionStatus.error
                                                ? "rgba(239, 68, 68, 0.5)"
                                                : "rgba(255, 255, 255, 0.1)"}`,
                                color: connectionStatus.loading
                                    ? "#a5b4fc"
                                    : connectionStatus.authenticated
                                        ? "#34d399"
                                        : connectionStatus.online
                                            ? "#fbbf24"
                                            : connectionStatus.error
                                                ? "#f87171"
                                                : "#aaa"
                            }, children: [SP_JSX.jsx("div", { style: { display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", marginBottom: "4px" }, children: SP_JSX.jsx("span", { children: connectionStatus.loading
                                            ? "⏳ Testing Connection..."
                                            : connectionStatus.authenticated
                                                ? "🟢 Connected & Paired"
                                                : connectionStatus.online
                                                    ? "🟡 Server Online (Pairing Token Needed)"
                                                    : connectionStatus.error
                                                        ? "🔴 Disconnected"
                                                        : "⚪ Not Tested Yet" }) }), SP_JSX.jsx("div", { style: { fontSize: "11px", wordBreak: "break-word", lineHeight: "1.4" }, children: connectionStatus.message ||
                                        connectionStatus.warning ||
                                        connectionStatus.error ||
                                        "Configure your server URL and Pairing Token, then click Connect Server." })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Server URL (IP:Port)", value: serverUrl, onChange: (e) => {
                                setServerUrl(e.target.value);
                                try {
                                    localStorage.setItem("omni_decky_server_url", e.target.value);
                                }
                                catch { }
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Pairing Token", value: token, onChange: (e) => {
                                setToken(e.target.value);
                                try {
                                    localStorage.setItem("omni_decky_token", e.target.value);
                                }
                                catch { }
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: "10px", color: "#888", width: "100%", padding: "0 2px" }, children: ["\uD83D\uDCA1 ", SP_JSX.jsxs("em", { children: ["Get your Pairing Token in OmniAchievements Web/iOS App: ", SP_JSX.jsx("strong", { children: "Settings > Steam Deck & Handhelds" })] })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: handleSaveConfig, disabled: isLoading, children: isLoading ? "Connecting to server..." : connectionStatus.authenticated ? "Reconnect / Test Connection" : "Connect Server" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { padding: "8px 0", width: "100%" }, children: [SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }, children: [SP_JSX.jsx("span", { style: { fontSize: "11px", color: "#888" }, children: "Detected Running Game:" }), SP_JSX.jsx("span", { style: { fontSize: "11px", color: activeShortcutId ? "#34d399" : "#888", fontWeight: "bold" }, children: activeShortcutId ? "🎮 Active" : "⏸ Idle" })] }), SP_JSX.jsx("div", { style: { fontSize: "14px", fontWeight: "bold", wordBreak: "break-word" }, children: activeShortcutName || "No game running currently" }), activeShortcutId && (SP_JSX.jsxs("div", { style: { fontSize: "11px", color: "#666", marginTop: "2px" }, children: ["AppID: ", activeShortcutId] })), SP_JSX.jsx("div", { style: { marginTop: "8px" }, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => detectRunningGame(true), children: "\uD83D\uDD04 Refresh Game Detection" }) })] }) }), !linkedGame && suggestedMatch && activeShortcutId && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(99, 102, 241, 0.5)" }, children: [SP_JSX.jsx("div", { style: { fontSize: "11px", color: "#a5b4fc", fontWeight: "bold" }, children: "Suggested Match Found:" }), SP_JSX.jsxs("div", { style: { fontSize: "13px", fontWeight: "bold", margin: "4px 0" }, children: [suggestedMatch.title, " (", suggestedMatch.platform, ")"] }), SP_JSX.jsxs(DFL.ButtonItem, { layout: "below", onClick: async () => {
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
                                    }, children: ["1-Click Link to ", suggestedMatch.title] })] }) })), !linkedGame && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "8px", width: "100%" }, children: [SP_JSX.jsx("span", { style: { fontSize: "11px", color: "#888" }, children: activeShortcutId ? "Link Shortcut to OmniAchievements Game:" : "Browse & View Achievements for Game:" }), SP_JSX.jsxs("select", { style: { padding: "8px", borderRadius: "8px", background: "#222", color: "#fff", width: "100%", fontSize: "12px" }, value: selectedGameId, onChange: (e) => {
                                        const gId = e.target.value;
                                        setSelectedGameId(gId);
                                        if (gId) {
                                            loadAchievementsForApp(gId);
                                        }
                                    }, children: [SP_JSX.jsxs("option", { value: "", children: ["-- Choose game from library (", availableGames.length, ") --"] }), availableGames.map((g) => (SP_JSX.jsxs("option", { value: g.id, children: [g.title, " (", g.platform, ")"] }, g.id)))] }), activeShortcutId && selectedGameId && (SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: handleLinkGame, children: "Link Game & Load Achievements" }))] }) })), linkedGame && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%", padding: "4px 0" }, children: [SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }, children: [SP_JSX.jsx("span", { style: { fontWeight: "bold" }, children: linkedGame.title }), SP_JSX.jsxs("span", { children: [unlockedCount, " / ", totalCount, " (", Math.round(progressPct), "%)"] })] }), SP_JSX.jsx(DFL.ProgressBar, { nProgress: progressPct })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "6px", width: "100%", maxHeight: "300px", overflowY: "auto" }, children: achievements.map((ach) => {
                                        const isUnlocked = ach.is_unlocked === 1;
                                        return (SP_JSX.jsxs(DFL.Focusable, { style: {
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "8px",
                                                borderRadius: "8px",
                                                backgroundColor: isUnlocked ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.05)",
                                                border: isUnlocked ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)"
                                            }, onClick: () => handleToggleAchievement(ach), children: [SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }, children: [SP_JSX.jsx("div", { style: {
                                                                width: "32px",
                                                                height: "32px",
                                                                borderRadius: "6px",
                                                                overflow: "hidden",
                                                                backgroundColor: "#333",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center"
                                                            }, children: ach.icon_unlocked ? (SP_JSX.jsx("img", { src: isUnlocked ? ach.icon_unlocked : (ach.icon_locked || ach.icon_unlocked), style: { width: "100%", height: "100%", filter: isUnlocked ? "none" : "grayscale(100%)" } })) : (SP_JSX.jsx(TrophyIcon, { color: isUnlocked ? "#f59e0b" : "#888" })) }), SP_JSX.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [SP_JSX.jsx("div", { style: { fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: ach.display_name_es || ach.display_name }), SP_JSX.jsx("div", { style: { fontSize: "10px", color: "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: ach.description_es || ach.description })] })] }), SP_JSX.jsx("div", { children: isUnlocked ? SP_JSX.jsx(CheckCircleIcon, { color: "#10b981" }) : SP_JSX.jsx(LockIcon, { color: "#666" }) })] }, ach.id));
                                    }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => {
                                        setLinkedGame(null);
                                        setAchievements([]);
                                    }, children: "Change Selected Game" }) })] }))] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Plugin Self-Updater", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", fontSize: "12px", padding: "4px 0" }, children: [SP_JSX.jsx("span", { style: { color: "#aaa" }, children: "Installed Version:" }), SP_JSX.jsxs("span", { style: { fontWeight: "bold", background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "10px" }, children: ["v", currentVersion] })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "4px", width: "100%" }, children: [SP_JSX.jsx("span", { style: { fontSize: "11px", color: "#888" }, children: "Update Channel:" }), SP_JSX.jsxs("select", { style: { padding: "6px 8px", borderRadius: "6px", background: "#222", color: "#fff", fontSize: "12px" }, value: updateSource, onChange: (e) => setUpdateSource(e.target.value), children: [SP_JSX.jsx("option", { value: "auto", children: "Auto (Server with GitHub fallback)" }), SP_JSX.jsx("option", { value: "server", children: "Local OmniAchievements Server" }), SP_JSX.jsx("option", { value: "github", children: "GitHub Repo (santx1/OmniAchievements)" })] })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => handleCheckUpdate(), disabled: isCheckingUpdate || isApplyingUpdate, children: isCheckingUpdate ? "Checking for updates..." : "Check for Updates" }) }), updateStatusMsg && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: {
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
                            }, children: updateStatusMsg }) })), updateAvailable && !updateSuccess && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: handleApplyUpdate, disabled: isApplyingUpdate, children: isApplyingUpdate ? "Updating Plugin Files..." : `Update to v${latestVersion} Now` }) })), updateSuccess && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: handleReloadDecky, children: "Reload Decky Now" }) }))] })] }));
};
// Official Decky definePlugin helper
function defineDeckyPlugin(fn) {
    return (...args) => fn(...args);
}
var index = defineDeckyPlugin((serverApi) => {
    if (serverApi) {
        globalServerApi = serverApi;
    }
    return {
        name: "OmniAchievements",
        title: SP_JSX.jsx("div", { className: DFL.staticClasses.Title, children: "OmniAchievements" }),
        titleView: SP_JSX.jsx("div", { className: DFL.staticClasses.Title, children: "OmniAchievements" }),
        content: SP_JSX.jsx(Content, { serverApi: serverApi }),
        icon: SP_JSX.jsx(TrophyIcon, {}),
        onDismount() { }
    };
});

export { index as default };
//# sourceMappingURL=index.js.map
