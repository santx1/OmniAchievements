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
    const [serverUrl, setServerUrl] = SP_REACT.useState("http://192.168.1.100:3001");
    const [token, setToken] = SP_REACT.useState("");
    const [isConnected, setIsConnected] = SP_REACT.useState(false);
    const [activeShortcutId, setActiveShortcutId] = SP_REACT.useState("");
    const [activeShortcutName, setActiveShortcutName] = SP_REACT.useState("");
    const [availableGames, setAvailableGames] = SP_REACT.useState([]);
    const [suggestedMatch, setSuggestedMatch] = SP_REACT.useState(null);
    const [selectedGameId, setSelectedGameId] = SP_REACT.useState("");
    const [linkedGame, setLinkedGame] = SP_REACT.useState(null);
    const [achievements, setAchievements] = SP_REACT.useState([]);
    const [isLoading, setIsLoading] = SP_REACT.useState(false);
    // Self-Updater state
    const [currentVersion, setCurrentVersion] = SP_REACT.useState("0.2.2");
    const [latestVersion, setLatestVersion] = SP_REACT.useState(null);
    const [updateAvailable, setUpdateAvailable] = SP_REACT.useState(false);
    const [updateSource, setUpdateSource] = SP_REACT.useState("auto");
    const [isCheckingUpdate, setIsCheckingUpdate] = SP_REACT.useState(false);
    const [isApplyingUpdate, setIsApplyingUpdate] = SP_REACT.useState(false);
    const [updateStatusMsg, setUpdateStatusMsg] = SP_REACT.useState(null);
    const [updateSuccess, setUpdateSuccess] = SP_REACT.useState(false);
    // Load config on mount
    SP_REACT.useEffect(() => {
        callBackend("get_config").then((res) => {
            if (res && res.server_url) {
                setServerUrl(res.server_url || "http://192.168.1.100:3001");
            }
        });
        callBackend("get_plugin_version").then((res) => {
            if (res?.version) {
                setCurrentVersion(res.version);
            }
        });
        detectRunningGame();
        // Periodic playtime logger every 5 minutes while gaming
        const interval = setInterval(() => {
            if (activeShortcutId && linkedGame) {
                callBackend("log_playtime", {
                    shortcut_id: activeShortcutId,
                    game_id: linkedGame.id,
                    minutes: 5
                });
            }
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [activeShortcutId, linkedGame]);
    const detectRunningGame = async () => {
        try {
            const activeApp = window.SteamClient?.Apps?.GetActiveGameInfo?.() ||
                window.SteamClient?.GameSessions?.GetActiveGameSession?.();
            if (activeApp && activeApp.nAppId) {
                const appId = String(activeApp.nAppId);
                const appTitle = activeApp.strGameTitle || "Running Game";
                setActiveShortcutId(appId);
                setActiveShortcutName(appTitle);
                // Check if already linked
                const achRes = await callBackend("get_achievements", { shortcut_id: appId });
                if (achRes && achRes.linked) {
                    setLinkedGame(achRes.game);
                    setAchievements(achRes.achievements || []);
                }
                else {
                    // Trigger Fuzzy Match Auto-Suggestion
                    const matchRes = await callBackend("match_game", { shortcut_name: appTitle });
                    if (matchRes?.matches?.length > 0) {
                        setSuggestedMatch(matchRes.matches[0]);
                    }
                }
            }
        }
        catch (e) {
            console.warn("Could not query active game session from SteamClient", e);
        }
    };
    const handleSaveConfig = async () => {
        setIsLoading(true);
        const res = await callBackend("configure", {
            server_url: serverUrl,
            token: token
        });
        setIsLoading(false);
        if (res && res.online) {
            setIsConnected(true);
            loadGames();
        }
        else {
            setIsConnected(false);
        }
    };
    const loadGames = async () => {
        const res = await callBackend("get_games");
        if (res && Array.isArray(res.games)) {
            setAvailableGames(res.games);
        }
    };
    const loadAchievementsForApp = async (appId) => {
        setIsLoading(true);
        const res = await callBackend("get_achievements", { shortcut_id: appId });
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
                try {
                    if (globalServerApi?.toaster?.toast) {
                        globalServerApi.toaster.toast({
                            title: "OmniAchievements Updated",
                            body: `Plugin updated to v${data.new_version}!`
                        });
                    }
                }
                catch (_) { }
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
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: "OmniAchievements Sync", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Server URL (IP:Port)", value: serverUrl, onChange: (e) => setServerUrl(e.target.value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Pairing Token", value: token, onChange: (e) => setToken(e.target.value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: handleSaveConfig, children: isLoading ? "Connecting..." : "Connect Server" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { padding: "8px 0" }, children: [SP_JSX.jsx("div", { style: { fontSize: "12px", color: "#888" }, children: "Detected Running Game:" }), SP_JSX.jsx("div", { style: { fontSize: "14px", fontWeight: "bold" }, children: activeShortcutName || "No game running currently" }), activeShortcutId && (SP_JSX.jsxs("div", { style: { fontSize: "11px", color: "#666" }, children: ["AppID: ", activeShortcutId] }))] }) }), !linkedGame && suggestedMatch && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { padding: "8px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(99, 102, 241, 0.5)" }, children: [SP_JSX.jsx("div", { style: { fontSize: "11px", color: "#a5b4fc", fontWeight: "bold" }, children: "Suggested Match Found:" }), SP_JSX.jsxs("div", { style: { fontSize: "13px", fontWeight: "bold", margin: "4px 0" }, children: [suggestedMatch.title, " (", suggestedMatch.platform, ")"] }), SP_JSX.jsxs(DFL.ButtonItem, { layout: "below", onClick: async () => {
                                        setIsLoading(true);
                                        await callBackend("link_shortcut", {
                                            steam_shortcut_id: activeShortcutId,
                                            game_id: suggestedMatch.id,
                                            shortcut_name: activeShortcutName
                                        });
                                        await loadAchievementsForApp(activeShortcutId);
                                        setSuggestedMatch(null);
                                        setIsLoading(false);
                                    }, children: ["1-Click Link to ", suggestedMatch.title] })] }) })), !linkedGame && activeShortcutId && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: [SP_JSX.jsx("span", { style: { fontSize: "12px" }, children: "Link to OmniAchievements Game:" }), SP_JSX.jsxs("select", { style: { padding: "8px", borderRadius: "8px", background: "#222", color: "#fff" }, value: selectedGameId, onChange: (e) => setSelectedGameId(e.target.value), children: [SP_JSX.jsx("option", { value: "", children: "-- Choose game to link --" }), availableGames.map((g) => (SP_JSX.jsxs("option", { value: g.id, children: [g.title, " (", g.platform, ")"] }, g.id)))] }), SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: handleLinkGame, children: "Link Game & Load Achievements" })] }) })), linkedGame && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%", padding: "4px 0" }, children: [SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }, children: [SP_JSX.jsx("span", { children: linkedGame.title }), SP_JSX.jsxs("span", { children: [unlockedCount, " / ", totalCount, " (", Math.round(progressPct), "%)"] })] }), SP_JSX.jsx(DFL.ProgressBar, { nProgress: progressPct })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "6px", width: "100%", maxHeight: "300px", overflowY: "auto" }, children: achievements.map((ach) => {
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
                                    }) }) })] }))] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Plugin Self-Updater", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", fontSize: "12px", padding: "4px 0" }, children: [SP_JSX.jsx("span", { style: { color: "#aaa" }, children: "Installed Version:" }), SP_JSX.jsxs("span", { style: { fontWeight: "bold", background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "10px" }, children: ["v", currentVersion] })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "4px", width: "100%" }, children: [SP_JSX.jsx("span", { style: { fontSize: "11px", color: "#888" }, children: "Update Channel:" }), SP_JSX.jsxs("select", { style: { padding: "6px 8px", borderRadius: "6px", background: "#222", color: "#fff", fontSize: "12px" }, value: updateSource, onChange: (e) => setUpdateSource(e.target.value), children: [SP_JSX.jsx("option", { value: "auto", children: "Auto (Server with GitHub fallback)" }), SP_JSX.jsx("option", { value: "server", children: "Local OmniAchievements Server" }), SP_JSX.jsx("option", { value: "github", children: "GitHub Repo (santx1/OmniAchievements)" })] })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => handleCheckUpdate(), disabled: isCheckingUpdate || isApplyingUpdate, children: isCheckingUpdate ? "Checking for updates..." : "Check for Updates" }) }), updateStatusMsg && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: {
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
