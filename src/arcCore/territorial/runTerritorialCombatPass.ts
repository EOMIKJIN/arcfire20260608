import {
  getTerritorialCombatPolicy,
  listTerritorialCombatPolicies,
  listTerritorialCombatPoliciesForCampaign,
  listTerritorialFleetShipIds,
  type TerritorialCombatMode,
  type TerritorialCombatParticipant,
  type TerritorialCombatPolicy,
  type TerritorialFactionSide,
} from './arcCoreTerritorialCombatPolicy';
import {
  getTerritorialCombatLastPassAtMs,
  hydrateArcCoreTerritorialCombatState,
  listTerritorialCampaignGroups,
  markTerritorialCombatPassCompleted,
  resolveTerritorialCampaignPlanetDue,
} from './arcCoreTerritorialCombatState';
import {
  opposingTerritorialSide,
  resolveHoldFactionSide,
  resolveTerritorialQuickCombat,
} from './resolveTerritorialQuickCombat';
import {
  showTerritorialOccupationChangeAlert,
  showTerritorialOccupationMaintainedAlert,
  showTerritorialStatusQuoAlert,
} from './showTerritorialOccupationChangeAlert';
import { publishTerritorialHoldChangeNotice } from './publishTerritorialHoldChangeNotice';
import {
  resolveGovernorTacticsReversal,
  type TacticsReversalOutcome,
} from './resolveGovernorTacticsReversal';
import { hydratePlanetGovernorAssignmentStore } from '../../game/planetGovernor/planetGovernorAssignmentStore';
import { validateTerritorialCombatModeForSystem } from './territorialCombatGraph';
import {
  countAdjacentFriendlySystems,
  listHostileFactions,
  resolveTerritorialSupplyContext,
} from './territorialSupplyLine';
import { usePlayerStore } from '../../store/playerStore';
import { resolveMapFactionSideFromClanId } from '../../galaxyMap/resolveMapFactionSide';
import type { MapFactionSide } from '../../galaxyMap/resolveMapFactionSide';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { yieldJsThread } from '../schedule/yieldJsThread';
import {
  DYNAMIC_CONTESTED_TEMPLATE_PLANET_ID,
  isDynamicContestedZonePlanet,
} from './dynamicContestedZoneStore';
import type { PlanetClanHold } from '../../types';

export type TerritorialPassDecision = 'battle' | 'neutral_declare' | 'status_quo';

export type TerritorialPassResult = {
  planetId: string;
  decision: TerritorialPassDecision;
  holdChanged: boolean;
  previousSide: MapFactionSide;
  newSide: MapFactionSide;
  operationId?: string;
};

function rollDecision(policy: TerritorialCombatPolicy): TerritorialPassDecision {
  const total =
    policy.battleWeightPct + policy.neutralDeclareWeightPct + policy.statusQuoWeightPct;
  if (total <= 0) return 'status_quo';
  let r = Math.random() * total;
  if (r < policy.battleWeightPct) return 'battle';
  r -= policy.battleWeightPct;
  if (r < policy.neutralDeclareWeightPct) return 'neutral_declare';
  return 'status_quo';
}

