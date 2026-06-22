// ============================================================
// 뉴 에덴(에덴 시티) 전용 — NPC AI 간 상호 타겟·전투 테스트
// 스테이지·이벤트 공용 진입: `src/combat/index.ts` (직접 import 지양).
// 함선 규모는 `edenCapitalFleetConfig`(소규모 기본; 대규모는 `LARGE_SCALE_*`). 규약은 `capitalCombatConventions.ts`. 궤도 표시는 `PlanetEdenRaidOrbitSkiaCombat`(Skia 단일 Canvas + postStepRef, 시뮬 `agentsRef` 등 직접 읽기).
// 무기 교환 루프는 여전히 O(N²) 근사 — 대규모 함대는 공간 분할·타깃 수 상한이 별도 필요.
// 전투비행: 탐지→추격→미사일사거리+패턴(거리띄우기 링)→근접레이저. 미사일은 살보 3발 중 1발 비유도(낙점 고정·무피해), 나머지 유도·궤적 전량 렌더. 근접은 미사일 비발사. 복합 목표·분리. 가속/요속 적분. 스폰 블렌드.
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
import { getNpcCapitalShip, hasNpcCapitalShipId, listAllNpcCapitalShipRows, listNpcCaptains } from '../../npc/npcFleetRegistry';
import type { NpcCapitalShip } from '../../types';
import {
  getCapitalWeaponRow,
  isKnownCapitalWeaponId,
  resolveMissileSalvoCount,
  resolveMissileSalvoIntervalMs,
} from '../../game/capitalWeaponRegistry';
import {
  buildCapitalProjectileSpawn,
  isNovaAoeWeapon,
  resolveCapitalLaserBeamPresentation,
  resolveCapitalWeaponImpact,
} from '../../combat/capitalWeaponPipeline';
import { DEFAULT_CLOSE_RANGE_WEAPON_ID } from '../../game/combatWeaponSlots';
import {
  resolveMainStageCombatEnabled,
  resolvePlanetEnemyAffinityKind,
  resolvePlanetMainStageCombatVariant,
  resolvePlanetTargetCombatLevel,
} from '../../arcCore/balance/balanceTableRegistry';
import { resolvePlayerHullAffinityKind } from '../../combat/playerHullAffinity';
import { resolveHostileEnemyWeaponLoadout } from '../../combat/hostileEnemyWeaponLoadoutFromBalance';
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
import { useNpcCaptainProgressStore, NPC_CAPTAIN_PROGRESS_EXP } from '../../store/npcCaptainProgressStore';
import { usePlayerStore } from '../../store/playerStore';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { recordMatchSummary } from '../../store/combatMatchTelemetryStore';
import { isSurvivalPodNpcShipId } from '../../game/playerSurvivalPod';
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
import { getWaveFleetSeedOverride, useWaveDefenseStore } from '../../game/waveDefense/waveDefenseStore';

type StageFleetSeedSlot = {
  team: 'red' | 'blue' | 'orange';
  npcShipId: string | null;
  captainId: string | null;
};

function resolveTransitCombatSeedSlots(systemId: string | null): StageFleetSeedSlot[] {
  const currentFlagshipNpcId = resolveCurrentPlayerFlagshipNpcShipId();
  return buildTransitCombatSeedSlots(systemId, currentFlagshipNpcId);
}

