// ============================================================
// 궤도 전함 전투 UI 활성 — 레벨업 모달 숨김 조건
// ============================================================

import { create } from 'zustand';

type OrbitCapitalCombatUiState = {
  active: boolean;
  setActive: (active: boolean) => void;
};

export const useOrbitCapitalCombatUiStore = create<OrbitCapitalCombatUiState>((set) => ({
  active: false,
  setActive: (active) => set({ active }),
}));
