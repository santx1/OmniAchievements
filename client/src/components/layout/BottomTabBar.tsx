import React from 'react';
import { Gamepad2, BarChart3, PlusCircle, RefreshCw, Settings } from 'lucide-react';

export type ActiveTab = 'library' | 'stats' | 'settings';

interface BottomTabBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAddGame: () => void;
  onOpenSteamSync: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddGame,
  onOpenSteamSync
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass dark:glass border-t border-slate-200/50 dark:border-slate-800/80 pb-safe transition-colors">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Library */}
        <button
          onClick={() => onTabChange('library')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition-all ${
            activeTab === 'library'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <Gamepad2 className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Games</span>
        </button>

        {/* Statistics */}
        <button
          onClick={() => onTabChange('stats')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition-all ${
            activeTab === 'stats'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Stats</span>
        </button>

        {/* Floating Add Game Button */}
        <button
          onClick={onOpenAddGame}
          className="flex flex-col items-center justify-center -mt-5"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 active:scale-95 transition-transform">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">Add</span>
        </button>

        {/* Sync Steam */}
        <button
          onClick={onOpenSteamSync}
          className="flex flex-col items-center justify-center w-14 py-1 text-slate-500 dark:text-slate-400 hover:text-indigo-500 font-medium transition-colors"
        >
          <RefreshCw className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Sync</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center justify-center w-14 py-1 transition-all ${
            activeTab === 'settings'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <Settings className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Settings</span>
        </button>
      </div>
    </div>
  );
};