function resolveAttackerDefenderSides(
  holdSide: TerritorialFactionSide | 'NEUTRAL',
  combatMode: TerritorialCombatMode,
  /** 보급선 — 중립 blue_red 공격자 선정 시 인접 아군 성계 수(무보급 팩션은 원정 불가) */
  supplyAdjacency?: { blue: number; red: number },
): {
  // INDEPENDENT는 이 함수에 진입하지 않음(별도 침공 판정 분기) — 반환 타입에서 제외
  attacker: TerritorialFactionSide | 'NEUTRAL';
  defender: TerritorialFactionSide | 'NEUTRAL';
} {
  if (combatMode === 'blue_neutral') {
    if (holdSide === 'BLUE') {
      return { attacker: 'NEUTRAL', defender: 'BLUE' };
    }
    return { attacker: 'BLUE', defender: 'NEUTRAL' };
  }
  if (combatMode === 'red_neutral') {
    if (holdSide === 'RED') {
      return { attacker: 'NEUTRAL', defender: 'RED' };
    }
    return { attacker: 'RED', defender: 'NEUTRAL' };
  }
  if (holdSide === 'BLUE') {
    return { attacker: 'RED', defender: 'BLUE' };
  }
  if (holdSide === 'RED') {
    return { attacker: 'BLUE', defender: 'RED' };
  }
  // 중립 행성 — 보급선(인접 아군 성계) 있는 팩션만 공격자 후보. 한쪽만 보급 확보 시 그쪽 확정.
  if (supplyAdjacency) {
    const blueCan = supplyAdjacency.blue > 0;
    const redCan = supplyAdjacency.red > 0;
    if (blueCan !== redCan) {
      const attacker: TerritorialFactionSide = blueCan ? 'BLUE' : 'RED';
      return { attacker, defender: opposingTerritorialSide(attacker) };
    }
  }
  const attacker: TerritorialFactionSide = Math.random() < 0.5 ? 'BLUE' : 'RED';
  return { attacker, defender: opposingTerritorialSide(attacker) };
}

function resolveDominantFaction(combatMode: TerritorialCombatMode): TerritorialFactionSide | null {
  if (combatMode === 'blue_neutral') return 'BLUE';
  if (combatMode === 'red_neutral') return 'RED';
  return null;
}

/** 2자 접전 — 우세 팩션 dominantSideWeightPct% 확률로 점유. 실패 시 NEUTRAL이 아닌 현재 점유 유지(중립 과다 방지). */
function resolveBinaryDominantHoldTarget(
  combatMode: TerritorialCombatMode,
  policy: TerritorialCombatPolicy,
  holdSide: TerritorialFactionSide | 'NEUTRAL',
): TerritorialFactionSide | 'NEUTRAL' {
  const dominant = resolveDominantFaction(combatMode);
  if (!dominant) return holdSide === 'NEUTRAL' ? 'NEUTRAL' : holdSide;
  const dominantWins = Math.random() * 100 < policy.dominantSideWeightPct;
  if (dominantWins) return dominant;
  if (holdSide !== 'NEUTRAL') return holdSide;
  return 'NEUTRAL';
}

function participantToHoldTarget(
  participant: TerritorialCombatParticipant,
): TerritorialFactionSide | 'NEUTRAL' {
  // INDEPENDENT는 별도 침공 판정(runIndependentHoldInvasionJudgment)에서만 참여 — 일반 hold 타깃 아님
  if (participant === 'BLUE' || participant === 'RED') return participant;
  return 'NEUTRAL';
}

function notifyHoldChange(input: {
  planetId: string;
  planetLabelKo: string;
  previousSide: MapFactionSide;
  newSide: MapFactionSide;
  decision: TerritorialPassDecision;
  attackerWon?: boolean;
}): void {
  if (input.previousSide === input.newSide) return;
  showTerritorialOccupationChangeAlert({
    planetLabelKo: input.planetLabelKo,
    previousSide: input.previousSide,
    newSide: input.newSide,
    decision: input.decision,
    attackerWon: input.attackerWon,
  });
  publishTerritorialHoldChangeNotice({
    planetId: input.planetId,
    planetLabelKo: input.planetLabelKo,
    previousSide: input.previousSide,
    newSide: input.newSide,
    decision: input.decision,
  });
}

function notifyTerritorialPassOutcome(input: {
  planetId: string;
  planetLabelKo: string;
  previousSide: MapFactionSide;
  newSide: MapFactionSide;
  decision: TerritorialPassDecision;
  holdChanged: boolean;
  attackerWon?: boolean;
}): void {
  if (input.decision === 'status_quo') {
    showTerritorialStatusQuoAlert({
      planetLabelKo: input.planetLabelKo,
      side: input.newSide,
    });
    return;
  }

  if (input.holdChanged) {
    notifyHoldChange(input);
    return;
  }

  showTerritorialOccupationMaintainedAlert({
    planetLabelKo: input.planetLabelKo,
    side: input.newSide,
    decision: input.decision,
    attackerWon: input.attackerWon,
  });
}

