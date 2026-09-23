// ============================================================
// 행성 웨이브 전투 발생조건 — 단일 정본 resolver.
//
// 규칙(대표님 지시 2026-08-16·2026-08-18 · 2026-09-05):
// - 월드맵 [전투](planet_assault)는 RED stay block + 쿨다운 아님 + occupationCombatEnabled.
//   ActivePool(순차 분쟁 리스트) 선행 조건 아님 — 전투 후 동적 편입.
// - 리스트 착륙 자동 웨이브는 폐지. 체류 중 **분쟁 순차 차례(due)** 가 오면
//   territorial 패스가 pending 을 세우고, 이 resolver가 territorial_turn 으로 발화한다.
// - 웨이브 종료 후 패스가 커서를 전진한다(한 방향: 패스→웨이브 요청, 웨이브→패스 완료).
// - 예외: endgame_boss 는 분쟁 순차와 별도 계약(§16-A).
// 쿨다운·퀘스트 등 추가 규칙은 **evaluatePlanetWaveCombatTrigger 안에서만** 조율한다.
// ============================================================

import {
  isPlanetOccupationCombatEnabled,
  resolvePlanetMainStageCombatVariant,
} from '../../arcCore/balance/balanceTableRegistry';
import { isSequentialContestedDecisionPlanet } from '../../arcCore/territorial/arcCoreTerritorialCombatPolicy';
import { resolvePlayerPlanetStayBlock } from '../../clanWar/planetTerritoryPlayerAccess';
import {
  evaluatePlanetWaveCombatTrigger,
  type PlanetWaveCombatTrigger,
  type PlanetWaveCombatTriggerRule,
} from './evaluatePlanetWaveCombatTrigger';
import { isTerritorialPlayerWavePending } from '../../arcCore/territorial/territorialPlayerWavePending';
import { isPlanetAssaultIntentActive } from './planetAssaultIntent';
import { isChatArmedWavePending } from './chatArmedWavePending';
import { isWaveCombatCooldownActive } from './waveCombatCooldownStore';
import { applyDracoCombatTestWaveTrigger } from '../../combat/dracoCombatTestVenue';
import { resolveQuestCombatLock, shouldHoldWaveForQuestHubOrbit } from '../../missions/questCombatLock';
import { useMissionStore } from '../../store/missionStore';

export type { PlanetWaveCombatTrigger, PlanetWaveCombatTriggerRule };
export { evaluatePlanetWaveCombatTrigger } from './evaluatePlanetWaveCombatTrigger';

/**
 * 월드맵 [전투] 노출·진입 — RED 점유 + occupationCombatEnabled + 승리 쿨다운 아님.
 * ActivePool 선행 조건 아님(2026-09-05 대표님). assault intent는 아직 없으므로 resolver.enabled와 같지 않다.
 */
export function isPlanetWaveAssaultAvailable(planetId: string | null | undefined): boolean {
  const id = planetId?.trim();
  if (!id) return false;
  if (isWaveCombatCooldownActive(id)) return false;
  if (!resolvePlayerPlanetStayBlock(id)) return false;
  return isPlanetOccupationCombatEnabled(id);
}

/**
 * 행성 허브 진입 시 웨이브 전투 발생 여부 판정 (허브 마운트·착륙 시 1회 호출).
 */
export function resolvePlanetWaveCombatTrigger(
  planetId: string | null | undefined,
): PlanetWaveCombatTrigger {
  const id = planetId?.trim();
  if (!id) return { enabled: false, rule: 'none', variant: 'default' };

  const missionState = useMissionStore.getState();
  const questLock = resolveQuestCombatLock(missionState.progresses, missionState.activeMissionId);
  const evaluated = evaluatePlanetWaveCombatTrigger({
    variant: resolvePlanetMainStageCombatVariant(id),
    onSequentialList: isSequentialContestedDecisionPlanet(id),
    stayBlocked: Boolean(resolvePlayerPlanetStayBlock(id)),
    assaultActive: isPlanetAssaultIntentActive(id) && isPlanetOccupationCombatEnabled(id),
    cooldownActive: isWaveCombatCooldownActive(id),
    territorialTurnPending: isTerritorialPlayerWavePending(id),
    chatArmedPending: isChatArmedWavePending(id),
    questHubOrbitHold: shouldHoldWaveForQuestHubOrbit(questLock, id),
  });
  return applyDracoCombatTestWaveTrigger(id, evaluated);
}
