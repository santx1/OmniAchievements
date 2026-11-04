import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { Profile } from '../types/index.js';

interface AuthContextType {
  isMasterAuthenticated: boolean;
  masterToken: string | null;
  activeProfile: Profile | null;
  profiles: Profile[];
  isLoading: boolean;
  loginMaster: (password: string) => Promise<void>;
  logoutMaster: () => void;
  loadProfiles: () => Promise<void>;
  selectProfileWithPin: (profileId: string, pin: string) => Promise<boolean>;
  setActiveProfileDirect: (profile: Profile | null) => void;
  lockProfile: () => void;
  refreshActiveProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMasterAuthenticated, setIsMasterAuthenticated] = useState<boolean>(false);
  const [masterToken, setMasterToken] = useState<string | null>(api.getMasterToken());
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check auth status on boot
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (api.getMasterToken()) {
          try {
            const status = await api.checkAuthStatus();
            if (status.authenticated) {
              setIsMasterAuthenticated(true);
              setMasterToken(api.getMasterToken());
              await loadProfiles();
            } else {
              api.setMasterToken(null);
              setIsMasterAuthenticated(false);
            }
          } catch (netErr) {
            // Offline fallback: keep master session active from cached token
            setIsMasterAuthenticated(true);
            setMasterToken(api.getMasterToken());
            await loadProfiles();
          }
        }
      } catch (err) {
        setIsMasterAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const handleExpired = () => {
      setIsMasterAuthenticated(false);
      setActiveProfile(null);
    };

    const handleSyncComplete = () => {
      loadProfiles();
    };

    window.addEventListener('omni:master_auth_expired', handleExpired);
    window.addEventListener('omni:sync_completed', handleSyncComplete);
    return () => {
      window.removeEventListener('omni:master_auth_expired', handleExpired);
      window.removeEventListener('omni:sync_completed', handleSyncComplete);
    };
  }, []);

  const loadProfiles = async () => {
    try {
      const res = await api.getProfiles();
      setProfiles(res.profiles);

      // Check if there was an active profile stored
      const storedProfileId = api.getActiveProfileId();
      if (storedProfileId) {
        const found = res.profiles.find((p) => p.id === storedProfileId);
        if (found && api.getProfileToken()) {
          setActiveProfile(found);
        }
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  };

  const loginMaster = async (password: string) => {
    const res = await api.masterLogin(password);
    if (res.success) {
      setIsMasterAuthenticated(true);
      setMasterToken(res.token);
      await loadProfiles();
    }
  };

  const logoutMaster = () => {
    api.setMasterToken(null);
    api.setProfileToken(null, null);
    setIsMasterAuthenticated(false);
    setActiveProfile(null);
  };

  const selectProfileWithPin = async (profileId: string, pin: string): Promise<boolean> => {
    try {
      const res = await api.verifyProfilePin(profileId, pin);
      if (res.success) {
        localStorage.setItem(`omni_offline_pin_${profileId}`, '1');
        setActiveProfile(res.profile);
        return true;
      }
      return false;
    } catch (err: any) {
      // Offline fallback: if profile was previously unlocked with PIN on this device, allow offline entry
      const wasUnlocked = localStorage.getItem(`omni_offline_pin_${profileId}`) === '1';
      if (wasUnlocked) {
        const cached = profiles.find((p) => p.id === profileId);
        if (cached) {
          api.setProfileToken('offline_token', cached.id);
          setActiveProfile(cached);
          return true;
        }
      }
      return false;
    }
  };

  const setActiveProfileDirect = (profile: Profile | null) => {
    setActiveProfile(profile);
  };

  const lockProfile = () => {
    api.setProfileToken(null, null);
    setActiveProfile(null);
  };

  const refreshActiveProfile = async () => {
    if (!activeProfile) return;
    try {
      const res = await api.getProfiles();
      setProfiles(res.profiles);
      const updated = res.profiles.find((p) => p.id === activeProfile.id);
      if (updated) {
        setActiveProfile(updated);
      }
    } catch (err) {
      console.error('Failed to refresh profile', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isMasterAuthenticated,
        masterToken,
        activeProfile,
        profiles,
        isLoading,
        loginMaster,
        logoutMaster,
        loadProfiles,
        selectProfileWithPin,
        setActiveProfileDirect,
        lockProfile,
        refreshActiveProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