function sideToMapFaction(side: TerritorialFactionSide | 'NEUTRAL' | 'INDEPENDENT'): MapFactionSide {
  if (side === 'BLUE') return 'blue';
  if (side === 'RED') return 'red';
  if (side === 'INDEPENDENT') return 'independent';
  return 'neutral';
}

function resolveBattleHoldTarget(input: {
  combatMode: TerritorialCombatMode;
  policy: TerritorialCombatPolicy;
  holdSide: TerritorialFactionSide | 'NEUTRAL';
  attacker: TerritorialCombatParticipant;
  defender: TerritorialCombatParticipant;
  attackerWon: boolean;
}): TerritorialFactionSide | 'NEUTRAL' {
  const { combatMode, policy, holdSide, attacker, defender, attackerWon } = input;

  if (combatMode === 'blue_neutral' || combatMode === 'red_neutral') {
    return resolveBinaryDominantHoldTarget(combatMode, policy, holdSide);
  }

  if (attackerWon) {
    return participantToHoldTarget(attacker);
  }
  if (holdSide === 'NEUTRAL') {
    return participantToHoldTarget(defender);
  }
  return holdSide;
}

/** 함대 CSV — 동적 편입 행성은 `__dynamic_default__` 템플릿 편성 폴백 */
function resolveTerritorialFleetShipIds(
  planetId: string,
  side: TerritorialCombatParticipant,
): readonly string[] {
  const rows = listTerritorialFleetShipIds(planetId, side);
  if (rows.length > 0) return rows;
  if (!isDynamicContestedZonePlanet(planetId)) return rows;
  return listTerritorialFleetShipIds(DYNAMIC_CONTESTED_TEMPLATE_PLANET_ID, side);
}

/**
 * 독립국(플레이어 국가·녹색) 행성 침공 판정 — 정식 팩션 규칙 (2026-07-21 대표님 확정 설계).
 * - 공격자: 정치관계 CSV상 적대 팩션 중 보급선(인접 아군 성계 ≥1) 보유 측만 (동맹 블루는 침공 불가)
 * - 주둔 억지: 플레이어가 해당 행성 체류 중이면 주력전투병력 주둔으로 침공 보류 (자리를 뜨면 함락이 정론)
 * - 소유권 파괴: 함락 시 점유 전환 + 증서 소멸(applyArcCoreTerritorialHold 덮어쓰기 정본) → 재중립화 후 재구매
 * - neutral_declare는 미적용 — 소유권은 전투 함락으로만 소멸
 * - 총사령관 전술 역전 미적용 — NPC 국가 총독 체계 밖 (추후 병력배치 시스템에서 대체)
 */
