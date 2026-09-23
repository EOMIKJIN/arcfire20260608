// ============================================================
// 스킬 발동 텍스트 — interned 상수. 전투는 에이전트 필드, 비전투는 overlay 1회
// ============================================================

import { resolveSkillAutoCombatPolicy } from './skillAutoCombatPolicy';

export const SKILL_PROC_LABEL = {
  emp: 'EMP 폭발',
  fortress: '요새화 모드',
  perfect: '절대 방어',
  stealth: '스텔스 기동',
  gravity: '중력 가속',
  blink: '차원 도약',
  regen: '나노봇 수복',
  singularity: '특이점 전개',
  emergency: '긴급 탈출',
  wingman: '윙맨 소환',
  shieldOverload: '실드 과부하',
  wormhole: '웜홀 작동',
  smugglerCatch: '밀수 발각',
  jumpBoost: '점프 가속',
  monopoly: '시장 독점',
  scan: '정찰 센서',
  repairDrone: '수리 드론',
} as const;

export type SkillProcLabel = (typeof SKILL_PROC_LABEL)[keyof typeof SKILL_PROC_LABEL];

/** 비전투 1회 배너 — compact overlay. 전투 틱에서 호출 금지 */
export function presentSkillProcBanner(label: string): void {
  const ms = resolveSkillAutoCombatPolicy().procBannerMs;
  const { showArcAlert } = require('../utils/showArcAlert') as typeof import('../utils/showArcAlert');
  showArcAlert(label, undefined, undefined, { autoDismissMs: ms });
}
