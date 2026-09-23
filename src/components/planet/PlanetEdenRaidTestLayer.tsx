// ============================================================
// 뉴 에덴(에덴 시티) 전용 — NPC AI 간 상호 타겟·전투 테스트
// 스테이지·이벤트 공용 진입: `src/combat/index.ts` (직접 import 지양).
// 함선 규모는 `edenCapitalFleetConfig`(소규모 기본; 대규모는 `LARGE_SCALE_*`). 규약은 `capitalCombatConventions.ts`. 궤도 표시는 `PlanetEdenRaidOrbitSkiaCombat`(Skia 단일 Canvas + postStepRef, 시뮬 `agentsRef` 등 직접 읽기).
// 무기 교환 루프는 여전히 O(N²) 근사 — 대규모 함대는 공간 분할·타깃 수 상한이 별도 필요.
// 전투비행: 조우 후 장거리 우선 운용→선회(현측/후방)→근접. 교착은 함장 판단으로 짧게 타파. 미사일 살보·레이저·근접은 운용 밴드 게이트. 복합 목표·분리. 가속/요속 적분. 스폰 블렌드.
// ============================================================

import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';
import {
  CAPITAL_REALTIME_COMBAT_LOG_UI_ENABLED,
  COMBAT_HUD_LOG_MAX_AGENT_LINES,
} from '../../combat/capitalRealtimeCombatUiFlags';
import { clearCapitalRealtimeCombatPresentationCaches } from '../../combat/clearCapitalRealtimeCombatCaches';
import {
  applyCombatResumeSnapshotToAgents,
  captureCombatResumeSnapshot,
  clearCombatResumeSnapshot,
  consumeCombatResumeSnapshotForSession,
} from '../../combat/combatResumeStore';
import {
  EDEN_CAPITAL_FLEET_BLUE_COUNT as DUEL_TEAM_BLUE_COUNT_FALLBACK,
} from '../../npc/edenCapitalFleetConfig';
import {
  CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID,
  resolveCombatFleetSlotsFromCaptains,
  hasCapitalRealtimeCombatSlotsForPlanet,
  isCapitalRealtimeCombatOrbitPlanet,
} from '../../combat/capitalRealtimeCombatGate';
import { buildTransitCombatSeedSlots } from '../../combat/capitalTransitCombatSeed';
import { NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV } from '../../data/generated';
import { resolveNpcCaptainDisplayNameNow } from '../../i18n/captainText';
import { getNpcCapitalShip, getNpcCaptain, hasNpcCapitalShipId } from '../../npc/npcFleetRegistry';
import type { NpcCapitalShip } from '../../types';
import {
  getCapitalWeaponRow,
  getRocketBurstPolicy,
  resolveMissileSalvoCount,
  resolveMissileSalvoIntervalMs,
} from '../../game/capitalWeaponRegistry';
import {
  buildCapitalProjectileSpawn,
  createCapitalCraftImpactScratch,
  createCapitalCraftPool,
  getWeaponCraftLoiterPolicy,
  isCraftFamilyKind,
  isCraftLoiterRuntimeActive,
  isNovaAoeWeapon,
  isRocketFamilyWeapon,
  resetCapitalCraftPool,
  resolveCapitalLaserBeamPresentation,
  resolveCapitalWeaponImpact,
  applySpecialWeaponStatusOnAgent,
  applySpecialWeaponAoeAroundPoint,
  getWeaponSpecialFxPolicy,
  tickCapitalCrafts,
  trySpawnCapitalCraftVolley,
  type CapitalCraft,
  type CapitalCraftImpactEvent,
} from '../../combat/capitalWeaponPipeline';
import { DEFAULT_CLOSE_RANGE_WEAPON_ID } from '../../game/combatWeaponSlots';
import { resolvePlayerCombatWeaponChannels } from '../../game/resolvePlayerCombatWeaponChannels';
import {
  resolveMainStageCombatEnabled,
  resolvePlanetEnemyAffinityKind,
  resolvePlanetMainStageCombatVariant,
  resolveCombatEncounterTargetLevel,
  resolvePlayScenarioPrimaryPlanetId,
  resolveTransitCombatEncounterTargetLevel,
} from '../../arcCore/balance/balanceTableRegistry';
import { resolveTransitHostileHullScalePlanetId } from '../../npc/transitHostileCaptainResolve';
import { resolvePlayerHullAffinityKind } from '../../combat/playerHullAffinity';
import { resolveHostileEnemyWeaponLoadout } from '../../combat/hostileEnemyWeaponLoadoutFromBalance';
import { applyPlanetHostileHullScale } from '../../combat/planetHostileHullScale';
import { buildQuestHubOrbitSeedSlots } from '../../combat/questHubOrbitCombatSeed';
import { useMissionStore } from '../../store/missionStore';
import {
  resolveQuestCombatLock,
  resolveQuestLockTransitEncounterLevel,
  resolveQuestLockTransitHullPlanetId,
  shouldGuaranteeQuestTransitEncounter,
} from '../../missions/questCombatLock';
import {
  applyMineralUpgradeToShipPerformance,
  calculateShipPerformance,
} from '../../combat/ShipPerformanceCalculator';
import { normalizePlayerCombatProficiency } from '../../combat/playerCombatProficiency';
import { resolveWeaponAffinityDamageMultiplier } from '../../combat/weaponAffinityFromBalance';
import {
  CAPITAL_COMBAT_PLANET_DIAM_PX,
  CAPITAL_MISSILE_RANGE_LOOSEN_PX,
  CAPITAL_WEAPON_RANGE_FALLBACK_MISSILE_PX,
  deriveCapitalCombatRangeBands,
  navalBrawlRingBoundsFromBands,
  resolveCapitalWeaponRangePx,
  type CapitalCombatRangeBands,
} from '../../game/capitalWeaponRange';
import {
  appendDracoCombatTestAllies,
  resolveDracoCombatTestDoctrine,
  resolveDracoCombatTestRuntimePatch,
} from '../../combat/dracoCombatTestVenue';
import {
  applyTempoJudge,
  capitalWeaponFireAllowed,
  combatMotionStageFromDist,
  createCapitalManeuverDecision,
  createManeuverEmploymentDefaults,
  employBandLabelKo,
  propagateFleetTempoFromLeads,
  resolveCapitalManeuverDecision,
  type BearingGoal,
  type CapitalManeuverInput,
  type CombatMotionStage,
  type EmployBand,
  type KiteEvasionMode,
  type PreferredWeapon,
  type TempoRole,
} from '../../combat/maneuver/capitalManeuverDecision';
import {
  createCapitalHeavyTurnLaw,
  headingAlignGainForMaxYaw,
  writeCapitalHeavyTurnLaw,
} from '../../combat/maneuver/capitalHeavyTurnLaw';
import {
  resolveDoctrineForCaptain,
  type CaptainTacticDoctrine,
} from '../../combat/maneuver/captainTacticDoctrine';
import {
  createFormationAnchorPose,
  resolveLineFormationAnchor,
} from '../../combat/maneuver/capitalFormation';
import { useNpcCaptainProgressStore, NPC_CAPTAIN_PROGRESS_EXP } from '../../store/npcCaptainProgressStore';
import { usePlayerStore } from '../../store/playerStore';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { recordMatchSummary } from '../../store/combatMatchTelemetryStore';
import { maybeTriggerArcCoreShadowRevealOnCombatVictory } from '../../arcCore/shadow/arcCoreShadowReveal';
import { resolveArcCoreShadowBossOverride } from '../../arcCore/shadow/arcCoreShadowBossClone';
import { isSurvivalPodNpcShipId } from '../../game/playerSurvivalPod';
import { t } from '../../i18n';
import { showArcAlert } from '../../utils/showArcAlert';
import { useOrbitCapitalCombatUiStore } from '../../store/orbitCapitalCombatUiStore';
import { useBattleStanceStore, type BattleStanceId } from '../../store/battleStanceStore';
import { resolveShipFinalStatResult } from '../../ship/shipStatPipeline';
import {
  applyShipEquipmentToShipPerformance,
  aggregateShipEquipmentBonuses,
  resolveShipEquipmentAgentKnobs,
  type ShipEquipmentAgentKnobs,
} from '../../game/shipEquipment';
import { resolveNpcCapitalShipCombatBinding } from '../../game/npcCapitalShipCombatBinding';
import {
  applySkillArmorPierceToArmorStat,
  EMPTY_PLAYER_COMBAT_SKILL_BIND,
  PLAYER_WINGMAN_CAPTAIN_ID,
  resolvePlayerCombatSkillBind,
} from '../../game/playerOwnedSkillCombatBind';
import { resolveSkillAutoCombatPolicy, skillTurnMs } from '../../game/skillAutoCombatPolicy';
import { SKILL_PROC_LABEL } from '../../game/skillProcBanner';
import {
  applyMultiLockExtraHits,
  createNpcAgentSkillAuto,
  createPlayerAgentSkillAuto,
  createWingmanAgentSkillAuto,
  isAgentSkillInvulnerable,
  isAgentStealthed,
  readSkillProcLabel,
  resolveSkillMoveSpeedMult,
  playerAutoCombatSkillsNeedTick,
  tickPlayerAutoCombatSkills,
  type AgentSkillAuto,
} from '../../combat/playerAutoCombatSkills';
import { FONTS } from '../../utils/theme';
import { PlanetEdenRaidOrbitSkiaCombat } from './PlanetEdenRaidOrbitSkiaCombat';

/** `systems.ts` 의 에덴 시티 id */
export const NEW_EDEN_RAID_TEST_PLANET_ID = 'eden_city';
export const DRACO_SEAMLESS_PVP_TEST_PLANET_ID = 'draco_haven';
export const DRACO_SEAMLESS_PVP_TEST_SYSTEM_ID = 'draco_nebula';

export {
  CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID,
  hasCapitalRealtimeCombatSlotsForPlanet,
  isCapitalRealtimeCombatOrbitPlanet,
} from '../../combat/capitalRealtimeCombatGate';
import { COMBAT_END_HOLD_MS } from '../../game/combatEndHold';
import { getWaveFleetSeedOverride, useWaveDefenseStore } from '../../game/waveDefense/waveDefenseStore';
import { WAVE_DEFENSE_MAX_WAVES } from '../../game/waveDefense/waveDefenseFleet';
import { markWaveCombatVictoryCooldown } from '../../game/waveDefense/waveCombatCooldownStore';
import { applyDefeatEnemyMissionObjectives } from '../../missions/applyDefeatEnemyMissionObjectives';
import { tryPresentPendingMissionClearDialog } from '../../missions/missionPlanetHubSync';

type StageFleetSeedSlot = {
  team: 'red' | 'blue' | 'orange';
  npcShipId: string | null;
  captainId: string | null;
  combatInstanceKey?: string | null;
};

function lookupSlotCaptainDisplayName(captainId: string | null): string | undefined {
  if (!captainId) return undefined;
  const captain = getNpcCaptain(captainId);
  if (!captain) return undefined;
  return resolveNpcCaptainDisplayNameNow(captain);
}

function resolveTransitCombatSeedSlots(systemId: string | null): StageFleetSeedSlot[] {
  const currentFlagshipNpcId = resolveCurrentPlayerFlagshipNpcShipId();
  return buildTransitCombatSeedSlots(systemId, currentFlagshipNpcId);
}

const PLAYER_FLAGSHIP_CAPTAIN_ID = 'Player_pilot';
const PLAYER_FLAGSHIP_NPC_SHIP_ID = 'Player_npc_red_fleet_1';
/** 자동전투 스킬 틱·스텔스 판정용. 루프 선두에서만 갱신 */
let COMBAT_SKILL_NOW_MS = 0;
/** 내 전함 마름모·선수선만 녹색으로 구분 */
const PLAYER_FLAGSHIP_SHIP_STROKE = '#22C55E';

/** 전 행성 공통: 전투 함장 매칭(`npc_ai_captains.csv`) → 없으면 기본 폴백 편성. */
function resolveStageFleetSeedSlotsForPlanet(
  planetId: string,
  systemId: string | null = null,
): StageFleetSeedSlot[] {
  if (planetId === CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID) {
    return resolveTransitCombatSeedSlots(systemId);
  }
  const withDracoTestAllies = (slots: StageFleetSeedSlot[]): StageFleetSeedSlot[] =>
    appendDracoCombatTestAllies(planetId, slots);
  // 웨이브 디펜스 — 활성 시 해당 행성에 커스텀 적(red) 함대 주입 + 플레이어 blue 기함 자동 추가.
  const waveOverride = getWaveFleetSeedOverride(planetId);
  if (waveOverride && waveOverride.length > 0) {
    const hasBlue = waveOverride.some((slot) => slot.team === 'blue');
    if (!hasBlue) {
      const currentFlagshipNpcId = resolveCurrentPlayerFlagshipNpcShipId();
      const blueShipId = hasNpcCapitalShipId(currentFlagshipNpcId) ? currentFlagshipNpcId : null;
      // 웨이브 blue는 항상 플레이어 기함 슬롯 — captainId 고정으로 isPlayerCombatAgent/격파→endRun 경로 보장.
      // (captainId null이면 NPC blue로만 시드되어 red 승 시 cleared/endRun이 안 나와 stall까지 고착됨)
      return withDracoTestAllies([
        ...waveOverride,
        { team: 'blue', npcShipId: blueShipId, captainId: PLAYER_FLAGSHIP_CAPTAIN_ID },
      ]);
    }
    return withDracoTestAllies(waveOverride);
  }
  const missionState = useMissionStore.getState();
  const questHubSlots = buildQuestHubOrbitSeedSlots(
    resolveQuestCombatLock(missionState.progresses, missionState.activeMissionId),
    planetId,
    systemId,
    resolveCurrentPlayerFlagshipNpcShipId(),
  );
  if (questHubSlots && questHubSlots.length > 0) {
    return withDracoTestAllies(questHubSlots);
  }
  const fromCaptains = resolveCombatFleetSlotsFromCaptains(planetId, systemId);
  if (fromCaptains.length > 0) {
    const hasBlue = fromCaptains.some((slot) => slot.team === 'blue');
    if (!hasBlue && resolveMainStageCombatEnabled(planetId)) {
      const currentFlagshipNpcId = resolveCurrentPlayerFlagshipNpcShipId();
      const blueShipId = hasNpcCapitalShipId(currentFlagshipNpcId) ? currentFlagshipNpcId : null;
      return withDracoTestAllies([
        ...fromCaptains,
        { team: 'blue', npcShipId: blueShipId, captainId: null },
      ]);
    }
    return withDracoTestAllies(fromCaptains);
  }
  // 레드팀 폴백 슬롯 없음 — 적함은 CSV `combat`+`red` 함장(베가·드라코 테스트)만 사용.
  const rows: StageFleetSeedSlot[] = [];
  for (let i = 0; i < DUEL_TEAM_BLUE_COUNT_FALLBACK; i++) rows.push({ team: 'blue', npcShipId: null, captainId: null });
  return withDracoTestAllies(rows);
}

/** 팀 전열에서 함선 간격(px) */
const FLEET_SLOT_SPACING_PX = 34;

/** 레이저 발사 후 빔 표시 총 시간(페이드 포함) */
const LASER_DURATION_MS = 320;
/** 레이저 탄속 미지정 시 시각 연출용 폴백 */
const LASER_BOLT_TRAVEL_MS_FALLBACK = 26;
/** 이 시각 이후 스트로크 알파 서서히 감소 */
const LASER_FADE_START_MS = 170;
/** 레이저 재장전: 이전 발사 가능 시각부터 다음 발사까지 */
const LASER_RECHARGE_MS = 1800;

const TEMPO_JUDGE_INTERVAL_MS = 30_000;
const TEMPO_JUDGE_START_DELAY_MS = 60_000;
const WEAPON_STALL_RECOVERY_MS = 4200;
const STALL_CHASE_BOOST_MS = 1400;
/** 궤도 씬 `planet.tsx` 의 `<PlanetDot size={120} />` 와 동일 기준 */
const PLANET_DIAM_PX = CAPITAL_COMBAT_PLANET_DIAM_PX;
/** 전팀 공통 레이저 빔(기존 실시간 전함 전투 붉은 `#E04050`) */
const LASER_BEAM_COLOR_CAPITAL = '#E04050';
/** 무기 탄속 미지정 시 미사일 비행속도 폴백(px/ms) — 사거리는 `weapon_list.csv` 정본 */
const MISSILE_FLIGHT_SPEED_PX_PER_MS_FALLBACK =
  (CAPITAL_WEAPON_RANGE_FALLBACK_MISSILE_PX / 1400) * 0.5;
/** 살보 3발을 모두 쏜 뒤 다음 살보까지(재장전) */
const MISSILE_FIRE_INTERVAL_MS = 10_000;
/** 살보가 무기별 발수 완료 없이 비정상으로 멈출 때 강제 쿨다운으로 넘기기 위한 여유(ms) */
const MISSILE_SALVO_STALL_ABORT_GRACE_MS = 2600;
/** 명중 시점부터 궤적만 부드럽게 사라지는 시간 */
const MISSILE_TRAIL_FADE_MS = 4000;
/** 비행 중에도 오래된 연기(발사점 쪽)를 먼저 지우는 가시 윈도우(베지어 비율). */
const MISSILE_INFLIGHT_TRAIL_WINDOW_U = 0.78;
/** 명중 파편 — 슬로우 연출을 위해 길게 유지 */
const MISSILE_HIT_FX_DURATION_MS = 920;
const MISSILE_HIT_FX_PARTICLES = 6;
/** `planet.tsx` OrbitNpcDiamond — orbitMarkWrap 14×14 */
const ALLY_MARK_HALF = 7;
/** 수평 페어 최대 중심간 거리 = 맵 가로 − 2×margin − 이 여백(작을수록 양끝에 더 붙음) */
const DUEL_EDGE_INSET_TOTAL = 4;
/** 스폰 직후·리스폰 직후 이 구간(ms) 동안 넓은 배치 ↔ 복합 목표를 블렌드 */
const WIDE_SPAWN_LAYOUT_MS = 1600;
/** 함선 중심간 최소 이격(px) — 렌더·추적 겹침 완화 */
const MIN_CAPITAL_CENTER_SEP_PX = 38;
/** 코어 수송 궤도(`planetOrbitHubWorklets` ARC_ORBIT_Y_MUL)와 같이 적 주변 링·회피 궤도의 Y를 살짝 눌러 체감 정렬 */
const CAPITAL_ENEMY_ORBIT_ELLIPSE_Y_MUL = 0.88;
/** 와이드 스폰 앵커→전투 항법 블렌드 시 장면 Y(행성 중심 기준) — 진입·체류 궤도 느낌 */
const CAPITAL_SCENE_ORBIT_ELLIPSE_Y_MUL = 0.84;
/** 탐지·추격 단계에서 맵 중심 주변 미세 접선 드리프트(수송선 dwell 각속에 대응하는 시각적 리듬) */
const CAPITAL_CLOSING_ORBIT_DRIFT_AMP_PX = 3.2;
const CAPITAL_CLOSING_ORBIT_DRIFT_OMEGA_PER_MS = 0.00112;
/** 적 주위 공전 각속도(rad/ms) — 느린 선회 교전 */
const NAVAL_BRAWL_ORBIT_OMEGA = 0.00036;
/** 근접에서 목표 지점 추격(chase) 상한 — 링·접선 기동이 우선 */
const BRAWL_CHASE_WEIGHT_CAP = 0.26;
/** 경계 도달 시 정지하지 않도록 접선 회피 이동량 */
const EDGE_EVADE_STEP_PX = 22;
/** 코너 체류 방지: 중앙 복귀 이동량 */
const EDGE_CENTER_ESCAPE_STEP_PX = 30;
/** 경계 정체 판정(목표-현재 오차) */
const EDGE_STALL_EPS_PX = 1.2;
/** 작은 헤딩 오차에서 요레이트 명령을 줄여 요동 억제(rad) */
const HEADING_STEER_DEAD_RAD = 0.05;
const HEADING_STEER_SOFT_RAD = 0.16;
/** 이 거리(px) 안에서는 목표 선속도 0(브레이크)으로 과슈트·앞뒤 흔들림 완화 */
const ARRIVE_DEADZONE_PX = 3.5;
/** 이 거리까지는 최고 속도에 비례해 순항 속도를 낮춤(선형 램프) */
const ARRIVE_SLOW_RADIUS_PX = 74;
/**
 * 전함 이동(이 레이어 적분기 기준):
 * - 전진: 선수 방향(heading) 전방으로 가속·순항.
 * - 좌·우 선회: 제자리 회전 없음. |요각속도| ≤ |전후 선속도| / R_min.
 *   R_min·요·각가속은 `capitalHeavyTurnLaw`(이동속도 대비 육중 상한). 표 값이 더 느리면 표 우선.
 * - 후진: 전후 선속도가 정지에 가깝기 전에는 후진 가속 금지(브레이크 후 전환). 후진 최고속은 전진 max의 21%(기존 30% 대비 30% 감속).
 * - kite·standoff 거리벌림: 목표점 후진이 아니라 적 기준 멀어짐+좌/우 큰 곡선으로 후진(경계 보정).
 * - 횡방향(빔축) 속도는 감쇠해 측방 미끄럼을 줄임.
 */
/** 후진 최대 = 전진 max × 이 값 (기존 0.3에서 30% 낮춤 → 0.21) */
const CAPITAL_REVERSE_SURGE_FRAC = 0.21;
const CAPITAL_STOP_SURGE_FOR_REVERSE_PX_PER_MS = 0.0015;
/** kite·standoff 곡선 후진: 적에서 멀어지는 방향에 수직 성분 혼합(크게 좌/우 휨) */
const KITE_CURVED_REVERSE_LATERAL_MIX = 1.08;
/** 경계 근처 곡선 후진 시 맵 안쪽으로 살짝 당김(벽 정체 완화) */
const KITE_CURVED_REVERSE_BOUNDARY_NUDGE = 0.38;
/** 적분기 요조종: 목표 헤딩(주로 대적) 우선 — 항로 접선보다 선수 정렬 */
const KINEMATICS_BOW_HEADING_BLEND = 0.86;
/** 항법 최종 헤딩: 적 방향(선수 정렬) 1순위 */
const BOW_FACE_ENEMY_HEADING_WEIGHT = 0.94;
/** 목표 지점 방향 소혼합(선수 우선 유지) */
const BOW_GOAL_HEADING_MIX = 0.12;
const CAPITAL_LATERAL_VEL_DAMP_PER_MS = 0.28;
/** 적 중심 광궤도(`planet_orbit`) 반경: 페어 거리·맵 한계 반영 */
const ENEMY_ORBIT_R_MIN_EXTRA_PX = 52;
const ENEMY_ORBIT_R_PAIR_SCALE = 1.08;
/** 전방 부채꼴 120° → 반각 60°의 cos(선수–표적 내적 임계) */
const CAPITAL_ATTACK_ARC_COS_HALF = 0.5;

const DEFAULT_MISSILE_DMG_FALLBACK = 5;
const DEFAULT_LASER_DMG_FALLBACK = 4;
const COMBAT_CRIT_NATURAL_THRESHOLD = 20;
const COMBAT_CRIT_DAMAGE_BONUS_MUL = 2;
/** 피격 관성 넉백 계수(추후 밸런싱): 피해 1당 즉시 위치 밀림(px) */
const HIT_KNOCKBACK_PX_PER_DMG = 0.05;
const HIT_KNOCKBACK_MAX_PUSH_PX = 2.2;
/** 피격 관성 넉백 계수(추후 밸런싱): 피해 1당 속도 임펄스(px/ms) */
const HIT_KNOCKBACK_VEL_PER_DMG = 0.00003;
const HIT_KNOCKBACK_MAX_IMPULSE = 0.0014;
const PLAYER_STANCE_SHIELD_REGEN_INTERVAL_MS = 1000;
const PLAYER_STANCE_SHIELD_REGEN_PER_TICK = 1;
const CAPITAL_BASE_HULL_HP = 300;
const DESTROY_FX_DURATION_MS = 1100;
const DESTROY_FX_PARTICLES = 10;
/** 마름모 기본 nose = 위(-y); 헤딩(속도 방향)에 맞추기 위한 SVG 회전 보정(deg) */
const DIAMOND_HEADING_OFFSET_DEG = 90;
/** 중심에서 포구(전방)까지 px — `headingRad` 축상 nose 근처 */
const LASER_MUZZLE_FORWARD_PX = ALLY_MARK_HALF + 3;
/** 임시: 선수(`headingRad`) 확인용 짧은 표시선 길이(px) */
const DEBUG_CAPITAL_BOW_LINE_PX = 22;
type Pt = { x: number; y: number };

