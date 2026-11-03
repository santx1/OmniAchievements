import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { BlacklistItem } from '../../types/index.js';
import { X, ShieldAlert, Undo2, Trash2 } from 'lucide-react';

interface BlacklistManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BlacklistManagerModal: React.FC<BlacklistManagerModalProps> = ({ isOpen, onClose }) => {
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadBlacklist();
    }
  }, [isOpen]);

  const loadBlacklist = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBlacklist();
      setBlacklist(res.blacklist || []);
    } catch (err) {
      console.error('Failed to load blacklist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (appId: string) => {
    try {
      await api.removeFromBlacklist(appId);
      setBlacklist((prev) => prev.filter((b) => b.steam_app_id !== appId));
    } catch (err) {
      console.error('Failed to restore game:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
      <div className="w-full max-w-lg rounded-3xl glass-dark border border-slate-700/60 shadow-2xl p-6 relative max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Ignored & Bloatware Games</h2>
              <p className="text-xs text-slate-400">Skipped automatically during Steam synchronizations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-grow space-y-2 pr-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading blacklisted games...</p>
            </div>
          ) : blacklist.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Trash2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No games are currently blacklisted.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                When you delete a free or bloatware Steam game with the blacklist checkbox enabled, it will appear here so it's never re-imported!
              </p>
            </div>
          ) : (
            blacklist.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-xs text-white">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">AppID: {item.steam_app_id}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.reason}</p>
                </div>

                <button
                  onClick={() => handleRestore(item.steam_app_id)}
                  title="Restore game to sync list"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors border border-slate-700 shrink-0"
                >
                  <Undo2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Restore</span>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="pt-4 mt-2 border-t border-slate-800 shrink-0 text-center">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
