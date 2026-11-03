import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Trophy, RefreshCw, Sun, Moon, Laptop, Plus, LogOut, Settings as SettingsIcon } from 'lucide-react';

interface NavbarProps {
  onOpenAddGame: () => void;
  onOpenSteamSync: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddGame,
  onOpenSteamSync,
  onOpenSettings
}) => {
  const { activeProfile, lockProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass dark:glass border-b border-slate-200/50 dark:border-slate-800/80 pt-safe transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* App Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-glow">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              OmniAchievements
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
              Universal Hub
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Steam Sync */}
          <button
            onClick={onOpenSteamSync}
            title="Synchronize Steam Library"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-colors border border-slate-300/40 dark:border-slate-700/60"
          >
            <RefreshCw className="w-4 h-4 text-indigo-500" />
            <span className="hidden md:inline">Sync Steam</span>
          </button>

          {/* Add Game Button */}
          <button
            onClick={onOpenAddGame}
            title="Manually Add Game"
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Game</span>
          </button>

          {/* Theme Mode Toggle */}
          <button
            onClick={cycleTheme}
            title={`Current theme: ${theme} (Click to change)`}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-300/40 dark:border-slate-700/60"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Laptop className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title="Settings & Integrations"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-300/40 dark:border-slate-700/60"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {/* Active Profile Pill / Switcher */}
          {activeProfile && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-300 dark:border-slate-800">
              <button
                onClick={lockProfile}
                title="Switch Profile / Lock"
                className="group flex items-center gap-2 p-1 sm:pr-2.5 rounded-full bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-300/50 dark:border-slate-700 transition-colors"
              >
                <img
                  src={activeProfile.avatar}
                  alt={activeProfile.name}
                  className="w-7 h-7 rounded-full object-cover border border-indigo-500"
                />
                <span className="hidden sm:inline text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-500 transition-colors truncate max-w-[100px]">
                  {activeProfile.name}
                </span>
                <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400 transition-colors ml-0.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