/** 1:1 전함 시뮬 에이전트 — `src/combat` 등 외부 스테이지에서 레이아웃·HP만 조정할 때 사용 */
export type Agent = {
  id: number;
  team: 'red' | 'blue' | 'orange';
  x: number;
  y: number;
  /** 표적(적함) 쪽을 향하는 라디안 */
  headingRad: number;
  /** 선속도 성분(px/ms) */
  vx: number;
  vy: number;
  /** 최대 선속도 크기(px/ms) */
  maxMoveSpeedPxPerMs: number;
  /** 선가속도 상한(px/ms²) — 목표 속도로 수렴 */
  accelPxPerMs2: number;
  /** 현재 요각속도(rad/ms) */
  headingRateRadPerMs: number;
  /** 최대 요각속도(rad/ms) */
  maxTurnRateRadPerMs: number;
  /** 각가속도 상한(rad/ms²) — 목표 각속으로 수렴 */
  turnAccelRadPerMs2: number;
  /** 선체 HP — 0 이하 시 격침. 수치·피해식은 추후 조정 */
  hullHp: number;
  maxHullHp: number;
  alive: boolean;
  stroke: string;
  /** 레이저 플래시 주기 */
  nextFireMs: number;
  /** 다음 미사일 살보(3발) 시작 가능 시각 */
  nextMissileSalvoAt: number;
  /** 다음 근접 로켓 살보 시작 가능 시각 */
  nextCloseRangeSalvoAt: number;
  /** 현재 살보 시작 시각, null 이면 대기 */
  activeSalvoBaseMs: number | null;
  /** 근접 로켓 살보 시작 시각 */
  activeCloseRangeSalvoBaseMs: number | null;
  /** 이번 살보에서 이미 쏜 발 수(0 이상, 살보 진행 중 `missileSalvoCount` 미만) */
  salvoSpawned: number;
  /** 근접 로켓 살보 발사 수 */
  closeRangeSalvoSpawned: number;
  /** 현재 살보의 다음 발사 예정 시각(ms). null 이면 살보 대기 */
  activeSalvoNextShotAtMs: number | null;
  activeCloseRangeNextShotAtMs: number | null;
  lastLaserStartMs: number;
  lastDestroyedAtMs: number;
  /** 객체별 행동 랜덤화(동기화 방지) */
  behaviorTimeOffsetMs: number;
  laserCooldownJitterMs: number;
  missileCooldownJitterMs: number;
  salvoStepMs: number;
  /** 전투 프로세스 시작 지연(ms) — 시작 시점을 분리 */
  engageStartDelayMs: number;
  /** 탐지 스케일 — 센서 탐색이 아님. FSM closing 이탈·미사일 발사 게이트에만 곱함 */
  detectRangeScale: number;
  /** 개체별 무기 정체 복구(전역 동기화 방지) */
  lastWeaponFireAtMs: number;
  /** 상태이상: 이동속도 감속 배율(1=정상, 0.5=50% 감속) */
  speedSlowMul: number;
  /** 상태이상: 감속 유지 종료 시각(ms) */
  speedSlowUntilMs: number;
  /** 특수무기 피격 함체 틴트 종료(ms). 0=없음 */
  statusTintUntilMs: number;
  /** 정책 interned hex. 빈 문자열=기본 stroke */
  statusTintHex: string;
  /** 정책 interned iconKind. 빈 문자열=배지 없음 */
  statusIconKind: string;
  /** 플레이어 태세 실드 재생 마지막 반영 시각(ms) */
  lastShieldRegenAtMs: number;
  stallChaseBoostUntilMs: number;
  /** 기세(가위바위보) 기반 템포 역할: 승자 press(근접), 패자 kite(거리 벌리기) */
  tempoRole: TempoRole;
  /** 기세 열세(-) 시 회피 방식: 거리벌림 or 행성주변 회전 */
  kiteEvasionMode: KiteEvasionMode;
  /** 거리벌림 중 저속 정체 시작 시각, null 이면 비정체 */
  kiteDistStallSinceMs: number | null;
  /** 0 초과이면 이 시각까지 적·전진 회복 항법(거리벌림 정체 보완) */
  kiteDistResumeAdvanceUntilMs: number;
  /** 함장 전투 전술 독트린(Table-First) — 스폰 시 1회 바인딩(카탈로그 불변 참조) */
  doctrine: CaptainTacticDoctrine;
  stalemateSinceMs: number | null;
  stalemateAnchorDist: number;
  stalemateBreakUntilMs: number;
  stalemateRearmUntilMs: number;
  stalemateBreakSeq: number;
  stalemateBreakKind: 0 | 1 | 2;
  stalemateWeaponLock: boolean;
  bearingGoal: BearingGoal;
  forcedEmployBand: EmployBand | null;
  longRangeEmploySinceMs: number | null;
  longRangeSalvoSpent: number;
  lastPairDist: number;
  employBand: EmployBand;
  preferredWeapon: PreferredWeapon;
  /** 현재 주력 교전 상대(적 팀 함선 id). 격침 시 `resolveCombatOpponent`가 다음 표적으로 갱신 */
  currentTargetAgentId: number | null;
  /** 편대 테이블에서 지정된 NPC 전함 id (없으면 null) */
  npcShipId: string | null;
  /** NPC 함장 id (없으면 null) */
  captainId: string | null;
  /** UI 표기 함선명(테이블 name 우선) */
  displayName: string;
  /** 마름모 상단 표기용 함장명 */
  captainLabel: string;
  laserWeaponId: string;
  missileWeaponId: string;
  /** WEAPON_3 — 근접 로켓탄 */
  closeRangeWeaponId: string;
  /** WEAPON_4 — 임시(연동만, 발사 미구현) */
  auxWeaponId: string;
  strStat: number;
  dexStat: number;
  strMod: number;
  dexMod: number;
  sizeClass: number;
  armorStat: number;
  attackBonusStat: number;
  expRewardStat: number;
  shieldHp: number;
  maxShieldHp: number;
  laserMinDamage: number;
  laserMaxDamage: number;
  missileMinDamage: number;
  missileMaxDamage: number;
  closeRangeMinDamage: number;
  closeRangeMaxDamage: number;
  laserRechargeMs: number;
  missileFireIntervalMs: number;
  missileSalvoCount: number;
  missileSalvoIntervalMs: number;
  closeRangeFireIntervalMs: number;
  closeRangeSalvoCount: number;
  closeRangeSalvoIntervalMs: number;
  laserEngageRangePx: number;
  missileMaxRangePx: number;
  closeRangeMaxRangePx: number;
  /** `weapon_list.csv` 사거리에서 파생한 항법·교전 구간 */
  rangeBands: CapitalCombatRangeBands;
  laserBoltTravelMs: number;
  missileFlightSpeedPxPerMs: number;
  closeRangeFlightSpeedPxPerMs: number;
  /** weapon_affinity_matrix.csv — 적 장갑 유형(light/shielded/heavy) */
  enemyAffinityKind: string;
  /** 장비 — 회피 AC 가산 */
  equipmentAcBonus: number;
  /** 장비 — 피해 % 감소(외장장갑 등) */
  equipmentIncomingDamageMul: number;
  /** 장비 — 전투 중 선체 회복(/tick) */
  equipmentHullRegenPerTick: number;
  /** 장비 — 적 미사일 명중 회피 확률(0~1) */
  equipmentMissileMissChance: number;
  /** 스킬 armor_pierce — 매치 시작 1회. NPC는 0 */
  skillArmorPierce: number;
  /** 스킬 damage_reduction 배율 — 매치 시작 1회. NPC는 1 */
  skillIncomingDamageMul: number;
  /** 자동전투 스킬 타이머·패시브. 매치 시작 1회 할당 */
  skillAuto: AgentSkillAuto;
};

type TeamAgentBuckets = { red: Agent[]; blue: Agent[]; orange: Agent[] };

/** HUD 스냅샷용 sparse id 버퍼 — `buildCombatHudLogSnapshot`에서만 사용(GC 없음). */
const HUD_SCRATCH_AGENT_ID_BUF: (Agent | undefined)[] = [];
const WARNED_MISSING_WEAPON_IDS = new Set<string>();

/** `p0`는 발사 시 고정. `p1`·`p2`는 살아 있는 표적을 매 프레임 추적(유도). */
export type Missile = {
  id: number;
  startMs: number;
  p0: Pt;
  p1: Pt;
  p2: Pt;
  travelMs: number;
  hitApplied: boolean;
  ownerAgentId: number;
  /** 유도 표적 함선 id */
  targetAgentId: number;
  /** 살보 0~2 — 제어점 편향 */
  spreadLane: number;
  /** 발사 당시 무기의 살보 발수(1=표준, 3=연사 등) */
  salvoCount: number;
  /** lane=0(단발/중앙탄)에서도 곡률을 강제하기 위한 방향 부호 */
  curveSign: 1 | -1;
  /** 미사일 무기 id(무기 효과 모듈 분기용) */
  missileWeaponId: string;
  /** true면 발사 시점 공간 좌표에 고정 탄착(유도 갱신 없음) */
  lockImpactPoint: boolean;
  /** 탄착분포상 미스 확정 — 표적을 그대로 통과(피해·폭발 FX 없음). 로켓 발칸 연사 전용 */
  missPassThrough: boolean;
  /** 스폰 시 1회 확정 — 렌더 틱마다 runtimeSpec 재해석·할당 방지 */
  isRocketProjectile: boolean;
  isNovaProjectile: boolean;
};

export type MissileHitFx = {
  id: number;
  x: number;
  y: number;
  startMs: number;
  color: string;
  missileWeaponId?: string;
  ownerTeam?: 'red' | 'blue' | 'orange';
  effectKind?: 'default' | 'nova_dodge' | 'laser_dodge' | 'rocket_spread' | 'drone_burst' | 'carrier_bomb';
};

/** from 에서 to 방향으로 최대 maxDist 까지 — 레이저 길이·미사일 낙점 클램프 */
function clampPointToward(from: Pt, to: Pt, maxDist: number): Pt {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d = Math.hypot(dx, dy);
  if (d <= maxDist + 1e-6) return { x: to.x, y: to.y };
  if (d < 1e-9) return { x: from.x, y: from.y };
  const s = maxDist / d;
  return { x: from.x + dx * s, y: from.y + dy * s };
}

/** 레이저 직진 방향 — 함선 `headingRad`(함수선 nose) */
function laserHeadingUnit(headingRad: number): Pt {
  return { x: Math.cos(headingRad), y: Math.sin(headingRad) };
}

function laserMuzzleFromAgent(ag: { x: number; y: number; headingRad: number }): Pt {
  const u = laserHeadingUnit(ag.headingRad);
  return {
    x: ag.x + u.x * LASER_MUZZLE_FORWARD_PX,
    y: ag.y + u.y * LASER_MUZZLE_FORWARD_PX,
  };
}

/**
 * 로켓탄 발사구 — 선수(레이저 전용) 좌우 측면에서 발수 인덱스로 교대 발사.
 * 오프셋은 weapon_rocket_burst_policy.csv(전함 공통 장착 위치).
 * 향후 함선별 사이드 무기(드론·함재기 사출 등) 장착위치 테이블로 확장 예정.
 */
function rocketSideMuzzleFromAgent(
  ag: { x: number; y: number; headingRad: number },
  shotIdx: number,
): Pt {
  const p = getRocketBurstPolicy();
  const u = laserHeadingUnit(ag.headingRad);
  const side = shotIdx % 2 === 0 ? 1 : -1;
  /** 좌현/우현 수직 벡터 n = (-u.y, u.x) */
  return {
    x: ag.x + u.x * p.muzzleForwardOffsetPx - u.y * side * p.muzzleLateralOffsetPx,
    y: ag.y + u.y * p.muzzleForwardOffsetPx + u.x * side * p.muzzleLateralOffsetPx,
  };
}

function destroyFxParticlePoint(agent: Agent, t01: number, idx: number): Pt {
  const base = (idx / DESTROY_FX_PARTICLES) * Math.PI * 2 + agent.id * 0.37;
  const drift = 16 + idx * 2.2;
  // 슬로우모션: 초반 느리게, 후반에 조금 더 퍼지는 이징
  const slowT = Math.pow(Math.min(1, Math.max(0, t01)), 1.65);
  return {
    x: agent.x + Math.cos(base) * drift * slowT,
    y: agent.y + Math.sin(base) * drift * slowT,
  };
}

function agentsByTeamSorted(agents: Agent[], team: 'red' | 'blue' | 'orange'): Agent[] {
  return agents.filter(a => a.team === team).sort((a, b) => a.id - b.id);
}

/** 시뮬 스텝당 1회 — `id` sparse lookup + 팀별 정렬 슬롯(와이드 스폰·키트 선회에 재사용). */
function rebuildAgentIdSparseBuf(agents: Agent[], out: (Agent | undefined)[]): number {
  let maxAgentId = -1;
  for (const a of agents) {
    if (a.id > maxAgentId) maxAgentId = a.id;
  }
  /** 이전 행성·스폰이 더 많은 에이전트를 가졌다면 테일 참조만 남아 GC 되지 않을 수 있음 — 길이를 maxId+1 에 맞춘다 */
  const nextLen = maxAgentId < 0 ? 0 : maxAgentId + 1;
  if (out.length > nextLen) {
    out.length = nextLen;
  }
  for (let i = 0; i < nextLen; i++) {
    if (i >= out.length) out.length = i + 1;
    out[i] = undefined;
  }
  for (const a of agents) {
    out[a.id] = a;
  }
  return maxAgentId;
}

function refillTeamBucketsWithSlots(
  agents: Agent[],
  buckets: TeamAgentBuckets,
  slotByAgentId: number[],
  maxAgentId: number,
): void {
  buckets.red.length = 0;
  buckets.blue.length = 0;
  buckets.orange.length = 0;
  for (const a of agents) {
    if (a.team === 'red') buckets.red.push(a);
    else if (a.team === 'blue') buckets.blue.push(a);
    else buckets.orange.push(a);
  }
  buckets.red.sort((a, b) => a.id - b.id);
  buckets.blue.sort((a, b) => a.id - b.id);
  buckets.orange.sort((a, b) => a.id - b.id);
  const slotLen = maxAgentId < 0 ? 0 : maxAgentId + 1;
  if (slotByAgentId.length !== slotLen) slotByAgentId.length = slotLen;
  for (let i = 0; i <= maxAgentId; i++) slotByAgentId[i] = -1;
  const stamp = (list: Agent[]) => {
    for (let i = 0; i < list.length; i++) {
      slotByAgentId[list[i]!.id] = i;
    }
  };
  stamp(buckets.red);
  stamp(buckets.blue);
  stamp(buckets.orange);
}

/** 전투 개시 시 팀별 라운드로빈으로 첫 표적을 붙인다. 탐지 원 진입이 아님(좌표는 공유). */
function assignInitialCombatTargets(agents: Agent[]): void {
  const oranges = agentsByTeamSorted(agents, 'orange');
  if (oranges.length >= 2) {
    for (let i = 0; i < oranges.length; i++) {
      const next = oranges[(i + 1) % oranges.length];
      oranges[i]!.currentTargetAgentId = next?.id ?? null;
    }
    return;
  }
  const reds = agentsByTeamSorted(agents, 'red');
  const blues = agentsByTeamSorted(agents, 'blue');
  if (reds.length === 0 || blues.length === 0) return;
  for (let i = 0; i < reds.length; i++) {
    reds[i]!.currentTargetAgentId = blues[i % blues.length]!.id;
  }
  for (let j = 0; j < blues.length; j++) {
    blues[j]!.currentTargetAgentId = reds[j % reds.length]!.id;
  }
}

function currentTargetAliveByBuf(self: Agent, idBuf: (Agent | undefined)[]): Agent | null {
  const tid = self.currentTargetAgentId;
  if (tid === null) return null;
  const t = idBuf[tid];
  if (!t?.alive) return null;
  if (isAgentStealthed(t, COMBAT_SKILL_NOW_MS) && t.team !== self.team) return null;
  if (self.team !== 'orange' && t.team === self.team) return null;
  if (self.team === 'orange' && t.id === self.id) return null;
  return t;
}

/** 소함대면 전수 스캔과 동일 — 표적 품질 보장 */
const CAPITAL_TARGET_FULL_SCAN_AGENT_THRESHOLD = 11;
/** 라운드로빈 창 길이(프레임당 적 후보 상한) */
const CAPITAL_TARGET_RING_WINDOW = 14;
/** 몇 시뮬 틱마다 한 번 전수 재스캔(표적 품질 복구) */
const CAPITAL_TARGET_FULL_SCAN_INTERVAL = 5;

/**
 * 독트린 표적 우선순위 점수(낮을수록 우선) — 신규 표적 선택 시에만 호출(저빈도).
 * nearest: 거리(현행) · lowest_hull: 선체 우선(거리 타이브레이크) · focus_fire: 팀 리드 표적 최우선.
 */
function doctrineTargetScore(
  self: Agent,
  cand: Agent,
  dist: number,
  focusTargetId: number | null,
): number {
  const pr = self.doctrine.targetPriority;
  if (pr === 'lowest_hull') return cand.hullHp * 1e6 + dist;
  if (pr === 'focus_fire') {
    return (focusTargetId !== null && cand.id === focusTargetId ? 0 : 1e9) + dist;
  }
  return dist;
}

/** focus_fire: 팀 리드(최소 id 생존)의 현재 표적 id — 리드 자신·비배정 시 null(→ nearest 폴백) */
function resolveFocusFireTargetId(self: Agent, agents: Agent[]): number | null {
  if (self.doctrine.targetPriority !== 'focus_fire') return null;
  const lead = firstAliveLeadByTeam(agents, self.team);
  if (!lead || lead.id === self.id) return null;
  return typeof lead.currentTargetAgentId === 'number' ? lead.currentTargetAgentId : null;
}

function pickNextAliveEnemyTargetFull(self: Agent, agents: Agent[]): void {
  const focusTargetId = resolveFocusFireTargetId(self, agents);
  let best: Agent | null = null;
  let bestScore = Infinity;
  const selfTeam = self.team;
  const selfId = self.id;
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i]!;
    if (!a.alive) continue;
    if (isAgentStealthed(a, COMBAT_SKILL_NOW_MS) && a.team !== selfTeam) continue;
    if (selfTeam === 'orange') {
      if (a.id === selfId) continue;
    } else if (a.team === selfTeam) {
      continue;
    }
    const d = Math.hypot(a.x - self.x, a.y - self.y);
    const score = doctrineTargetScore(self, a, d, focusTargetId);
    if (score < bestScore) {
      bestScore = score;
      best = a;
    }
  }
  self.currentTargetAgentId = best?.id ?? null;
}

function pickNextAliveEnemyTarget(self: Agent, agents: Agent[], ringTick: number): void {
  const n = agents.length;
  if (n <= CAPITAL_TARGET_FULL_SCAN_AGENT_THRESHOLD || ringTick % CAPITAL_TARGET_FULL_SCAN_INTERVAL === 0) {
    pickNextAliveEnemyTargetFull(self, agents);
    return;
  }
  const focusTargetId = resolveFocusFireTargetId(self, agents);
  let best: Agent | null = null;
  let bestScore = Infinity;
  const selfTeam = self.team;
  const selfId = self.id;
  const start = (self.id * 31 + ringTick * 17) % Math.max(1, n);
  const win = Math.min(n, CAPITAL_TARGET_RING_WINDOW);
  for (let k = 0; k < win; k++) {
    const a = agents[(start + k) % n]!;
    if (!a.alive) continue;
    if (isAgentStealthed(a, COMBAT_SKILL_NOW_MS) && a.team !== selfTeam) continue;
    if (selfTeam === 'orange') {
      if (a.id === selfId) continue;
    } else if (a.team === selfTeam) {
      continue;
    }
    const d = Math.hypot(a.x - self.x, a.y - self.y);
    const score = doctrineTargetScore(self, a, d, focusTargetId);
    if (score < bestScore) {
      bestScore = score;
      best = a;
    }
  }
  if (best === null) {
    pickNextAliveEnemyTargetFull(self, agents);
    return;
  }
  self.currentTargetAgentId = best.id;
}

/** 현재 표적이 유효하면 그 함선, 아니면 가장 가까운 생존 적으로 재지정 — `idBuf`는 동일 스텝의 `rebuildAgentIdSparseBuf` 결과여야 한다. */
function resolveCombatOpponent(
  self: Agent,
  agents: Agent[],
  idBuf: (Agent | undefined)[],
  ringTick: number,
): Agent | null {
  let t = currentTargetAliveByBuf(self, idBuf);
  if (t) return t;
  pickNextAliveEnemyTarget(self, agents, ringTick);
  return currentTargetAliveByBuf(self, idBuf);
}

function firstAliveLeadByTeam(agents: Agent[], team: 'red' | 'blue' | 'orange'): Agent | null {
  let best: Agent | null = null;
  for (const a of agents) {
    if (!a.alive || a.team !== team) continue;
    if (!best || a.id < best.id) best = a;
  }
  return best;
}

/** 와이드 스폰 블렌드용 팀 슬롯 기준 포즈 — `refillTeamBucketsWithSlots` 결과 사용 */
function fleetWideBlendAnchorPose(
  duelWide: ReturnType<typeof initialSpawnDuelWidePositions>,
  ag: Agent,
  buckets: TeamAgentBuckets,
  slotByAgentId: number[],
  margin: number,
  orbitSize: number,
): { x: number; y: number; headingRad: number } {
  const dx = duelWide.x1 - duelWide.x0;
  const dy = duelWide.y1 - duelWide.y0;
  const len = Math.hypot(dx, dy) || 1e-6;
  const px = -dy / len;
  const py = dx / len;
  const same =
    ag.team === 'red' ? buckets.red : ag.team === 'blue' ? buckets.blue : buckets.orange;
  const teamCount = Math.max(1, same.length);
  const rawSlot = slotByAgentId[ag.id];
  const slotIdx = rawSlot !== undefined && rawSlot >= 0 ? rawSlot : 0;
  const off = (slotIdx - (teamCount - 1) / 2) * FLEET_SLOT_SPACING_PX;
  if (ag.team === 'red') {
    const c = clampToOrbit(
      { x: duelWide.x0 + px * off, y: duelWide.y0 + py * off },
      margin,
      orbitSize,
    );
    return { x: c.x, y: c.y, headingRad: duelWide.h0 };
  }
  const c = clampToOrbit(
    { x: duelWide.x1 + px * off, y: duelWide.y1 + py * off },
    margin,
    orbitSize,
  );
  return { x: c.x, y: c.y, headingRad: duelWide.h1 };
}

/**
 * 기세 `planet_orbit`: 행성 중심이 아니라 **적 함선 중심**·가능한 한 큰 반경 광궤도.
 * `pairDist`에 비례해 반경을 키우고 맵·미사일 사거리 안에서 클램프.
 */
function enemyWideOrbitEvasionPose(
  agentId: number,
  elapsedMs: number,
  enemy: Pt,
  pairDist: number,
  margin: number,
  orbitSize: number,
  bands: CapitalCombatRangeBands,
): AgentPose {
  const halfSpan = Math.max(40, orbitSize * 0.5 - margin - 10);
  const rCap = Math.min(halfSpan * 0.92, bands.missileMaxRangePx + CAPITAL_MISSILE_RANGE_LOOSEN_PX + 4);
  const rMin = Math.max(bands.laserBrawlOuterPx + ENEMY_ORBIT_R_MIN_EXTRA_PX, bands.missileIdealPairDistPx + 28);
  const rFromPair = pairDist * ENEMY_ORBIT_R_PAIR_SCALE + 64;
  const r = Math.max(rMin, Math.min(rCap, Math.max(rFromPair, bands.missileIdealPairDistPx + 48)));
  const omega = 0.00055 * (agentId % 2 === 0 ? 1 : -1);
  const ang = elapsedMs * omega + agentId * 1.31;
  const raw = {
    x: enemy.x + r * Math.cos(ang),
    y: enemy.y + r * Math.sin(ang) * CAPITAL_ENEMY_ORBIT_ELLIPSE_Y_MUL,
  };
  const c = clampToOrbit(raw, margin, orbitSize);
  const tang = ang + (omega >= 0 ? Math.PI / 2 : -Math.PI / 2);
  return { x: c.x, y: c.y, headingRad: tang };
}

function missileHitFxParticlePoint(fx: MissileHitFx, t01: number, idx: number): Pt {
  const base = (idx / MISSILE_HIT_FX_PARTICLES) * Math.PI * 2 + idx * 0.31;
  const spread = 7 + idx * 0.85;
  /** 슬로우: 초반 확산을 느리게, 후반에 거리 증가 */
  const u = Math.min(1, Math.max(0, t01));
  const slowT = Math.pow(u, 0.38);
  return {
    x: fx.x + Math.cos(base) * spread * slowT,
    y: fx.y + Math.sin(base) * spread * slowT,
  };
}

