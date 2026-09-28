/**
 * 전투 종료 출력 «순서» — RN/store 없이 계산만.
 * 실행부(`runCombatEndOutcomeFlow`)는 이 계획을 그대로 따른다.
 *
 * 대표님 정본 (2026-09-28):
 * 1 패배 인앱대사(리더) → 2 승/패 결과창 → 3 미션 완료 대사 → 4 레벨업·기타
 * 1번은 파이프라인 밖(호출부가 결과 present 전에 await).
 */

export const COMBAT_END_OUTCOME_STEPS = [
  'result',
  'missionClear',
  'levelUp',
  'notice',
  'backchannel',
] as const;

export type CombatEndOutcomeStep = (typeof COMBAT_END_OUTCOME_STEPS)[number];

export type CombatEndOutcomePlanInput = {
  /** 격침·파손 등 알림이 있는가 */
  hasNotice?: boolean;
  /** 아크코어 전투종료 백채널을 태울 것인가 */
  hasBackchannel?: boolean;
  /** 미션 클리어 대사 시도 여부. 기본 true */
  missionClearEnabled?: boolean;
  /** 결과창 직후 조기 종료(RED 퇴거) — 미션은 생략, 레벨업은 남김 */
  stopAfterResult?: boolean;
  /** 레벨업 뒤 조기 종료 — 알림·백채널 생략 */
  stopAfterLevelUp?: boolean;
};

/**
 * 실행될 단계를 순서대로 반환.
 * `result` · `levelUp` 은 항상 포함(레벨업 대기 없으면 즉시 통과하므로 «단계»로는 존재).
 */
export function planCombatEndOutcomeSteps(
  input: CombatEndOutcomePlanInput = {},
): CombatEndOutcomeStep[] {
  const steps: CombatEndOutcomeStep[] = ['result'];
  if (input.stopAfterResult === true) {
    steps.push('levelUp');
    return steps;
  }
  if (input.missionClearEnabled !== false) steps.push('missionClear');
  steps.push('levelUp');
  if (input.stopAfterLevelUp === true) return steps;
  if (input.hasNotice === true) steps.push('notice');
  if (input.hasBackchannel === true) steps.push('backchannel');
  return steps;
}