async function runIndependentHoldInvasionJudgment(input: {
  planetId: string;
  policy: TerritorialCombatPolicy;
  warStore: ReturnType<typeof useClanWarFoundationStore.getState>;
  nowMs: number;
  campaignMeta?: { group: string; orderIndex: number };
}): Promise<TerritorialPassResult> {
  const { planetId, policy, warStore, nowMs, campaignMeta } = input;
  const previousSide: MapFactionSide = 'independent';

  const completePass = async () => {
    await markTerritorialCombatPassCompleted(
      planetId,
      nowMs,
      campaignMeta ? { group: campaignMeta.group, orderIndex: campaignMeta.orderIndex } : undefined,
    );
  };

  const statusQuoResult = async (): Promise<TerritorialPassResult> => {
    await completePass();
    showTerritorialStatusQuoAlert({
      planetLabelKo: policy.alertLabelKo,
      side: previousSide,
    });
    return {
      planetId,
      decision: 'status_quo',
      holdChanged: false,
      previousSide,
      newSide: previousSide,
    };
  };

  // 1. 주둔 억지 — 플레이어(주력전투병력)가 해당 행성에 체류 중이면 침공 보류
  const player = usePlayerStore.getState().player;
  if (player?.currentPlanetId === planetId) {
    if (__DEV__) {
      console.log(`[territorial] ${planetId} 독립국 침공 보류 — 플레이어 주둔(주력병력) 억지`);
    }
    return statusQuoResult();
  }

  const holds = warStore.planetHolds;

  // 2. 공격자 선정 — 적대 팩션 중 보급선 보유 측(인접 아군 성계 최다)만 침공 가능
  let attacker: TerritorialFactionSide | null = null;
  let attackerAdjacent = 0;
  for (const hostile of listHostileFactions('INDEPENDENT')) {
    if (hostile !== 'BLUE' && hostile !== 'RED') continue;
    const adj = countAdjacentFriendlySystems({
      systemId: policy.systemId,
      side: hostile,
      holds,
    });
    if (adj > attackerAdjacent) {
      attacker = hostile;
      attackerAdjacent = adj;
    }
  }
  if (!attacker) {
    return statusQuoResult();
  }

  // 3. 판정 롤 — battle 외에는 현상 유지(독립국에 중립선포 없음)
  const decision = rollDecision(policy);
  if (decision !== 'battle') {
    return statusQuoResult();
  }

  // 4. 전투 — 침공 함대 vs 독립국 주둔군 (보급 배율 동일 물리학)
  const attackerShipIds = resolveTerritorialFleetShipIds(planetId, attacker);
  const defenderShipIds = resolveTerritorialFleetShipIds(planetId, 'INDEPENDENT');
  if (attackerShipIds.length === 0 || defenderShipIds.length === 0) {
    if (__DEV__) {
      console.warn(
        `[territorial] ${planetId} 독립국 침공 skip — 함대 없음 atk=${attackerShipIds.length} def=${defenderShipIds.length}`,
      );
    }
    return statusQuoResult();
  }

  const supply = resolveTerritorialSupplyContext({
    policy,
    attacker,
    defender: 'INDEPENDENT',
    holds,
  });
  const combat = resolveTerritorialQuickCombat({
    attackerShipIds,
    defenderShipIds,
    defenderAdvantagePct: policy.defenderAdvantagePct,
    combatNoisePct: policy.combatNoisePct,
    attackerSupplyMul: supply.attacker.powerMul,
    defenderSupplyMul: supply.defender.powerMul,
  });
  const attackerWon = combat.winner === 'attacker';

  if (!attackerWon) {
    await completePass();
    showTerritorialOccupationMaintainedAlert({
      planetLabelKo: policy.alertLabelKo,
      side: previousSide,
      decision: 'battle',
      attackerWon: false,
    });
    return {
      planetId,
      decision: 'battle',
      holdChanged: false,
      previousSide,
      newSide: previousSide,
    };
  }

  // 5. 함락 — 점유 전환 + 소유권 증서 파괴(덮어쓰기) → 플레이어는 재중립화 후 재구매
  const applied = warStore.applyArcCoreTerritorialHold({
    planetId,
    systemId: policy.systemId,
    factionSide: attacker,
    operationMeta: {
      source: 'arc_core_territorial',
      decision: 'battle',
      combatMode: 'independent_invasion',
      attackerSide: attacker,
      defenderSide: 'INDEPENDENT',
      attackerWon: true,
      combat,
      supply: {
        attackerAdjacentFriendly: supply.attacker.adjacentFriendlySystems,
        defenderAdjacentFriendly: supply.defender.adjacentFriendlySystems,
        attackerMul: supply.attacker.powerMul,
        defenderMul: supply.defender.powerMul,
      },
    },
  });
  await completePass();
  notifyHoldChange({
    planetId,
    planetLabelKo: policy.alertLabelKo,
    previousSide,
    newSide: applied.newSide,
    decision: 'battle',
    attackerWon: true,
  });
  return {
    planetId,
    decision: 'battle',
    holdChanged: applied.changed,
    previousSide,
    newSide: applied.newSide,
    operationId: applied.operationId,
  };
}

