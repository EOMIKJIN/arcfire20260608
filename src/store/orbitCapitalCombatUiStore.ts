// ============================================================
// 궤도 전함 전투 UI 활성 — 레벨업 모달 숨김 조건
// ============================================================

import { create } from 'zustand';

type OrbitCapitalCombatUiState = {
  active: boolean;
  /** 허브 일반전투 최종 격파 — 이동중과 동일한 종료 베일 */
  endHoldActive: boolean;
  setActive: (active: boolean) => void;
  setEndHoldActive: (active: boolean) => void;
};

export const useOrbitCapitalCombatUiStore = create<OrbitCapitalCombatUiState>((set) => ({
  active: false,
  endHoldActive: false,
  setActive: (active) => set(active ? { active } : { active, endHoldActive: false }),
  setEndHoldActive: (active) => set({ endHoldActive: active }),
}));