/** 전 행성 공통: 전투 함장 매칭(`npc_ai_captains.csv`) → 없으면 기본 폴백 편성. */
function resolveStageFleetSeedSlotsForPlanet(
  planetId: string,
  systemId: string | null = null,
): StageFleetSeedSlot[] {
  if (planetId === CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID) {
    return resolveTransitCombatSeedSlots(systemId);
  }
  // 웨이브 디펜스 — 활성 시 해당 행성에 커스텀 적(red) 함대 주입 + 플레이어 blue 기함 자동 추가.
  const waveOverride = getWaveFleetSeedOverride(planetId);
  if (waveOverride && waveOverride.length > 0) {
    const hasBlue = waveOverride.some((slot) => slot.team === 'blue');
    if (!hasBlue) {
      const currentFlagshipNpcId = resolveCurrentPlayerFlagshipNpcShipId();
      const blueShipId = hasNpcCapitalShipId(currentFlagshipNpcId) ? currentFlagshipNpcId : null;
      return [...waveOverride, { team: 'blue', npcShipId: blueShipId, captainId: null }];
    }
    return waveOverride;
  }
  const fromCaptains = resolveCombatFleetSlotsFromCaptains(planetId, systemId);
  if (fromCaptains.length > 0) {
    const hasBlue = fromCaptains.some((slot) => slot.team === 'blue');
    if (!hasBlue && resolveMainStageCombatEnabled(planetId)) {
      const currentFlagshipNpcId = resolveCurrentPlayerFlagshipNpcShipId();
      const blueShipId = hasNpcCapitalShipId(currentFlagshipNpcId) ? currentFlagshipNpcId : null;
      return [...fromCaptains, { team: 'blue', npcShipId: blueShipId, captainId: null }];
    }
    return fromCaptains;
  }
  // 레드팀 폴백 슬롯 없음 — 적함은 CSV `combat`+`red` 함장(베가·드라코 테스트)만 사용.
  const rows: StageFleetSeedSlot[] = [];
  for (let i = 0; i < DUEL_TEAM_BLUE_COUNT_FALLBACK; i++) rows.push({ team: 'blue', npcShipId: null, captainId: null });
  return rows;
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
/** 기세 우세 시 추격 강화(근접 강요) */
const TEMPO_PRESS_CHASE_WEIGHT = 0.9;
/** 기세 열세 시 추격 약화(거리 벌리기) */
const TEMPO_KITE_CHASE_WEIGHT = 0.24;
/** 경계 도달 시 정지하지 않도록 접선 회피 이동량 */
const EDGE_EVADE_STEP_PX = 22;
/** 코너 체류 방지: 중앙 복귀 이동량 */
const EDGE_CENTER_ESCAPE_STEP_PX = 30;
/** 경계 정체 판정(목표-현재 오차) */
const EDGE_STALL_EPS_PX = 1.2;
type CombatMotionStage = 'closing' | 'missile_pattern' | 'missile_reposition' | 'brawl';

type MovementPhase = 'approach' | 'ellipse' | 'orbit';
type TempoRole = 'press' | 'kite';
type RpsHand = 0 | 1 | 2; // 0:가위, 1:바위, 2:보
type KiteEvasionMode = 'standoff' | 'planet_orbit';

/** 근접 패턴: 서로 거리 호흡(레이저 사거리 근처) */
const DUEL_SEP_CENTER = 118;
const DUEL_SEP_AMP = 62;
const DUEL_SEP_OMEGA = 0.00042;
const DUEL_PHASE_OFFSET = Math.PI / 2;
/** 이동 패턴 구간(ms): 근접 → 타원 → 궤도 */
const MOVE_PHASE_APPROACH_MS = 7200;
const MOVE_PHASE_ELLIPSE_MS = 7800;
const MOVE_PHASE_ORBIT_MS = 6400;
const MOVE_CYCLE_MS =
  MOVE_PHASE_APPROACH_MS + MOVE_PHASE_ELLIPSE_MS + MOVE_PHASE_ORBIT_MS;
const AGENT_SEGMENT_PHASE: ReadonlyArray<readonly MovementPhase[]> = [
  ['approach', 'ellipse', 'orbit'],
  ['ellipse', 'orbit', 'approach'],
];
/** 목표 헤딩 오차(rad)에 대한 목표 각속도 비례 이득 — 과대 시 좌우 요동·떨림 */
const HEADING_ALIGN_GAIN = 0.38;
/** 작은 헤딩 오차에서 요레이트 명령을 줄여 요동 억제(rad) */
const HEADING_STEER_DEAD_RAD = 0.04;
const HEADING_STEER_SOFT_RAD = 0.11;
/** 이 거리(px) 안에서는 목표 선속도 0(브레이크)으로 과슈트·앞뒤 흔들림 완화 */
const ARRIVE_DEADZONE_PX = 3.5;
/** 이 거리까지는 최고 속도에 비례해 순항 속도를 낮춤(선형 램프) */
const ARRIVE_SLOW_RADIUS_PX = 74;
/**
 * 전함 이동(이 레이어 적분기 기준):
 * - 전진: 선수 방향(heading) 전방으로 가속·순항.
 * - 좌·우 선회: 제자리 회전 없음. |요각속도| ≤ |전후 선속도| / R_min (최소 선회 반경).
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
/** 거리벌림(kite·재배치) 중 정지에 가까운 선속(px/ms) */
const KITE_DIST_STALL_SPEED_PX_PER_MS = 0.0055;
/** 위 저속이 이 시간(ms) 유지되면 적 방향 전진 회복 구간 진입 */
const KITE_DIST_STALL_HOLD_MS = 1900;
/** 회복 구간: 적함 방향으로 일반 항법·전진(ms) */
const KITE_DIST_RESUME_ADVANCE_MS = 2600;
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
/** 테스트: 한쪽 격침 후 전원 리스폰 — 임시 10초(밸런스 확정 전) */
const RESPAWN_DELAY_MS = 10_000;

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
  /** 인지/추적 거리 스케일 — 최초 추적 길이를 개체별로 분리 */
  detectRangeScale: number;
  /** 개체별 무기 정체 복구(전역 동기화 방지) */
  lastWeaponFireAtMs: number;
  /** 상태이상: 이동속도 감속 배율(1=정상, 0.5=50% 감속) */
  speedSlowMul: number;
  /** 상태이상: 감속 유지 종료 시각(ms) */
  speedSlowUntilMs: number;
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
};

type TeamAgentBuckets = { red: Agent[]; blue: Agent[]; orange: Agent[] };

/** HUD 스냅샷용 sparse id 버퍼 — `buildCombatHudLogSnapshot`에서만 사용(GC 없음). */
const HUD_SCRATCH_AGENT_ID_BUF: (Agent | undefined)[] = [];
/** `respawnDestroyedAgents` 와이드 앵커용 — 리스폰 시에만 사용 */
const RESPAWN_BLEND_BUCKETS: TeamAgentBuckets = { red: [], blue: [], orange: [] };
const RESPAWN_BLEND_SLOT_BY_ID: number[] = [];
const RESPAWN_BLEND_IDBUF: (Agent | undefined)[] = [];
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

