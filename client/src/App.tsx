import React, { useState } from 'react';
import { useAuth } from './context/AuthContext.js';
import { MasterPasswordGate } from './components/auth/MasterPasswordGate.js';
import { ProfileSelector } from './components/auth/ProfileSelector.js';
import { Navbar } from './components/layout/Navbar.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { BottomTabBar, ActiveTab } from './components/layout/BottomTabBar.js';
import { LibraryView } from './components/games/LibraryView.js';
import { StatisticsView } from './components/stats/StatisticsView.js';
import { SettingsView } from './components/settings/SettingsView.js';
import { AddGameModal } from './components/games/AddGameModal.js';
import { SteamSyncModal } from './components/steam/SteamSyncModal.js';

export const App: React.FC = () => {
  const { isMasterAuthenticated, activeProfile, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [isSteamSyncOpen, setIsSteamSyncOpen] = useState(false);
  const [libraryRefreshTrigger, setLibraryRefreshTrigger] = useState(0);

  // Initial loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading OmniAchievements...</p>
      </div>
    );
  }

  // 1. Master Password Gate (Web & Local Gateway Protection)
  if (!isMasterAuthenticated) {
    return <MasterPasswordGate />;
  }

  // 2. Profile Selection Screen (Household Multi-User)
  if (!activeProfile) {
    return <ProfileSelector />;
  }

  // 3. Main Authenticated Application
  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation Bar */}
      <Navbar
        onOpenAddGame={() => setIsAddGameOpen(true)}
        onOpenSteamSync={() => setIsSteamSyncOpen(true)}
        onOpenSettings={() => setActiveTab('settings')}
      />

      <div className="flex-grow flex max-w-7xl mx-auto w-full">
        {/* iPadOS & Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenAddGame={() => setIsAddGameOpen(true)}
          onOpenSteamSync={() => setIsSteamSyncOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-x-hidden pb-24 md:pb-8">
          {activeTab === 'library' && (
            <LibraryView
              key={libraryRefreshTrigger}
              onOpenAddGame={() => setIsAddGameOpen(true)}
              onOpenSteamSync={() => setIsSteamSyncOpen(true)}
            />
          )}

          {activeTab === 'stats' && <StatisticsView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* iOS Mobile Bottom Tab Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddGame={() => setIsAddGameOpen(true)}
        onOpenSteamSync={() => setIsSteamSyncOpen(true)}
      />

      {/* Global Modals */}
      <AddGameModal
        isOpen={isAddGameOpen}
        onClose={() => setIsAddGameOpen(false)}
        onGameAdded={() => {
          setLibraryRefreshTrigger((prev) => prev + 1);
          setActiveTab('library');
        }}
      />

      <SteamSyncModal
        isOpen={isSteamSyncOpen}
        onClose={() => setIsSteamSyncOpen(false)}
        onSyncComplete={() => {
          setLibraryRefreshTrigger((prev) => prev + 1);
        }}
      />
    </div>
  );
};
