import { create } from 'zustand';

export type BattleStanceId = 'AGGRESSIVE' | 'DEFENSIVE' | 'NEUTRAL';

/** color only — UI label via `t('battleStance.' + id)` */
export const BATTLE_STANCE_META: Record<BattleStanceId, { color: string }> = {
  AGGRESSIVE: { color: '#FF5C5C' },
  DEFENSIVE: { color: '#4A90FF' },
  NEUTRAL: { color: '#A0A8B8' },
};

type BattleStanceState = {
  activeStance: BattleStanceId;
  setStance: (stance: BattleStanceId) => void;
};

export const useBattleStanceStore = create<BattleStanceState>((set) => ({
  activeStance: 'NEUTRAL',
  setStance: (stance) => set({ activeStance: stance }),
}));