function compactMissilesInPlace(arr: Missile[], elapsed: number): void {
  let w = 0;
  for (let r = 0; r < arr.length; r++) {
    const m = arr[r];
    if (!m) continue;
    if (elapsed - m.startMs >= m.travelMs + MISSILE_TRAIL_FADE_MS) continue;
    arr[w++] = m;
  }
  arr.length = w;
}

/** 닷지 시각보다 긴 920ms 잔류를 막기 — 로켓/레이저는 짧은 수명으로 조기 compact (PSS) */
function hitFxRetainMs(fx: MissileHitFx): number {
  if (fx.effectKind === 'rocket_spread') return 140;
  if (fx.effectKind === 'laser_dodge') return 140;
  return MISSILE_HIT_FX_DURATION_MS;
}

function compactHitFxInPlace(arr: MissileHitFx[], elapsed: number): void {
  let w = 0;
  for (let r = 0; r < arr.length; r++) {
    const fx = arr[r];
    if (!fx) continue;
    if (elapsed - fx.startMs >= hitFxRetainMs(fx)) continue;
    arr[w++] = fx;
  }
  arr.length = w;
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

type CombatWeaponType = 'laser' | 'missile' | 'closeRange';

function getAbilityModifier(stat: number): number {
  return Math.floor(stat / 2) - 5;
}

/** 0=miss, 1=hit, 2=crit */
function resolveAgentAttackOutcome(attacker: Agent, defender: Agent, weaponType: CombatWeaponType = 'laser'): 0 | 1 | 2 {
  const natural = 1 + Math.floor(Math.random() * 20);
  if (natural === 1) return 0;
  if (
    weaponType === 'missile'
    && defender.equipmentMissileMissChance > 0
    && Math.random() < defender.equipmentMissileMissChance
  ) {
    return 0;
  }
  const attackerStance = isPlayerCombatAgent(attacker)
    ? useBattleStanceStore.getState().activeStance
    : 'NEUTRAL';
  const defenderStance = isPlayerCombatAgent(defender)
    ? useBattleStanceStore.getState().activeStance
    : 'NEUTRAL';
  const attackBonusDelta = attackerStance === 'AGGRESSIVE' ? 2 : attackerStance === 'DEFENSIVE' ? -1 : 0;
  const acBonusDelta = defenderStance === 'AGGRESSIVE' ? -2 : defenderStance === 'DEFENSIVE' ? 3 : 0;
  const critDelta = attackerStance === 'AGGRESSIVE' ? -1 : attackerStance === 'DEFENSIVE' ? 1 : 0;
  const skillCrit = attacker.skillAuto?.critRange || COMBAT_CRIT_NATURAL_THRESHOLD;
  const critThreshold = Math.min(20, Math.max(2, Math.min(skillCrit, COMBAT_CRIT_NATURAL_THRESHOLD) + critDelta));
  const attackTotal = natural + attacker.attackBonusStat + attacker.sizeClass + attacker.strMod + attackBonusDelta;
  const defenseAc = 10 + defender.sizeClass + defender.dexMod + defender.armorStat + acBonusDelta
    + Math.max(0, defender.equipmentAcBonus);
  if (natural >= critThreshold) return 2;
  return attackTotal >= defenseAc ? 1 : 0;
}

function rollAgentWeaponDamage(
  attacker: Agent,
  defender: Agent,
  weaponType: CombatWeaponType,
  outcome: 0 | 1 | 2,
): number {
  const min =
    weaponType === 'laser'
      ? attacker.laserMinDamage
      : weaponType === 'closeRange'
        ? attacker.closeRangeMinDamage
        : attacker.missileMinDamage;
  const max =
    weaponType === 'laser'
      ? attacker.laserMaxDamage
      : weaponType === 'closeRange'
        ? attacker.closeRangeMaxDamage
        : attacker.missileMaxDamage;
  const hi = Math.max(min, max);
  const raw = min + Math.floor(Math.random() * (hi - min + 1));
  const withStr = Math.max(1, raw + attacker.strMod);
  const stance = isPlayerCombatAgent(attacker)
    ? useBattleStanceStore.getState().activeStance
    : 'NEUTRAL';
  const dmgMult = stance === 'AGGRESSIVE' ? 1.25 : stance === 'DEFENSIVE' ? 0.85 : 1;
  let stanceDamage = Math.max(1, Math.round(withStr * dmgMult));
  const weaponId =
    weaponType === 'laser'
      ? attacker.laserWeaponId
      : weaponType === 'closeRange'
        ? attacker.closeRangeWeaponId
        : attacker.missileWeaponId;
  if (weaponId.trim()) {
    const affinitySlot = weaponType === 'closeRange' ? 'missile' : weaponType;
    stanceDamage = Math.max(
      1,
      Math.round(
        stanceDamage
          * resolveWeaponAffinityDamageMultiplier(weaponId, affinitySlot, defender.enemyAffinityKind),
      ),
    );
  }
  if (outcome !== 2) return stanceDamage;
  const critBase = Math.max(1, stanceDamage + Math.max(1, attacker.strMod * COMBAT_CRIT_DAMAGE_BONUS_MUL));
  const critMult = stance === 'AGGRESSIVE' ? 1.5 : 1;
  return Math.max(1, Math.round(critBase * critMult));
}

function applyAgentIncomingDamage(
  defender: Agent,
  rawDamage: number,
  attackerAttackBonus: number,
  ignoreShield = false,
  ignoreArmor = false,
  attackerArmorPierce = 0,
  attackerShieldPenPct = 0,
  attackerSneakMul = 1,
  consumeSneak?: AgentSkillAuto,
): number {
  if (rawDamage <= 0) return 0;
  if (isAgentSkillInvulnerable(defender, COMBAT_SKILL_NOW_MS)) return 0;
  const defenderStance = isPlayerCombatAgent(defender)
    ? useBattleStanceStore.getState().activeStance
    : 'NEUTRAL';
  const damageReduction = defenderStance === 'DEFENSIVE' ? 0.85 : 1;
  const equipmentMul = Math.max(0.65, Math.min(1, defender.equipmentIncomingDamageMul || 1));
  const skillMul = Math.max(0.6, Math.min(1, defender.skillIncomingDamageMul || 1));
  let fortressMul = 1;
  if (defender.skillAuto && defender.skillAuto.fortressUntilMs > COMBAT_SKILL_NOW_MS && defender.skillAuto.fortressDefensePct > 0) {
    fortressMul = 1 / (1 + defender.skillAuto.fortressDefensePct / 100);
  }
  const sneak = consumeSneak && consumeSneak.sneakReady && attackerSneakMul > 1 ? attackerSneakMul : 1;
  if (consumeSneak && sneak > 1) consumeSneak.sneakReady = false;
  const reducedDamage = Math.max(1, Math.round(rawDamage * damageReduction * equipmentMul * skillMul * fortressMul * sneak));
  let remaining = reducedDamage;
  let hullDirect = 0;
  if (!ignoreShield && attackerShieldPenPct > 0) {
    hullDirect = Math.floor(remaining * Math.min(80, attackerShieldPenPct) / 100);
    remaining -= hullDirect;
  }
  if (!ignoreShield && defender.shieldHp > 0) {
    const absorbed = Math.min(defender.shieldHp, remaining);
    defender.shieldHp -= absorbed;
    remaining -= absorbed;
  }
  remaining += hullDirect;
  if (remaining <= 0) return 0;
  const effectiveArmor = applySkillArmorPierceToArmorStat(defender.armorStat, attackerArmorPierce);
  const armorMitigation = ignoreArmor
    ? 0
    : Math.max(
        0,
        Math.floor(effectiveArmor * 0.4) - Math.floor(attackerAttackBonus * 0.15),
      );
  const hullDamage = Math.max(1, remaining - armorMitigation);
  defender.hullHp = Math.max(0, defender.hullHp - hullDamage);
  return hullDamage;
}

function applyHitKnockback(
  victim: Agent,
  attackerPos: Pt,
  damage: number,
  margin: number,
  orbitSize: number,
): void {
  if (damage <= 0) return;
  let dx = victim.x - attackerPos.x;
  let dy = victim.y - attackerPos.y;
  let d = Math.hypot(dx, dy);
  if (d < 1e-9) {
    dx = Math.cos(victim.headingRad);
    dy = Math.sin(victim.headingRad);
    d = Math.hypot(dx, dy) || 1;
  }
  const ux = dx / d;
  const uy = dy / d;
  const pushPx = Math.min(HIT_KNOCKBACK_MAX_PUSH_PX, damage * HIT_KNOCKBACK_PX_PER_DMG);
  const impulse = Math.min(HIT_KNOCKBACK_MAX_IMPULSE, damage * HIT_KNOCKBACK_VEL_PER_DMG);
  victim.x += ux * pushPx;
  victim.y += uy * pushPx;
  victim.vx += ux * impulse;
  victim.vy += uy * impulse;
  const cl = clampToOrbit({ x: victim.x, y: victim.y }, margin, orbitSize);
  victim.x = cl.x;
  victim.y = cl.y;
}

function clampToOrbit(p: Pt, margin: number, orbitSize: number): Pt {
  return {
    x: Math.min(orbitSize - margin, Math.max(margin, p.x)),
    y: Math.min(orbitSize - margin, Math.max(margin, p.y)),
  };
}

function clampOrbitCoord(v: number, margin: number, orbitSize: number): number {
  return Math.min(orbitSize - margin, Math.max(margin, v));
}

const interceptBezierScratch: Pt = { x: 0, y: 0 };
const skillClampScratch: Pt = { x: 0, y: 0 };

function writeQuadBezierInto(out: Pt, p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
  const u = 1 - t;
  out.x = u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x;
  out.y = u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y;
  return out;
}

function writePrevAgentPts(prevPts: Pt[], agents: Agent[], prevPtsLen: number): void {
  if (prevPts.length !== prevPtsLen) prevPts.length = prevPtsLen;
  for (let i = 0; i < agents.length; i += 1) {
    const a = agents[i]!;
    const slot = prevPts[a.id];
    if (slot) {
      slot.x = a.x;
      slot.y = a.y;
    } else {
      prevPts[a.id] = { x: a.x, y: a.y };
    }
  }
}

const aliveBattleScratch = {
  aliveRed: false,
  aliveBlue: false,
  aliveOrange: false,
  aliveCount: 0,
};

function recountAliveBattle(agents: Agent[]): typeof aliveBattleScratch {
  let aliveRed = false;
  let aliveBlue = false;
  let aliveOrange = false;
  let aliveCount = 0;
  for (let i = 0; i < agents.length; i += 1) {
    const a = agents[i]!;
    if (!a.alive) continue;
    aliveCount += 1;
    if (a.team === 'red') aliveRed = true;
    else if (a.team === 'blue') aliveBlue = true;
    else if (a.team === 'orange') aliveOrange = true;
  }
  aliveBattleScratch.aliveRed = aliveRed;
  aliveBattleScratch.aliveBlue = aliveBlue;
  aliveBattleScratch.aliveOrange = aliveOrange;
  aliveBattleScratch.aliveCount = aliveCount;
  return aliveBattleScratch;
}

function anyCapitalCraftAlive(crafts: CapitalCraft[]): boolean {
  for (let i = 0; i < crafts.length; i += 1) {
    if (crafts[i]!.alive) return true;
  }
  return false;
}

function isNearOrbitBoundary(p: Pt, margin: number, orbitSize: number, pad = 1.5): boolean {
  return (
    p.x <= margin + pad ||
    p.x >= orbitSize - margin - pad ||
    p.y <= margin + pad ||
    p.y >= orbitSize - margin - pad
  );
}

function isNearOrbitCorner(p: Pt, margin: number, orbitSize: number, pad = 2.5): boolean {
  const left = p.x <= margin + pad;
  const right = p.x >= orbitSize - margin - pad;
  const top = p.y <= margin + pad;
  const bottom = p.y >= orbitSize - margin - pad;
  return (left || right) && (top || bottom);
}

function smoothstep01(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** 수송선 궤도 진입처럼 양끝에서 더 부드럽게 붙는 이징(이중 smoothstep). */
function capitalOrbitIngressEase01(t: number): number {
  return smoothstep01(smoothstep01(Math.min(1, Math.max(0, t))));
}

/** 최단 호 쪽으로 각도 보간(계수 k는 0~1) */
function lerpAngleRad(from: number, to: number, k: number): number {
  let d = to - from;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return from + d * k;
}

function shortestSignedAngleRad(from: number, to: number): number {
  let d = to - from;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/** 표적이 전함 선수 방향 기준 120° 부채꼴 안에 있을 때만 true */
function targetInCapitalFrontAttackArc(
  attacker: { x: number; y: number; headingRad: number },
  target: Pt,
): boolean {
  const dx = target.x - attacker.x;
  const dy = target.y - attacker.y;
  const d = Math.hypot(dx, dy);
  if (d < 1e-9) return false;
  const ux = dx / d;
  const uy = dy / d;
  const fx = Math.cos(attacker.headingRad);
  const fy = Math.sin(attacker.headingRad);
  return ux * fx + uy * fy >= CAPITAL_ATTACK_ARC_COS_HALF - 1e-7;
}

/** kite·standoff: 목표점 없이 적 기준 멀어짐 + 좌/우 큰 곡선으로 후진할 선수 방향 */
function curvedReverseBowHeadingRad(
  ag: Agent,
  enemyX: number,
  enemyY: number,
  turnSign: number,
  margin: number,
  orbitSize: number,
): number {
  let rdx = ag.x - enemyX;
  let rdy = ag.y - enemyY;
  let rd = Math.hypot(rdx, rdy);
  if (rd < 1e-6) {
    rdx = Math.cos(ag.headingRad);
    rdy = Math.sin(ag.headingRad);
    rd = 1;
  }
  const ux = rdx / rd;
  const uy = rdy / rd;
  const px = -uy;
  const py = ux;
  let fx = ux + turnSign * px * KITE_CURVED_REVERSE_LATERAL_MIX;
  let fy = uy + turnSign * py * KITE_CURVED_REVERSE_LATERAL_MIX;
  let fm = Math.hypot(fx, fy);
  if (fm > 1e-9) {
    fx /= fm;
    fy /= fm;
  }
  if (isNearOrbitBoundary({ x: ag.x, y: ag.y }, margin, orbitSize)) {
    const cx = orbitSize * 0.5;
    const cy = orbitSize * 0.5;
    const tx = cx - ag.x;
    const ty = cy - ag.y;
    const tm = Math.hypot(tx, ty) || 1;
    fx += (tx / tm) * KITE_CURVED_REVERSE_BOUNDARY_NUDGE;
    fy += (ty / tm) * KITE_CURVED_REVERSE_BOUNDARY_NUDGE;
    fm = Math.hypot(fx, fy);
    if (fm > 1e-9) {
      fx /= fm;
      fy /= fm;
    }
  }
  return Math.atan2(-fy, -fx);
}

type KiteStandoffReverseCurve = {
  enemyX: number;
  enemyY: number;
  turnSign: -1 | 1;
};

/** 적분 틱 재사용 — 육중 선회 상한 산출용(프레임당 Make 금지) */
const heavyTurnLawBuf = createCapitalHeavyTurnLaw();

/** 목표 지점·헤딩을 향해 전·후진(surge) + 선회각(속도 연동)으로 적분 — 제자리 회전·즉시 후진 없음 */
function integrateAgentKinematics(
  ag: Agent,
  targetX: number,
  targetY: number,
  targetHeadingRad: number,
  dt: number,
  elapsedMs: number,
  margin: number,
  orbitSize: number,
  /** 거리벌림(kite·standoff): 전진 금지 — 곡선 후진 모드 시 목표점·항로 거리 무관 */
  openingReverseOnly = false,
  kiteReverseCurve: KiteStandoffReverseCurve | null = null,
  moveSpeedMult = 1,
): void {
  const slowActive = elapsedMs < ag.speedSlowUntilMs;
  const speedMul = slowActive ? ag.speedSlowMul : 1;
  const maxMoveSpeed = ag.maxMoveSpeedPxPerMs * speedMul * Math.max(0.4, moveSpeedMult);
  const fh0x = Math.cos(ag.headingRad);
  const fh0y = Math.sin(ag.headingRad);
  const vFwd0 = ag.vx * fh0x + ag.vy * fh0y;

  const useCurvedStandoffReverse = openingReverseOnly && kiteReverseCurve !== null;

  const dxGoal = targetX - ag.x;
  const dyGoal = targetY - ag.y;
  const distGoal = Math.hypot(dxGoal, dyGoal);
  const navGoalRad = distGoal > 1e-8 ? Math.atan2(dyGoal, dxGoal) : ag.headingRad;

  let distSurge = distGoal;
  let navSurgeRad = navGoalRad;
  const blendH = useCurvedStandoffReverse
    ? curvedReverseBowHeadingRad(
        ag,
        kiteReverseCurve.enemyX,
        kiteReverseCurve.enemyY,
        kiteReverseCurve.turnSign,
        margin,
        orbitSize,
      )
    : lerpAngleRad(navGoalRad, targetHeadingRad, KINEMATICS_BOW_HEADING_BLEND);

  const errNav = shortestSignedAngleRad(ag.headingRad, navSurgeRad);
  const cosh = Math.cos(errNav);
  const dH = shortestSignedAngleRad(ag.headingRad, blendH);
  const adH = Math.abs(dH);
  let steerScale = 1;
  if (adH < HEADING_STEER_DEAD_RAD) steerScale = 0;
  else if (adH < HEADING_STEER_SOFT_RAD) {
    steerScale =
      (adH - HEADING_STEER_DEAD_RAD) / Math.max(1e-6, HEADING_STEER_SOFT_RAD - HEADING_STEER_DEAD_RAD);
  }
  const steerErr = dH * steerScale;

  let cruiseFwd = maxMoveSpeed;
  if (!useCurvedStandoffReverse) {
    if (distSurge <= ARRIVE_DEADZONE_PX) {
      cruiseFwd = 0;
    } else if (distSurge < ARRIVE_SLOW_RADIUS_PX) {
      const span = ARRIVE_SLOW_RADIUS_PX - ARRIVE_DEADZONE_PX;
      cruiseFwd *= Math.max(0, (distSurge - ARRIVE_DEADZONE_PX) / span);
    }
  }
  const reverseMax = maxMoveSpeed * CAPITAL_REVERSE_SURGE_FRAC;

  let surgeDes = 0;
  if (useCurvedStandoffReverse) {
    surgeDes =
      vFwd0 > CAPITAL_STOP_SURGE_FOR_REVERSE_PX_PER_MS ? 0 : -reverseMax;
  } else if (distSurge <= ARRIVE_DEADZONE_PX) {
    surgeDes = 0;
  } else if (cosh >= 0.14) {
    surgeDes = cruiseFwd * Math.max(0.36, cosh);
  } else if (cosh <= -0.1) {
    surgeDes =
      vFwd0 > CAPITAL_STOP_SURGE_FOR_REVERSE_PX_PER_MS ? 0 : -reverseMax;
  } else {
    const t = smoothstep01((cosh + 0.1) / 0.24);
    surgeDes = cruiseFwd * (0.3 + 0.22 * t);
  }
  if (openingReverseOnly && !useCurvedStandoffReverse) {
    surgeDes = Math.min(0, surgeDes);
  }
  if (surgeDes > 0) {
    surgeDes = Math.min(surgeDes, maxMoveSpeed);
  } else if (surgeDes < 0) {
    surgeDes = Math.max(surgeDes, -reverseMax);
  }

  writeCapitalHeavyTurnLaw(
    maxMoveSpeed,
    ag.maxTurnRateRadPerMs,
    ag.turnAccelRadPerMs2,
    ag.sizeClass,
    heavyTurnLawBuf,
  );
  const maxYaw = heavyTurnLawBuf.maxTurnRateRadPerMs;
  const turnAccel = heavyTurnLawBuf.turnAccelRadPerMs2;
  const Rmin = heavyTurnLawBuf.minTurnRadiusPx;
  const turnCap = Math.abs(vFwd0) / Rmin;
  const headingGain = headingAlignGainForMaxYaw(maxYaw);
  let omegaDes = Math.max(-maxYaw, Math.min(maxYaw, steerErr * headingGain));
  omegaDes = Math.max(-turnCap, Math.min(turnCap, omegaDes));

  let dw = omegaDes - ag.headingRateRadPerMs;
  const maxDw = turnAccel * dt;
  if (Math.abs(dw) > maxDw) dw = dw > 0 ? maxDw : -maxDw;
  ag.headingRateRadPerMs += dw;
  ag.headingRateRadPerMs = Math.max(-maxYaw, Math.min(maxYaw, ag.headingRateRadPerMs));

  ag.headingRad += ag.headingRateRadPerMs * dt;
  while (ag.headingRad > Math.PI) ag.headingRad -= 2 * Math.PI;
  while (ag.headingRad < -Math.PI) ag.headingRad += 2 * Math.PI;

  const fhx = Math.cos(ag.headingRad);
  const fhy = Math.sin(ag.headingRad);
  let vFwd = ag.vx * fhx + ag.vy * fhy;
  let vLat = -ag.vx * fhy + ag.vy * fhx;
  vLat *= Math.exp(-CAPITAL_LATERAL_VEL_DAMP_PER_MS * dt);

  let ds = surgeDes - vFwd;
  const maxDs = ag.accelPxPerMs2 * dt;
  const ads = Math.abs(ds);
  if (ads > maxDs && ads > 1e-14) ds *= maxDs / ads;
  vFwd += ds;
  if (vFwd > maxMoveSpeed) vFwd = maxMoveSpeed;
  if (vFwd < -reverseMax) vFwd = -reverseMax;

  ag.vx = fhx * vFwd - fhy * vLat;
  ag.vy = fhy * vFwd + fhx * vLat;

  const vFwdFin = ag.vx * fhx + ag.vy * fhy;
  const turnCapFin = Math.abs(vFwdFin) / Rmin;
  ag.headingRateRadPerMs = Math.max(
    -turnCapFin,
    Math.min(turnCapFin, ag.headingRateRadPerMs),
  );

  ag.x += ag.vx * dt;
  ag.y += ag.vy * dt;

  const bx = ag.x;
  const by = ag.y;
  const clx = clampOrbitCoord(ag.x, margin, orbitSize);
  const cly = clampOrbitCoord(ag.y, margin, orbitSize);
  if (Math.abs(clx - bx) > 1e-5) ag.vx = 0;
  if (Math.abs(cly - by) > 1e-5) ag.vy = 0;
  ag.x = clx;
  ag.y = cly;
}

type AgentPose = { x: number; y: number; headingRad: number };

function blendAgentPose(
  wx: number,
  wy: number,
  wh: number,
  p: AgentPose,
  rawT: number,
  sceneCy: number,
  orbitEllipseYMul: number,
): AgentPose {
  const u = capitalOrbitIngressEase01(rawT);
  const wyE = sceneCy + (wy - sceneCy) * orbitEllipseYMul;
  const pyE = sceneCy + (p.y - sceneCy) * orbitEllipseYMul;
  return {
    x: wx + (p.x - wx) * u,
    y: wyE + (pyE - wyE) * u,
    headingRad: lerpAngleRad(wh, p.headingRad, u),
  };
}

/** 프레임 시작 좌표 기준: 목표점 = 상대 중심, 헤딩 = 상대 방향(추격) */
function chaseTargetPose(self: Pt, other: Pt): AgentPose {
  const dx = other.x - self.x;
  const dy = other.y - self.y;
  const headingRad = Math.hypot(dx, dy) < 1e-10 ? 0 : Math.atan2(dy, dx);
  return { x: other.x, y: other.y, headingRad };
}

/** 탐지 거리 베이스(px) — 맵 최대 이격. 표적 획득이 아니라 교전 단계·미사일 게이트용 */
function combatDetectionRangePx(orbitSize: number, margin: number): number {
  return maxHorizontalPairSeparationPx(orbitSize, margin);
}

/** 판단 계층(순수 모듈) 재사용 버퍼 — 결과는 같은 반복(iteration) 내에서만 소비(zero-allocation) */
const maneuverDecisionBuf = createCapitalManeuverDecision();
const maneuverInputBuf: CapitalManeuverInput = {
  elapsedMs: 0,
  pairDist: 0,
  detectRangePx: 0,
  bands: deriveCapitalCombatRangeBands(0, 0),
  speedPxPerMs: 0,
  teamSlot: 0,
  weaponProfileReady: true,
  hasMissile: false,
  hasLaser: false,
  hasClose: false,
  selfHeadingRad: 0,
  enemyHeadingRad: 0,
  bearingToEnemyRad: 0,
  maneuverSeed: 0,
};
/** 진형 앵커 재사용 버퍼(zero-allocation) — 같은 반복 내에서만 소비 */
const formationAnchorBuf = createFormationAnchorPose();

/** 미사일 사거리 링 유지(거리띄우기) — 단계·현재 거리에 따른 블렌드 가중 */
function standoffWeightForDistAndStage(
  dist: number,
  stage: CombatMotionStage,
  bands: CapitalCombatRangeBands,
): number {
  if (stage === 'closing') return 0;
  if (stage === 'missile_reposition') return 0.74;
  /** 근접: 교전 거리 유지·횡이동 보조(해상전 링과 합성) */
  if (stage === 'brawl') return dist <= bands.laserBrawlOuterPx - 2 ? 0.46 : 0.38;
  // missile_pattern
  if (dist <= bands.laserBrawlOuterPx + 18) return 0.3;
  if (dist < bands.missileIdealPairDistPx - 14) return 0.22;
  if (dist <= bands.missileMaxRangePx + CAPITAL_MISSILE_RANGE_LOOSEN_PX - 6) return 0.14;
  return 0.08;
}

/** 적 중심에서 `ringDist` 떨어진 링 위(자기 쪽 반경) 목표 — 미사일 사거리 재확보 */
function standoffTargetPose(
  self: Pt,
  other: Pt,
  ringDist: number,
  margin: number,
  orbitSize: number,
): AgentPose {
  const dx = self.x - other.x;
  const dy = self.y - other.y;
  const d = Math.hypot(dx, dy);
  const ux = d > 1e-9 ? dx / d : 1;
  const uy = d > 1e-9 ? dy / d : 0;
  const raw = { x: other.x + ux * ringDist, y: other.y + uy * ringDist };
  const c = clampToOrbit(raw, margin, orbitSize);
  const hx = other.x - self.x;
  const hy = other.y - self.y;
  const headingRad = Math.hypot(hx, hy) < 1e-9 ? 0 : Math.atan2(hy, hx);
  return { x: c.x, y: c.y, headingRad };
}

function combatStageLabelKo(stage: CombatMotionStage): string {
  if (stage === 'closing') return '탐지·추격';
  if (stage === 'missile_pattern') return '미사일·패턴';
  if (stage === 'missile_reposition') return '거리벌림';
  return '근접';
}

/** 근접 해상전: 적 주변 교전 링 위 목표 + 반대 방향 공전(최종 기수는 `faceEnemy` 블렌드로 조준 유지). */
function navalBrawlOrbitTargetPose(
  agentId: number,
  elapsedMs: number,
  selfPrev: Pt,
  otherPrev: Pt,
  margin: number,
  orbitSize: number,
  bands: CapitalCombatRangeBands,
): AgentPose {
  const dx0 = selfPrev.x - otherPrev.x;
  const dy0 = selfPrev.y - otherPrev.y;
  const angFromEnemy =
    Math.hypot(dx0, dy0) > 1e-6 ? Math.atan2(dy0, dx0) : agentId * Math.PI;
  const { rMin: NAVAL_BRAWL_RING_R_MIN_PX, rMax: NAVAL_BRAWL_RING_R_MAX_PX } =
    navalBrawlRingBoundsFromBands(bands);
  const rSpan = Math.max(4, (NAVAL_BRAWL_RING_R_MAX_PX - NAVAL_BRAWL_RING_R_MIN_PX) * 0.5);
  const rMid = (NAVAL_BRAWL_RING_R_MAX_PX + NAVAL_BRAWL_RING_R_MIN_PX) * 0.5;
  const R = Math.min(
    NAVAL_BRAWL_RING_R_MAX_PX,
    Math.max(
      NAVAL_BRAWL_RING_R_MIN_PX,
      rMid + rSpan * 0.5 * Math.sin(elapsedMs * 0.0001 + agentId * 1.9),
    ),
  );
  const theta =
    elapsedMs * NAVAL_BRAWL_ORBIT_OMEGA +
    angFromEnemy * 0.18 +
    agentId * Math.PI * 0.88;
  const raw = {
    x: otherPrev.x + R * Math.cos(theta),
    y: otherPrev.y + R * Math.sin(theta) * CAPITAL_ENEMY_ORBIT_ELLIPSE_Y_MUL,
  };
  const c = clampToOrbit(raw, margin, orbitSize);
  const turnSign = (agentId & 1) === 0 ? 1 : -1;
  const headingRad = theta + turnSign * (Math.PI / 2);
  return { x: c.x, y: c.y, headingRad };
}

/**
 * 단일 적 기준 추격 + (브롤만) 해상전 링 + 미사일 사거리 스탠드오프.
 * 21초 안무 패턴은 전술 단계와 분리되어 제거됨 — 목표점은 판단 계층 chase/standoff/brawl만.
 * kite·거리벌림: `standoff`는 후진 이격, `planet_orbit`은 적 중심 광궤도. 최종 헤딩은 선수 대적 1순위.
 */
function compositeNavigatePose(
  agentId: number,
  elapsedMs: number,
  selfPrev: Pt,
  otherPrev: Pt,
  cx: number,
  cy: number,
  margin: number,
  orbitSize: number,
  chaseWeight: number,
  combatStage: CombatMotionStage,
  tempoRole: TempoRole,
  kiteEvasionMode: KiteEvasionMode,
  bands: CapitalCombatRangeBands,
  /** 독트린 스탠드오프 링 오프셋(px) — 0이면 현행과 완전 동일 */
  standoffRingOffsetPx = 0,
  otherHeadingRad = 0,
  bearingGoal: BearingGoal = 'bow',
  employBand: EmployBand = 'approach',
  holdPairDistPx = 0,
): AgentPose {
  let wc = Math.min(1, Math.max(0, chaseWeight));
  if (combatStage === 'brawl') {
    wc = Math.min(wc, BRAWL_CHASE_WEIGHT_CAP);
  }
  let wp = 1 - wc;
  const kiteRepos = tempoRole === 'kite' && combatStage === 'missile_reposition';
  const kiteStandoffRepos = kiteRepos && kiteEvasionMode === 'standoff';
  if (kiteStandoffRepos) {
    wc = Math.min(wc, 0.035);
    wp = 1 - wc;
  }
  const cha = chaseTargetPose(selfPrev, otherPrev);
  const pat =
    combatStage === 'brawl'
      ? navalBrawlOrbitTargetPose(agentId, elapsedMs, selfPrev, otherPrev, margin, orbitSize, bands)
      : cha;
  let mx = cha.x * wc + pat.x * wp;
  let my = cha.y * wc + pat.y * wp;
  const pairD = Math.hypot(selfPrev.x - otherPrev.x, selfPrev.y - otherPrev.y);
  let ws = standoffWeightForDistAndStage(pairD, combatStage, bands);
  // 기세 역할별로 거리유지 강도를 분리해 동시동형(둘 다 동일 움직임) 완화
  if (tempoRole === 'press') {
    ws *= combatStage === 'brawl' ? 0.58 : 0.35;
  } else {
    ws = Math.min(1, ws * 1.55 + 0.08);
  }
  if (employBand === 'standoff_long') {
    ws = Math.min(1, ws * 2.35 + 0.2);
  } else if (bearingGoal !== 'bow') {
    ws = Math.min(1, ws + 0.14);
  }
  let headingBlend = lerpAngleRad(pat.headingRad, cha.headingRad, wc);
  if (ws > 1e-6) {
    let ringDist =
      tempoRole === 'press'
        ? Math.max(bands.laserBrawlOuterPx + 8, bands.missileIdealPairDistPx - 26)
        : Math.min(
            bands.missileMaxRangePx + CAPITAL_MISSILE_RANGE_LOOSEN_PX - 2,
            bands.missileIdealPairDistPx + 28,
          );
    if (standoffRingOffsetPx !== 0) {
      // 독트린 오프셋(장거리 유지형 등): 브롤 외곽~미사일 사거리 내로 클램프해 적용
      ringDist = Math.min(
        bands.missileMaxRangePx + CAPITAL_MISSILE_RANGE_LOOSEN_PX - 2,
        Math.max(bands.laserBrawlOuterPx + 4, ringDist + standoffRingOffsetPx),
      );
    }
    if (holdPairDistPx > 0) {
      ringDist = Math.min(
        bands.missileMaxRangePx + CAPITAL_MISSILE_RANGE_LOOSEN_PX - 2,
        Math.max(bands.minHoldPairDistPx, holdPairDistPx),
      );
    }
    const st = standoffTargetPose(selfPrev, otherPrev, ringDist, margin, orbitSize);
    mx = mx * (1 - ws) + st.x * ws;
    my = my * (1 - ws) + st.y * ws;
    headingBlend = lerpAngleRad(headingBlend, st.headingRad, ws * 0.5);
  }
  if (bearingGoal !== 'bow') {
    const holdR = Math.max(
      bands.minHoldPairDistPx,
      holdPairDistPx > 0
        ? holdPairDistPx
        : Math.max(bands.laserBrawlOuterPx + 10, Math.min(pairD, bands.missileIdealPairDistPx)),
    );
    const angOff =
      bearingGoal === 'stern'
        ? Math.PI
        : bearingGoal === 'beam_port'
          ? Math.PI * 0.5
          : -Math.PI * 0.5;
    const ang = otherHeadingRad + angOff;
    const rawBear = {
      x: otherPrev.x + holdR * Math.cos(ang),
      y: otherPrev.y + holdR * Math.sin(ang) * CAPITAL_ENEMY_ORBIT_ELLIPSE_Y_MUL,
    };
    const bear = clampToOrbit(rawBear, margin, orbitSize);
    const bw = bearingGoal === 'stern' ? 0.58 : 0.64;
    mx = mx * (1 - bw) + bear.x * bw;
    my = my * (1 - bw) + bear.y * bw;
  }
  const sepPad = Math.max(
    MIN_CAPITAL_CENTER_SEP_PX + 6,
    bands.minHoldPairDistPx ?? 0,
    holdPairDistPx,
  );
  const rdx = mx - otherPrev.x;
  const rdy = my - otherPrev.y;
  const rd = Math.hypot(rdx, rdy);
  if (rd < sepPad && rd > 1e-9) {
    const push = sepPad - rd;
    const sdx = selfPrev.x - otherPrev.x;
    const sdy = selfPrev.y - otherPrev.y;
    const sl = Math.hypot(sdx, sdy);
    const ux = sl > 1e-9 ? sdx / sl : 1;
    const uy = sl > 1e-9 ? sdy / sl : 0;
    mx += ux * push;
    my += uy * push;
  }
  const c = clampToOrbit({ x: mx, y: my }, margin, orbitSize);
  mx = c.x;
  my = c.y;
  const stalledAtEdge =
    isNearOrbitBoundary(c, margin, orbitSize) &&
    Math.hypot(mx - selfPrev.x, my - selfPrev.y) <= EDGE_STALL_EPS_PX;
  const forceEdgeEvade =
    stalledAtEdge || (tempoRole === 'kite' && combatStage === 'missile_reposition' && isNearOrbitBoundary(c, margin, orbitSize));
  if (forceEdgeEvade) {
    if (isNearOrbitCorner(c, margin, orbitSize)) {
      // 코너에서는 무조건 중앙 복귀로 빠져나온다.
      const ccx = orbitSize * 0.5;
      const ccy = orbitSize * 0.5;
      const dx = ccx - mx;
      const dy = ccy - my;
      const d = Math.hypot(dx, dy);
      const ux = d > 1e-9 ? dx / d : 1;
      const uy = d > 1e-9 ? dy / d : 0;
      const recenter = clampToOrbit(
        { x: mx + ux * EDGE_CENTER_ESCAPE_STEP_PX, y: my + uy * EDGE_CENTER_ESCAPE_STEP_PX },
        margin,
        orbitSize,
      );
      mx = recenter.x;
      my = recenter.y;
    } else {
      const ex = otherPrev.x - mx;
      const ey = otherPrev.y - my;
      const ed = Math.hypot(ex, ey);
      const ux = ed > 1e-9 ? ex / ed : 1;
      const uy = ed > 1e-9 ? ey / ed : 0;
      // 적 기준 접선 방향으로 슬라이드해 경계에서 정지하지 않게 함
      const tx = -uy;
      const ty = ux;
      const side = (agentId & 1) === 0 ? 1 : -1;
      const s = EDGE_EVADE_STEP_PX * side;
      const candA = clampToOrbit({ x: mx + tx * s, y: my + ty * s }, margin, orbitSize);
      const candB = clampToOrbit({ x: mx - tx * s, y: my - ty * s }, margin, orbitSize);
      const dA = Math.hypot(candA.x - otherPrev.x, candA.y - otherPrev.y);
      const dB = Math.hypot(candB.x - otherPrev.x, candB.y - otherPrev.y);
      const pick = dA >= dB ? candA : candB;
      mx = pick.x;
      my = pick.y;
    }
  }
  if (kiteRepos && kiteEvasionMode === 'planet_orbit') {
    const orb = enemyWideOrbitEvasionPose(agentId, elapsedMs, otherPrev, pairD, margin, orbitSize, bands);
    mx = mx * 0.28 + orb.x * 0.72;
    my = my * 0.28 + orb.y * 0.72;
    headingBlend = lerpAngleRad(headingBlend, orb.headingRad, 0.75);
  }
  // 탐지·추격: 행성 중심 기준 미세 접선 드리프트 — 코어 수송선 체류(dwell) 각속과 유사한 궤도 리듬
  if (combatStage === 'closing' && pairD > combatDetectionRangePx(orbitSize, margin) * 0.42) {
    const tang =
      Math.sin(elapsedMs * CAPITAL_CLOSING_ORBIT_DRIFT_OMEGA_PER_MS + agentId * 1.73) *
      CAPITAL_CLOSING_ORBIT_DRIFT_AMP_PX;
    const ccx = orbitSize * 0.5;
    const ccy = orbitSize * 0.5;
    const rdx = mx - ccx;
    const rdy = my - ccy;
    const rl = Math.hypot(rdx, rdy);
    if (rl > 1e-6) {
      const px = -rdy / rl;
      const py = rdx / rl;
      const drifted = clampToOrbit({ x: mx + px * tang, y: my + py * tang }, margin, orbitSize);
      mx = drifted.x;
      my = drifted.y;
    }
  }
  const gx = mx - selfPrev.x;
  const gy = my - selfPrev.y;
  const headingToGoal = Math.hypot(gx, gy) < 1e-9 ? headingBlend : Math.atan2(gy, gx);
  const dxE = otherPrev.x - selfPrev.x;
  const dyE = otherPrev.y - selfPrev.y;
  const faceEnemy =
    Math.hypot(dxE, dyE) < 1e-9 ? headingBlend : Math.atan2(dyE, dxE);
  let headingRad = lerpAngleRad(headingBlend, faceEnemy, BOW_FACE_ENEMY_HEADING_WEIGHT);
  headingRad = lerpAngleRad(headingRad, headingToGoal, BOW_GOAL_HEADING_MIX);
  return { x: mx, y: my, headingRad };
}

/** 적분 직후 중심 거리가 최소 이하이면 모든 페어를 양쪽으로 밀어 분리 */
function resolveCapitalShipOverlaps(
  agents: Agent[],
  minCenterDist: number,
  margin: number,
  orbitSize: number,
): void {
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];
    if (!a?.alive) continue;
    for (let j = i + 1; j < agents.length; j++) {
      const b = agents[j];
      if (!b?.alive) continue;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let d = Math.hypot(dx, dy);
      const pairMin =
        a.team !== b.team
          ? Math.max(
              minCenterDist,
              a.rangeBands.minHoldPairDistPx ?? 0,
              b.rangeBands.minHoldPairDistPx ?? 0,
            )
          : minCenterDist;
      if (d >= pairMin) continue;
      if (d < 1e-10) {
        dx = 1;
        dy = 0;
        d = 1;
      }
      dx /= d;
      dy /= d;
      const pen = (pairMin - d) * 0.5;
      a.x -= dx * pen;
      a.y -= dy * pen;
      b.x += dx * pen;
      b.y += dy * pen;
      const ca = clampToOrbit({ x: a.x, y: a.y }, margin, orbitSize);
      const cb = clampToOrbit({ x: b.x, y: b.y }, margin, orbitSize);
      a.x = ca.x;
      a.y = ca.y;
      b.x = cb.x;
      b.y = cb.y;
    }
  }
}

/** 맵 안에서 허용되는 함선 중심 간 최대 거리(수평 한 축 기준) */
function maxHorizontalPairSeparationPx(orbitSize: number, margin: number): number {
  return Math.max(96, orbitSize - 2 * margin - DUEL_EDGE_INSET_TOTAL);
}

function horizontalDuelFromCenterDistance(
  cx: number,
  cy: number,
  margin: number,
  orbitSize: number,
  centerDistance: number,
): { x0: number; y0: number; x1: number; y1: number; h0: number; h1: number } {
  const half = centerDistance * 0.5;
  const c0 = clampToOrbit({ x: cx - half, y: cy }, margin, orbitSize);
  const c1 = clampToOrbit({ x: cx + half, y: cy }, margin, orbitSize);
  return {
    x0: c0.x,
    y0: c0.y,
    x1: c1.x,
    y1: c1.y,
    h0: 0,
    h1: Math.PI,
  };
}

/** 최초·리스폰 직후: 함선 중심간 거리 목표 = 맵 허용 최대의 2배 요청(수평 클램프로 실제는 맵 한도까지) */
const INITIAL_SPAWN_PAIR_SEPARATION_MULT = 2;

/** 1:1 결투 최초·와이드 블렌드 스폰 변형(3종 중 무작위, 세션 `active` 진입 시 재추첨) */
type DuelSpawnVariant = 0 | 1 | 2;
const DUEL_SPAWN_VARIANT_COUNT = 3;

function randomDuelSpawnVariant(): DuelSpawnVariant {
  return (Math.floor(Math.random() * DUEL_SPAWN_VARIANT_COUNT) % DUEL_SPAWN_VARIANT_COUNT) as DuelSpawnVariant;
}

function resolveDuelSpawnVariantForPlanet(planetId: string): DuelSpawnVariant {
  const variantKey = resolvePlanetMainStageCombatVariant(planetId);
  if (variantKey === 'draco_wave' || variantKey === 'endgame_boss') return 0;
  return randomDuelSpawnVariant();
}

/** 최초·리스폰 직후: 가능한 한 맵 양끝으로 이격(수평 기준 — 변형 0 전용) */
function initialSpawnDuelPositions(
  cx: number,
  cy: number,
  margin: number,
  orbitSize: number,
): { x0: number; y0: number; x1: number; y1: number; h0: number; h1: number } {
  const base = maxHorizontalPairSeparationPx(orbitSize, margin);
  const d = base * INITIAL_SPAWN_PAIR_SEPARATION_MULT;
  return horizontalDuelFromCenterDistance(cx, cy, margin, orbitSize, d);
}

/** 와이드 스폰 블렌드용 페어 포즈 — `variant`에 맞춘 큰 이격 */
function initialSpawnDuelWidePositions(
  variant: DuelSpawnVariant,
  cx: number,
  cy: number,
  margin: number,
  orbitSize: number,
): { x0: number; y0: number; x1: number; y1: number; h0: number; h1: number } {
  const base = maxHorizontalPairSeparationPx(orbitSize, margin);
  const d = base * INITIAL_SPAWN_PAIR_SEPARATION_MULT;
  if (variant === 0) {
    return initialSpawnDuelPositions(cx, cy, margin, orbitSize);
  }
  if (variant === 1) {
    const half = d * 0.5;
    const c0 = clampToOrbit({ x: cx, y: cy - half }, margin, orbitSize);
    const c1 = clampToOrbit({ x: cx, y: cy + half }, margin, orbitSize);
    return {
      x0: c0.x,
      y0: c0.y,
      x1: c1.x,
      y1: c1.y,
      h0: Math.PI / 2,
      h1: -Math.PI / 2,
    };
  }
  const ux = 1 / Math.SQRT2;
  const uy = 1 / Math.SQRT2;
  const half = d * 0.5;
  const c0 = clampToOrbit({ x: cx - ux * half, y: cy - uy * half }, margin, orbitSize);
  const c1 = clampToOrbit({ x: cx + ux * half, y: cy + uy * half }, margin, orbitSize);
  return {
    x0: c0.x,
    y0: c0.y,
    x1: c1.x,
    y1: c1.y,
    h0: Math.atan2(c1.y - c0.y, c1.x - c0.x),
    h1: Math.atan2(c0.y - c1.y, c0.x - c1.x),
  };
}

function resolveCurrentPlayerFlagshipNpcShipId(): string {
  const currentId = usePlayerStore.getState().player?.ship?.portraitNpcCapitalShipId?.trim();
  if (currentId && currentId.length > 0) return currentId;
  return PLAYER_FLAGSHIP_NPC_SHIP_ID;
}

type PlayerFlagshipCombatBinding = {
  displayName: string;
  combatStats: NpcCapitalShip['combat'];
  runtimeConfig: (typeof NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV)[string] | undefined;
  equipmentAgentKnobs: ShipEquipmentAgentKnobs;
};

function resolvePlayerFlagshipCombatBinding(): PlayerFlagshipCombatBinding | null {
  const player = usePlayerStore.getState().player;
  if (!player) return null;
  const shipForCombat = resolveShipFinalStatResult(player.ship).shipForCombat;
  const npcShipId = shipForCombat.portraitNpcCapitalShipId?.trim();
  if (!npcShipId) return null;
  const npcRow = getNpcCapitalShip(npcShipId);
  if (!npcRow) return null;
  const runtimeBase = NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV[npcShipId];

  // 플레이어 전투 무장은 equipSlots가 정본이다. 해제('0'/빈) = 그 채널 ''.
  // ship.weapons 잔존값·기종 CSV 기본무장·전역 근접 폴백은 쓰지 않는다.
  const {
    laserWeaponId,
    missileWeaponId,
    closeRangeWeaponId,
    auxWeaponId,
  } = resolvePlayerCombatWeaponChannels(player.ship.equipSlots, runtimeBase);

  const baseCombat = {
    ...npcRow.combat,
    maxHp: Math.max(1, shipForCombat.maxHp),
    maxShield: Math.max(0, shipForCombat.maxShield),
    armor: Math.max(0, shipForCombat.armor),
  };
  const proficiency = normalizePlayerCombatProficiency(player.combatProficiency, player.level);
  let perf = calculateShipPerformance(
    baseCombat,
    { level: player.level, proficiencyMultiplier: proficiency.proficiencyMultiplier },
    runtimeBase,
  );
  perf = applyMineralUpgradeToShipPerformance(perf, player.mineralUpgrades);
  perf = applyShipEquipmentToShipPerformance(perf, player.ship.equipSlots);
  const equipmentBonuses = aggregateShipEquipmentBonuses(player.ship.equipSlots);
  const equipmentAgentKnobs = resolveShipEquipmentAgentKnobs(perf.combat.maxHp, equipmentBonuses);

  const mergedRuntime = {
    ...(runtimeBase ?? {}),
    ...(perf.runtimeConfig ?? {}),
    laserWeaponId: laserWeaponId || '',
    missileWeaponId: missileWeaponId || '',
    closeRangeWeaponId: closeRangeWeaponId || '',
    auxWeaponId: auxWeaponId || '',
  };

  return {
    displayName: shipForCombat.name,
    combatStats: perf.combat,
    runtimeConfig: mergedRuntime,
    equipmentAgentKnobs,
  };
}

function resolveStageAgentCombatBinding(input: {
  isPlayerSlot: boolean;
  npcShipId: string | null;
  npcRow: NpcCapitalShip | undefined;
  runtimeConfig: (typeof NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV)[string] | undefined;
  playerBinding: PlayerFlagshipCombatBinding | null;
}): {
  combatStats: NpcCapitalShip['combat'] | undefined;
  runtimeConfig: (typeof NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV)[string] | undefined;
  equipmentAgentKnobs: ShipEquipmentAgentKnobs | undefined;
} {
  if (input.isPlayerSlot && input.playerBinding) {
    return {
      combatStats: input.playerBinding.combatStats,
      runtimeConfig: input.playerBinding.runtimeConfig,
      equipmentAgentKnobs: input.playerBinding.equipmentAgentKnobs,
    };
  }
  if (input.npcShipId && input.npcRow) {
    const npcBinding = resolveNpcCapitalShipCombatBinding({
      npcShipId: input.npcShipId,
      npcRow: input.npcRow,
      runtimeConfig: input.runtimeConfig,
    });
    return {
      combatStats: npcBinding.combatStats,
      runtimeConfig: npcBinding.runtimeConfig,
      equipmentAgentKnobs: npcBinding.equipmentAgentKnobs,
    };
  }
  return {
    combatStats: input.npcRow?.combat,
    runtimeConfig: input.runtimeConfig,
    equipmentAgentKnobs: undefined,
  };
}

function isPlayerCombatAgent(ag: Agent): boolean {
  return ag.captainId === PLAYER_FLAGSHIP_CAPTAIN_ID;
}

function resolvePlayerStanceForAgent(ag: Agent): BattleStanceId {
  if (!isPlayerCombatAgent(ag)) return 'NEUTRAL';
  return useBattleStanceStore.getState().activeStance;
}

function resolvePlayerStanceMoveSpeedMult(ag: Agent): number {
  const stance = resolvePlayerStanceForAgent(ag);
  let base = 1;
  if (stance === 'AGGRESSIVE') base = 1.18;
  else if (stance === 'DEFENSIVE') base = 0.84;
  return resolveSkillMoveSpeedMult(ag, COMBAT_SKILL_NOW_MS, base);
}

function resolvePlayerStanceMissileSalvoDelta(ag: Agent): number {
  const stance = resolvePlayerStanceForAgent(ag);
  if (stance === 'AGGRESSIVE') return 1;
  if (stance === 'DEFENSIVE') return -1;
  return 0;
}

function finalizeShipDestroyed(victim: Agent, owner: Agent | undefined, elapsedMs: number): void {
  if (!victim.alive) return;
  victim.alive = false;
  victim.lastDestroyedAtMs = elapsedMs;
  if (owner && isPlayerCombatAgent(owner)) {
    // 웨이브 디펜스 중엔 per-kill 플레이어 exp 미지급 — exp는 전투 종료 후 결과창(인게임 대화 뒤)에서
    // 1회만 지급한다. (전투 종료 즉시 + 결과창 후 레벨업창이 두 번 뜨던 현상 방지)
    if (!useWaveDefenseStore.getState().active) {
      usePlayerStore.getState().addExp(victim.expRewardStat);
    }
  }
  if (owner?.captainId) {
    const s = useNpcCaptainProgressStore.getState();
    s.grantCaptainDelta(owner.captainId, {
      exp: NPC_CAPTAIN_PROGRESS_EXP.kill,
      killCount: 1,
    });
    void s.persistNpcCaptainProgress();
  }
}

function applyCapitalCraftHitToAgent(
  owner: Agent,
  target: Agent,
  ev: CapitalCraftImpactEvent,
  elapsed: number,
  margin: number,
  orbitSize: number,
): void {
  if (!target.alive) return;
  const craftOutcome = resolveAgentAttackOutcome(owner, target, 'missile');
  if (craftOutcome > 0) {
    const craftRawDamage = Math.max(
      1,
      Math.round(rollAgentWeaponDamage(owner, target, 'missile', craftOutcome) * (owner.skillAuto?.droneDamageMul || 1)),
    );
    const craftFx = getWeaponSpecialFxPolicy(ev.weaponId);
    const hullDamage = applyAgentIncomingDamage(
      target,
      craftRawDamage,
      owner.attackBonusStat,
      ev.ignoreShield,
      craftFx?.ignoreArmor ?? false,
      owner.skillArmorPierce,
      owner.skillAuto?.shieldPenPct ?? 0,
      owner.skillAuto?.sneakAttackMul ?? 1,
      owner.skillAuto,
    );
    if (craftFx) {
      applySpecialWeaponStatusOnAgent(target, craftFx, elapsed);
    }
    applyHitKnockback(target, ev, Math.max(1, hullDamage), margin, orbitSize);
  }
  if (ev.slowMs > 0 && ev.slowMul > 0 && ev.slowMul < 1) {
    target.speedSlowMul = Math.min(target.speedSlowMul, ev.slowMul);
    target.speedSlowUntilMs = Math.max(target.speedSlowUntilMs, elapsed + ev.slowMs);
  }
  if (target.hullHp <= 0) {
    finalizeShipDestroyed(target, owner, elapsed);
  }
}

function isPlayerFlagshipSlot(
  captainId: string | null,
  npcShipId: string | null,
  ctx?: { combatPlanetId: string; team: 'red' | 'blue' | 'orange' },
): boolean {
  if (captainId === PLAYER_FLAGSHIP_CAPTAIN_ID) {
    return true;
  }
  /** 이동중 전투(`__transit__`): 플레이스홀더 2체만 — 블루가 플레이어 함선 */
  if (
    ctx &&
    ctx.combatPlanetId === CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID &&
    ctx.team === 'blue' &&
    npcShipId === null &&
    captainId === null
  ) {
    return true;
  }
  return false;
}

/** 표적 위치로 낙점·제어점을 맞춘다 — 유도탄 곡선 유지 */
function retargetMissileBezier(m: Missile, target: Pt): void {
  m.p2 = { x: target.x, y: target.y };
  const lane = missileSpreadLane(m.spreadLane, m.salvoCount);
  const dx = m.p2.x - m.p0.x;
  const dy = m.p2.y - m.p0.y;
  const d = Math.hypot(dx, dy);
  const ux = d > 1e-9 ? dx / d : 1;
  const uy = d > 1e-9 ? dy / d : 0;
  const nx = -uy;
  const ny = ux;
  const laneLateral = 24 * lane;
  const baseArcLateral = lane === 0 ? 20 * m.curveSign : 0;
  const lateral = laneLateral + baseArcLateral;
  const forward = 18 + Math.abs(lane) * 6;
  m.p1 = {
    x: (m.p0.x + m.p2.x) / 2 + nx * lateral + ux * forward,
    y: (m.p0.y + m.p2.y) / 2 + ny * lateral + uy * forward,
  };
}

function missileSpreadLane(spreadIdx: number, salvoCount: number): number {
  const count = Math.max(1, salvoCount);
  const i = ((spreadIdx % count) + count) % count;
  return i - (count - 1) * 0.5;
}

function createCapitalAgentBase(
  id: number,
  team: 'red' | 'blue' | 'orange',
  combatPlanetId: string,
  pose: AgentPose,
  wallBaseMs: number,
  redLikeStats: boolean,
  npcShipId: string | null,
  captainId: string | null,
  displayName: string,
  captainLabel: string,
  combatStats?: NpcCapitalShip['combat'],
  runtimeConfig?: (typeof NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV)[string],
  enemyAffinityKind = 'light',
  equipmentKnobs?: ShipEquipmentAgentKnobs,
): Agent {
  let maxHullHp = Math.max(1, combatStats?.maxHp ?? CAPITAL_BASE_HULL_HP);
  if (team === 'red' || team === 'orange') {
    const engageMul = usePlanetCoreRuntimeStore.getState().getGlobalEngageHpMul();
    maxHullHp = Math.max(1, Math.round(maxHullHp * engageMul));
  }
  const maxShieldHp = Math.max(0, combatStats?.maxShield ?? 0);
  const armorStat = Math.max(0, combatStats?.armor ?? (redLikeStats ? 14 : 12));
  const attackBonusStat = combatStats?.attackBonus ?? (redLikeStats ? 8 : 6);
  const strStat = Math.max(1, combatStats?.strStat ?? Math.min(24, Math.max(6, Math.round(maxHullHp / 10))));
  const dexStat = Math.max(
    1,
    combatStats?.dexStat ?? Math.min(24, Math.max(6, Math.round((runtimeConfig?.maxMoveSpeedPxPerMs ?? (redLikeStats ? 0.0238 : 0.0196)) * 1000))),
  );
  const sizeClass = combatStats?.sizeClass ?? 0;
  const expRewardStat = Math.max(0, combatStats?.expReward ?? Math.max(20, Math.round(maxHullHp / 4)));
  const strMod = getAbilityModifier(strStat);
  const dexMod = getAbilityModifier(dexStat);
  const laserJitterMin = runtimeConfig?.laserCooldownJitterMinMs ?? 120;
  const laserJitterMax = runtimeConfig?.laserCooldownJitterMaxMs ?? 520;
  const missileJitterMin = runtimeConfig?.missileCooldownJitterMinMs ?? 450;
  const missileJitterMax = runtimeConfig?.missileCooldownJitterMaxMs ?? 1900;
  const salvoStepMin = runtimeConfig?.salvoStepMinMs ?? 420;
  const salvoStepMax = runtimeConfig?.salvoStepMaxMs ?? 620;
  const engageDelayMin = runtimeConfig?.engageStartDelayMinMs ?? 0;
  const engageDelayMax = runtimeConfig?.engageStartDelayMaxMs ?? 1400;
  const detectRangeScale = runtimeConfig?.detectRangeScale ?? randRange(0.84, 1.18);
  const laserWeaponId = runtimeConfig?.laserWeaponId?.trim() ?? '';
  const missileWeaponId = runtimeConfig?.missileWeaponId?.trim() ?? '';
  const specifiedClose = runtimeConfig?.closeRangeWeaponId;
  const closeRangeWeaponId =
    specifiedClose === undefined ? DEFAULT_CLOSE_RANGE_WEAPON_ID : specifiedClose.trim();
  const auxWeaponId = runtimeConfig?.auxWeaponId?.trim() ?? '';
  const laserWeapon = laserWeaponId ? getCapitalWeaponRow(laserWeaponId) : null;
  const missileWeapon = missileWeaponId ? getCapitalWeaponRow(missileWeaponId) : null;
  const closeRangeWeapon = closeRangeWeaponId ? getCapitalWeaponRow(closeRangeWeaponId) : null;
  const hasLaserWeaponId = laserWeaponId.trim().length > 0;
  const hasMissileWeaponId = missileWeaponId.trim().length > 0;
  if (__DEV__) {
    if (hasLaserWeaponId && !laserWeapon && !WARNED_MISSING_WEAPON_IDS.has(laserWeaponId)) {
      WARNED_MISSING_WEAPON_IDS.add(laserWeaponId);
      console.warn(`[combat] weapon_list.csv 매핑 누락(laser): ${laserWeaponId}`);
    }
    if (hasMissileWeaponId && !missileWeapon && !WARNED_MISSING_WEAPON_IDS.has(missileWeaponId)) {
      WARNED_MISSING_WEAPON_IDS.add(missileWeaponId);
      console.warn(`[combat] weapon_list.csv 매핑 누락(missile): ${missileWeaponId}`);
    }
    if (closeRangeWeaponId && !closeRangeWeapon && !WARNED_MISSING_WEAPON_IDS.has(closeRangeWeaponId)) {
      WARNED_MISSING_WEAPON_IDS.add(closeRangeWeaponId);
      console.warn(`[combat] weapon_list.csv 매핑 누락(closeRange): ${closeRangeWeaponId}`);
    }
  }
  const hasLaserWeapon = Boolean(laserWeapon);
  const hasMissileWeapon = Boolean(missileWeapon);
  const hasCloseRangeWeapon = Boolean(closeRangeWeapon);
  const laserRechargeMs = hasLaserWeapon
    ? Math.max(120, laserWeapon?.cooldownMs ?? LASER_RECHARGE_MS)
    : Number.POSITIVE_INFINITY;
  const missileFireIntervalMs = hasMissileWeapon
    ? Math.max(900, missileWeapon?.cooldownMs ?? MISSILE_FIRE_INTERVAL_MS)
    : Number.POSITIVE_INFINITY;
  const closeRangeFireIntervalMs = hasCloseRangeWeapon
    ? Math.max(420, closeRangeWeapon?.cooldownMs ?? MISSILE_FIRE_INTERVAL_MS)
    : Number.POSITIVE_INFINITY;
  const laserEngageRangePx = hasLaserWeapon && laserWeapon ? resolveCapitalWeaponRangePx(laserWeapon) : 0;
  const missileMaxRangePx = hasMissileWeapon && missileWeapon ? resolveCapitalWeaponRangePx(missileWeapon) : 0;
  const closeRangeMaxRangePx =
    hasCloseRangeWeapon && closeRangeWeapon ? resolveCapitalWeaponRangePx(closeRangeWeapon) : 0;
  const rangeBands = deriveCapitalCombatRangeBands(
    laserEngageRangePx,
    missileMaxRangePx,
    closeRangeMaxRangePx,
  );
  const laserSpeedPxPerSec = Math.max(1, laserWeapon?.projectileSpeedPxPerSec ?? 5200);
  const laserBoltTravelMs = Math.max(8, Math.round((Math.max(1, laserEngageRangePx) / laserSpeedPxPerSec) * 1000));
  const missileSpeedPxPerSec = Math.max(
    1,
    missileWeapon?.projectileSpeedPxPerSec ?? MISSILE_FLIGHT_SPEED_PX_PER_MS_FALLBACK * 1000,
  );
  const missileFlightSpeedPxPerMs = missileSpeedPxPerSec / 1000;
  const closeRangeSpeedPxPerSec = Math.max(
    1,
    closeRangeWeapon?.projectileSpeedPxPerSec ?? missileSpeedPxPerSec,
  );
  const closeRangeFlightSpeedPxPerMs = closeRangeSpeedPxPerSec / 1000;
  const diceCount = Math.max(1, combatStats?.damageDice.count ?? 1);
  const diceSides = Math.max(2, combatStats?.damageDice.sides ?? 6);
  const diceBonus = combatStats?.damageDice.bonus ?? 0;
  const baseMinDamage = diceCount + diceBonus;
  const baseMaxDamage = diceCount * diceSides + diceBonus;
  const laserDamageBonus = hasLaserWeapon ? Math.max(1, laserWeapon?.damage ?? DEFAULT_LASER_DMG_FALLBACK) : 0;
  const missileDamageBonus = hasMissileWeapon ? Math.max(1, missileWeapon?.damage ?? DEFAULT_MISSILE_DMG_FALLBACK) : 0;
  const closeRangeDamageBonus = hasCloseRangeWeapon
    ? Math.max(1, closeRangeWeapon?.damage ?? DEFAULT_MISSILE_DMG_FALLBACK)
    : 0;
  const laserMinDamage = Math.max(1, baseMinDamage + laserDamageBonus);
  const laserMaxDamage = Math.max(laserMinDamage, baseMaxDamage + laserDamageBonus);
  const missileMinDamage = Math.max(1, baseMinDamage + missileDamageBonus);
  const missileMaxDamage = Math.max(missileMinDamage, baseMaxDamage + missileDamageBonus);
  const closeRangeMinDamage = Math.max(1, baseMinDamage + closeRangeDamageBonus);
  const closeRangeMaxDamage = Math.max(closeRangeMinDamage, baseMaxDamage + closeRangeDamageBonus);
  const missileSalvoCount = hasMissileWeapon
    ? resolveMissileSalvoCount(missileWeaponId)
    : 0;
  const closeRangeSalvoCount = hasCloseRangeWeapon
    ? resolveMissileSalvoCount(closeRangeWeaponId)
    : 0;
  const missileSalvoIntervalMs = hasMissileWeapon
    ? resolveMissileSalvoIntervalMs(missileWeaponId, randRange(salvoStepMin, salvoStepMax))
    : randRange(salvoStepMin, salvoStepMax);
  const closeRangeSalvoIntervalMs = hasCloseRangeWeapon
    ? resolveMissileSalvoIntervalMs(closeRangeWeaponId, randRange(salvoStepMin, salvoStepMax))
    : randRange(salvoStepMin, salvoStepMax);
  const eqKnobs = equipmentKnobs ?? {
    acBonus: 0,
    incomingDamageMul: 1,
    hullRegenPerTick: 0,
    missileMissChance: 0,
  };
  const isWingman = captainId === PLAYER_WINGMAN_CAPTAIN_ID;
  const combatSkill = captainId === PLAYER_FLAGSHIP_CAPTAIN_ID
    ? resolvePlayerCombatSkillBind()
    : EMPTY_PLAYER_COMBAT_SKILL_BIND;
  const skillAuto = captainId === PLAYER_FLAGSHIP_CAPTAIN_ID
    ? createPlayerAgentSkillAuto(combatSkill)
    : isWingman
      ? createWingmanAgentSkillAuto()
      : createNpcAgentSkillAuto();
  const statMul = 1 + combatSkill.statMultiplierPct / 100;
  const armorStatResolved = armorStat + combatSkill.armorBonus;
  const attackBonusResolved = Math.round(attackBonusStat * statMul) + combatSkill.partyAttackBonus;
  const shieldMaxResolved = Math.max(0, Math.round(maxShieldHp * combatSkill.shieldMaxMul));
  const laserCd = Math.max(120, Math.round(laserRechargeMs * combatSkill.weaponCooldownMul));
  const missileCd = Number.isFinite(missileFireIntervalMs)
    ? Math.max(900, Math.round(missileFireIntervalMs * combatSkill.weaponCooldownMul))
    : missileFireIntervalMs;
  const closeCd = Number.isFinite(closeRangeFireIntervalMs)
    ? Math.max(420, Math.round(closeRangeFireIntervalMs * combatSkill.weaponCooldownMul))
    : closeRangeFireIntervalMs;
  const salvoResolved = hasMissileWeapon
    ? missileSalvoCount + combatSkill.missileSalvoBonus
    : missileSalvoCount;
  if (combatSkill.shieldMaxMul > 1) {
    skillAuto.procLabel = SKILL_PROC_LABEL.shieldOverload;
    skillAuto.procUntilMs = wallBaseMs + resolveSkillAutoCombatPolicy().procBannerMs;
  }
  if (combatSkill.wingman) {
    skillAuto.wingmanUntilMs = wallBaseMs + resolveSkillAutoCombatPolicy().wingmanDurationTurns * skillTurnMs();
    skillAuto.nextWingmanMs = skillAuto.wingmanUntilMs + resolveSkillAutoCombatPolicy().wingmanCooldownTurns * skillTurnMs();
    skillAuto.procLabel = SKILL_PROC_LABEL.wingman;
    skillAuto.procUntilMs = wallBaseMs + resolveSkillAutoCombatPolicy().procBannerMs;
  }
  return {
    id,
    team,
    x: pose.x,
    y: pose.y,
    headingRad: pose.headingRad,
    vx: 0,
    vy: 0,
    maxMoveSpeedPxPerMs:
      runtimeConfig?.maxMoveSpeedPxPerMs ?? (redLikeStats ? 0.0238 : 0.0196),
    accelPxPerMs2: runtimeConfig?.accelPxPerMs2 ?? (redLikeStats ? 0.000038 : 0.000032),
    headingRateRadPerMs: 0,
    maxTurnRateRadPerMs:
      runtimeConfig?.maxTurnRateRadPerMs ?? (redLikeStats ? 0.0042 * 0.5 : 0.0036 * 0.5),
    turnAccelRadPerMs2:
      runtimeConfig?.turnAccelRadPerMs2 ?? (redLikeStats ? 0.00012 * 0.5 : 0.0001 * 0.5),
    hullHp: maxHullHp,
    maxHullHp,
    shieldHp: shieldMaxResolved,
    maxShieldHp: shieldMaxResolved,
    alive: true,
    stroke: isPlayerFlagshipSlot(captainId, npcShipId, { combatPlanetId, team })
      ? PLAYER_FLAGSHIP_SHIP_STROKE
      : team === 'red'
        ? '#D62839'
        : team === 'blue'
          ? '#5B8DEF'
          : '#FF8A00',
    nextFireMs: wallBaseMs,
    nextMissileSalvoAt:
      wallBaseMs + (redLikeStats ? 0 : missileFireIntervalMs * 0.5) + id * 70,
    nextCloseRangeSalvoAt:
      wallBaseMs + (redLikeStats ? 120 : closeRangeFireIntervalMs * 0.35) + id * 55,
    activeSalvoBaseMs: null,
    activeCloseRangeSalvoBaseMs: null,
    activeSalvoNextShotAtMs: null,
    activeCloseRangeNextShotAtMs: null,
    salvoSpawned: 0,
    closeRangeSalvoSpawned: 0,
    lastLaserStartMs: wallBaseMs - 1e9,
    lastDestroyedAtMs: -1e9,
    behaviorTimeOffsetMs: randRange(-1200, 1200),
    laserCooldownJitterMs: randRange(laserJitterMin, laserJitterMax),
    missileCooldownJitterMs: randRange(missileJitterMin, missileJitterMax),
    salvoStepMs: missileSalvoIntervalMs,
    engageStartDelayMs: randRange(engageDelayMin, engageDelayMax),
    detectRangeScale,
    lastWeaponFireAtMs: wallBaseMs,
    speedSlowMul: 1,
    speedSlowUntilMs: 0,
    statusTintUntilMs: 0,
    statusTintHex: '',
    statusIconKind: '',
    lastShieldRegenAtMs: wallBaseMs,
    stallChaseBoostUntilMs: 0,
    tempoRole: 'press',
    kiteEvasionMode: 'standoff',
    kiteDistStallSinceMs: null,
    kiteDistResumeAdvanceUntilMs: 0,
    doctrine: resolveDracoCombatTestDoctrine(captainId) ?? resolveDoctrineForCaptain(captainId),
    ...createManeuverEmploymentDefaults(),
    currentTargetAgentId: null,
    npcShipId,
    captainId,
    displayName,
    captainLabel,
    laserWeaponId,
    missileWeaponId,
    closeRangeWeaponId: hasCloseRangeWeapon ? closeRangeWeaponId : '',
    auxWeaponId,
    strStat,
    dexStat,
    strMod,
    dexMod,
    sizeClass,
    armorStat: armorStatResolved,
    attackBonusStat: attackBonusResolved,
    expRewardStat,
    laserMinDamage,
    laserMaxDamage,
    missileMinDamage,
    missileMaxDamage,
    closeRangeMinDamage,
    closeRangeMaxDamage,
    laserRechargeMs: laserCd,
    missileFireIntervalMs: missileCd,
    missileSalvoCount: salvoResolved,
    missileSalvoIntervalMs,
    closeRangeFireIntervalMs: closeCd,
    closeRangeSalvoCount,
    closeRangeSalvoIntervalMs,
    laserEngageRangePx,
    missileMaxRangePx,
    closeRangeMaxRangePx,
    rangeBands,
    laserBoltTravelMs,
    missileFlightSpeedPxPerMs,
    closeRangeFlightSpeedPxPerMs,
    enemyAffinityKind,
    equipmentAcBonus: eqKnobs.acBonus,
    equipmentIncomingDamageMul: eqKnobs.incomingDamageMul,
    equipmentHullRegenPerTick: eqKnobs.hullRegenPerTick,
    equipmentMissileMissChance: eqKnobs.missileMissChance,
    skillArmorPierce: combatSkill.armorPierce,
    skillIncomingDamageMul: combatSkill.incomingDamageMul,
    skillAuto,
  };
}

/** 실계정 닉네임 — 내 전함(궤도·HUD)에는 함선명 없이 닉네임만. */
function resolveLinkedAccountNicknameForFlagship(): string | null {
  const nick = usePlayerStore.getState().player?.nickname;
  if (typeof nick !== 'string') return null;
  const t = nick.trim();
  return t.length > 0 ? t : null;
}

/**
 * 궤도 마름모·전투 HUD 한 줄에 쓰는 이름 — 함선명은 넣지 않음.
 * - 내 전함: 계정 닉네임만
 * - 그 외: CSV 함장 표시명만(없으면 이동중 적만 `해적`, 나머지 `—`)
 */
function resolveCapitalAgentNameplateLabel(
  captainId: string | null,
  npcShipId: string | null,
  _shipName: string,
  csvCaptainDisplay: string | undefined,
  team: 'red' | 'blue' | 'orange',
  combatPlanetId: string,
): string {
  if (isPlayerFlagshipSlot(captainId, npcShipId, { combatPlanetId, team })) {
    const acc = resolveLinkedAccountNicknameForFlagship();
    if (acc) return acc;
    return '—';
  }
  const c = csvCaptainDisplay?.trim();
  if (c) return c;
  if (combatPlanetId === CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID && team === 'red') {
    return '해적';
  }
  return '—';
}

/** wallElapsed 기준 발사 타이머. 함장 테이블(combat 상태 + assignedShipId) 기준 전함 id를 우선 스폰. */
function initAgents(
  orbitSize: number,
  margin: number,
  wallBaseMs: number,
  spawnVariant: DuelSpawnVariant,
  combatPlanetId: string,
  combatSystemId: string | null,
  stageSlots: StageFleetSeedSlot[],
): Agent[] {
  const cx = orbitSize * 0.5;
  const cy = orbitSize * 0.5;
  const duelWide = initialSpawnDuelWidePositions(spawnVariant, cx, cy, margin, orbitSize);
  const dx = duelWide.x1 - duelWide.x0;
  const dy = duelWide.y1 - duelWide.y0;
  const len = Math.hypot(dx, dy) || 1e-6;
  const px = -dy / len;
  const py = dx / len;
  const agents: Agent[] = [];
  const redSlots = stageSlots.filter(s => s.team === 'red');
  const blueSlots = stageSlots.filter(s => s.team === 'blue');
  const orangeSlots = stageSlots.filter(s => s.team === 'orange');
  const playerBinding = resolvePlayerFlagshipCombatBinding();
  const isTransitCombat = combatPlanetId === CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID;
  const transitPlayerLevel = usePlayerStore.getState().player?.level ?? 1;
  const missionState = useMissionStore.getState();
  const questLock = resolveQuestCombatLock(missionState.progresses, missionState.activeMissionId);
  const questTransitSeedActive =
    isTransitCombat && shouldGuaranteeQuestTransitEncounter(questLock, combatSystemId);
  const questTransitHullPlanetId = questTransitSeedActive
    ? resolveQuestLockTransitHullPlanetId(questLock)
    : null;
  const questTransitLevel = questTransitSeedActive
    ? resolveQuestLockTransitEncounterLevel(questLock, transitPlayerLevel)
    : null;
  const transitHullAffinityPlanetId = questTransitHullPlanetId
    ?? (isTransitCombat
      ? (resolvePlayScenarioPrimaryPlanetId(combatSystemId) ?? combatPlanetId)
      : combatPlanetId);
  const transitEncounterLevel = questTransitLevel
    ?? (isTransitCombat
      ? resolveTransitCombatEncounterTargetLevel(combatSystemId, transitPlayerLevel)
      : resolveCombatEncounterTargetLevel(combatPlanetId, combatSystemId));
  let id = 0;
  for (let r = 0; r < redSlots.length; r++) {
    const slot = redSlots[r]!;
    const off = (r - (redSlots.length - 1) / 2) * FLEET_SLOT_SPACING_PX;
    const c = clampToOrbit({ x: duelWide.x0 + px * off, y: duelWide.y0 + py * off }, margin, orbitSize);
    const npc = slot.npcShipId ? getNpcCapitalShip(slot.npcShipId) : undefined;
    const runtimeConfig = slot.npcShipId
      ? NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV[slot.npcShipId]
      : undefined;
    const captainId = slot.captainId ?? npc?.captainId ?? null;
    const shipName = runtimeConfig?.displayName ?? npc?.name ?? `RED-${r + 1}`;
    const csvCaptainName = lookupSlotCaptainDisplayName(captainId);
    const nameplate = resolveCapitalAgentNameplateLabel(
      captainId,
      slot.npcShipId,
      shipName,
      csvCaptainName,
      'red',
      combatPlanetId,
    );
    const isPlayerSlot = isPlayerFlagshipSlot(captainId, slot.npcShipId, { combatPlanetId, team: 'red' });
    const agentBinding = resolveStageAgentCombatBinding({
      isPlayerSlot,
      npcShipId: slot.npcShipId,
      npcRow: npc,
      runtimeConfig,
      playerBinding,
    });
    let appliedCombatStats = agentBinding.combatStats;
    let appliedRuntimeConfig = agentBinding.runtimeConfig;
    let appliedName = isPlayerSlot ? (playerBinding?.displayName ?? nameplate) : nameplate;
    let appliedCaptainLabel = isPlayerSlot ? (resolveLinkedAccountNicknameForFlagship() ?? '—') : nameplate;
    let appliedEquipmentKnobs = agentBinding.equipmentAgentKnobs;
    const planetAffinity = resolvePlanetEnemyAffinityKind(transitHullAffinityPlanetId);
    // 아크코어 본진(endgame_boss) — 짝 유저의 복제 전함이 보스 리드 슬롯을 차지 (§16-A)
    const shadowBoss = !isPlayerSlot ? resolveArcCoreShadowBossOverride(combatPlanetId, r) : null;
    if (shadowBoss) {
      appliedCombatStats = shadowBoss.combatStats;
      appliedRuntimeConfig = {
        ...(appliedRuntimeConfig ?? {}),
        ...shadowBoss.runtimeOverride,
      } as typeof appliedRuntimeConfig;
      appliedEquipmentKnobs = shadowBoss.equipmentAgentKnobs;
      appliedName = shadowBoss.shipDisplayName;
      appliedCaptainLabel = shadowBoss.nameplateLabel;
    } else if (!isPlayerSlot) {
      const hostileLoadout = resolveHostileEnemyWeaponLoadout(r, transitEncounterLevel);
      appliedRuntimeConfig = {
        ...(appliedRuntimeConfig ?? {}),
        laserWeaponId: hostileLoadout.laserWeaponId,
        missileWeaponId: hostileLoadout.missileWeaponId,
      } as typeof appliedRuntimeConfig;
      if (appliedCombatStats) {
        const hullPlanetId = questTransitHullPlanetId
          ?? (combatPlanetId === CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID
            ? resolveTransitHostileHullScalePlanetId(combatSystemId, captainId)
            : combatPlanetId);
        appliedCombatStats = applyPlanetHostileHullScale(hullPlanetId, appliedCombatStats);
      }
    }
    agents.push(
      createCapitalAgentBase(
        id++,
        'red',
        combatPlanetId,
        { x: c.x, y: c.y, headingRad: duelWide.h0 },
        wallBaseMs,
        true,
        slot.npcShipId,
        captainId,
        appliedName,
        appliedCaptainLabel,
        appliedCombatStats,
        appliedRuntimeConfig,
        planetAffinity,
        appliedEquipmentKnobs,
      ),
    );
  }
  for (let b = 0; b < blueSlots.length; b++) {
    const slot = blueSlots[b]!;
    const off = (b - (blueSlots.length - 1) / 2) * FLEET_SLOT_SPACING_PX;
    const c = clampToOrbit({ x: duelWide.x1 + px * off, y: duelWide.y1 + py * off }, margin, orbitSize);
    const npc = slot.npcShipId ? getNpcCapitalShip(slot.npcShipId) : undefined;
    const runtimeConfig = slot.npcShipId
      ? NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV[slot.npcShipId]
      : undefined;
    const captainId = slot.captainId ?? npc?.captainId ?? null;
    const shipName = runtimeConfig?.displayName ?? npc?.name ?? `BLUE-${b + 1}`;
    const csvCaptainName = lookupSlotCaptainDisplayName(captainId);
    const nameplate = resolveCapitalAgentNameplateLabel(
      captainId,
      slot.npcShipId,
      shipName,
      csvCaptainName,
      'blue',
      combatPlanetId,
    );
    // 요청 기준: 플레이어 기함은 블루팀에 고정 배치.
    // 기존 슬롯 전함과 겹치지 않도록 slot[0]을 플레이어 전용으로 치환한다.
    const forcePlayerBlueSlot = b === 0 && !!playerBinding;
    const isPlayerSlot = forcePlayerBlueSlot
      || isPlayerFlagshipSlot(captainId, slot.npcShipId, { combatPlanetId, team: 'blue' });
    const agentBinding = resolveStageAgentCombatBinding({
      isPlayerSlot,
      npcShipId: isPlayerSlot ? null : slot.npcShipId,
      npcRow: npc,
      runtimeConfig,
      playerBinding,
    });
    const appliedCombatStats = agentBinding.combatStats;
    const appliedNpcShipId = isPlayerSlot ? null : slot.npcShipId;
    const appliedCaptainId = isPlayerSlot ? PLAYER_FLAGSHIP_CAPTAIN_ID : captainId;
    const testPatch = isPlayerSlot ? null : resolveDracoCombatTestRuntimePatch(appliedCaptainId);
    const appliedRuntimeConfig = testPatch
      ? ({ ...(agentBinding.runtimeConfig ?? {}), ...testPatch } as typeof agentBinding.runtimeConfig)
      : agentBinding.runtimeConfig;
    const appliedName = isPlayerSlot
      ? (playerBinding?.displayName ?? nameplate)
      : (testPatch?.displayName ?? nameplate);
    const appliedCaptainLabel = isPlayerSlot
      ? (resolveLinkedAccountNicknameForFlagship() ?? '—')
      : (testPatch?.displayName ?? nameplate);
    const playerLevel = usePlayerStore.getState().player?.level ?? 1;
    const blueAffinity = isPlayerSlot
      ? resolvePlayerHullAffinityKind(playerLevel)
      : 'light';
    agents.push(
      createCapitalAgentBase(
        id++,
        'blue',
        combatPlanetId,
        { x: c.x, y: c.y, headingRad: duelWide.h1 },
        wallBaseMs,
        false,
        appliedNpcShipId,
        appliedCaptainId,
        appliedName,
        appliedCaptainLabel,
        appliedCombatStats,
        appliedRuntimeConfig,
        blueAffinity,
        agentBinding.equipmentAgentKnobs,
      ),
    );
  }
  for (let o = 0; o < orangeSlots.length; o++) {
    const slot = orangeSlots[o]!;
    const ang = (-Math.PI / 2) + (Math.PI * 2 * o) / Math.max(1, orangeSlots.length);
    const r = Math.max(28, (orbitSize - margin * 2) * 0.33);
    const c = clampToOrbit(
      { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r },
      margin,
      orbitSize,
    );
    const npc = slot.npcShipId ? getNpcCapitalShip(slot.npcShipId) : undefined;
    const runtimeConfig = slot.npcShipId
      ? NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV[slot.npcShipId]
      : undefined;
    const captainId = slot.captainId ?? npc?.captainId ?? null;
    const shipName = runtimeConfig?.displayName ?? npc?.name ?? `ORANGE-${o + 1}`;
    const csvCaptainName = lookupSlotCaptainDisplayName(captainId);
    const nameplate = resolveCapitalAgentNameplateLabel(
      captainId,
      slot.npcShipId,
      shipName,
      csvCaptainName,
      'orange',
      combatPlanetId,
    );
    const isPlayerSlot = isPlayerFlagshipSlot(captainId, slot.npcShipId, { combatPlanetId, team: 'orange' });
    const agentBinding = resolveStageAgentCombatBinding({
      isPlayerSlot,
      npcShipId: slot.npcShipId,
      npcRow: npc,
      runtimeConfig,
      playerBinding,
    });
    const appliedCombatStats = agentBinding.combatStats;
    const appliedRuntimeConfig = agentBinding.runtimeConfig;
    const appliedName = isPlayerSlot ? (playerBinding?.displayName ?? nameplate) : nameplate;
    const appliedCaptainLabel = isPlayerSlot ? (resolveLinkedAccountNicknameForFlagship() ?? '—') : nameplate;
    agents.push(
      createCapitalAgentBase(
        id++,
        'orange',
        combatPlanetId,
        { x: c.x, y: c.y, headingRad: ang + Math.PI },
        wallBaseMs,
        false,
        slot.npcShipId,
        captainId,
        appliedName,
        appliedCaptainLabel,
        appliedCombatStats,
        appliedRuntimeConfig,
        'light',
        agentBinding.equipmentAgentKnobs,
      ),
    );
  }
  let playerAg: Agent | null = null;
  for (let i = 0; i < agents.length; i += 1) {
    if (agents[i]!.captainId === PLAYER_FLAGSHIP_CAPTAIN_ID) {
      playerAg = agents[i]!;
      break;
    }
  }
  if (playerAg?.skillAuto.wingmanOwned && playerBinding) {
    const policy = resolveSkillAutoCombatPolicy();
    const c = clampToOrbit(
      { x: playerAg.x + px * FLEET_SLOT_SPACING_PX, y: playerAg.y + py * FLEET_SLOT_SPACING_PX },
      margin,
      orbitSize,
    );
    const wingStats = {
      ...playerBinding.combatStats,
      maxHp: Math.max(1, Math.round(playerAg.maxHullHp * policy.wingmanHullMul)),
      maxShield: Math.max(0, Math.round(playerAg.maxShieldHp * policy.wingmanHullMul)),
    };
    agents.push(
      createCapitalAgentBase(
        id++,
        'blue',
        combatPlanetId,
        { x: c.x, y: c.y, headingRad: playerAg.headingRad },
        wallBaseMs,
        false,
        playerAg.npcShipId,
        PLAYER_WINGMAN_CAPTAIN_ID,
        '윙맨',
        '윙맨',
        wingStats,
        playerBinding.runtimeConfig,
        playerAg.enemyAffinityKind,
        playerBinding.equipmentAgentKnobs,
      ),
    );
  }
  if (playerAg) {
    const bind = resolvePlayerCombatSkillBind();
    const auraAlly = bind.auraAllyHit;
    const auraEnemy = bind.auraEnemyHit;
    for (let i = 0; i < agents.length; i += 1) {
      const a = agents[i]!;
      if (a.team === 'blue' && a.id !== playerAg.id) {
        a.attackBonusStat += bind.partyAttackBonus + auraAlly;
      } else if (a.team === 'red' || a.team === 'orange') {
        a.attackBonusStat = Math.max(0, a.attackBonusStat - auraEnemy);
      }
    }
    playerAg.attackBonusStat += auraAlly;
  }
  assignInitialCombatTargets(agents);
  return agents;
}

export type PlanetEdenRaidSim = {
  tMsRef: React.MutableRefObject<number>;
  fpsRef: React.MutableRefObject<number>;
  /** Orbit SVG 갱신 기준 렌더 추정 FPS(최종 합성 FPS가 아닌 UI 갱신 근사치) */
  renderFpsRef: React.MutableRefObject<number>;
  orbitSize: number;
  margin: number;
  agentsRef: React.MutableRefObject<Agent[]>;
  /** 시뮬 스텝마다 갱신 — 궤도 레이저 표시 등 읽기 전용 O(1) 표적 lookup */
  agentByIdSparseRef: React.MutableRefObject<(Agent | undefined)[]>;
  missilesRef: React.MutableRefObject<Missile[]>;
  /** STAGE3 드론·함재기 사전할당 풀 — persist 없음 */
  craftsRef: React.MutableRefObject<CapitalCraft[]>;
  missileHitFxRef: React.MutableRefObject<MissileHitFx[]>;
  /** 리스폰 카운트다운(초); HUD는 rAF에서 직접 읽는다 — setState 없음 */
  respawnCountdownSecRef: React.MutableRefObject<number | null>;
  /**
   * 시뮬 스텝 직후 호출 — Reanimated/Skia 궤도 레이어가 SharedValue 패킹으로 React setState 없이 갱신.
   * 언마운트 시 null로 비운다.
   */
  combatOrbitPostStepRef: React.MutableRefObject<(() => void) | null>;
  /**
   * 메인스테이지 출발(은하지도 이동) 시 sim 내부 진척을 `combatResumeStore`에 저장한다.
   * 호출 직후 활성 sim을 비활성으로 전환하면 같은 sessionKey 로 복귀했을 때 재개된다.
   * 활성 세션이 아니면 no-op.
   */
  captureSuspendSnapshot: (suspendedAtMs: number) => void;
  /**
   * 은하계 지도 출발 — rAF·Skia postStep·resume 스냅샷 즉시 halt (freezeOnBlur 레이스 방지).
   */
  haltForGalaxyDeparture: () => void;
};

/** Provider는 `PlanetEdenRaidSimBinder`가 감싼다. `StageShell` 밖에서 리렌더를 유발하지 않도록 sim만 전달한다. */
export const PlanetEdenRaidSimContext = createContext<PlanetEdenRaidSim | null>(null);

export function usePlanetEdenRaidSimContext(): PlanetEdenRaidSim | null {
  return useContext(PlanetEdenRaidSimContext);
}

export function usePlanetEdenRaidSim(
  orbitSize: number,
  active: boolean,
  paused: boolean,
  combatPlanetId: string | null,
  combatSystemId: string | null = null,
): PlanetEdenRaidSim {
  const cx = orbitSize / 2;
  const cy = orbitSize / 2;
  const margin = 14;

  /** 현재 스폰된 전함 에이전트 수 — 기세 판정·와이드 스폰 블렌드에 사용 */
  const expectedAgentCountRef = useRef(0);

  const tMsRef = useRef(0);
  const fpsRef = useRef(60);
  const renderFpsRef = useRef(60);
  const respawnCountdownSecRef = useRef<number | null>(null);
  const duelSpawnVariantRef = useRef<DuelSpawnVariant>(randomDuelSpawnVariant());
  // active=false 구간에는 무거운 에이전트 배열을 들고 있지 않음
  const agentsRef = useRef<Agent[]>([]);
  const missilesRef = useRef<Missile[]>([]);
  const craftsRef = useRef<CapitalCraft[]>(createCapitalCraftPool());
  const craftImpactScratchRef = useRef(createCapitalCraftImpactScratch(24));
  const missileHitFxRef = useRef<MissileHitFx[]>([]);
  const nextMissileId = useRef(0);
  const lastElapsedRef = useRef(0);
  const prevPtsRef = useRef<Pt[]>([]);
  /** `id` → 에이전트 — 매 시뮬 스텝마다 재구성, 미사일·표적 lookup O(1) */
  const agentByIdBuf = useRef<(Agent | undefined)[]>([]);
  const teamBucketsRef = useRef<TeamAgentBuckets>({ red: [], blue: [], orange: [] });
  const teamSlotByAgentIdRef = useRef<number[]>([]);
  const fpsAccumRef = useRef(0);
  const fpsSampleRef = useRef(0);
  const lastFpsUiUpdateRef = useRef(0);
  const nextTempoJudgeAtRef = useRef(0);
  /**
   * @deprecated 자동 리스폰 재교전 삭제(2026-07-27) — 항상 null. 레거시 resume 스냅샷
   * 타입 호환(`combatResumeStore`)을 위해서만 필드를 유지한다(실제 스케줄 없음).
   */
  const respawnAtWallRef = useRef<number | null>(null);
  /** 팀 승패 보상(함장 EXP) 중복 지급 방지 */
  const waveOutcomeAwardedRef = useRef(false);
  /** 전투 1회 내구도 마모 중복 방지 */
  const playerDurabilityWearAppliedRef = useRef(false);
  const battleEngageStartMsRef = useRef<number | null>(null);
  /** 플레이어 전함 격침 → 생존포드 1회 처리 */
  const playerCapitalDestroyedRef = useRef(false);
  /** 스폰·리스폰 구간 시작 `elapsed` */
  const wideSpawnLayoutFromElapsedRef = useRef(0);
  /** 스폰·리스폰 구간 끝 `elapsed` */
  const wideSpawnLayoutUntilElapsedRef = useRef(WIDE_SPAWN_LAYOUT_MS);
  /** 현재 유지 중인 전투 세션 키 — 행성+성계 (같은 화면 재포커스 시 재초기화 방지) */
  const sessionCombatKeyRef = useRef<string | null>(null);
  /** pause/resume 사이에 시뮬 시간축이 이어지도록 누적 elapsed(ms) */
  const elapsedCarryRef = useRef(0);
  const combatOrbitPostStepRef = useRef<(() => void) | null>(null);
  const combatTargetRingTickRef = useRef(0);
  const simLoopHaltedRef = useRef(false);
  /** 웨이브 전환 재시드 트리거 — 값이 바뀌면 같은 활성 세션에서 함대만 재초기화(Canvas 리마운트 없음) */
  const waveGenKey = useWaveDefenseStore((s) => s.waveGenKey);
  const lastWaveGenKeyRef = useRef(0);
  const waveLoseAlertHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (waveLoseAlertHoldTimerRef.current) {
        clearTimeout(waveLoseAlertHoldTimerRef.current);
        waveLoseAlertHoldTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!active || !combatPlanetId) return;
    const sessionKey = `${combatPlanetId}:${combatSystemId ?? ''}`;
    const waveReseed = waveGenKey !== lastWaveGenKeyRef.current;
    if (sessionCombatKeyRef.current === sessionKey && agentsRef.current.length > 0 && !waveReseed) {
      return;
    }
    lastWaveGenKeyRef.current = waveGenKey;
    /** 웨이브 전환(재시드)마다 module Path/Paint·hit-fx 캐시 회수 — 연속 웨이브 GL 누적 방지 */
    if (waveReseed) clearCapitalRealtimeCombatPresentationCaches();
    simLoopHaltedRef.current = false;
    sessionCombatKeyRef.current = sessionKey;
    /** 메인스테이지 출발(은하지도)로 안전 종료된 직후라면 같은 sessionKey 의 스냅샷이 있을 수 있다 — 1회 소비. */
    const resumeSnap = consumeCombatResumeSnapshotForSession(sessionKey);
    elapsedCarryRef.current = resumeSnap ? resumeSnap.elapsedMs : 0;
    duelSpawnVariantRef.current = resumeSnap
      ? resumeSnap.duelSpawnVariant
      : resolveDuelSpawnVariantForPlanet(combatPlanetId);
    const slots = resolveStageFleetSeedSlotsForPlanet(combatPlanetId, combatSystemId);
    expectedAgentCountRef.current = slots.length;
    agentsRef.current = initAgents(
      orbitSize,
      margin,
      resumeSnap ? resumeSnap.elapsedMs : 0,
      duelSpawnVariantRef.current,
      combatPlanetId,
      combatSystemId,
      slots,
    );
    if (resumeSnap) {
      applyCombatResumeSnapshotToAgents(agentsRef.current, resumeSnap);
    }
    missilesRef.current = [];
    nextMissileId.current = 0;
    missileHitFxRef.current = [];
    resetCapitalCraftPool(craftsRef.current);
    // 자동 리스폰 재교전 삭제 — 과거(레거시) 스냅샷에 남아있을 수 있는 값도 복원하지 않음
    respawnAtWallRef.current = null;
    respawnCountdownSecRef.current = null;
    lastElapsedRef.current = resumeSnap ? resumeSnap.elapsedMs : 0;
    tMsRef.current = resumeSnap ? resumeSnap.elapsedMs : 0;
    fpsRef.current = 60;
    renderFpsRef.current = 60;
    fpsAccumRef.current = 0;
    fpsSampleRef.current = 0;
    lastFpsUiUpdateRef.current = 0;
    nextTempoJudgeAtRef.current = (resumeSnap ? resumeSnap.elapsedMs : 0) + TEMPO_JUDGE_START_DELAY_MS;
    wideSpawnLayoutFromElapsedRef.current = resumeSnap ? resumeSnap.elapsedMs : 0;
    wideSpawnLayoutUntilElapsedRef.current = (resumeSnap ? resumeSnap.elapsedMs : 0) + WIDE_SPAWN_LAYOUT_MS;
    waveOutcomeAwardedRef.current = resumeSnap ? resumeSnap.waveOutcomeAwarded : false;
    battleEngageStartMsRef.current = null;
    playerCapitalDestroyedRef.current = false;
    const captainIds = agentsRef.current.map(a => a.captainId).filter((id): id is string => Boolean(id));
    if (captainIds.length > 0) {
      const s = useNpcCaptainProgressStore.getState();
      s.ensureCaptainsRegistered(captainIds);
      void s.persistNpcCaptainProgress();
    }
  }, [active, combatPlanetId, combatSystemId, margin, orbitSize, waveGenKey]);

  useEffect(() => {
    if (active) return;
    simLoopHaltedRef.current = true;
    combatOrbitPostStepRef.current = null;
    // 메인 스테이지 세션 종료 시에만 런타임 버퍼 해제
    missilesRef.current = [];
    nextMissileId.current = 0;
    missileHitFxRef.current = [];
    resetCapitalCraftPool(craftsRef.current);
    agentsRef.current = [];
    agentByIdBuf.current = [];
    prevPtsRef.current = [];
    respawnAtWallRef.current = null;
    respawnCountdownSecRef.current = null;
    waveOutcomeAwardedRef.current = false;
    battleEngageStartMsRef.current = null;
    playerCapitalDestroyedRef.current = false;
    sessionCombatKeyRef.current = null;
    elapsedCarryRef.current = 0;
  }, [active]);

  const pushCapitalProjectileMissile = useCallback((
    owner: Agent,
    weaponId: string,
    target: Pt,
    targetAgentId: number,
    elapsed: number,
    spreadIdx: number,
    salvoCount: number,
    flightSpeedPxPerMs: number,
  ) => {
    if (!weaponId.trim()) return;
    if (isCraftLoiterRuntimeActive(weaponId)) {
      const family = getCapitalWeaponRow(weaponId)?.familyKind;
      if (isCraftFamilyKind(family)) {
        const policy = getWeaponCraftLoiterPolicy(family, weaponId);
        const muzzle = laserMuzzleFromAgent(owner);
        const hx = Math.cos(owner.headingRad);
        const hy = Math.sin(owner.headingRad);
        const nx = -hy;
        const ny = hx;
        trySpawnCapitalCraftVolley(
          craftsRef.current,
          {
            family,
            ownerAgentId: owner.id,
            targetAgentId,
            weaponId,
            x: muzzle.x,
            y: muzzle.y,
            headingRad: owner.headingRad,
            speedPxPerMs: flightSpeedPxPerMs * policy.approachSpeedMul,
            policy,
          },
          nx,
          ny,
          9,
        );
        return;
      }
    }
    if (salvoCount <= 1) {
      const hasActive = missilesRef.current.some((m) => {
        if (m.ownerAgentId !== owner.id) return false;
        if (m.missileWeaponId !== weaponId) return false;
        if (m.hitApplied) return false;
        return elapsed - m.startMs < m.travelMs;
      });
      if (hasActive) return;
    }
    const curveSign: 1 | -1 = ((owner.id + targetAgentId + spreadIdx) & 1) === 0 ? 1 : -1;
    /** 발사구 — 선수는 레이저 전용, 로켓탄은 좌우 측면 교대(전함 공통 장착 위치) */
    const muzzle = isRocketFamilyWeapon(weaponId)
      ? rocketSideMuzzleFromAgent(owner, spreadIdx)
      : laserMuzzleFromAgent(owner);
    const spawn = buildCapitalProjectileSpawn({
      weaponId,
      p0: muzzle,
      aimCenter: { x: target.x, y: target.y },
      spreadIdx,
      salvoCount,
      flightSpeedPxPerMs,
      curveSign,
    });
    if (!spawn) return;
    missilesRef.current.push({
      id: nextMissileId.current++,
      startMs: elapsed,
      p0: spawn.p0,
      p1: spawn.p1,
      p2: spawn.p2,
      travelMs: spawn.travelMs,
      hitApplied: false,
      ownerAgentId: owner.id,
      targetAgentId,
      spreadLane: spawn.spreadLane,
      salvoCount: spawn.salvoCount,
      curveSign: spawn.curveSign,
      missileWeaponId: weaponId,
      lockImpactPoint: spawn.lockImpactPoint,
      missPassThrough: spawn.missPassThrough,
      isRocketProjectile: isRocketFamilyWeapon(weaponId),
      isNovaProjectile: isNovaAoeWeapon(weaponId),
    });
  }, []);

  const spawnSingleMissile = useCallback((
    owner: Agent,
    target: Pt,
    targetAgentId: number,
    elapsed: number,
    spreadIdx: number,
  ) => {
    pushCapitalProjectileMissile(
      owner,
      owner.missileWeaponId,
      target,
      targetAgentId,
      elapsed,
      spreadIdx,
      owner.missileSalvoCount,
      owner.missileFlightSpeedPxPerMs,
    );
  }, [pushCapitalProjectileMissile]);

  const spawnSingleCloseRangeRocket = useCallback((
    owner: Agent,
    target: Pt,
    targetAgentId: number,
    elapsed: number,
    spreadIdx: number,
  ) => {
    pushCapitalProjectileMissile(
      owner,
      owner.closeRangeWeaponId,
      target,
      targetAgentId,
      elapsed,
      spreadIdx,
      owner.closeRangeSalvoCount,
      owner.closeRangeFlightSpeedPxPerMs,
    );
  }, [pushCapitalProjectileMissile]);

  useEffect(() => {
    if (!active || paused) {
      return () => {};
    }
    let lastWallNowMs = performance.now();
    let raf = 0;
    const clampSkillPos = (x: number, y: number) => {
      skillClampScratch.x = clampOrbitCoord(x, margin, orbitSize);
      skillClampScratch.y = clampOrbitCoord(y, margin, orbitSize);
      return skillClampScratch;
    };
    const loop = () => {
      if (simLoopHaltedRef.current) return;
      const nowMs = performance.now();
      const rawDt = Math.max(0, nowMs - lastWallNowMs);
      lastWallNowMs = nowMs;
      const dt = Math.min(33, rawDt);
      const elapsed = lastElapsedRef.current + dt;
      lastElapsedRef.current = elapsed;
      COMBAT_SKILL_NOW_MS = elapsed;
      if (rawDt > 0) {
        fpsAccumRef.current += 1000 / rawDt;
        fpsSampleRef.current += 1;
      }

      const ringTick = ++combatTargetRingTickRef.current;
      const agents = agentsRef.current;
      const idBuf = agentByIdBuf.current;
      const maxAgentId = rebuildAgentIdSparseBuf(agents, idBuf);
      refillTeamBucketsWithSlots(agents, teamBucketsRef.current, teamSlotByAgentIdRef.current, maxAgentId);
      for (const ag of agents) {
        if (!ag.team) ag.team = ag.id % 2 === 0 ? 'red' : 'blue';
      }
      let playerAgent: Agent | null = null;
      for (let pi = 0; pi < agents.length; pi += 1) {
        const cand = agents[pi]!;
        if (isPlayerCombatAgent(cand)) {
          playerAgent = cand;
          break;
        }
      }
      if (playerAgent?.alive && playerAutoCombatSkillsNeedTick(playerAgent.skillAuto)) {
        const autoTick = tickPlayerAutoCombatSkills(
          playerAgent,
          agents,
          elapsed,
          clampSkillPos,
        );
        if (autoTick.emergencyWarpFlee) {
          playerCapitalDestroyedRef.current = true;
          respawnAtWallRef.current = null;
          respawnCountdownSecRef.current = null;
          for (let wi = 0; wi < agents.length; wi += 1) {
            if (agents[wi]!.captainId === PLAYER_WINGMAN_CAPTAIN_ID) {
              agents[wi]!.alive = false;
            }
          }
          if (useWaveDefenseStore.getState().active) {
            useWaveDefenseStore.getState().requestEndRun('lose');
          }
        }
      }
      if (
        playerAgent
        && !playerAgent.alive
        && !playerCapitalDestroyedRef.current
        && !playerAgent.skillAuto?.emergencyUsed
        && !isSurvivalPodNpcShipId(usePlayerStore.getState().player?.ship?.portraitNpcCapitalShipId)
      ) {
        playerCapitalDestroyedRef.current = true;
        respawnAtWallRef.current = null;
        respawnCountdownSecRef.current = null;
        // 웨이브 디펜스: 플레이어 격파 = 패배 종료(홀드 후 오퍼레이터 대사)
        if (useWaveDefenseStore.getState().active) {
          useWaveDefenseStore.getState().requestEndRun('lose');
        }
        const delayWaveLoseAlert = useWaveDefenseStore.getState().active
          || useWaveDefenseStore.getState().endHoldActive;
        const applyDestruction = () => {
          void usePlayerStore.getState().applyCapitalShipDestruction().then(() => {
            const presentDestroyAlert = () => {
              showArcAlert(
                t('combat.shipDestroyedTitle'),
                t('combat.shipDestroyedBody'),
              );
            };
            if (!delayWaveLoseAlert) {
              presentDestroyAlert();
              return;
            }
            if (waveLoseAlertHoldTimerRef.current) {
              clearTimeout(waveLoseAlertHoldTimerRef.current);
            }
            waveLoseAlertHoldTimerRef.current = setTimeout(() => {
              waveLoseAlertHoldTimerRef.current = null;
              presentDestroyAlert();
            }, COMBAT_END_HOLD_MS);
          });
        };
        if (!playerDurabilityWearAppliedRef.current) {
          playerDurabilityWearAppliedRef.current = true;
          void usePlayerStore.getState().applyPostCombatDurabilityWear(elapsed).then(applyDestruction);
        } else {
          applyDestruction();
        }
      }
      // 자동 리스폰 재교전 삭제(2026-07-27) — 전멸 후 재개는 쿨다운(waveCombatCooldownStore) 경유
      // 재착륙·재진입만 허용(웨이브 모드는 기존대로 컨트롤러가 처리).

      const { aliveRed, aliveBlue, aliveOrange, aliveCount } = recountAliveBattle(agents);
      const activeBattle = aliveOrange ? aliveCount >= 2 : aliveRed && aliveBlue;
      if (activeBattle) {
        waveOutcomeAwardedRef.current = false;
        playerDurabilityWearAppliedRef.current = false;
        if (battleEngageStartMsRef.current === null) {
          battleEngageStartMsRef.current = elapsed;
        }
      } else if (!waveOutcomeAwardedRef.current && (aliveRed || aliveBlue || aliveOrange)) {
        const participants = agents
          .map(a => a.captainId)
          .filter((id): id is string => Boolean(id));
        const winnerTeam = aliveOrange ? 'orange' : aliveRed ? 'red' : 'blue';
        const winners = agents
          .filter(a => a.team === winnerTeam)
          .map(a => a.captainId)
          .filter((id): id is string => Boolean(id));
        if (participants.length > 0) {
          const s = useNpcCaptainProgressStore.getState();
          s.grantBattleWaveResult(participants, winners);
          void s.persistNpcCaptainProgress();
          const hadPlayerCombat = agents.some((a) => isPlayerCombatAgent(a));
          if (hadPlayerCombat && !playerDurabilityWearAppliedRef.current) {
            playerDurabilityWearAppliedRef.current = true;
            void usePlayerStore.getState().applyPostCombatDurabilityWear(elapsed);
          }
          if (combatPlanetId) {
            const startMs = battleEngageStartMsRef.current ?? Math.max(0, elapsed - 32_000);
            void recordMatchSummary({
              planetId: combatPlanetId,
              systemId: combatSystemId,
              engageSec: Math.max(1, (elapsed - startMs) / 1000),
              playerWon: winnerTeam === 'blue',
            });
            // 아크코어 본진(endgame_boss) 격파 — 섀도우 정체 공개 (전투당 1회 · 본진 외 즉시 return)
            // 웨이브 디펜스 진행 중이면 마지막 웨이브 승리 시에만 공개(중간 웨이브 클리어로 조기 공개 방지)
            const wdForReveal = useWaveDefenseStore.getState();
            const isFinalWaveOrNonWave =
              !wdForReveal.active
              || wdForReveal.planetId !== combatPlanetId
              || wdForReveal.waveIndex >= WAVE_DEFENSE_MAX_WAVES;
            // 범용 재개 대기(2026-07-27) — 플레이어 참전 블루 승만.
            // 웨이브 중간 클리어(1~8)에서 mark하면 이후 패배해도 30분이 남는 회귀 → 허브·최종웨이브만.
            // 웨이브 전체 승리는 planet.tsx handleWaveDefenseRunEnded도 mark(중복 무해).
            if (winnerTeam === 'blue' && hadPlayerCombat && isFinalWaveOrNonWave) {
              markWaveCombatVictoryCooldown(combatPlanetId);
              const hubLock = resolveQuestCombatLock(
                useMissionStore.getState().progresses,
                useMissionStore.getState().activeMissionId,
              );
              applyDefeatEnemyMissionObjectives({
                venue: 'hub_orbit',
                planetId: combatPlanetId,
                enemyTemplateId: hubLock?.venue === 'hub_orbit' ? hubLock.templateId : null,
              });
              if (!wdForReveal.active) {
                tryPresentPendingMissionClearDialog();
              }
            }
            if (isFinalWaveOrNonWave) {
              maybeTriggerArcCoreShadowRevealOnCombatVictory(
                combatPlanetId,
                winnerTeam === 'blue',
              );
            }
          }
        }
        waveOutcomeAwardedRef.current = true;
        battleEngageStartMsRef.current = null;
        // 웨이브 디펜스: red 전멸(blue 승) → 컨트롤러에 클리어 신호(다음 웨이브 재장전)
        // red/orange 승 → 패배 종료(플레이어 격파 경로가 빗나가도 phase=combat 고착 방지)
        const wdOutcome = useWaveDefenseStore.getState();
        if (wdOutcome.active) {
          if (winnerTeam === 'blue') {
            wdOutcome.setPhase('cleared');
          } else {
            wdOutcome.requestEndRun('lose');
          }
        }
      }
      for (const ag of agents) {
        if (!ag.alive) continue;
        if (isPlayerCombatAgent(ag) && resolvePlayerStanceForAgent(ag) === 'DEFENSIVE') {
          const due = elapsed - ag.lastShieldRegenAtMs;
          if (due >= PLAYER_STANCE_SHIELD_REGEN_INTERVAL_MS) {
            const ticks = Math.floor(due / PLAYER_STANCE_SHIELD_REGEN_INTERVAL_MS);
            if (ticks > 0) {
              ag.shieldHp = Math.min(
                ag.maxShieldHp,
                ag.shieldHp + ticks * PLAYER_STANCE_SHIELD_REGEN_PER_TICK,
              );
              ag.lastShieldRegenAtMs += ticks * PLAYER_STANCE_SHIELD_REGEN_INTERVAL_MS;
            }
          }
        }
        if (
          isPlayerCombatAgent(ag)
          && ag.equipmentHullRegenPerTick > 0
          && ag.hullHp > 0
          && ag.hullHp < ag.maxHullHp
        ) {
          ag.hullHp = Math.min(
            ag.maxHullHp,
            ag.hullHp + ag.equipmentHullRegenPerTick,
          );
        }
        if (elapsed - ag.lastWeaponFireAtMs > WEAPON_STALL_RECOVERY_MS) {
          ag.stallChaseBoostUntilMs = elapsed + STALL_CHASE_BOOST_MS;
          ag.lastWeaponFireAtMs = elapsed;
        }
      }
      const prevPts = prevPtsRef.current;
      const prevPtsLen = maxAgentId < 0 ? 0 : maxAgentId + 1;
      writePrevAgentPts(prevPts, agents, prevPtsLen);
      if (
        activeBattle &&
        elapsed >= nextTempoJudgeAtRef.current &&
        expectedAgentCountRef.current > 0 &&
        agents.length === expectedAgentCountRef.current
      ) {
        const a0 = firstAliveLeadByTeam(agents, 'red');
        const a1 = firstAliveLeadByTeam(agents, 'blue');
        if (a0?.alive && a1?.alive && a0.team !== a1.team) {
          applyTempoJudge(a0, a1);
          propagateFleetTempoFromLeads(agents, a0, a1);
        }
        nextTempoJudgeAtRef.current = elapsed + TEMPO_JUDGE_INTERVAL_MS;
      }
      const duelWide = initialSpawnDuelWidePositions(
        duelSpawnVariantRef.current,
        cx,
        cy,
        margin,
        orbitSize,
      );
      for (const ag of agents) {
        if (!ag.alive) continue;
        const other = resolveCombatOpponent(ag, agents, idBuf, ringTick);
        if (!other) continue;
        const selfPrev = prevPts[ag.id] ?? { x: ag.x, y: ag.y };
        const otherPrev = prevPts[other.id] ?? { x: other.x, y: other.y };
        // 판단 계층(순수 모듈): 교전 단계 FSM·기세 우선 navStage·추격 가중·kite 정체
        // 상태기계를 일괄 판정. `ag.kiteDist*` 상태는 모듈이 in-place 갱신한다.
        maneuverInputBuf.elapsedMs = elapsed;
        maneuverInputBuf.pairDist = Math.hypot(
          selfPrev.x - otherPrev.x,
          selfPrev.y - otherPrev.y,
        );
        maneuverInputBuf.detectRangePx =
          combatDetectionRangePx(orbitSize, margin) * ag.detectRangeScale;
        maneuverInputBuf.bands = ag.rangeBands;
        maneuverInputBuf.speedPxPerMs = Math.hypot(ag.vx, ag.vy);
        maneuverInputBuf.teamSlot = teamSlotByAgentIdRef.current[ag.id] ?? 0;
        maneuverInputBuf.weaponProfileReady = true;
        maneuverInputBuf.hasMissile =
          ag.missileSalvoCount > 0 && ag.missileWeaponId.trim().length > 0;
        maneuverInputBuf.hasLaser = ag.laserWeaponId.trim().length > 0 && ag.laserEngageRangePx > 0;
        maneuverInputBuf.hasClose =
          ag.closeRangeSalvoCount > 0 && ag.closeRangeWeaponId.trim().length > 0;
        maneuverInputBuf.selfHeadingRad = ag.headingRad;
        maneuverInputBuf.enemyHeadingRad = other.headingRad;
        maneuverInputBuf.bearingToEnemyRad = Math.atan2(
          otherPrev.y - selfPrev.y,
          otherPrev.x - selfPrev.x,
        );
        maneuverInputBuf.maneuverSeed = ag.id;
        const decision = resolveCapitalManeuverDecision(ag, maneuverInputBuf, maneuverDecisionBuf);
        let P = compositeNavigatePose(
          ag.id,
          Math.max(0, elapsed - ag.engageStartDelayMs) + ag.behaviorTimeOffsetMs,
          selfPrev,
          otherPrev,
          cx,
          cy,
          margin,
          orbitSize,
          decision.chaseWeight,
          decision.navStage,
          ag.tempoRole,
          ag.kiteEvasionMode,
          ag.rangeBands,
          decision.standoffRingOffsetPx,
          other.headingRad,
          decision.bearingGoal,
          decision.employBand,
          decision.holdPairDistPx,
        );
        if (
          activeBattle &&
          elapsed < wideSpawnLayoutUntilElapsedRef.current &&
          expectedAgentCountRef.current > 0 &&
          agents.length === expectedAgentCountRef.current
        ) {
          const from = wideSpawnLayoutFromElapsedRef.current;
          const until = wideSpawnLayoutUntilElapsedRef.current;
          const span = Math.max(1e-6, until - from);
          const rawT = (elapsed - from) / span;
          const anchor = fleetWideBlendAnchorPose(
            duelWide,
            ag,
            teamBucketsRef.current,
            teamSlotByAgentIdRef.current,
            margin,
            orbitSize,
          );
          P = blendAgentPose(
            anchor.x,
            anchor.y,
            anchor.headingRad,
            P,
            rawT,
            cy,
            CAPITAL_SCENE_ORBIT_ELLIPSE_Y_MUL,
          );
        }
        // 진형 공급자(독트린 formationType) — 리드 기준 슬롯 앵커로 목표 포즈를 응집 블렌드.
        // default 독트린은 cohesion=0 이라 현행과 완전 동일. 리드 자신·kite 후진 중엔 미적용.
        if (
          ag.doctrine.formationType === 'line' &&
          ag.doctrine.formationCohesion > 0 &&
          !decision.openingReverseOnly
        ) {
          const lead = firstAliveLeadByTeam(agents, ag.team);
          const slotForFormation = teamSlotByAgentIdRef.current[ag.id] ?? 0;
          if (lead && lead.id !== ag.id && slotForFormation > 0) {
            const anchor = resolveLineFormationAnchor(
              formationAnchorBuf,
              lead,
              slotForFormation,
              ag.doctrine.formationSpacingPx,
              margin,
              orbitSize,
            );
            const w = ag.doctrine.formationCohesion;
            P.x = P.x * (1 - w) + anchor.x * w;
            P.y = P.y * (1 - w) + anchor.y * w;
            P.headingRad = lerpAngleRad(P.headingRad, anchor.headingRad, w * 0.5);
          }
        }
        const kiteReverseCurve: KiteStandoffReverseCurve | null = decision.openingReverseOnly
          ? {
              enemyX: other.x,
              enemyY: other.y,
              turnSign: decision.kiteReverseTurnSign,
            }
          : null;

        if (decision.kiteDistResumeAdvance) {
          const hChase =
            Math.hypot(other.x - ag.x, other.y - ag.y) < 1e-8
              ? ag.headingRad
              : Math.atan2(other.y - ag.y, other.x - ag.x);
          integrateAgentKinematics(
            ag,
            other.x,
            other.y,
            hChase,
            dt,
            elapsed,
            margin,
            orbitSize,
            false,
            null,
            resolvePlayerStanceMoveSpeedMult(ag),
          );
        } else {
          integrateAgentKinematics(
            ag,
            P.x,
            P.y,
            P.headingRad,
            dt,
            elapsed,
            margin,
            orbitSize,
            decision.openingReverseOnly,
            kiteReverseCurve,
            resolvePlayerStanceMoveSpeedMult(ag),
          );
        }
      }
      resolveCapitalShipOverlaps(agents, MIN_CAPITAL_CENTER_SEP_PX, margin, orbitSize);

      for (const m of missilesRef.current) {
        if (m.hitApplied) continue;
        if (m.lockImpactPoint) continue;
        const tgt = idBuf[m.targetAgentId];
        if (tgt?.alive) retargetMissileBezier(m, { x: tgt.x, y: tgt.y });
      }

      for (const ag of agents) {
        const other = resolveCombatOpponent(ag, agents, idBuf, ringTick);
        if (!ag.alive || !other?.alive) continue;
        if (elapsed < ag.engageStartDelayMs) continue;
        const dist = Math.hypot(other.x - ag.x, other.y - ag.y);
        const inLaserRange = dist <= ag.laserEngageRangePx;
        const inAttackArc = targetInCapitalFrontAttackArc(ag, other);
        const laserReady = elapsed >= ag.nextFireMs;
        const allowLaser = capitalWeaponFireAllowed(
          ag.employBand,
          ag.preferredWeapon,
          'laser',
          ag.stalemateWeaponLock,
        );
        const allowMissile = capitalWeaponFireAllowed(
          ag.employBand,
          ag.preferredWeapon,
          'missile',
          ag.stalemateWeaponLock,
        );
        const allowClose = capitalWeaponFireAllowed(
          ag.employBand,
          ag.preferredWeapon,
          'close',
          ag.stalemateWeaponLock,
        );
        // 규칙: 쿨다운 + 사거리 + 전방 120° 부채꼴 + 함장 우선 무기 게이트
        if (laserReady && inLaserRange && inAttackArc && allowLaser) {
          ag.nextFireMs = elapsed + ag.laserRechargeMs + ag.laserCooldownJitterMs;
          ag.lastLaserStartMs = elapsed;
          ag.lastWeaponFireAtMs = elapsed;
          ag.stallChaseBoostUntilMs = 0;
          const laserOutcome = resolveAgentAttackOutcome(ag, other);
          /** 레이저는 발사 시점에 즉시 1회 판정/타격 */
          if (laserOutcome > 0) {
            const rawLaserDamage = rollAgentWeaponDamage(ag, other, 'laser', laserOutcome);
            const laserFx = getWeaponSpecialFxPolicy(ag.laserWeaponId);
            const hullDamage = applyAgentIncomingDamage(
              other,
              rawLaserDamage,
              ag.attackBonusStat,
              laserFx?.ignoreShield ?? false,
              laserFx?.ignoreArmor ?? false,
              ag.skillArmorPierce,
              ag.skillAuto?.shieldPenPct ?? 0,
              ag.skillAuto?.sneakAttackMul ?? 1,
              ag.skillAuto,
            );
            applyHitKnockback(other, { x: ag.x, y: ag.y }, Math.max(1, hullDamage), margin, orbitSize);
            applyMultiLockExtraHits(ag, other.id, agents, (extra) => {
              applyAgentIncomingDamage(
                extra,
                rawLaserDamage,
                ag.attackBonusStat,
                laserFx?.ignoreShield ?? false,
                laserFx?.ignoreArmor ?? false,
                ag.skillArmorPierce,
                ag.skillAuto?.shieldPenPct ?? 0,
              );
              if (extra.hullHp <= 0) finalizeShipDestroyed(extra, ag, elapsed);
            });
            if (laserFx) {
              applySpecialWeaponStatusOnAgent(other, laserFx, elapsed);
              applySpecialWeaponAoeAroundPoint({
                owner: ag,
                agents,
                impactPoint: { x: other.x, y: other.y },
                elapsedMs: elapsed,
                weaponId: ag.laserWeaponId,
                skipAgentId: other.id,
                damageSlot: 'laser',
                applyIncomingDamage: applyAgentIncomingDamage,
                rollDamage: rollAgentWeaponDamage,
                resolveAttackOutcome: resolveAgentAttackOutcome,
                finalizeDestroyed: finalizeShipDestroyed,
              });
            }
            missileHitFxRef.current.push({
              id: 1000000 + ag.id * 1000 + other.id,
              x: other.x,
              y: other.y,
              startMs: elapsed,
              color: laserFx?.tintHex || other.stroke || '#94A3B8',
              missileWeaponId: ag.laserWeaponId,
              ownerTeam: ag.team,
              effectKind: 'laser_dodge',
            });
          }
          if (other.hullHp <= 0) {
            finalizeShipDestroyed(other, ag, elapsed);
          }
        }

        const effectiveMissileSalvoCount = Math.max(
          1,
          ag.missileSalvoCount + resolvePlayerStanceMissileSalvoDelta(ag),
        );
        const canFireMissile = ag.missileSalvoCount > 0 && ag.missileWeaponId.trim().length > 0;
        const inMissileRange =
          canFireMissile &&
          dist > ag.rangeBands.laserBrawlOuterPx &&
          dist <= ag.missileMaxRangePx + CAPITAL_MISSILE_RANGE_LOOSEN_PX &&
          dist <= combatDetectionRangePx(orbitSize, margin) * ag.detectRangeScale + 8;
        const missileSalvoReady = elapsed >= ag.nextMissileSalvoAt;
        if (
          ag.activeSalvoBaseMs === null &&
          missileSalvoReady &&
          inMissileRange &&
          inAttackArc &&
          allowMissile
        ) {
          ag.activeSalvoBaseMs = elapsed;
          ag.activeSalvoNextShotAtMs = elapsed;
          ag.salvoSpawned = 0;
        }
        if (ag.activeSalvoBaseMs !== null) {
          /** 살보 개시 시점에만 부채꼴 검사(`inAttackArc`). 이후 탄은 같은 살보로 발사 완료 — 스폰 직후 선회로 2·3발이 끊기는 현상 방지.
           * 연출 안정화를 위해 프레임당 최대 1발만 생성한다(프레임 드랍 시 2~3발 동시 팝인 방지). */
          const nextShotDueAt = ag.activeSalvoNextShotAtMs ?? ag.activeSalvoBaseMs;
          if (ag.salvoSpawned < effectiveMissileSalvoCount && elapsed >= nextShotDueAt) {
            spawnSingleMissile(
              ag,
              { x: other.x, y: other.y },
              other.id,
              elapsed,
              ag.salvoSpawned,
            );
            ag.lastWeaponFireAtMs = elapsed;
            ag.stallChaseBoostUntilMs = 0;
            ag.salvoSpawned += 1;
            ag.activeSalvoNextShotAtMs = elapsed + ag.missileSalvoIntervalMs;
          }
          if (ag.salvoSpawned >= effectiveMissileSalvoCount) {
            ag.nextMissileSalvoAt =
              ag.activeSalvoBaseMs + ag.missileFireIntervalMs + ag.missileCooldownJitterMs;
            ag.activeSalvoBaseMs = null;
            ag.activeSalvoNextShotAtMs = null;
            ag.salvoSpawned = 0;
            ag.longRangeSalvoSpent += 1;
          } else if (
            elapsed >
            ag.activeSalvoBaseMs +
              effectiveMissileSalvoCount * ag.salvoStepMs +
              MISSILE_SALVO_STALL_ABORT_GRACE_MS
          ) {
            ag.nextMissileSalvoAt =
              elapsed + ag.missileFireIntervalMs * 0.42 + ag.missileCooldownJitterMs;
            ag.activeSalvoBaseMs = null;
            ag.activeSalvoNextShotAtMs = null;
            ag.salvoSpawned = 0;
          }
        }

        const canFireCloseRange =
          ag.closeRangeSalvoCount > 0 && ag.closeRangeWeaponId.trim().length > 0;
        const inCloseRange =
          canFireCloseRange &&
          dist <= ag.closeRangeMaxRangePx + CAPITAL_MISSILE_RANGE_LOOSEN_PX &&
          inAttackArc;
        const closeRangeSalvoReady = elapsed >= ag.nextCloseRangeSalvoAt;
        if (
          ag.activeCloseRangeSalvoBaseMs === null &&
          closeRangeSalvoReady &&
          inCloseRange &&
          allowClose
        ) {
          ag.activeCloseRangeSalvoBaseMs = elapsed;
          ag.activeCloseRangeNextShotAtMs = elapsed;
          ag.closeRangeSalvoSpawned = 0;
        }
        if (ag.activeCloseRangeSalvoBaseMs !== null) {
          const closeSalvoCount = Math.max(1, ag.closeRangeSalvoCount);
          const nextCloseShotDueAt =
            ag.activeCloseRangeNextShotAtMs ?? ag.activeCloseRangeSalvoBaseMs;
          if (ag.closeRangeSalvoSpawned < closeSalvoCount && elapsed >= nextCloseShotDueAt) {
            spawnSingleCloseRangeRocket(
              ag,
              { x: other.x, y: other.y },
              other.id,
              elapsed,
              ag.closeRangeSalvoSpawned,
            );
            ag.lastWeaponFireAtMs = elapsed;
            ag.stallChaseBoostUntilMs = 0;
            ag.closeRangeSalvoSpawned += 1;
            ag.activeCloseRangeNextShotAtMs = elapsed + ag.closeRangeSalvoIntervalMs;
          }
          if (ag.closeRangeSalvoSpawned >= closeSalvoCount) {
            ag.nextCloseRangeSalvoAt =
              ag.activeCloseRangeSalvoBaseMs
              + ag.closeRangeFireIntervalMs
              + ag.missileCooldownJitterMs;
            ag.activeCloseRangeSalvoBaseMs = null;
            ag.activeCloseRangeNextShotAtMs = null;
            ag.closeRangeSalvoSpawned = 0;
          } else if (
            elapsed >
            ag.activeCloseRangeSalvoBaseMs
              + closeSalvoCount * ag.salvoStepMs
              + MISSILE_SALVO_STALL_ABORT_GRACE_MS
          ) {
            ag.nextCloseRangeSalvoAt =
              elapsed + ag.closeRangeFireIntervalMs * 0.42 + ag.missileCooldownJitterMs;
            ag.activeCloseRangeSalvoBaseMs = null;
            ag.activeCloseRangeNextShotAtMs = null;
            ag.closeRangeSalvoSpawned = 0;
          }
        }
      }

      const craftScratch = craftImpactScratchRef.current;
      const craftsNow = craftsRef.current;
      if (!anyCapitalCraftAlive(craftsNow)) {
        craftScratch.count = 0;
      } else {
      tickCapitalCrafts(craftsNow, dt, idBuf, craftScratch);
      for (let ci = 0; ci < craftsNow.length; ci++) {
        const craft = craftsNow[ci]!;
        if (!craft.alive || !craft.interceptMissiles) continue;
        for (let mi = 0; mi < missilesRef.current.length; mi++) {
          const incoming = missilesRef.current[mi]!;
          if (incoming.hitApplied || incoming.missPassThrough) continue;
          if (incoming.targetAgentId !== craft.ownerAgentId) continue;
          if (incoming.ownerAgentId === craft.ownerAgentId) continue;
          const u = Math.min(
            1,
            Math.max(0, (elapsed - incoming.startMs) / Math.max(1, incoming.travelMs)),
          );
          const pos = writeQuadBezierInto(
            interceptBezierScratch,
            incoming.p0,
            incoming.p1,
            incoming.p2,
            u,
          );
          if (Math.hypot(pos.x - craft.x, pos.y - craft.y) <= 18) {
            incoming.hitApplied = true;
            incoming.missPassThrough = true;
          }
        }
      }
      for (let ci = 0; ci < craftScratch.count; ci++) {
        const ev = craftScratch.events[ci]!;
        const owner = idBuf[ev.ownerAgentId];
        const victim = idBuf[ev.targetAgentId];
        if (victim?.alive && owner) {
          applyCapitalCraftHitToAgent(owner, victim, ev, elapsed, margin, orbitSize);
        }
        if (ev.aoeRadiusPx > 0 && owner) {
          for (let ai = 0; ai < agents.length; ai++) {
            const other = agents[ai]!;
            if (!other.alive || other.id === ev.targetAgentId) continue;
            if (other.team === owner.team) continue;
            if (Math.hypot(other.x - ev.x, other.y - ev.y) > ev.aoeRadiusPx) continue;
            applyCapitalCraftHitToAgent(owner, other, ev, elapsed, margin, orbitSize);
          }
        }
        missileHitFxRef.current.push({
          id: nextMissileId.current++,
          x: ev.x,
          y: ev.y,
          startMs: elapsed,
          color: victim?.stroke ?? '#94A3B8',
          missileWeaponId: ev.weaponId,
          ownerTeam: owner?.team,
          effectKind: ev.family === 'drone' ? 'drone_burst' : 'carrier_bomb',
        });
      }
      }

      for (const m of missilesRef.current) {
        if (m.hitApplied) continue;
        if (elapsed - m.startMs < m.travelMs) continue;
        m.hitApplied = true;
        /** 탄착분포 미스탄 — 표적 뒤로 통과 완료. 피해·폭발 FX 없이 소멸 */
        if (m.missPassThrough) continue;
        const owner = idBuf[m.ownerAgentId];
        const victim = idBuf[m.targetAgentId];
        const isNova = m.isNovaProjectile;
        const impactPoint: Pt =
          isNova || m.lockImpactPoint
            ? { x: m.p2.x, y: m.p2.y }
            : victim?.alive
              ? { x: victim.x, y: victim.y }
              : { x: m.p2.x, y: m.p2.y };
        const impactResult = resolveCapitalWeaponImpact({
          owner,
          primaryVictim: victim?.alive ? victim : undefined,
          impactPoint,
          missile: m,
          agents,
          elapsedMs: elapsed,
          orbitSize,
          margin,
          rollDamage: rollAgentWeaponDamage,
          resolveAttackOutcome: resolveAgentAttackOutcome,
          applyIncomingDamage: applyAgentIncomingDamage,
          applyKnockback: applyHitKnockback,
          finalizeDestroyed: finalizeShipDestroyed,
          missiles: missilesRef.current,
        });
        missileHitFxRef.current.push({
          id: m.id,
          ...impactResult.hitFx,
        });
        if (impactResult.skipDefaultMissileDamage) {
          continue;
        }
        if (victim?.alive) {
          if (owner) {
            const missileOutcome = resolveAgentAttackOutcome(owner, victim, 'missile');
            if (missileOutcome > 0) {
              const missileRawDamage = rollAgentWeaponDamage(owner, victim, 'missile', missileOutcome);
              const missileFx = getWeaponSpecialFxPolicy(m.missileWeaponId);
              const hullDamage = applyAgentIncomingDamage(
                victim,
                missileRawDamage,
                owner.attackBonusStat,
                missileFx?.ignoreShield ?? false,
                missileFx?.ignoreArmor ?? false,
                owner.skillArmorPierce,
                owner.skillAuto?.shieldPenPct ?? 0,
                owner.skillAuto?.sneakAttackMul ?? 1,
                owner.skillAuto,
              );
              applyHitKnockback(victim, m.p0, Math.max(1, hullDamage), margin, orbitSize);
              applyMultiLockExtraHits(owner, victim.id, agents, (extra) => {
                applyAgentIncomingDamage(
                  extra,
                  missileRawDamage,
                  owner.attackBonusStat,
                  missileFx?.ignoreShield ?? false,
                  missileFx?.ignoreArmor ?? false,
                  owner.skillArmorPierce,
                  owner.skillAuto?.shieldPenPct ?? 0,
                );
                if (extra.hullHp <= 0) finalizeShipDestroyed(extra, owner, elapsed);
              });
            }
          }
          if (owner) {
            // no-op: 모듈 효과는 위에서 공통 처리
          }
          if (victim.hullHp <= 0) {
            finalizeShipDestroyed(victim, owner, elapsed);
          }
        }
      }
      compactMissilesInPlace(missilesRef.current, elapsed);
      compactHitFxInPlace(missileHitFxRef.current, elapsed);

      if (fpsSampleRef.current >= 20 && elapsed - lastFpsUiUpdateRef.current >= 240) {
        const avg = fpsAccumRef.current / Math.max(1, fpsSampleRef.current);
        fpsRef.current = Math.round(avg);
        renderFpsRef.current = fpsRef.current;
        fpsAccumRef.current = 0;
        fpsSampleRef.current = 0;
        lastFpsUiUpdateRef.current = elapsed;
      }

      tMsRef.current = elapsed;
      combatOrbitPostStepRef.current?.();
      if (simLoopHaltedRef.current) return;
      raf = requestAnimationFrame(loop);
    };
    lastElapsedRef.current = elapsedCarryRef.current;
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      elapsedCarryRef.current = lastElapsedRef.current;
    };
  }, [active, paused, cx, cy, margin, orbitSize, spawnSingleMissile, spawnSingleCloseRangeRocket]);

  const captureSuspendSnapshot = useCallback((suspendedAtMs: number) => {
    const sessionKey = sessionCombatKeyRef.current;
    const agents = agentsRef.current;
    if (!sessionKey || agents.length === 0) return;
    captureCombatResumeSnapshot({
      sessionKey,
      elapsedMs: lastElapsedRef.current,
      agents,
      respawnAtElapsedMs: respawnAtWallRef.current,
      waveOutcomeAwarded: waveOutcomeAwardedRef.current,
      duelSpawnVariant: duelSpawnVariantRef.current,
      suspendedAtMs,
    });
  }, []);

  const haltForGalaxyDeparture = useCallback(() => {
    simLoopHaltedRef.current = true;
    combatOrbitPostStepRef.current = null;
    missilesRef.current = [];
    missileHitFxRef.current = [];
    resetCapitalCraftPool(craftsRef.current);
    agentsRef.current = [];
    agentByIdBuf.current = [];
    prevPtsRef.current = [];
    respawnAtWallRef.current = null;
    respawnCountdownSecRef.current = null;
    sessionCombatKeyRef.current = null;
    elapsedCarryRef.current = 0;
    lastElapsedRef.current = 0;
    tMsRef.current = 0;
    clearCombatResumeSnapshot();
    clearCapitalRealtimeCombatPresentationCaches();
  }, []);

  return useMemo(
    () => ({
      tMsRef,
      fpsRef,
      renderFpsRef,
      orbitSize,
      margin,
      agentsRef,
      agentByIdSparseRef: agentByIdBuf,
      missilesRef,
      craftsRef,
      missileHitFxRef,
      respawnCountdownSecRef,
      combatOrbitPostStepRef,
      captureSuspendSnapshot,
      haltForGalaxyDeparture,
    }),
    [orbitSize, captureSuspendSnapshot, haltForGalaxyDeparture],
  );
}

