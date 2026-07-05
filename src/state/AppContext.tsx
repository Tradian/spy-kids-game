import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Mission, Profile, Rank, StageResult, Track } from '../types';
import { getProfile } from '../db/repo';

/**
 * A tiny explicit screen stack. This app is a kiosk for small hands — no
 * deep links, no gestures to learn — so a full navigation library would be
 * more machinery than the game needs.
 */

export type Screen =
  | { name: 'profileSelect' }
  | { name: 'hq' }
  | { name: 'missionMap'; track: Track }
  | { name: 'briefing'; mission: Mission }
  | { name: 'codeStage'; mission: Mission }
  | { name: 'unlock'; mission: Mission; results: StageResult[] }
  | {
      name: 'debrief';
      mission: Mission;
      results: StageResult[];
      promotedTo: Rank | null;
      newBadgeIds: string[];
    }
  | { name: 'gadgetLocker' }
  | { name: 'badgeWall' }
  | { name: 'parentArea' };

interface AppState {
  screen: Screen;
  profile: Profile | null;
  missionsThisSession: number;
  navigate: (s: Screen) => void;
  /** Replace current screen (used mid-mission so back never re-enters a stage). */
  replace: (s: Screen) => void;
  back: () => void;
  goHome: () => void;
  setProfile: (p: Profile | null) => void;
  refreshProfile: () => Promise<void>;
  bumpMissionsThisSession: () => void;
}

const Ctx = createContext<AppState | null>(null);

export const useApp = (): AppState => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<Screen[]>([{ name: 'profileSelect' }]);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [missionsThisSession, setMissionsThisSession] = useState(0);

  const navigate = useCallback((s: Screen) => setStack((st) => [...st, s]), []);
  const replace = useCallback(
    (s: Screen) => setStack((st) => [...st.slice(0, -1), s]),
    [],
  );
  const back = useCallback(
    () => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)),
    [],
  );
  const goHome = useCallback(() => setStack([{ name: 'profileSelect' }, { name: 'hq' }]), []);

  const setProfile = useCallback((p: Profile | null) => {
    setProfileState(p);
    setMissionsThisSession(0);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!profile) return;
    const fresh = await getProfile(profile.id);
    if (fresh) setProfileState(fresh);
  }, [profile]);

  const bumpMissionsThisSession = useCallback(
    () => setMissionsThisSession((n) => n + 1),
    [],
  );

  const value = useMemo<AppState>(
    () => ({
      screen: stack[stack.length - 1],
      profile,
      missionsThisSession,
      navigate,
      replace,
      back,
      goHome,
      setProfile,
      refreshProfile,
      bumpMissionsThisSession,
    }),
    [stack, profile, missionsThisSession, navigate, replace, back, goHome, setProfile, refreshProfile, bumpMissionsThisSession],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
