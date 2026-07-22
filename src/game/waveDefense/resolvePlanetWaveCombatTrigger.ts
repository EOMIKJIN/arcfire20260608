// ============================================================
// 행성 웨이브 전투 발생조건 — 단일 정본 resolver.
//
// 현재(기반 단계)는 「강제성 반복 규칙」: CSV variant(draco_wave·endgame_boss)
// 행성은 착륙 방문마다, RED 점유 행성은 [전투] 공격 진입 intent가 있을 때
// 웨이브 전투가 발생한다. 추후 전투발생조건 조율(쿨다운·점유상태·퀘스트 게이트 등)은
// **이 함수 안에서만** 규칙을 추가한다 — planet.tsx 등 소비처는 결과만 읽는다.
// (국경 표시 연동 회귀(2026-07-20)와 같은 「트리거·표시 로직 분산」 재발 방지 축)
// ============================================================

import { resolvePlanetMainStageCombatVariant } from '../../arcCore/balance/balanceTableRegistry';
import { resolvePlayerPlanetStayBlock } from '../../clanWar/planetTerritoryPlayerAccess';
import { isPlanetAssaultIntentActive } from './planetAssaultIntent';
import { isWaveCombatCooldownActive } from './waveCombatCooldownStore';

export type PlanetWaveCombatTriggerRule =
  | 'csv_variant' // planet_hostile_red_progression.csv mainStageCombatVariant
  | 'planet_assault' // worldmap [전투] 공격 진입(RED 점유 행성)
  | 'victory_cooldown' // 승리 후 재개 대기(30분) — 향후 전투 재개 전술화의 기반 규칙
  | 'none';

export type PlanetWaveCombatTrigger = {
  enabled: boolean;
  rule: PlanetWaveCombatTriggerRule;
  /** CSV variant 원문 — draco_wave · endgame_boss · tutorial_escape · default 등 */
  variant: string;
};

const WAVE_TRIGGER_VARIANTS: readonly string[] = ['draco_wave', 'endgame_boss'];

/**
 * 행성 허브 진입 시 웨이브 전투 발생 여부 판정 (허브 마운트·착륙 시 1회 호출).
 * 우선순위: 공격 진입 intent(점유와 무관하게 판가름 전투) > CSV variant 반복 규칙.
 */
export function resolvePlanetWaveCombatTrigger(
  planetId: string | null | undefined,
): PlanetWaveCombatTrigger {
  const id = planetId?.trim();
  if (!id) return { enabled: false, rule: 'none', variant: 'default' };

  const variant = resolvePlanetMainStageCombatVariant(id);

  // 승리 후 재개 대기(30분) — 모든 트리거 규칙에 선행 (대표님 지시 2026-07-22).
  // 승리 결과창 표시 중 즉시 재기동(중복 처리) 차단 + 30분 내 재방문/재진입도 전투 없음.
  // 향후 「전투 재개 전술화」 고도화 시 waveCombatCooldownStore의 시간·조건만 확장한다.
  if (isWaveCombatCooldownActive(id)) {
    return { enabled: false, rule: 'victory_cooldown', variant };
  }

  // [전투] 공격 진입 — RED 점유 행성이면 variant와 무관하게 웨이브 전투(vega_base 룰)
  if (isPlanetAssaultIntentActive(id) && resolvePlayerPlanetStayBlock(id)) {
    return { enabled: true, rule: 'planet_assault', variant };
  }

  if (WAVE_TRIGGER_VARIANTS.includes(variant)) {
    return { enabled: true, rule: 'csv_variant', variant };
  }

  return { enabled: false, rule: 'none', variant };
}
