import type { ActionKind, PersonaId } from './types';

export type PersonaDef = {
  id: PersonaId;
  stage: 1 | 2;
  titleKo: string;
  weights: Record<ActionKind, number>;
};

export const PERSONAS: Record<PersonaId, PersonaDef> = {
  mixed_ref: {
    id: 'mixed_ref',
    stage: 1,
    titleKo: '혼합 기준(스토리+전투+무역+편입)',
    weights: {
      quest: 0.26,
      combat: 0.12,
      trade: 0.08,
      annex_path: 0.08,
      colonize: 0,
      travel: 0.04,
      idle: 0.02,
      skill: 0.08,
      gear: 0.10,
      develop: 0.10,
      capital: 0.12,
    },
  },
  front_annex: {
    id: 'front_annex',
    stage: 1,
    titleKo: '전선 편입(중립화→위성→스텔리움)',
    weights: {
      quest: 0.16,
      combat: 0.16,
      trade: 0.06,
      annex_path: 0.22,
      colonize: 0,
      travel: 0.04,
      idle: 0.02,
      skill: 0.06,
      gear: 0.08,
      develop: 0.06,
      capital: 0.14,
    },
  },
  trader: {
    id: 'trader',
    stage: 2,
    titleKo: '무역 편중',
    weights: {
      quest: 0.16,
      combat: 0.06,
      trade: 0.28,
      annex_path: 0.04,
      colonize: 0,
      travel: 0.04,
      idle: 0.02,
      skill: 0.08,
      gear: 0.18,
      develop: 0.08,
      capital: 0.06,
    },
  },
  colonize_edge: {
    id: 'colonize_edge',
    stage: 2,
    titleKo: '변경 개척 편중',
    weights: {
      quest: 0.14,
      combat: 0.14,
      trade: 0.06,
      annex_path: 0.10,
      colonize: 0.20,
      travel: 0.04,
      idle: 0.02,
      skill: 0.06,
      gear: 0.08,
      develop: 0.08,
      capital: 0.08,
    },
  },
  story_main: {
    id: 'story_main',
    stage: 2,
    titleKo: '본편 스토리 편중',
    weights: {
      quest: 0.36,
      combat: 0.08,
      trade: 0.06,
      annex_path: 0.04,
      colonize: 0,
      travel: 0.04,
      idle: 0.02,
      skill: 0.08,
      gear: 0.08,
      develop: 0.08,
      capital: 0.16,
    },
  },
};

export const STAGE1_PERSONAS: readonly PersonaId[] = ['mixed_ref', 'front_annex'];
export const STAGE2_PERSONAS: readonly PersonaId[] = [
  'mixed_ref',
  'front_annex',
  'trader',
  'colonize_edge',
  'story_main',
];

export function resolvePersona(id: string, minStage: 1 | 2): PersonaDef {
  const p = PERSONAS[id as PersonaId];
  if (!p) throw new Error(`unknown persona: ${id}`);
  if (p.stage > minStage) {
    throw new Error(`persona ${id} requires stage ${p.stage} (current ${minStage})`);
  }
  return p;
}
