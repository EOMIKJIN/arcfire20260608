/**
 * 실시간 전함 교전 — 게임 전역 공용 진입점.
 *
 * **행성 궤도 전투** — `/(game)/planet`: 착륙한 행성 id + `npc_ai_captains.csv`의 `operationalState=combat`·`assignedShipId`만으로
 * 전투 레이어 on/off·편대 구성(코드는 CSV를 읽기만 함).
 *
 * **이동중 전투** — `/(game)/combat`: 은하 이동 도중 강제 교전(현 해적). 행성 착륙과 무관·함장 CSV 궤도 함대와 분리.
 * 시뮬 시드는 `CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID`(플레이스홀더 1:1); 상세 시나리오·미션 연동은 추후.
 *
 * **규약(소규모·대규모 공통)**: `capitalCombatConventions.ts`.
 * 함대 척수 프리셋: `npc/edenCapitalFleetConfig.ts`(소규모·`LARGE_SCALE_*`).
 *
 * 새 행성 스테이지·미션·이벤트·모달 전투는 `src/combat`에서만 import 하고,
 * `PlanetEdenRaidTestLayer` 직접 참조는 피한다(구현 교체·리네임 시 한곳만 수정).
 *
 * 권장 패턴:
 * - `CapitalRealtimeCombatSimBinder`로 `StageShell`을 감싼 뒤 `CapitalRealtimeCombatSimContext`로 sim 구독
 * - (레거시) 동일 `orbitSize`·`active`로 `useCapitalRealtimeCombatSim` 직접 호출은 테스트·특수 화면용
 * - 교전 전용 HP/팀: `useCapitalRealtimeEncounterLayoutEffect` 또는 `applyCapitalRealtimeEncounterLayout`
 * - 승패: `useCapitalRealtimeDuelOutcome`
 * - 궤도만: `CapitalRealtimeCombatOrbitView` + (선택) `CapitalRealtimeCombatHudOverlay`
 * - 상세 전투 로그 HUD: `CAPITAL_REALTIME_COMBAT_LOG_UI_ENABLED` (`capitalRealtimeCombatUiFlags.ts`)
 */

export {
  CAPITAL_REALTIME_COMBAT_LOG_UI_ENABLED,
  COMBAT_HUD_LOG_MAX_AGENT_LINES,
} from './capitalRealtimeCombatUiFlags';

export { clearCapitalRealtimeCombatPresentationCaches } from './clearCapitalRealtimeCombatCaches';

export {
  applyCombatResumeSnapshotToAgents,
  captureCombatResumeSnapshot,
  clearCombatResumeSnapshot,
  consumeCombatResumeSnapshotForSession,
  makeCombatSessionKey,
  peekCombatResumeSnapshot,
} from './combatResumeStore';
export type {
  CombatResumeAgentEntry,
  CombatResumeAgentTeam,
  CombatResumeDuelSpawnVariant,
  CombatResumeSnapshot,
} from './combatResumeStore';

export {
  CAPITAL_REALTIME_MISSILE_HIT_FX_MAX_SIMULATED,
  CAPITAL_REALTIME_MISSILES_MAX_SIMULATED,
  CAPITAL_REALTIME_SALVO_SIZE,
  CAPITAL_REALTIME_SALVO_UNGUIDED_PER_VOLLEY,
} from './capitalCombatConventions';

export type {
  CapitalRealtimeCombatSim,
  CapitalRealtimeEncounterLayout,
  CapitalRealtimeEncounterSlot,
} from './capitalRealtimeTypes';

export {
  CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID,
  hasCapitalRealtimeCombatSlotsForPlanet,
  isCapitalRealtimeCombatOrbitPlanet,
} from './capitalRealtimeCombatGate';

export {
  CAPITAL_REALTIME_COMBAT_ORBIT_TEST_PLANET_ID,
  DRACO_SEAMLESS_PVP_TEST_PLANET_ID,
  DRACO_SEAMLESS_PVP_TEST_SYSTEM_ID,
  CapitalRealtimeCombatHudOverlay,
  CapitalRealtimeCombatOrbitSkia,
  /** @deprecated — `CapitalRealtimeCombatOrbitSkia` */
  CapitalRealtimeCombatOrbitSvg,
  CapitalRealtimeCombatSimBinder,
  CapitalRealtimeCombatSimContext,
  useCapitalRealtimeCombatSim,
  useCapitalRealtimeCombatSimContext,
  type PlanetEdenRaidSim,
} from './capitalRealtimeBridge';

export { CapitalRealtimeCombatOrbitView } from './CapitalRealtimeCombatOrbitView';
export type { CapitalRealtimeCombatOrbitViewProps } from './CapitalRealtimeCombatOrbitView';

export {
  applyCapitalRealtimeEncounterLayout,
  useCapitalRealtimeEncounterLayoutEffect,
} from './useCapitalRealtimeEncounterLayout';

export { useCapitalRealtimeDuelOutcome } from './useCapitalRealtimeDuelOutcome';

export {
  applyCapitalRealtimeEncounterBuild,
  buildCapitalRealtimeEncounterDuel,
  useCapitalRealtimeEncounterBuildEffect,
  type CapitalRealtimeEncounterBuild,
  type CapitalRealtimeEncounterBuildSource,
  type CapitalRealtimeEncounterSimPatch,
  type CapitalRealtimeSimSlotKnobs,
} from './capitalEncounterBuild';
