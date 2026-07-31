// ============================================================
// 분쟁지역 Eligibility 풀 거버너 — 대표님 A안(2026-07-31)
// ActivePool = (CSV contested ∪ dynamic) − SAFE. N<min이면 전선에서 자동 promote로 min까지 채움,
// N>max면 전선점수 낮은 동적 항목부터 demote. 1회 조정은 promote+demote 합계 ≤ stepMax.
// M3~M5 순수 결정 로직(planContestedPoolRebalance)은 스토어 의존 없음 — 테스트 용이.
// 실제 스토어 적용(rebalanceContestedPoolNow)만 zustand/store를 만짐.
// ============================================================

import type { ContestedEligibilityClass } from './contestedEligibility';

/**
 * 승격 우선순위 티어(2026-07-31, contested-active-pool-ui-fix) — 숫자가 작을수록 우선.
 * 대표님 지시: min8 부족분은 "외곽 중립(전략적 불리 중립)"을 최우선으로 채우고, 이미 점유된
 * 후방 BLUE/RED 성계(FRONT라도)를 "땜빵"으로 올리는 것은 금지에 가깝게 — 중립 후보가 하나라도
 * 남아있으면 FRONT보다 먼저 전부 소진한다. 점수(score) 가산만으로는 보너스가 겹칠 때(연속+최근전투)
 * FRONT가 STRATEGIC_NEUTRAL 기본값을 역전할 수 있어 "후보 있으면 무조건" 요건을 못 지키므로,
 * 점수보다 먼저 적용되는 하드 티어로 강제한다(같은 티어 내에서만 점수로 순위).
 */
const PROMOTE_TIER_BY_CLASSIFICATION: Record<ContestedEligibilityClass, number> = {
  eligible_strategic_neutral: 0,
  eligible_front: 1,
  eligible_independent_front: 2,
  safe_hinterland: 99,
  ineligible: 99,
};

export type ContestedPoolMemberInput = {
  planetId: string;
  systemId: string;
  classification: ContestedEligibilityClass;
  /** CSV 정적 행 — 파일 삭제 불가(SAFE여도 store remove 대상 아님, 스킵 게이트로만 제외) */
  isStaticCsvRow: boolean;
  /** 이미 Active pool 멤버(CSV 또는 dynamic)인지 */
  isActiveMember: boolean;
  /** 승격 우선순위(후보) / 강등 우선순위(활성 멤버, 낮을수록 먼저 강등) 공용 스코어 */
  score: number;
  /** 최근 승격/강등 쿨다운 중이면 true — 이번 라운드 미조정 */
  inCooldown: boolean;
};

export type ContestedPoolRebalancePlan = {
  /** 새로 Active로 편입할 planetId(비-CSV, dynamic store에 promote) */
  promote: string[];
  /** Active에서 제외할 planetId(동적 항목만 — CSV 정적행은 절대 포함되지 않음) */
  demote: string[];
};

/**
 * 순수 결정 로직 — 스코어링·후보 선정만. 실제 promote/demote 스토어 반영은 호출측 책임.
 * 우선순위: (1) SAFE 지속 동적 멤버 정리 → (2) N<poolMin이면 승격 → (3) N>poolMax면 강등.
 * (2)(3)은 동시에 트리거되지 않음(정의상 상호 배타) — 정리(1) 이후 재계산된 activeNonSafeCount 기준.
 */