export function PlanetEdenRaidSimBinder({
  orbitSize,
  active,
  paused = false,
  combatPlanetId,
  combatSystemId = null,
  children,
}: {
  orbitSize: number;
  active: boolean;
  /** true면 전투 상태는 유지하고 시뮬 루프만 일시정지 */
  paused?: boolean;
  /** 실시간 교전 함장 테이블 조회용 행성 id — `active`일 때 필수 */
  combatPlanetId: string | null;
  /** 함장 CSV의 activitySystemIds / baseSystemId 매칭용 — 권장 */
  combatSystemId?: string | null;
  children: React.ReactNode;
}) {
  const sim = usePlanetEdenRaidSim(orbitSize, active, paused, combatPlanetId, combatSystemId);
  const value = active ? sim : null;
  const setOrbitCombatUiActive = useOrbitCapitalCombatUiStore((s) => s.setActive);

  useEffect(() => {
    setOrbitCombatUiActive(active);
    return () => setOrbitCombatUiActive(false);
  }, [active, setOrbitCombatUiActive]);

  useEffect(() => {
    if (active) return;
    clearCapitalRealtimeCombatPresentationCaches();
  }, [active]);

  return (
    <PlanetEdenRaidSimContext.Provider value={value}>{children}</PlanetEdenRaidSimContext.Provider>
  );
}