export async function runTerritorialCombatPassForPlanet(
  planetId: string,
  nowMs: number,
  campaignMeta?: { group: string; orderIndex: number },
): Promise<TerritorialPassResult | null> {
  const policy = getTerritorialCombatPolicy(planetId);
  if (!policy?.enabled) return null;

  const graphCheck = validateTerritorialCombatModeForSystem({
    systemId: policy.systemId,
    combatMode: policy.combatMode,
  });
  if (!graphCheck.ok && __DEV__) {
    console.warn(
      `[territorial] ${planetId} combatMode=${policy.combatMode} != graph=${graphCheck.expected}`,
    );
  }

  if (!campaignMeta) {
    const lastPass = getTerritorialCombatLastPassAtMs(planetId);
    if (lastPass != null && nowMs - lastPass < policy.passIntervalSec * 1000) {
      return null;
    }
  }

  const warStore = useClanWarFoundationStore.getState();
  if (!warStore.hydrated) {
    await warStore.loadLocalClanWarFoundation();
  }
  // 총사령관 슬롯 판정(전술 역전) 전 배정 스토어 hydrate 보장 — 멱등·부트 후 즉시 반환
  await hydratePlanetGovernorAssignmentStore();

  const hold = warStore.getHold(planetId);
  const holdSide = resolveHoldFactionSide(hold?.occupierClanId);

  // 독립국(플레이어 국가) 점유 — 정식 팩션 침공 판정으로 분기
  if (holdSide === 'INDEPENDENT') {
    return runIndependentHoldInvasionJudgment({ planetId, policy, warStore, nowMs, campaignMeta });
  }

  const previousSide = sideToMapFaction(holdSide);
  const decision = rollDecision(policy);

  let newSide = previousSide;
  let holdChanged = false;
  let operationId: string | undefined;
  let attackerWon: boolean | undefined;

  const completePass = async () => {
    await markTerritorialCombatPassCompleted(
      planetId,
      nowMs,
      campaignMeta ? { group: campaignMeta.group, orderIndex: campaignMeta.orderIndex } : undefined,
    );
  };

  if (decision === 'status_quo') {
    await completePass();
    notifyTerritorialPassOutcome({
      planetId,
      planetLabelKo: policy.alertLabelKo,
      previousSide,
      newSide: previousSide,
      decision,
      holdChanged: false,
    });
    return { planetId, decision, holdChanged: false, previousSide, newSide: previousSide };
  }

  if (decision === 'neutral_declare') {
    if (holdSide !== 'NEUTRAL') {
      const applied = warStore.applyArcCoreTerritorialHold({
        planetId,
        systemId: policy.systemId,
        factionSide: 'NEUTRAL',
        operationMeta: { source: 'arc_core_territorial', decision },
      });
      holdChanged = applied.changed;
      newSide = applied.newSide;
      operationId = applied.operationId;
    }
    await completePass();
    notifyTerritorialPassOutcome({
      planetId,
      planetLabelKo: policy.alertLabelKo,
      previousSide,
      newSide,
      decision,
      holdChanged,
    });
    return { planetId, decision, holdChanged, previousSide, newSide, operationId };
  }

  // 보급선(런타임 holds 1홉 인접) — 공격자 선정·전투력 배율에 반영
  const holdsSnapshot = warStore.planetHolds;
  const supplyAdjacency = {
    blue: countAdjacentFriendlySystems({
      systemId: policy.systemId,
      side: 'BLUE',
      holds: holdsSnapshot,
    }),
    red: countAdjacentFriendlySystems({
      systemId: policy.systemId,
      side: 'RED',
      holds: holdsSnapshot,
    }),
  };

  const { attacker, defender } = resolveAttackerDefenderSides(
    holdSide,
    policy.combatMode,
    supplyAdjacency,
  );
  const attackerShipIds = resolveTerritorialFleetShipIds(planetId, attacker);
  const defenderShipIds = resolveTerritorialFleetShipIds(planetId, defender);

  const supply = resolveTerritorialSupplyContext({
    policy,
    attacker,
    defender,
    holds: holdsSnapshot,
  });

  const usesBinaryDominance =
    policy.combatMode === 'blue_neutral' || policy.combatMode === 'red_neutral';

  if (!usesBinaryDominance && (attackerShipIds.length === 0 || defenderShipIds.length === 0)) {
    await completePass();
    if (__DEV__) {
      console.warn(
        `[territorial] ${planetId} battle skipped — empty fleet attacker=${attackerShipIds.length} defender=${defenderShipIds.length}`,
      );
    }
    notifyTerritorialPassOutcome({
      planetId,
      planetLabelKo: policy.alertLabelKo,
      previousSide,
      newSide: previousSide,
      decision,
      holdChanged: false,
      attackerWon: false,
    });
    return { planetId, decision, holdChanged: false, previousSide, newSide: previousSide };
  }

  if (usesBinaryDominance) {
    attackerWon = undefined;
  } else {
    const combat = resolveTerritorialQuickCombat({
      attackerShipIds,
      defenderShipIds,
      defenderAdvantagePct: policy.defenderAdvantagePct,
      combatNoisePct: policy.combatNoisePct,
      attackerSupplyMul: supply.attacker.powerMul,
      defenderSupplyMul: supply.defender.powerMul,
    });
    attackerWon = combat.winner === 'attacker';

    // 총사령관 [전투전술영향] 역전 재판정 — 분쟁지역 한정, 전투당 1회
    let tacticsReversal: TacticsReversalOutcome | null = null;
    if (policy.contestedZone) {
      tacticsReversal = resolveGovernorTacticsReversal({
        planetId,
        winnerSide: attackerWon ? attacker : defender,
        loserSide: attackerWon ? defender : attacker,
      });
      if (tacticsReversal.reversed) {
        attackerWon = !attackerWon;
        if (__DEV__) {
          console.log(
            `[territorial] ${planetId} 전술 역전! chance=${tacticsReversal.reversalChancePct}% ` +
              `loser=${tacticsReversal.loserCaptainId}(${tacticsReversal.loserGrade}) → 승리 탈환`,
          );
        }
      }
    }

    const applied = warStore.applyArcCoreTerritorialHold({
      planetId,
      systemId: policy.systemId,
      factionSide: resolveBattleHoldTarget({
        combatMode: policy.combatMode,
        policy,
        holdSide,
        attacker,
        defender,
        attackerWon,
      }),
      operationMeta: {
        source: 'arc_core_territorial',
        decision,
        attackerSide: attacker,
        defenderSide: defender,
        attackerWon,
        combat,
        supply: {
          attackerAdjacentFriendly: supply.attacker.adjacentFriendlySystems,
          defenderAdjacentFriendly: supply.defender.adjacentFriendlySystems,
          attackerMul: supply.attacker.powerMul,
          defenderMul: supply.defender.powerMul,
        },
        ...(tacticsReversal
          ? {
              tacticsReversal: {
                reversed: tacticsReversal.reversed,
                reversalChancePct: tacticsReversal.reversalChancePct,
                winnerCaptainId: tacticsReversal.winnerCaptainId,
                loserCaptainId: tacticsReversal.loserCaptainId,
                winnerGrade: tacticsReversal.winnerGrade,
                loserGrade: tacticsReversal.loserGrade,
              },
            }
          : {}),
      },
    });
    holdChanged = applied.changed;
    newSide = applied.newSide;
    operationId = applied.operationId;
    await completePass();
    notifyTerritorialPassOutcome({
      planetId,
      planetLabelKo: policy.alertLabelKo,
      previousSide,
      newSide,
      decision,
      holdChanged,
      attackerWon,
    });
    return { planetId, decision, holdChanged, previousSide, newSide, operationId };
  }

  let targetFaction = resolveBattleHoldTarget({
    combatMode: policy.combatMode,
    policy,
    holdSide,
    attacker,
    defender,
    attackerWon: false,
  });

  // 총사령관 [전투전술영향] 역전 재판정 — 2자 접전(blue_neutral·red_neutral)도 분쟁지역이면 1회 적용.
  // 승자 = 판정된 target 측 참가자(제3측 유지면 방어 성공으로 간주), 패자 = 반대 참가자.
  let tacticsReversal: TacticsReversalOutcome | null = null;
  if (policy.contestedZone) {
    const winnerParticipant: TerritorialCombatParticipant =
      targetFaction === participantToHoldTarget(attacker)
        ? attacker
        : defender;
    const loserParticipant: TerritorialCombatParticipant =
      winnerParticipant === attacker ? defender : attacker;
    tacticsReversal = resolveGovernorTacticsReversal({
      planetId,
      winnerSide: participantToHoldTarget(winnerParticipant),
      loserSide: participantToHoldTarget(loserParticipant),
    });
    if (tacticsReversal.reversed) {
      targetFaction = participantToHoldTarget(loserParticipant);
      if (__DEV__) {
        console.log(
          `[territorial] ${planetId} 전술 역전(2자 접전)! chance=${tacticsReversal.reversalChancePct}% ` +
            `→ target=${targetFaction}`,
        );
      }
    }
  }

  const applied = warStore.applyArcCoreTerritorialHold({
    planetId,
    systemId: policy.systemId,
    factionSide: targetFaction,
    operationMeta: {
      source: 'arc_core_territorial',
      decision,
      combatMode: policy.combatMode,
      attackerSide: attacker,
      defenderSide: defender,
      dominantSideWeightPct: policy.dominantSideWeightPct,
      dominantFaction: resolveDominantFaction(policy.combatMode),
      targetFaction,
      ...(tacticsReversal
        ? {
            tacticsReversal: {
              reversed: tacticsReversal.reversed,
              reversalChancePct: tacticsReversal.reversalChancePct,
              winnerCaptainId: tacticsReversal.winnerCaptainId,
              loserCaptainId: tacticsReversal.loserCaptainId,
              winnerGrade: tacticsReversal.winnerGrade,
              loserGrade: tacticsReversal.loserGrade,
            },
          }
        : {}),
    },
  });
  holdChanged = applied.changed;
  newSide = applied.newSide;
  operationId = applied.operationId;

  await completePass();

  notifyTerritorialPassOutcome({
    planetId,
    planetLabelKo: policy.alertLabelKo,
    previousSide,
    newSide,
    decision,
    holdChanged,
  });

  return { planetId, decision, holdChanged, previousSide, newSide, operationId };
}

