import { create } from 'zustand';

export type BattleStanceId = 'AGGRESSIVE' | 'DEFENSIVE' | 'NEUTRAL';

export const BATTLE_STANCE_META: Record<BattleStanceId, { label: string; color: string }> = {
  AGGRESSIVE: { label: '공격 태세', color: '#FF5C5C' },
  DEFENSIVE: { label: '방어 태세', color: '#4A90FF' },
  NEUTRAL: { label: '중립 태세', color: '#A0A8B8' },
};

type BattleStanceState = {
  activeStance: BattleStanceId;
  setStance: (stance: BattleStanceId) => void;
};

export const useBattleStanceStore = create<BattleStanceState>((set) => ({
  activeStance: 'NEUTRAL',
  setStance: (stance) => set({ activeStance: stance }),
}));