/** Skia 단일 렌더 — 레거시 SVG+rAF(PlanetEdenRaidOrbitSvgRafCombat) 제거됨. */

export function PlanetEdenRaidOrbitSvg({
  sim: simOverride,
  renderMissileDodgeFx = true,
}: {
  sim?: PlanetEdenRaidSim;
  renderMissileDodgeFx?: boolean;
}) {
  const fromCtx = useContext(PlanetEdenRaidSimContext);
  const sim = simOverride ?? fromCtx;
  if (!sim) return null;
  return <PlanetEdenRaidOrbitSkiaCombat sim={sim} renderMissileDodgeFx={renderMissileDodgeFx} />;
}

/** 전함 수가 늘수록 HUD 텍스트 `setState` 주기를 늘려 JS 부담을 줄인다. */
function hudCombatLogStrideFrames(agentCount: number): number {
  return Math.min(10, Math.max(4, Math.floor(Math.max(1, agentCount) * 1.5)));
}

type CombatHudLogSnapshot = {
  respawnLine: string | null;
  skillProcLine: string | null;
  agentLines: Array<{
    agId: number;
    main: string;
    tempo: string;
    showTempo: boolean;
    tempoPress: boolean;
  }>;
};

function buildCombatHudLogSnapshot(sim: PlanetEdenRaidSim): CombatHudLogSnapshot {
  const { tMsRef, orbitSize, margin, agentsRef, respawnCountdownSecRef } = sim;
  const nowMs = tMsRef.current;
  const agents = agentsRef.current;
  rebuildAgentIdSparseBuf(agents, HUD_SCRATCH_AGENT_ID_BUF);
  const idBuf = HUD_SCRATCH_AGENT_ID_BUF;
  const respSec = respawnCountdownSecRef.current;
  const respawnLine = respSec === null ? null : `리스폰 ${respSec}s (테스트)`;
  let skillProcLine: string | null = null;
  for (let i = 0; i < agents.length; i += 1) {
    const ag = agents[i];
    if (!ag || !isPlayerCombatAgent(ag)) continue;
    const label = readSkillProcLabel(ag, nowMs);
    if (label) skillProcLine = label;
    break;
  }
  const agentLines: CombatHudLogSnapshot['agentLines'] = [];
  const nAgents = agents.length;
  for (let i = 0; i < nAgents; i++) {
    if (agentLines.length >= COMBAT_HUD_LOG_MAX_AGENT_LINES) break;
    const ag = agents[i];
    if (!ag) {
      agentLines.push({
        agId: i,
        main: '',
        tempo: '',
        showTempo: false,
        tempoPress: true,
      });
      continue;
    }
    if (!ag.alive) {
      agentLines.push({
        agId: ag.id,
        main: `${ag.displayName} 격침`,
        tempo: '',
        showTempo: false,
        tempoPress: true,
      });
      continue;
    }
    const enemy = currentTargetAliveByBuf(ag, idBuf);
    const dist = enemy ? Math.hypot(enemy.x - ag.x, enemy.y - ag.y) : 0;
    const laserCd = Math.max(0, ag.nextFireMs - nowMs);
    const missileCd =
      ag.activeSalvoBaseMs !== null ? 0 : Math.max(0, ag.nextMissileSalvoAt - nowMs);
    const detectR = combatDetectionRangePx(orbitSize, margin) * ag.detectRangeScale;
    const baseStage = combatMotionStageFromDist(dist, detectR, ag.rangeBands);
    const navStage = ag.tempoRole === 'kite' ? 'missile_reposition' : baseStage;
    const tail = ` ${employBandLabelKo(ag.employBand)}/${combatStageLabelKo(navStage)} 거리 ${Math.round(dist)} L ${(
      laserCd / 1000
    ).toFixed(1)}s M ${(missileCd / 1000).toFixed(1)}s`;
    const press = ag.tempoRole === 'press';
    agentLines.push({
      agId: ag.id,
      main: `${ag.displayName} HP ${ag.hullHp}/${ag.maxHullHp} SH ${ag.shieldHp}/${ag.maxShieldHp}${tail}`,
      tempo: press ? '  +' : '  -',
      showTempo: true,
      tempoPress: press,
    });
  }
  return { respawnLine, skillProcLine, agentLines };
}