export async function runTerritorialCombatPass(nowMs = Date.now()): Promise<TerritorialPassResult[]> {
  // 동적 분쟁지역 hydrate 포함 — listTerritorialCombatPolicies가 편입 행성을 캠페인 순번으로 합산
  await hydrateArcCoreTerritorialCombatState();
  const policies = listTerritorialCombatPolicies();
  const results: TerritorialPassResult[] = [];
  const campaignGroups = listTerritorialCampaignGroups(policies);
  const campaignPlanetIds = new Set<string>();

  for (const group of campaignGroups) {
    const groupPolicies = listTerritorialCombatPoliciesForCampaign(group);
    const due = resolveTerritorialCampaignPlanetDue(group, groupPolicies, nowMs);
    if (!due) continue;
    campaignPlanetIds.add(due.planetId);
    const row = await runTerritorialCombatPassForPlanet(due.planetId, nowMs, {
      group,
      orderIndex: due.orderIndex,
    });
    if (row) results.push(row);
    // 행성 1곳 처리마다 이벤트 루프 양보 — 부트 직후 probe가 타이틀 탭을 막지 않게(2026-07-19)
    await yieldJsThread();
  }

  for (const policy of policies) {
    if (!policy.enabled) continue;
    if (policy.campaignGroup && campaignPlanetIds.has(policy.planetId)) continue;
    if (policy.campaignGroup) continue;
    const row = await runTerritorialCombatPassForPlanet(policy.planetId, nowMs);
    if (row) results.push(row);
    await yieldJsThread();
  }

  if (__DEV__ && results.length > 0) {
    for (const r of results) {
      console.log(
        `[territorial] pass ${r.planetId} decision=${r.decision} holdChanged=${r.holdChanged} ${r.previousSide}->${r.newSide}`,
      );
    }
  }

  return results;
}

export function resolveTerritorialHoldMapSide(hold: PlanetClanHold | undefined): MapFactionSide {
  return resolveMapFactionSideFromClanId(hold?.occupierClanId ?? 'neutral');
}