function quadBezier(p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

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

/** 전투 개시 시 팀별 라운드로빈으로 첫 표적을 붙인다. */
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

function pickNextAliveEnemyTargetFull(self: Agent, agents: Agent[]): void {
  let best: Agent | null = null;
  let bestD = Infinity;
  const selfTeam = self.team;
  const selfId = self.id;
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i]!;
    if (!a.alive) continue;
    if (selfTeam === 'orange') {
      if (a.id === selfId) continue;
    } else if (a.team === selfTeam) {
      continue;
    }
    const d = Math.hypot(a.x - self.x, a.y - self.y);
    if (d < bestD) {
      bestD = d;
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
  let best: Agent | null = null;
  let bestD = Infinity;
  const selfTeam = self.team;
  const selfId = self.id;
  const start = (self.id * 31 + ringTick * 17) % Math.max(1, n);
  const win = Math.min(n, CAPITAL_TARGET_RING_WINDOW);
  for (let k = 0; k < win; k++) {
    const a = agents[(start + k) % n]!;
    if (!a.alive) continue;
    if (selfTeam === 'orange') {
      if (a.id === selfId) continue;
    } else if (a.team === selfTeam) {
      continue;
    }
    const d = Math.hypot(a.x - self.x, a.y - self.y);
    if (d < bestD) {
      bestD = d;
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

function rollRpsHand(): RpsHand {
  return Math.floor(Math.random() * 3) as RpsHand;
}

function rpsOutcome(a: RpsHand, b: RpsHand): 1 | -1 | 0 {
  if (a === b) return 0;
  if ((a + 1) % 3 === b) return -1;
  return 1;
}

function applyTempoJudge(a: Agent, b: Agent): void {
  let ah = rollRpsHand();
  let bh = rollRpsHand();
  let out = rpsOutcome(ah, bh);
  for (let i = 0; i < 5 && out === 0; i++) {
    ah = rollRpsHand();
    bh = rollRpsHand();
    out = rpsOutcome(ah, bh);
  }
  if (out === 0) {
    out = a.id < b.id ? 1 : -1;
  }
  if (out > 0) {
    a.tempoRole = 'press';
    b.tempoRole = 'kite';
    /** 열세 측 거리벌림: 스탠드오프 후진 이격 OR 적 중심 광궤도 */
    b.kiteEvasionMode = Math.random() < 0.5 ? 'standoff' : 'planet_orbit';
  } else {
    a.tempoRole = 'kite';
    b.tempoRole = 'press';
    /** 열세 측 거리벌림: 스탠드오프 후진 이격 OR 적 중심 광궤도 */
    a.kiteEvasionMode = Math.random() < 0.5 ? 'standoff' : 'planet_orbit';
  }
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

function compactHitFxInPlace(arr: MissileHitFx[], elapsed: number): void {
  let w = 0;
  for (let r = 0; r < arr.length; r++) {
    const fx = arr[r];
    if (!fx) continue;
    if (elapsed - fx.startMs >= MISSILE_HIT_FX_DURATION_MS) continue;
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
  const critThreshold = Math.min(20, Math.max(2, COMBAT_CRIT_NATURAL_THRESHOLD + critDelta));
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

function applyAgentIncomingDamage(defender: Agent, rawDamage: number, attackerAttackBonus: number): number {
  if (rawDamage <= 0) return 0;
  const defenderStance = isPlayerCombatAgent(defender)
    ? useBattleStanceStore.getState().activeStance
    : 'NEUTRAL';
  const damageReduction = defenderStance === 'DEFENSIVE' ? 0.85 : 1;
  const equipmentMul = Math.max(0.65, Math.min(1, defender.equipmentIncomingDamageMul || 1));
  const reducedDamage = Math.max(1, Math.round(rawDamage * damageReduction * equipmentMul));
  let remaining = reducedDamage;
  if (defender.shieldHp > 0) {
    const absorbed = Math.min(defender.shieldHp, remaining);
    defender.shieldHp -= absorbed;
    remaining -= absorbed;
  }
  if (remaining <= 0) return 0;
  const armorMitigation = Math.max(
    0,
    Math.floor(defender.armorStat * 0.4) - Math.floor(attackerAttackBonus * 0.15),
  );
  const hullDamage = Math.max(1, reducedDamage - armorMitigation);
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

  const Rmin = maxMoveSpeed / (ag.maxTurnRateRadPerMs + 1e-14);
  const turnCap = Math.abs(vFwd0) / Rmin;
  let omegaDes = Math.max(
    -ag.maxTurnRateRadPerMs,
    Math.min(ag.maxTurnRateRadPerMs, steerErr * HEADING_ALIGN_GAIN),
  );
  omegaDes = Math.max(-turnCap, Math.min(turnCap, omegaDes));

  let dw = omegaDes - ag.headingRateRadPerMs;
  const maxDw = ag.turnAccelRadPerMs2 * dt;
  if (Math.abs(dw) > maxDw) dw = dw > 0 ? maxDw : -maxDw;
  ag.headingRateRadPerMs += dw;
  ag.headingRateRadPerMs = Math.max(
    -ag.maxTurnRateRadPerMs,
    Math.min(ag.maxTurnRateRadPerMs, ag.headingRateRadPerMs),
  );

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
  const cl = clampToOrbit({ x: ag.x, y: ag.y }, margin, orbitSize);
  if (Math.abs(cl.x - bx) > 1e-5) ag.vx = 0;
  if (Math.abs(cl.y - by) > 1e-5) ag.vy = 0;
  ag.x = cl.x;
  ag.y = cl.y;
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

function pairSeparationPx(elapsedMs: number): number {
  return (
    DUEL_SEP_CENTER + DUEL_SEP_AMP * Math.sin(elapsedMs * DUEL_SEP_OMEGA + DUEL_PHASE_OFFSET)
  );
}

function movementPhaseAtForAgent(elapsedMs: number, agentId: number): MovementPhase {
  const u = elapsedMs % MOVE_CYCLE_MS;
  const d0 = MOVE_PHASE_APPROACH_MS;
  const d1 = MOVE_PHASE_ELLIPSE_MS;
  const row = AGENT_SEGMENT_PHASE[agentId & 1];
  if (u < d0) return row[0];
  if (u < d0 + d1) return row[1];
  return row[2];
}

/** 서로 탐지 가능 거리 = 맵 기준 최대 초기 이격(스폰과 동일 스케일) */
function combatDetectionRangePx(orbitSize: number, margin: number): number {
  return maxHorizontalPairSeparationPx(orbitSize, margin);
}

function combatMotionStageFromDist(
  dist: number,
  detectR: number,
  bands: CapitalCombatRangeBands,
): CombatMotionStage {
  if (dist > detectR + 6) return 'closing';
  if (dist > bands.missileMaxRangePx + CAPITAL_MISSILE_RANGE_LOOSEN_PX) return 'closing';
  if (dist > bands.laserBrawlOuterPx) return 'missile_pattern';
  if (dist > bands.laserBrawlInnerPx + 0.5) return 'missile_reposition';
  return 'brawl';
}

function chaseWeightForCombatStage(stage: CombatMotionStage): number {
  if (stage === 'closing') return 1;
  if (stage === 'missile_pattern') return 0.42;
  if (stage === 'missile_reposition') return 0.16;
  /** 브롤: 링 선회 비중↑ (`BRAWL_CHASE_WEIGHT_CAP`과 함께 직추격 억제) */
  return 0.3;
}

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

/** 한 척의 패턴 목표 — 궤도는 직전 프레임 상대 위치 기준 */
function agentTargetPose(
  phase: MovementPhase,
  agentId: number,
  cx: number,
  cy: number,
  margin: number,
  orbitSize: number,
  elapsedMs: number,
  otherPrev: Pt,
): AgentPose {
  if (phase === 'approach') {
    let d = pairSeparationPx(elapsedMs);
    const maxD = maxHorizontalPairSeparationPx(orbitSize, margin);
    const minD = 44;
    d = Math.min(maxD, Math.max(minD, d));
    const half = d * 0.5;
    const raw = agentId === 0 ? { x: cx - half, y: cy } : { x: cx + half, y: cy };
    const c = clampToOrbit(raw, margin, orbitSize);
    return {
      x: c.x,
      y: c.y,
      headingRad: agentId === 0 ? 0 : Math.PI,
    };
  }
  if (phase === 'ellipse') {
    const span = Math.min(orbitSize - 2 * margin - 12, orbitSize * 0.72);
    const a = span * 0.42;
    const b = span * 0.28;
    const omega = 0.00038;
    const th = elapsedMs * omega + (agentId === 0 ? 0 : Math.PI);
    const raw = { x: cx + a * Math.cos(th), y: cy + b * Math.sin(th) };
    const c = clampToOrbit(raw, margin, orbitSize);
    return {
      x: c.x,
      y: c.y,
      headingRad: Math.atan2(b * Math.cos(th), -a * Math.sin(th)),
    };
  }
  const R = Math.min(90, (orbitSize - 2 * margin) * 0.34);
  const omega = 0.00052;
  const ang = elapsedMs * omega + agentId * Math.PI * 1.07;
  const raw = {
    x: otherPrev.x + R * Math.cos(ang),
    y: otherPrev.y + R * Math.sin(ang),
  };
  const c = clampToOrbit(raw, margin, orbitSize);
  return { x: c.x, y: c.y, headingRad: ang + Math.PI / 2 };
}

/**
 * 1:1 전전 — 단일 적(`otherPrev`) 기준 패턴 + 추격 + 미사일 사거리 거리띄우기(스탠드오프 링) 복합 목표.
 * 근접(`brawl`)은 해상전 스타일: 적 주변 링 공전 목표 + 낮은 직추격 가중.
 * `chaseWeight` 는 전투 단계에 따라 1(순추격) ~ 패턴혼합.
 * 블렌드 점이 상대와 너무 가까우면 자기 쪽으로 목표를 밀어 최소 이격 확보.
 * kite·거리벌림: `standoff`는 스탠드오프·선수 대적·후진 이격(`openingReverseOnly`).
 * `planet_orbit`은 적 중심 광궤도(강한 궤도 블렌드). 최종 헤딩은 선수 대적 1순위.
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
  const phase = movementPhaseAtForAgent(elapsedMs, agentId);
  const pat =
    combatStage === 'brawl'
      ? navalBrawlOrbitTargetPose(agentId, elapsedMs, selfPrev, otherPrev, margin, orbitSize, bands)
      : agentTargetPose(phase, agentId, cx, cy, margin, orbitSize, elapsedMs, otherPrev);
  const cha = chaseTargetPose(selfPrev, otherPrev);
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
  let headingBlend = lerpAngleRad(pat.headingRad, cha.headingRad, wc);
  if (ws > 1e-6) {
    const ringDist =
      tempoRole === 'press'
        ? Math.max(bands.laserBrawlOuterPx + 8, bands.missileIdealPairDistPx - 26)
        : Math.min(
            bands.missileMaxRangePx + CAPITAL_MISSILE_RANGE_LOOSEN_PX - 2,
            bands.missileIdealPairDistPx + 28,
          );
    const st = standoffTargetPose(selfPrev, otherPrev, ringDist, margin, orbitSize);
    mx = mx * (1 - ws) + st.x * ws;
    my = my * (1 - ws) + st.y * ws;
    headingBlend = lerpAngleRad(headingBlend, st.headingRad, ws * 0.5);
  }
  const sepPad = MIN_CAPITAL_CENTER_SEP_PX + 6;
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
      if (d >= minCenterDist) continue;
      if (d < 1e-10) {
        dx = 1;
        dy = 0;
        d = 1;
      }
      dx /= d;
      dy /= d;
      const pen = (minCenterDist - d) * 0.5;
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

/** 1:1 전전 전용 스폰 — 팀당 1척(슬롯·다척 세로 분산 없음). */
function formationDuelSpawnPose(
  team: 'red' | 'blue' | 'orange',
  cx: number,
  cy: number,
  margin: number,
  orbitSize: number,
): AgentPose {
  const maxD = maxHorizontalPairSeparationPx(orbitSize, margin);
  const half = Math.min(maxD * 0.45, (orbitSize - 2 * margin) * 0.42);
  const x = team === 'red' ? cx - half : team === 'blue' ? cx + half : cx;
  const span = Math.min((orbitSize - 2 * margin) * 0.64, 220);
  const y = cy - span * 0.5;
  const c = clampToOrbit({ x, y }, margin, orbitSize);
  return { x: c.x, y: c.y, headingRad: team === 'red' ? 0 : team === 'blue' ? Math.PI : -Math.PI / 2 };
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
  if (variantKey === 'draco_wave') return 0;
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

/** 근접 스폰(formation) 변형별 레드·블루 포즈 */
function duelSpawnPairFromVariant(
  variant: DuelSpawnVariant,
  orbitSize: number,
  margin: number,
): { red: AgentPose; blue: AgentPose } {
  const cx = orbitSize * 0.5;
  const cy = orbitSize * 0.5;
  if (variant === 0) {
    return {
      red: formationDuelSpawnPose('red', cx, cy, margin, orbitSize),
      blue: formationDuelSpawnPose('blue', cx, cy, margin, orbitSize),
    };
  }
  const maxD = maxHorizontalPairSeparationPx(orbitSize, margin);
  const half = Math.min(maxD * 0.45, (orbitSize - 2 * margin) * 0.42);
  const spanY = Math.min((orbitSize - 2 * margin) * 0.64, 220) * 0.5;
  if (variant === 1) {
    const rC = clampToOrbit({ x: cx, y: cy - half }, margin, orbitSize);
    const bC = clampToOrbit({ x: cx, y: cy + half }, margin, orbitSize);
    return {
      red: { x: rC.x, y: rC.y, headingRad: Math.PI / 2 },
      blue: { x: bC.x, y: bC.y, headingRad: -Math.PI / 2 },
    };
  }
  const rRaw = { x: cx - half * 0.88, y: cy - spanY * 0.55 };
  const bRaw = { x: cx + half * 0.88, y: cy + spanY * 0.55 };
  const rc = clampToOrbit(rRaw, margin, orbitSize);
  const bc = clampToOrbit(bRaw, margin, orbitSize);
  return {
    red: {
      x: rc.x,
      y: rc.y,
      headingRad: Math.atan2(bc.y - rc.y, bc.x - rc.x),
    },
    blue: {
      x: bc.x,
      y: bc.y,
      headingRad: Math.atan2(rc.y - bc.y, rc.x - bc.x),
    },
  };
}

const PLAYER_FLAGSHIP_CAPTAIN_ID = 'Player_pilot';
const PLAYER_FLAGSHIP_NPC_SHIP_ID = 'Player_npc_red_fleet_1';
/** 내 전함 마름모·선수선만 녹색으로 구분 */
const PLAYER_FLAGSHIP_SHIP_STROKE = '#22C55E';

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

  // 플레이어 전투 무장은 equipSlots가 정본이다. ship.weapons 잔존값은 발사 판정에 쓰지 않는다.
  const slotLaserRaw = String(player.ship.equipSlots?.WEAPON_1?.itemDefId ?? '').trim();
  const slotMissileRaw = String(player.ship.equipSlots?.WEAPON_2?.itemDefId ?? '').trim();
  const slotCloseRaw = String(player.ship.equipSlots?.WEAPON_3?.itemDefId ?? '').trim();
  const slotAuxRaw = String(player.ship.equipSlots?.WEAPON_4?.itemDefId ?? '').trim();
  const slotLaserId = slotLaserRaw && slotLaserRaw !== '0' ? slotLaserRaw.replace(/^weapon_item_/, '').trim() : '';
  const slotMissileId = slotMissileRaw && slotMissileRaw !== '0' ? slotMissileRaw.replace(/^weapon_item_/, '').trim() : '';
  const slotCloseId = slotCloseRaw && slotCloseRaw !== '0' ? slotCloseRaw.replace(/^weapon_item_/, '').trim() : '';
  const slotAuxId = slotAuxRaw && slotAuxRaw !== '0' ? slotAuxRaw.replace(/^weapon_item_/, '').trim() : '';
  let laserWeaponId = slotLaserId && isKnownCapitalWeaponId(slotLaserId) ? slotLaserId : '';
  let missileWeaponId = slotMissileId && isKnownCapitalWeaponId(slotMissileId) ? slotMissileId : '';
  let closeRangeWeaponId = slotCloseId && isKnownCapitalWeaponId(slotCloseId) ? slotCloseId : '';
  let auxWeaponId = slotAuxId && isKnownCapitalWeaponId(slotAuxId) ? slotAuxId : '';
  if (!laserWeaponId && runtimeBase?.laserWeaponId?.trim()) {
    const fallback = runtimeBase.laserWeaponId.trim();
    if (isKnownCapitalWeaponId(fallback)) laserWeaponId = fallback;
  }
  if (!missileWeaponId && runtimeBase?.missileWeaponId?.trim()) {
    const fallback = runtimeBase.missileWeaponId.trim();
    if (isKnownCapitalWeaponId(fallback)) missileWeaponId = fallback;
  }
  if (!closeRangeWeaponId && runtimeBase?.closeRangeWeaponId?.trim()) {
    const fallback = runtimeBase.closeRangeWeaponId.trim();
    if (isKnownCapitalWeaponId(fallback)) closeRangeWeaponId = fallback;
  }
  if (!closeRangeWeaponId && isKnownCapitalWeaponId(DEFAULT_CLOSE_RANGE_WEAPON_ID)) {
    closeRangeWeaponId = DEFAULT_CLOSE_RANGE_WEAPON_ID;
  }
  if (!auxWeaponId && runtimeBase?.auxWeaponId?.trim()) {
    const fallback = runtimeBase.auxWeaponId.trim();
    if (isKnownCapitalWeaponId(fallback)) auxWeaponId = fallback;
  }

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

  const mergedRuntime = runtimeBase
    ? {
        ...runtimeBase,
        ...perf.runtimeConfig,
        laserWeaponId: laserWeaponId || '',
        missileWeaponId: missileWeaponId || '',
        closeRangeWeaponId: closeRangeWeaponId || '',
        auxWeaponId: auxWeaponId || '',
      }
    : perf.runtimeConfig
      ? {
          ...perf.runtimeConfig,
          laserWeaponId: laserWeaponId || '',
          missileWeaponId: missileWeaponId || '',
          closeRangeWeaponId: closeRangeWeaponId || '',
          auxWeaponId: auxWeaponId || '',
        }
      : undefined;

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
  if (stance === 'AGGRESSIVE') return 1.18;
  if (stance === 'DEFENSIVE') return 0.84;
  return 1;
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
  const closeRangeWeaponId =
    runtimeConfig?.closeRangeWeaponId?.trim() || DEFAULT_CLOSE_RANGE_WEAPON_ID;
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
  const rangeBands = deriveCapitalCombatRangeBands(laserEngageRangePx, missileMaxRangePx);
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
    shieldHp: maxShieldHp,
    maxShieldHp,
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
    lastShieldRegenAtMs: wallBaseMs,
    stallChaseBoostUntilMs: 0,
    tempoRole: 'press',
    kiteEvasionMode: 'standoff',
    kiteDistStallSinceMs: null,
    kiteDistResumeAdvanceUntilMs: 0,
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
    armorStat,
    attackBonusStat,
    expRewardStat,
    laserMinDamage,
    laserMaxDamage,
    missileMinDamage,
    missileMaxDamage,
    closeRangeMinDamage,
    closeRangeMaxDamage,
    laserRechargeMs,
    missileFireIntervalMs,
    missileSalvoCount,
    missileSalvoIntervalMs,
    closeRangeFireIntervalMs,
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
  const stageSlots = resolveStageFleetSeedSlotsForPlanet(combatPlanetId, combatSystemId);
  const redSlots = stageSlots.filter(s => s.team === 'red');
  const blueSlots = stageSlots.filter(s => s.team === 'blue');
  const orangeSlots = stageSlots.filter(s => s.team === 'orange');
  const shipMap = new Map(listAllNpcCapitalShipRows().map((s) => [s.id, s]));
  const captainNameMap = new Map(listNpcCaptains().map((c) => [c.id, c.displayName]));
  const playerBinding = resolvePlayerFlagshipCombatBinding();
  let id = 0;
  for (let r = 0; r < redSlots.length; r++) {
    const slot = redSlots[r]!;
    const off = (r - (redSlots.length - 1) / 2) * FLEET_SLOT_SPACING_PX;
    const c = clampToOrbit({ x: duelWide.x0 + px * off, y: duelWide.y0 + py * off }, margin, orbitSize);
    const npc = slot.npcShipId ? shipMap.get(slot.npcShipId) : undefined;
    const runtimeConfig = slot.npcShipId
      ? NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV[slot.npcShipId]
      : undefined;
    const captainId = slot.captainId ?? npc?.captainId ?? null;
    const shipName = runtimeConfig?.displayName ?? npc?.name ?? `RED-${r + 1}`;
    const csvCaptainName = captainId ? captainNameMap.get(captainId) : undefined;
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
    const appliedName = isPlayerSlot ? (playerBinding?.displayName ?? nameplate) : nameplate;
    const appliedCaptainLabel = isPlayerSlot ? (resolveLinkedAccountNicknameForFlagship() ?? '—') : nameplate;
    const planetAffinity = resolvePlanetEnemyAffinityKind(combatPlanetId);
    if (!isPlayerSlot) {
      const hostileLoadout = resolveHostileEnemyWeaponLoadout(
        r,
        resolvePlanetTargetCombatLevel(combatPlanetId),
      );
      appliedRuntimeConfig = {
        ...(appliedRuntimeConfig ?? {}),
        laserWeaponId: hostileLoadout.laserWeaponId,
        missileWeaponId: hostileLoadout.missileWeaponId,
      } as typeof appliedRuntimeConfig;
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
        agentBinding.equipmentAgentKnobs,
      ),
    );
  }
  for (let b = 0; b < blueSlots.length; b++) {
    const slot = blueSlots[b]!;
    const off = (b - (blueSlots.length - 1) / 2) * FLEET_SLOT_SPACING_PX;
    const c = clampToOrbit({ x: duelWide.x1 + px * off, y: duelWide.y1 + py * off }, margin, orbitSize);
    const npc = slot.npcShipId ? shipMap.get(slot.npcShipId) : undefined;
    const runtimeConfig = slot.npcShipId
      ? NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV[slot.npcShipId]
      : undefined;
    const captainId = slot.captainId ?? npc?.captainId ?? null;
    const shipName = runtimeConfig?.displayName ?? npc?.name ?? `BLUE-${b + 1}`;
    const csvCaptainName = captainId ? captainNameMap.get(captainId) : undefined;
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
    const appliedRuntimeConfig = agentBinding.runtimeConfig;
    const appliedName = isPlayerSlot ? (playerBinding?.displayName ?? nameplate) : nameplate;
    const appliedCaptainLabel = isPlayerSlot ? (resolveLinkedAccountNicknameForFlagship() ?? '—') : nameplate;
    const appliedNpcShipId = isPlayerSlot ? null : slot.npcShipId;
    const appliedCaptainId = isPlayerSlot ? PLAYER_FLAGSHIP_CAPTAIN_ID : captainId;
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
    const npc = slot.npcShipId ? shipMap.get(slot.npcShipId) : undefined;
    const runtimeConfig = slot.npcShipId
      ? NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV[slot.npcShipId]
      : undefined;
    const captainId = slot.captainId ?? npc?.captainId ?? null;
    const shipName = runtimeConfig?.displayName ?? npc?.name ?? `ORANGE-${o + 1}`;
    const csvCaptainName = captainId ? captainNameMap.get(captainId) : undefined;
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
  assignInitialCombatTargets(agents);
  return agents;
}

/** 격침된 전함만 리스폰. 생존 전함은 위치/상태를 유지. 팀 전열 슬롯에 맞춰 재배치 후 표적 재배정. */
function respawnDestroyedAgents(
  agents: Agent[],
  orbitSize: number,
  margin: number,
  wallBaseMs: number,
  spawnVariant: DuelSpawnVariant,
): void {
  const cx = orbitSize * 0.5;
  const cy = orbitSize * 0.5;
  const duelWide = initialSpawnDuelWidePositions(spawnVariant, cx, cy, margin, orbitSize);
  const maxId = rebuildAgentIdSparseBuf(agents, RESPAWN_BLEND_IDBUF);
  refillTeamBucketsWithSlots(agents, RESPAWN_BLEND_BUCKETS, RESPAWN_BLEND_SLOT_BY_ID, maxId);
  for (const ag of agents) {
    if (ag.alive) continue;
    const anchor = fleetWideBlendAnchorPose(
      duelWide,
      ag,
      RESPAWN_BLEND_BUCKETS,
      RESPAWN_BLEND_SLOT_BY_ID,
      margin,
      orbitSize,
    );
    ag.x = anchor.x;
    ag.y = anchor.y;
    ag.headingRad = anchor.headingRad;
    ag.vx = 0;
    ag.vy = 0;
    ag.headingRateRadPerMs = 0;
    ag.hullHp = ag.maxHullHp;
    ag.shieldHp = ag.maxShieldHp;
    ag.alive = true;
    ag.nextFireMs = wallBaseMs;
    ag.nextMissileSalvoAt = wallBaseMs + (ag.team === 'blue' ? ag.missileFireIntervalMs * 0.5 : 0);
    ag.activeSalvoBaseMs = null;
    ag.activeSalvoNextShotAtMs = null;
    ag.salvoSpawned = 0;
    ag.lastLaserStartMs = wallBaseMs - 1e9;
    ag.lastDestroyedAtMs = -1e9;
    ag.engageStartDelayMs = randRange(0, 1400);
    ag.detectRangeScale = randRange(0.84, 1.18);
    ag.lastWeaponFireAtMs = wallBaseMs;
    ag.speedSlowMul = 1;
    ag.speedSlowUntilMs = 0;
    ag.stallChaseBoostUntilMs = 0;
    ag.tempoRole = 'press';
    ag.kiteEvasionMode = 'standoff';
    ag.kiteDistStallSinceMs = null;
    ag.kiteDistResumeAdvanceUntilMs = 0;
    ag.currentTargetAgentId = null;
  }
  assignInitialCombatTargets(agents);
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
  /** 한쪽 격침 시 wall 시각 + RESPAWN_DELAY_MS, 리스폰 후 null */
  const respawnAtWallRef = useRef<number | null>(null);
  /** 팀 승패 보상(함장 EXP) 중복 지급 방지 */
  const waveOutcomeAwardedRef = useRef(false);
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
  /** 웨이브 전환 재시드 트리거 — 값이 바뀌면 같은 활성 세션에서 함대만 재초기화(Canvas 리마운트 없음) */
  const waveGenKey = useWaveDefenseStore((s) => s.waveGenKey);
  const lastWaveGenKeyRef = useRef(0);

  useEffect(() => {
    if (!active || !combatPlanetId) return;
    const sessionKey = `${combatPlanetId}:${combatSystemId ?? ''}`;
    const waveReseed = waveGenKey !== lastWaveGenKeyRef.current;
    if (sessionCombatKeyRef.current === sessionKey && agentsRef.current.length > 0 && !waveReseed) {
      return;
    }
    lastWaveGenKeyRef.current = waveGenKey;
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
    );
    if (resumeSnap) {
      applyCombatResumeSnapshotToAgents(agentsRef.current, resumeSnap);
    }
    missilesRef.current = [];
    nextMissileId.current = 0;
    missileHitFxRef.current = [];
    respawnAtWallRef.current = resumeSnap ? resumeSnap.respawnAtElapsedMs : null;
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
    combatOrbitPostStepRef.current = null;
    // 메인 스테이지 세션 종료 시에만 런타임 버퍼 해제
    missilesRef.current = [];
    nextMissileId.current = 0;
    missileHitFxRef.current = [];
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
    const spawn = buildCapitalProjectileSpawn({
      weaponId,
      p0: laserMuzzleFromAgent(owner),
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
    const loop = () => {
      const nowMs = performance.now();
      const rawDt = Math.max(0, nowMs - lastWallNowMs);
      lastWallNowMs = nowMs;
      const dt = Math.min(33, rawDt);
      const elapsed = lastElapsedRef.current + dt;
      lastElapsedRef.current = elapsed;
      if (rawDt > 0) {
        fpsAccumRef.current += 1000 / rawDt;
        fpsSampleRef.current += 1;
      }

      if (respawnAtWallRef.current !== null && elapsed >= respawnAtWallRef.current) {
        respawnDestroyedAgents(
          agentsRef.current,
          orbitSize,
          margin,
          elapsed,
          duelSpawnVariantRef.current,
        );
        missilesRef.current = [];
        nextMissileId.current = 0;
        missileHitFxRef.current = [];
        respawnAtWallRef.current = null;
        respawnCountdownSecRef.current = null;
        lastElapsedRef.current = elapsed;
        for (const ag of agentsRef.current) {
          ag.lastWeaponFireAtMs = elapsed;
          ag.stallChaseBoostUntilMs = 0;
          ag.lastShieldRegenAtMs = elapsed;
        }
      }

      const ringTick = ++combatTargetRingTickRef.current;
      const agents = agentsRef.current;
      const idBuf = agentByIdBuf.current;
      const maxAgentId = rebuildAgentIdSparseBuf(agents, idBuf);
      refillTeamBucketsWithSlots(agents, teamBucketsRef.current, teamSlotByAgentIdRef.current, maxAgentId);
      for (const ag of agents) {
        if (!ag.team) ag.team = ag.id % 2 === 0 ? 'red' : 'blue';
      }
      const playerAgent = agents.find((a) => isPlayerCombatAgent(a));
      if (
        playerAgent
        && !playerAgent.alive
        && !playerCapitalDestroyedRef.current
        && !isSurvivalPodNpcShipId(usePlayerStore.getState().player?.ship?.portraitNpcCapitalShipId)
      ) {
        playerCapitalDestroyedRef.current = true;
        respawnAtWallRef.current = null;
        respawnCountdownSecRef.current = null;
        // 웨이브 디펜스: 플레이어 격파 = 패배 종료 → 컨트롤러가 오퍼레이터 종료 대사 처리
        if (useWaveDefenseStore.getState().active) {
          useWaveDefenseStore.getState().endRun('lose');
        }
        void usePlayerStore.getState().applyCapitalShipDestruction().then(() => {
          showArcAlert(
            '전함 격침',
            '전함이 파괴되어 생존포드로 거점 행성에 귀환했습니다.\n조선소에서 전함을 재구매·탑승하세요.',
          );
        });
      }
      const allAlive = agents.every(a => a.alive);
      if (!allAlive && respawnAtWallRef.current === null && !useWaveDefenseStore.getState().active) {
        // 웨이브 모드에서는 자동 리스폰 금지 — 전멸(다음 웨이브)·격파(종료)는 웨이브 컨트롤러가 처리
        respawnAtWallRef.current = elapsed + RESPAWN_DELAY_MS;
      }

      const waitingRespawn = respawnAtWallRef.current !== null;
      if (!waitingRespawn) {
        if (respawnCountdownSecRef.current !== null) respawnCountdownSecRef.current = null;
      } else if (respawnAtWallRef.current !== null) {
        const sec = Math.max(0, Math.ceil((respawnAtWallRef.current - elapsed) / 1000));
        if (respawnCountdownSecRef.current !== sec) respawnCountdownSecRef.current = sec;
      }

      const aliveRed = agents.some(a => a.alive && a.team === 'red');
      const aliveBlue = agents.some(a => a.alive && a.team === 'blue');
      const aliveOrange = agents.some(a => a.alive && a.team === 'orange');
      const aliveCount = agents.filter(a => a.alive).length;
      const activeBattle = aliveOrange ? aliveCount >= 2 : aliveRed && aliveBlue;
      if (activeBattle) {
        waveOutcomeAwardedRef.current = false;
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
          if (combatPlanetId) {
            const startMs = battleEngageStartMsRef.current ?? Math.max(0, elapsed - 32_000);
            void recordMatchSummary({
              planetId: combatPlanetId,
              systemId: combatSystemId,
              engageSec: Math.max(1, (elapsed - startMs) / 1000),
              playerWon: winnerTeam === 'blue',
            });
          }
        }
        waveOutcomeAwardedRef.current = true;
        battleEngageStartMsRef.current = null;
        // 웨이브 디펜스: red 전멸(blue 승) → 컨트롤러에 클리어 신호(다음 웨이브 재장전)
        if (winnerTeam === 'blue' && useWaveDefenseStore.getState().active) {
          useWaveDefenseStore.getState().setPhase('cleared');
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
      if (prevPts.length !== prevPtsLen) prevPts.length = prevPtsLen;
      for (const a of agents) {
        prevPts[a.id] = { x: a.x, y: a.y };
      }
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
        const pairDist = Math.hypot(selfPrev.x - otherPrev.x, selfPrev.y - otherPrev.y);
        const detectR = combatDetectionRangePx(orbitSize, margin) * ag.detectRangeScale;
        const combatStage = combatMotionStageFromDist(pairDist, detectR, ag.rangeBands);
        // 우선순위 강제: 거리 판단보다 기세 판정 우선.
        // 기세 열세(kite)는 항상 거리벌리기 단계로 취급한다.
        let navStage: CombatMotionStage =
          ag.tempoRole === 'kite' ? 'missile_reposition' : combatStage;
        const engageReady = elapsed >= ag.engageStartDelayMs;
        let chaseW = chaseWeightForCombatStage(navStage);
        if (ag.tempoRole === 'press') {
          chaseW = Math.max(chaseW, TEMPO_PRESS_CHASE_WEIGHT);
        } else {
          chaseW = Math.min(chaseW, TEMPO_KITE_CHASE_WEIGHT);
        }
        if (!engageReady) {
          // 시작 지연 중에는 즉시 교전으로 붙지 않도록 추격 강도 제한
          chaseW = Math.min(chaseW, 0.28);
        }
        if (elapsed < ag.stallChaseBoostUntilMs) {
          if (ag.tempoRole === 'press') {
            chaseW = Math.max(chaseW, 0.88);
          } else {
            // 기세 열세(kite)는 정체 복구 중에도 거리벌리기 성향 유지
            chaseW = Math.min(chaseW, 0.32);
          }
        }
        let P = compositeNavigatePose(
          ag.id,
          Math.max(0, elapsed - ag.engageStartDelayMs) + ag.behaviorTimeOffsetMs,
          selfPrev,
          otherPrev,
          cx,
          cy,
          margin,
          orbitSize,
          chaseW,
          navStage,
          ag.tempoRole,
          ag.kiteEvasionMode,
          ag.rangeBands,
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
        const inKiteDistancing =
          ag.tempoRole === 'kite' && navStage === 'missile_reposition';
        const spd = Math.hypot(ag.vx, ag.vy);
        if (ag.kiteDistResumeAdvanceUntilMs > 0 && elapsed >= ag.kiteDistResumeAdvanceUntilMs) {
          ag.kiteDistResumeAdvanceUntilMs = 0;
        }
        if (!inKiteDistancing) {
          ag.kiteDistStallSinceMs = null;
          ag.kiteDistResumeAdvanceUntilMs = 0;
        } else if (engageReady) {
          const recovering =
            ag.kiteDistResumeAdvanceUntilMs > 0 && elapsed < ag.kiteDistResumeAdvanceUntilMs;
          if (recovering) {
            ag.kiteDistStallSinceMs = null;
          } else if (spd < KITE_DIST_STALL_SPEED_PX_PER_MS) {
            if (ag.kiteDistStallSinceMs === null) {
              ag.kiteDistStallSinceMs = elapsed;
            } else if (elapsed - ag.kiteDistStallSinceMs >= KITE_DIST_STALL_HOLD_MS) {
              ag.kiteDistResumeAdvanceUntilMs = elapsed + KITE_DIST_RESUME_ADVANCE_MS;
              ag.kiteDistStallSinceMs = null;
            }
          } else {
            ag.kiteDistStallSinceMs = null;
          }
        }

        const kiteDistResumeAdvance =
          engageReady &&
          inKiteDistancing &&
          ag.kiteDistResumeAdvanceUntilMs > 0 &&
          elapsed < ag.kiteDistResumeAdvanceUntilMs;

        const openingReverseOnly =
          inKiteDistancing &&
          ag.kiteEvasionMode === 'standoff' &&
          !kiteDistResumeAdvance;
        const slotForTurn = Math.max(0, teamSlotByAgentIdRef.current[ag.id] ?? 0);
        const kiteReverseCurve: KiteStandoffReverseCurve | null = openingReverseOnly
          ? {
              enemyX: other.x,
              enemyY: other.y,
              turnSign: slotForTurn % 2 === 0 ? 1 : -1,
            }
          : null;

        if (kiteDistResumeAdvance) {
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
            openingReverseOnly,
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
        // 규칙: 쿨다운 + 사거리 + 전방 120° 부채꼴
        if (laserReady && inLaserRange && inAttackArc) {
          ag.nextFireMs = elapsed + ag.laserRechargeMs + ag.laserCooldownJitterMs;
          ag.lastLaserStartMs = elapsed;
          ag.lastWeaponFireAtMs = elapsed;
          ag.stallChaseBoostUntilMs = 0;
          const laserOutcome = resolveAgentAttackOutcome(ag, other);
          /** 레이저는 발사 시점에 즉시 1회 판정/타격 */
          if (laserOutcome > 0) {
            const rawLaserDamage = rollAgentWeaponDamage(ag, other, 'laser', laserOutcome);
            const hullDamage = applyAgentIncomingDamage(other, rawLaserDamage, ag.attackBonusStat);
            applyHitKnockback(other, { x: ag.x, y: ag.y }, Math.max(1, hullDamage), margin, orbitSize);
            missileHitFxRef.current.push({
              id: 1000000 + ag.id * 1000 + other.id,
              x: other.x,
              y: other.y,
              startMs: elapsed,
              color: other.stroke ?? '#94A3B8',
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
        if (ag.activeSalvoBaseMs === null && missileSalvoReady && inMissileRange && inAttackArc) {
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
        if (ag.activeCloseRangeSalvoBaseMs === null && closeRangeSalvoReady && inCloseRange) {
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

      for (const m of missilesRef.current) {
        if (m.hitApplied) continue;
        if (elapsed - m.startMs < m.travelMs) continue;
        m.hitApplied = true;
        const owner = idBuf[m.ownerAgentId];
        const victim = idBuf[m.targetAgentId];
        const isNova = isNovaAoeWeapon(m.missileWeaponId);
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
              const hullDamage = applyAgentIncomingDamage(victim, missileRawDamage, owner.attackBonusStat);
              applyHitKnockback(victim, m.p0, Math.max(1, hullDamage), margin, orbitSize);
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
      missileHitFxRef,
      respawnCountdownSecRef,
      combatOrbitPostStepRef,
      captureSuspendSnapshot,
    }),
    [orbitSize, captureSuspendSnapshot],
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
    const tail = ` ${combatStageLabelKo(navStage)} 거리 ${Math.round(dist)} L ${(
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
  return { respawnLine, agentLines };
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
    sim ? buildCombatHudLogSnapshot(sim) : { respawnLine: null, agentLines: [] },
  );
  /** 접힘: 상단 FPS만 표시. 펼침: 전투 로그 전체 — 기본은 접힘 */
  const [hudLogExpanded, setHudLogExpanded] = useState(false);

  useEffect(() => {
    if (!sim) return;
    setRenderFpsDisplay(sim.renderFpsRef.current);
    if (CAPITAL_REALTIME_COMBAT_LOG_UI_ENABLED) {
      setLogHud(buildCombatHudLogSnapshot(sim));
    }
  }, [sim]);

  useEffect(() => {
    if (sim) return;
    setLogHud({ respawnLine: null, agentLines: [] });
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
      if (CAPITAL_REALTIME_COMBAT_LOG_UI_ENABLED) {
        frame += 1;
        const stride = hudCombatLogStrideFrames(sim.agentsRef.current.length);
        if (frame % stride === 0) {
          setLogHud(buildCombatHudLogSnapshot(sim));
        }
      }
    };
    frame = 0;
    lastRenderFpsShown = sim.renderFpsRef.current;
    setRenderFpsDisplay(lastRenderFpsShown);
    if (CAPITAL_REALTIME_COMBAT_LOG_UI_ENABLED) {
      setLogHud(buildCombatHudLogSnapshot(sim));
    }
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