export function planContestedPoolRebalance(input: {
  members: ContestedPoolMemberInput[];
  poolMin: number;
  poolMax: number;
  stepMax: number;
}): ContestedPoolRebalancePlan {
  const { members, poolMin, poolMax, stepMax } = input;
  const promote: string[] = [];
  const demote: string[] = [];
  let stepsUsed = 0;

  // 1) SAFE 지속 동적 멤버 정리 — CSV 정적행은 대상 아님(파일 삭제 금지, 스킵 게이트로만 제외)
  const safeDynamicActive = members.filter(
    (m) =>
      m.isActiveMember
      && !m.isStaticCsvRow
      && m.classification === 'safe_hinterland'
      && !m.inCooldown,
  );
  for (const m of safeDynamicActive) {
    if (stepsUsed >= stepMax) break;
    demote.push(m.planetId);
    stepsUsed += 1;
  }
  const willBeDemoted = new Set(demote);

  const activeNonSafeCount = members.filter(
    (m) => m.isActiveMember && !willBeDemoted.has(m.planetId) && m.classification !== 'safe_hinterland',
  ).length;

  if (activeNonSafeCount < poolMin && stepsUsed < stepMax) {
    const candidates = members
      .filter(
        (m) =>
          !m.isActiveMember
          && m.classification !== 'safe_hinterland'
          && m.classification !== 'ineligible'
          && !m.inCooldown,
      )
      .sort(
        (a, b) =>
          PROMOTE_TIER_BY_CLASSIFICATION[a.classification] - PROMOTE_TIER_BY_CLASSIFICATION[b.classification]
          || b.score - a.score
          || a.planetId.localeCompare(b.planetId),
      );
    let need = poolMin - activeNonSafeCount;
    for (const c of candidates) {
      if (stepsUsed >= stepMax || need <= 0) break;
      promote.push(c.planetId);
      stepsUsed += 1;
      need -= 1;
    }
  } else if (activeNonSafeCount > poolMax && stepsUsed < stepMax) {
    const demotable = members
      .filter(
        (m) =>
          m.isActiveMember
          && !m.isStaticCsvRow
          && !willBeDemoted.has(m.planetId)
          && m.classification !== 'safe_hinterland'
          && !m.inCooldown,
      )
      .sort((a, b) => a.score - b.score || a.planetId.localeCompare(b.planetId));
    let need = activeNonSafeCount - poolMax;
    for (const c of demotable) {
      if (stepsUsed >= stepMax || need <= 0) break;
      demote.push(c.planetId);
      stepsUsed += 1;
      need -= 1;
    }
  }

  return { promote, demote };
}

/**
 * 승격 후보 스코어 — STRATEGIC_NEUTRAL(외곽/국경 인접 중립)=120 · FRONT(양쪽 인접, 이미 점유된
 * 후방일 수 있음)=100 · INDEPENDENT_FRONT=80(문서 미명시 — front/strategic_neutral 중간값으로
 * 안전 기본 채택, soft) · Active 1홉 연속 보너스 +15 · 플레이어 최근 전투 +10.
 * STRATEGIC_NEUTRAL을 FRONT보다 높게 둔 것은 대표님 지시("점유 FRONT로 min8 땜빵 금지")를
 * 점수로도 일관되게 반영하기 위함 — 다만 보너스가 겹치면 점수만으로는 역전 가능하므로 실제
 * 강제는 `planContestedPoolRebalance`의 티어(PROMOTE_TIER_BY_CLASSIFICATION)가 담당한다.
 * 강등 판단에도 동일 스코어 재사용(낮을수록 강등 우선, 강등은 티어 없이 순수 점수).
 */
export function scoreContestedEligibilityCandidate(input: {
  classification: ContestedEligibilityClass;
  /** 1홉 인접 중 이미 Active pool 멤버인 성계 존재 여부(전선 연속성) */
  hasAdjacentActiveMember: boolean;
  /** 최근 플레이어 전투(웨이브 등) 발생 여부 */
  recentPlayerCombat: boolean;
}): number {
  let score = 0;
  if (input.classification === 'eligible_strategic_neutral') score += 120;
  else if (input.classification === 'eligible_front') score += 100;
  else if (input.classification === 'eligible_independent_front') score += 80;
  if (input.hasAdjacentActiveMember) score += 15;
  if (input.recentPlayerCombat) score += 10;
  return score;
}
