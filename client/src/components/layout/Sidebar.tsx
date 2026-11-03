import React from 'react';
import { ActiveTab } from './BottomTabBar.js';
import { Gamepad2, BarChart3, Settings, RefreshCw, PlusCircle, Shield, Award } from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAddGame: () => void;
  onOpenSteamSync: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddGame,
  onOpenSteamSync
}) => {
  return (
    <aside className="hidden md:flex flex-col w-64 glass dark:glass border-r border-slate-200/50 dark:border-slate-800/80 p-4 shrink-0 transition-colors">
      <div className="space-y-1">
        <button
          onClick={() => onTabChange('library')}
          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all ${
            activeTab === 'library'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Gamepad2 className="w-5 h-5" />
          <span>My Game Library</span>
        </button>

        <button
          onClick={() => onTabChange('stats')}
          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all ${
            activeTab === 'stats'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>Statistics & Analytics</span>
        </button>

        <button
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Settings & Profiles</span>
        </button>
      </div>

      <div className="my-4 border-t border-slate-200 dark:border-slate-800/80" />

      {/* Quick Action Shortcuts */}
      <div className="space-y-2">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Quick Actions
        </p>

        <button
          onClick={onOpenAddGame}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
        >
          <PlusCircle className="w-4 h-4 text-indigo-500" />
          <span>Add Custom Game</span>
        </button>

        <button
          onClick={onOpenSteamSync}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-cyan-500" />
          <span>Sync Steam Library</span>
        </button>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px]">
          <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Steam Account 100% Safe (Read-only API)</span>
        </div>
        <div className="flex items-center justify-between px-2 text-[10px] text-slate-500">
          <span>OmniAchievements v1.0</span>
          <span className="flex items-center gap-1 text-amber-500 font-semibold">
            <Award className="w-3 h-3" /> SteamOS Ready
          </span>
        </div>
      </div>
    </aside>
  );
};