export function PlanetEdenRaidCombatHudOverlay({
  sim: simOverride,
  style,
}: {
  sim?: PlanetEdenRaidSim;
  style?: ViewStyle;
}) {
  const fromCtx = useContext(PlanetEdenRaidSimContext);
  const sim = simOverride ?? fromCtx;
  const [renderFpsDisplay, setRenderFpsDisplay] = useState(() => sim?.renderFpsRef.current ?? 60);
  const [logHud, setLogHud] = useState<CombatHudLogSnapshot>(() =>
    sim ? buildCombatHudLogSnapshot(sim) : { respawnLine: null, skillProcLine: null, agentLines: [] },
  );
  /** 접힘: 상단 FPS만 표시. 펼침: 전투 로그 전체 — 기본은 접힘 */
  const [hudLogExpanded, setHudLogExpanded] = useState(false);

  useEffect(() => {
    if (!sim) return;
    setRenderFpsDisplay(sim.renderFpsRef.current);
    setLogHud(buildCombatHudLogSnapshot(sim));
  }, [sim]);

  useEffect(() => {
    if (sim) return;
    setLogHud({ respawnLine: null, skillProcLine: null, agentLines: [] });
    setHudLogExpanded(false);
  }, [sim]);

  useEffect(() => {
    if (!sim) return;
    let frame = 0;
    let lastRenderFpsShown = sim.renderFpsRef.current;
    const tick = () => {
      const rf = sim.renderFpsRef.current;
      if (rf !== lastRenderFpsShown) {
        lastRenderFpsShown = rf;
        setRenderFpsDisplay(rf);
      }
      frame += 1;
      const stride = hudCombatLogStrideFrames(sim.agentsRef.current.length);
      if (frame % stride === 0) {
        setLogHud(buildCombatHudLogSnapshot(sim));
      }
    };
    frame = 0;
    lastRenderFpsShown = sim.renderFpsRef.current;
    setRenderFpsDisplay(lastRenderFpsShown);
    setLogHud(buildCombatHudLogSnapshot(sim));
    const id = setInterval(tick, 120);
    return () => clearInterval(id);
  }, [sim]);

  if (!sim) return null;

  return (
    <View style={[styles.edenHudStrip, style]} pointerEvents="box-none">
      <View style={styles.hudTopRow}>
        <Text style={styles.hudFps}>FPS {renderFpsDisplay}</Text>
        {hudLogExpanded && CAPITAL_REALTIME_COMBAT_LOG_UI_ENABLED && logHud.respawnLine ? (
          <Text style={[styles.hudAccent, styles.hudTopRowMiddle]} numberOfLines={1}>
            {logHud.respawnLine}
          </Text>
        ) : (
          <View style={styles.hudTopRowSpacer} />
        )}
        <View style={styles.hudCollapseControls} pointerEvents="auto">
          <Pressable
            accessibilityLabel="전투 로그 접기"
            hitSlop={6}
            onPress={() => setHudLogExpanded(false)}
            style={({ pressed }) => [styles.hudCollapseBtn, pressed && styles.hudCollapseBtnPressed]}
          >
            <Text style={styles.hudCollapseBtnText}>-</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="전투 로그 펼치기"
            hitSlop={6}
            onPress={() => setHudLogExpanded(true)}
            style={({ pressed }) => [styles.hudCollapseBtn, pressed && styles.hudCollapseBtnPressed]}
          >
            <Text style={styles.hudCollapseBtnText}>+</Text>
          </Pressable>
        </View>
      </View>
      {logHud.skillProcLine ? (
        <Text style={styles.hudSkillProc} numberOfLines={1}>
          {logHud.skillProcLine}
        </Text>
      ) : null}
      {hudLogExpanded && CAPITAL_REALTIME_COMBAT_LOG_UI_ENABLED
        ? logHud.agentLines.map(line => (
            <View key={line.agId} style={styles.hudAgentRow}>
              <Text style={styles.hudText}>{line.main}</Text>
              {line.showTempo ? (
                <Text style={line.tempoPress ? styles.hudTempoPlus : styles.hudTempoMinus}>
                  {line.tempo}
                </Text>
              ) : null}
            </View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  edenHudStrip: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(8,12,22,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(120,132,160,0.35)',
    borderRadius: 4,
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 4,
    paddingBottom: 5,
  },
  hudTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    columnGap: 6,
    marginBottom: 2,
  },
  hudTopRowMiddle: {
    flex: 1,
    flexShrink: 1,
    textAlign: 'right',
    marginBottom: 0,
    minWidth: 0,
  },
  hudTopRowSpacer: {
    flex: 1,
    minWidth: 0,
  },
  hudCollapseControls: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 3,
    flexShrink: 0,
  },
  hudCollapseBtn: {
    minWidth: 22,
    minHeight: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(120,132,160,0.45)',
    borderRadius: 2,
    backgroundColor: 'rgba(20,28,44,0.92)',
  },
  hudCollapseBtnPressed: {
    backgroundColor: 'rgba(40,52,78,0.95)',
  },
  hudCollapseBtnText: {
    fontSize: 12,
    lineHeight: 14,
    fontFamily: FONTS.mono,
    color: 'rgba(220,228,240,0.95)',
    fontWeight: '700',
  },
  hudAgentRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginTop: 1,
  },
  hudText: {
    fontSize: 9,
    color: 'rgba(220,228,240,0.9)',
    fontFamily: FONTS.mono,
  },
  hudAccent: {
    fontSize: 9,
    color: 'rgba(255,214,120,0.95)',
    fontFamily: FONTS.mono,
  },
  hudSkillProc: {
    fontSize: 12,
    color: '#FDE68A',
    fontFamily: FONTS.mono,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  hudFps: {
    fontSize: 9,
    color: '#EF4444',
    fontFamily: FONTS.mono,
  },
  hudTempoPlus: {
    color: '#22C55E',
    fontFamily: FONTS.mono,
  },
  hudTempoMinus: {
    color: '#EF4444',
    fontFamily: FONTS.mono,
  },
});
