// src/index.tsx
import {
  definePlugin,
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  TextField,
  ProgressBar,
  Focusable,
  staticClasses
} from "decky-frontend-lib";
import React, { useState, useEffect } from "react";
var TrophyIcon = ({ color = "#f59e0b", size = 16 }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { display: "inline-block", verticalAlign: "middle" } }, /* @__PURE__ */ React.createElement("path", { d: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6" }), /* @__PURE__ */ React.createElement("path", { d: "M18 9h1.5a2.5 2.5 0 0 0 0-5H18" }), /* @__PURE__ */ React.createElement("path", { d: "M4 22h16" }), /* @__PURE__ */ React.createElement("path", { d: "M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" }), /* @__PURE__ */ React.createElement("path", { d: "M6 4h12v6c0 3.31-2.69 6-6 6s-6-2.69-6-6V4z", fill: color, fillOpacity: "0.3" }));
var CheckCircleIcon = ({ color = "#10b981", size = 16 }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { display: "inline-block", verticalAlign: "middle" } }, /* @__PURE__ */ React.createElement("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }), /* @__PURE__ */ React.createElement("polyline", { points: "22 4 12 14.01 9 11.01" }));
var LockIcon = ({ color = "#666", size = 16 }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { display: "inline-block", verticalAlign: "middle" } }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" }));
var Content = ({ serverApi }) => {
  const [serverUrl, setServerUrl] = useState("http://192.168.1.100:3001");
  const [token, setToken] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [activeShortcutId, setActiveShortcutId] = useState("");
  const [activeShortcutName, setActiveShortcutName] = useState("");
  const [availableGames, setAvailableGames] = useState([]);
  const [suggestedMatch, setSuggestedMatch] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [linkedGame, setLinkedGame] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentVersion, setCurrentVersion] = useState("1.0.0");
  const [latestVersion, setLatestVersion] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateSource, setUpdateSource] = useState("auto");
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const [updateStatusMsg, setUpdateStatusMsg] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  useEffect(() => {
    serverApi.callPluginMethod("get_config", {}).then((res) => {
      if (res.result) {
        setServerUrl(res.result.server_url || "http://192.168.1.100:3001");
      }
    });
    serverApi.callPluginMethod("get_plugin_version", {}).then((res) => {
      if (res.result?.version) {
        setCurrentVersion(res.result.version);
      }
    });
    detectRunningGame();
    const interval = setInterval(() => {
      if (activeShortcutId && linkedGame) {
        serverApi.callPluginMethod("log_playtime", {
          shortcut_id: activeShortcutId,
          game_id: linkedGame.id,
          minutes: 5
        });
      }
    }, 5 * 60 * 1e3);
    return () => clearInterval(interval);
  }, [activeShortcutId, linkedGame]);
  const detectRunningGame = async () => {
    try {
      const activeApp = window.SteamClient?.Apps?.GetActiveGameInfo?.() || window.SteamClient?.GameSessions?.GetActiveGameSession?.();
      if (activeApp && activeApp.nAppId) {
        const appId = String(activeApp.nAppId);
        const appTitle = activeApp.strGameTitle || "Running Game";
        setActiveShortcutId(appId);
        setActiveShortcutName(appTitle);
        const achRes = await serverApi.callPluginMethod("get_achievements", { shortcut_id: appId });
        if (achRes.result && achRes.result.linked) {
          setLinkedGame(achRes.result.game);
          setAchievements(achRes.result.achievements || []);
        } else {
          const matchRes = await serverApi.callPluginMethod("match_game", { shortcut_name: appTitle });
          if (matchRes.result?.matches?.length > 0) {
            setSuggestedMatch(matchRes.result.matches[0]);
          }
        }
      }
    } catch (e) {
      console.warn("Could not query active game session from SteamClient", e);
    }
  };
  const handleSaveConfig = async () => {
    setIsLoading(true);
    const res = await serverApi.callPluginMethod("configure", {
      server_url: serverUrl,
      token
    });
    setIsLoading(false);
    if (res.result && res.result.online) {
      setIsConnected(true);
      loadGames();
    } else {
      setIsConnected(false);
    }
  };
  const loadGames = async () => {
    const res = await serverApi.callPluginMethod("get_games", {});
    if (res.result && Array.isArray(res.result.games)) {
      setAvailableGames(res.result.games);
    }
  };
  const loadAchievementsForApp = async (appId) => {
    setIsLoading(true);
    const res = await serverApi.callPluginMethod("get_achievements", { shortcut_id: appId });
    setIsLoading(false);
    if (res.result && res.result.linked) {
      setLinkedGame(res.result.game);
      setAchievements(res.result.achievements || []);
    } else {
      setLinkedGame(null);
      setAchievements([]);
    }
  };
  const handleLinkGame = async () => {
    if (!activeShortcutId || !selectedGameId) return;
    setIsLoading(true);
    await serverApi.callPluginMethod("link_shortcut", {
      steam_shortcut_id: activeShortcutId,
      game_id: selectedGameId,
      shortcut_name: activeShortcutName
    });
    await loadAchievementsForApp(activeShortcutId);
    setIsLoading(false);
  };
  const handleToggleAchievement = async (ach) => {
    const nextUnlocked = ach.is_unlocked === 1 ? false : true;
    await serverApi.callPluginMethod("toggle_achievement", {
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
      const res = await serverApi.callPluginMethod("check_for_updates", { source });
      const data = res.result;
      if (data) {
        setCurrentVersion(data.current_version || currentVersion);
        setLatestVersion(data.latest_version);
        setUpdateAvailable(Boolean(data.update_available));
        if (data.update_available) {
          setUpdateStatusMsg(`\u26A1 Update Available: v${data.latest_version} (from ${data.source})`);
        } else if (data.error) {
          setUpdateStatusMsg(`\u2715 ${data.error}`);
        } else {
          setUpdateStatusMsg(`\u2713 Plugin is up to date (v${data.current_version})`);
        }
      }
    } catch (e) {
      setUpdateStatusMsg(`\u2715 Check failed: ${e.message || String(e)}`);
    } finally {
      setIsCheckingUpdate(false);
    }
  };
  const handleApplyUpdate = async () => {
    setIsApplyingUpdate(true);
    setUpdateStatusMsg("Downloading and applying update files...");
    try {
      const res = await serverApi.callPluginMethod("apply_update", { source: updateSource });
      const data = res.result;
      if (data?.success) {
        setUpdateSuccess(true);
        setCurrentVersion(data.new_version);
        setUpdateAvailable(false);
        setUpdateStatusMsg(`\u2713 Successfully updated to v${data.new_version}! Reload Decky to apply.`);
        try {
          serverApi.toaster?.toast({
            title: "OmniAchievements Updated",
            body: `Plugin updated to v${data.new_version}!`
          });
        } catch (_) {
        }
      } else {
        setUpdateStatusMsg(`\u2715 Update error: ${data?.error || "Unknown error"}`);
      }
    } catch (e) {
      setUpdateStatusMsg(`\u2715 Failed: ${e.message || String(e)}`);
    } finally {
      setIsApplyingUpdate(false);
    }
  };
  const handleReloadDecky = () => {
    try {
      if (window.DeckyPluginLoader?.reloadPlugin) {
        window.DeckyPluginLoader.reloadPlugin("OmniAchievements");
      } else {
        window.location.reload();
      }
    } catch (e) {
      window.location.reload();
    }
  };
  const unlockedCount = achievements.filter((a) => a.is_unlocked === 1).length;
  const totalCount = achievements.length;
  const progressPct = totalCount > 0 ? unlockedCount / totalCount * 100 : 0;
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(PanelSection, { title: "OmniAchievements Sync" }, /* @__PURE__ */ React.createElement(PanelSectionRow, null, /* @__PURE__ */ React.createElement(
    TextField,
    {
      label: "Server URL (IP:Port)",
      value: serverUrl,
      onChange: (e) => setServerUrl(e.target.value)
    }
  )), /* @__PURE__ */ React.createElement(PanelSectionRow, null, /* @__PURE__ */ React.createElement(
    TextField,
    {
      label: "Pairing Token",
      value: token,
      onChange: (e) => setToken(e.target.value)
    }
  )), /* @__PURE__ */ React.createElement(PanelSectionRow, null, /* @__PURE__ */ React.createElement(ButtonItem, { layout: "below", onClick: handleSaveConfig }, isLoading ? "Connecting..." : "Connect Server")), /* @__PURE__ */ React.createElement(PanelSectionRow, null, /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", color: "#888" } }, "Detected Running Game:"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "14px", fontWeight: "bold" } }, activeShortcutName || "No game running currently"), activeShortcutId && /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "#666" } }, "AppID: ", activeShortcutId))), !linkedGame && suggestedMatch && /* @__PURE__ */ React.createElement(PanelSectionRow, null, /* @__PURE__ */ React.createElement("div", { style: { padding: "8px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(99, 102, 241, 0.5)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "11px", color: "#a5b4fc", fontWeight: "bold" } }, "Suggested Match Found:"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "13px", fontWeight: "bold", margin: "4px 0" } }, suggestedMatch.title, " (", suggestedMatch.platform, ")"), /* @__PURE__ */ React.createElement(
    ButtonItem,
    {
      layout: "below",
      onClick: async () => {
        setIsLoading(true);
        await serverApi.callPluginMethod("link_shortcut", {
          steam_shortcut_id: activeShortcutId,
          game_id: suggestedMatch.id,
          shortcut_name: activeShortcutName
        });
        await loadAchievementsForApp(activeShortcutId);
        setSuggestedMatch(null);
        setIsLoading(false);
      }
    },
    "1-Click Link to ",
    suggestedMatch.title
  ))), !linkedGame && activeShortcutId && /* @__PURE__ */ React.createElement(PanelSectionRow, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "8px" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "12px" } }, "Link to OmniAchievements Game:"), /* @__PURE__ */ React.createElement(
    "select",
    {
      style: { padding: "8px", borderRadius: "8px", background: "#222", color: "#fff" },
      value: selectedGameId,
      onChange: (e) => setSelectedGameId(e.target.value)
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "-- Choose game to link --"),
    availableGames.map((g) => /* @__PURE__ */ React.createElement("option", { key: g.id, value: g.id }, g.title, " (", g.platform, ")"))
  ), /* @__PURE__ */ React.createElement(ButtonItem, { layout: "below", onClick: handleLinkGame }, "Link Game & Load Achievements"))), linkedGame && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(PanelSectionRow, null, /* @__PURE__ */ React.createElement("div", { style: { width: "100%", padding: "4px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" } }, /* @__PURE__ */ React.createElement("span", null, linkedGame.title), /* @__PURE__ */ React.createElement("span", null, unlockedCount, " / ", totalCount, " (", Math.round(progressPct), "%)")), /* @__PURE__ */ React.createElement(ProgressBar, { nProgress: progressPct }))), /* @__PURE__ */ React.createElement(PanelSectionRow, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "6px", width: "100%", maxHeight: "300px", overflowY: "auto" } }, achievements.map((ach) => {
    const isUnlocked = ach.is_unlocked === 1;
    return /* @__PURE__ */ React.createElement(
      Focusable,
      {
        key: ach.id,
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px",
          borderRadius: "8px",
          backgroundColor: isUnlocked ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.05)",
          border: isUnlocked ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)"
        },
        onClick: () => handleToggleAchievement(ach)
      },
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            overflow: "hidden",
            backgroundColor: "#333",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }
        },
        ach.icon_unlocked ? /* @__PURE__ */ React.createElement(
          "img",
          {
            src: isUnlocked ? ach.icon_unlocked : ach.icon_locked || ach.icon_unlocked,
            style: { width: "100%", height: "100%", filter: isUnlocked ? "none" : "grayscale(100%)" }
          }
        ) : /* @__PURE__ */ React.createElement(TrophyIcon, { color: isUnlocked ? "#f59e0b" : "#888" })
      ), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, ach.display_name_es || ach.display_name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "10px", color: "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, ach.description_es || ach.description))),
      /* @__PURE__ */ React.createElement("div", null, isUnlocked ? /* @__PURE__ */ React.createElement(CheckCircleIcon, { color: "#10b981" }) : /* @__PURE__ */ React.createElement(LockIcon, { color: "#666" }))
    );
  }))))), /* @__PURE__ */ React.createElement(PanelSection, { title: "Plugin Self-Updater" }, /* @__PURE__ */ React.createElement(PanelSectionRow, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", fontSize: "12px", padding: "4px 0" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#aaa" } }, "Installed Version:"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: "bold", background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "10px" } }, "v", currentVersion))), /* @__PURE__ */ React.createElement(PanelSectionRow, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "4px", width: "100%" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "11px", color: "#888" } }, "Update Channel:"), /* @__PURE__ */ React.createElement(
    "select",
    {
      style: { padding: "6px 8px", borderRadius: "6px", background: "#222", color: "#fff", fontSize: "12px" },
      value: updateSource,
      onChange: (e) => setUpdateSource(e.target.value)
    },
    /* @__PURE__ */ React.createElement("option", { value: "auto" }, "Auto (Server with GitHub fallback)"),
    /* @__PURE__ */ React.createElement("option", { value: "server" }, "Local OmniAchievements Server"),
    /* @__PURE__ */ React.createElement("option", { value: "github" }, "GitHub Repo (santx1/OmniAchievements)")
  ))), /* @__PURE__ */ React.createElement(PanelSectionRow, null, /* @__PURE__ */ React.createElement(
    ButtonItem,
    {
      layout: "below",
      onClick: () => handleCheckUpdate(),
      disabled: isCheckingUpdate || isApplyingUpdate
    },
    isCheckingUpdate ? "Checking for updates..." : "Check for Updates"
  )), updateStatusMsg && /* @__PURE__ */ React.createElement(PanelSectionRow, null, /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        fontSize: "11px",
        padding: "8px 10px",
        borderRadius: "6px",
        backgroundColor: updateSuccess ? "rgba(16, 185, 129, 0.15)" : updateAvailable ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.05)",
        border: updateSuccess ? "1px solid rgba(16, 185, 129, 0.4)" : updateAvailable ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
        color: updateSuccess ? "#34d399" : updateAvailable ? "#fbbf24" : "#ccc",
        width: "100%",
        wordBreak: "break-word"
      }
    },
    updateStatusMsg
  )), updateAvailable && !updateSuccess && /* @__PURE__ */ React.createElement(PanelSectionRow, null, /* @__PURE__ */ React.createElement(
    ButtonItem,
    {
      layout: "below",
      onClick: handleApplyUpdate,
      disabled: isApplyingUpdate
    },
    isApplyingUpdate ? "Updating Plugin Files..." : `Update to v${latestVersion} Now`
  )), updateSuccess && /* @__PURE__ */ React.createElement(PanelSectionRow, null, /* @__PURE__ */ React.createElement(ButtonItem, { layout: "below", onClick: handleReloadDecky }, "Reload Decky Now"))));
};
var index_default = definePlugin((serverApi) => {
  return {
    title: /* @__PURE__ */ React.createElement("div", { className: staticClasses.Title }, "OmniAchievements"),
    content: /* @__PURE__ */ React.createElement(Content, { serverApi }),
    icon: /* @__PURE__ */ React.createElement(TrophyIcon, null),
    onDismount() {
    }
  };
});
export {
  index_default as default
};
