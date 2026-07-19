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
import { resolveMapFactionSideFromClanId } from '../../galaxyMap/resolveMapFactionSide';
import type { MapFactionSide } from '../../galaxyMap/resolveMapFactionSide';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { yieldJsThread } from '../schedule/yieldJsThread';
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
): { attacker: TerritorialCombatParticipant; defender: TerritorialCombatParticipant } {
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
  if (participant === 'NEUTRAL') return 'NEUTRAL';
  return participant;
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

function sideToMapFaction(side: TerritorialFactionSide | 'NEUTRAL'): MapFactionSide {
  if (side === 'BLUE') return 'blue';
  if (side === 'RED') return 'red';
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

  const { attacker, defender } = resolveAttackerDefenderSides(holdSide, policy.combatMode);
  const attackerShipIds = listTerritorialFleetShipIds(planetId, attacker);
  const defenderShipIds = listTerritorialFleetShipIds(planetId, defender);

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
