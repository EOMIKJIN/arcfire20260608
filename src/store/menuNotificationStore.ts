import { create } from 'zustand';

type MenuNotificationMap = Record<string, boolean>;

interface MenuNotificationState {
  badges: MenuNotificationMap;
  setBadge: (menuKey: string, active: boolean) => void;
  clearBadge: (menuKey: string) => void;
  clearAllBadges: () => void;
  hasBadge: (menuKey: string) => boolean;
}

/**
 * 범용 메뉴 우상단 알림 점(배지) 상태.
 * menuKey 기준으로 모든 메뉴에서 재사용 가능.
 */
export const useMenuNotificationStore = create<MenuNotificationState>((set, get) => ({
  badges: {},
  setBadge: (menuKey, active) => {
    if (!menuKey) return;
    const nextOn = Boolean(active);
    set((state) => {
      const curOn = state.badges[menuKey] === true;
      if (nextOn) {
        if (curOn) return state;
        return { badges: { ...state.badges, [menuKey]: true } };
      }
      if (!curOn) return state;
      const next = { ...state.badges };
      delete next[menuKey];
      return { badges: next };
    });
  },
  clearBadge: (menuKey) => {
    if (!menuKey) return;
    set((state) => {
      if (!(menuKey in state.badges)) return state;
      const next = { ...state.badges };
      delete next[menuKey];
      return { badges: next };
    });
  },
  clearAllBadges: () => {
    if (Object.keys(get().badges).length === 0) return;
    set({ badges: {} });
  },
  hasBadge: (menuKey) => Boolean(get().badges[menuKey]),
}));
