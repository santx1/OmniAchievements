import {
  definePlugin,
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  TextField,
  ProgressBar,
  Focusable,
  ServerAPI,
  staticClasses
} from "decky-frontend-lib";
import React, { VFC, useState, useEffect } from "react";
import { FaTrophy, FaLink, FaSync, FaCheckCircle, FaLock } from "react-icons/fa";

interface Achievement {
  id: string;
  display_name: string;
  description: string;
  icon_unlocked: string;
  icon_locked: string;
  is_unlocked: number;
}

const Content: VFC<{ serverApi: ServerAPI }> = ({ serverApi }) => {
  const [serverUrl, setServerUrl] = useState("http://192.168.1.100:3001");
  const [token, setToken] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [activeShortcutId, setActiveShortcutId] = useState<string>("");
  const [activeShortcutName, setActiveShortcutName] = useState<string>("");

  const [availableGames, setAvailableGames] = useState<any[]>([]);
  const [suggestedMatch, setSuggestedMatch] = useState<any | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [linkedGame, setLinkedGame] = useState<any | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load config on mount
  useEffect(() => {
    serverApi.callPluginMethod("get_config", {}).then((res: any) => {
      if (res.result) {
        setServerUrl(res.result.server_url || "http://192.168.1.100:3001");
      }
    });

    detectRunningGame();

    // Periodic playtime logger every 5 minutes while gaming
    const interval = setInterval(() => {
      if (activeShortcutId && linkedGame) {
        serverApi.callPluginMethod("log_playtime", {
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
      const activeApp = (window as any).SteamClient?.Apps?.GetActiveGameInfo?.() ||
                        (window as any).SteamClient?.GameSessions?.GetActiveGameSession?.();
      if (activeApp && activeApp.nAppId) {
        const appId = String(activeApp.nAppId);
        const appTitle = activeApp.strGameTitle || "Running Game";
        setActiveShortcutId(appId);
        setActiveShortcutName(appTitle);

        // Check if already linked
        const achRes: any = await serverApi.callPluginMethod("get_achievements", { shortcut_id: appId });
        if (achRes.result && achRes.result.linked) {
          setLinkedGame(achRes.result.game);
          setAchievements(achRes.result.achievements || []);
        } else {
          // Trigger Fuzzy Match Auto-Suggestion
          const matchRes: any = await serverApi.callPluginMethod("match_game", { shortcut_name: appTitle });
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
    const res: any = await serverApi.callPluginMethod("configure", {
      server_url: serverUrl,
      token: token
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
    const res: any = await serverApi.callPluginMethod("get_games", {});
    if (res.result && Array.isArray(res.result.games)) {
      setAvailableGames(res.result.games);
    }
  };

  const loadAchievementsForApp = async (appId: string) => {
    setIsLoading(true);
    const res: any = await serverApi.callPluginMethod("get_achievements", { shortcut_id: appId });
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

  const handleToggleAchievement = async (ach: Achievement) => {
    const nextUnlocked = ach.is_unlocked === 1 ? false : true;
    await serverApi.callPluginMethod("toggle_achievement", {
      achievement_id: ach.id,
      is_unlocked: nextUnlocked
    });
    if (activeShortcutId) {
      await loadAchievementsForApp(activeShortcutId);
    }
  };

  const unlockedCount = achievements.filter((a) => a.is_unlocked === 1).length;
  const totalCount = achievements.length;
  const progressPct = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return (
    <PanelSection title="OmniAchievements Sync">
      {/* Server Configuration */}
      <PanelSectionRow>
        <TextField
          label="Server URL (IP:Port)"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <TextField
          label="Pairing Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem layout="below" onClick={handleSaveConfig}>
          {isLoading ? "Connecting..." : "Connect Server"}
        </ButtonItem>
      </PanelSectionRow>

      {/* Active Game & Linking */}
      <PanelSectionRow>
        <div style={{ padding: "8px 0" }}>
          <div style={{ fontSize: "12px", color: "#888" }}>Detected Running Game:</div>
          <div style={{ fontSize: "14px", fontWeight: "bold" }}>
            {activeShortcutName || "No game running currently"}
          </div>
          {activeShortcutId && (
            <div style={{ fontSize: "11px", color: "#666" }}>AppID: {activeShortcutId}</div>
          )}
        </div>
      </PanelSectionRow>

      {/* 1-Click Auto-Detect & Fuzzy Match Suggestion */}
      {!linkedGame && suggestedMatch && (
        <PanelSectionRow>
          <div style={{ padding: "8px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(99, 102, 241, 0.5)" }}>
            <div style={{ fontSize: "11px", color: "#a5b4fc", fontWeight: "bold" }}>Suggested Match Found:</div>
            <div style={{ fontSize: "13px", fontWeight: "bold", margin: "4px 0" }}>
              {suggestedMatch.title} ({suggestedMatch.platform})
            </div>
            <ButtonItem
              layout="below"
              onClick={async () => {
                setIsLoading(true);
                await serverApi.callPluginMethod("link_shortcut", {
                  steam_shortcut_id: activeShortcutId,
                  game_id: suggestedMatch.id,
                  shortcut_name: activeShortcutName
                });
                await loadAchievementsForApp(activeShortcutId);
                setSuggestedMatch(null);
                setIsLoading(false);
              }}
            >
              1-Click Link to {suggestedMatch.title}
            </ButtonItem>
          </div>
        </PanelSectionRow>
      )}

      {!linkedGame && activeShortcutId && (
        <PanelSectionRow>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "12px" }}>Link to OmniAchievements Game:</span>
            <select
              style={{ padding: "8px", borderRadius: "8px", background: "#222", color: "#fff" }}
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
            >
              <option value="">-- Choose game to link --</option>
              {availableGames.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.platform})
                </option>
              ))}
            </select>
            <ButtonItem layout="below" onClick={handleLinkGame}>
              Link Game & Load Achievements
            </ButtonItem>
          </div>
        </PanelSectionRow>
      )}

      {/* Achievements Overlay List */}
      {linkedGame && (
        <>
          <PanelSectionRow>
            <div style={{ width: "100%", padding: "4px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                <span>{linkedGame.title}</span>
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
                          <FaTrophy color={isUnlocked ? "#f59e0b" : "#888"} />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {ach.display_name}
                        </div>
                        <div style={{ fontSize: "10px", color: "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {ach.description}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isUnlocked ? <FaCheckCircle color="#10b981" /> : <FaLock color="#666" />}
                    </div>
                  </Focusable>
                );
              })}
            </div>
          </PanelSectionRow>
        </>
      )}
    </PanelSection>
  );
};

export default definePlugin((serverApi: ServerAPI) => {
  return {
    title: <div className={staticClasses.Title}>OmniAchievements</div>,
    content: <Content serverApi={serverApi} />,
    icon: <FaTrophy />,
    onDismount() {}
  };
});
