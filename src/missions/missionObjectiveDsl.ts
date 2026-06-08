/**
 * ============================================================
 * 미션 목표 DSL — v1 동결 (MissionObjective.type 확장 전 계약)
 * ============================================================
 *
 * **저장 스키마** (`AsyncStorage` `arcfire_missions_v1`, `missionStore.persistMissions`)
 * - `progresses: Record<missionId, MissionProgress>`
 * - `MissionProgress.objectives: Record<objectiveId, boolean>` — 키는 미션 데이터의 `MissionObjective.id`, 값 `true`면 완료.
 * - 목표 타입별로 `true`가 되는 조건은 아래 각 절. 완료는 `completeObjective(missionId, objectiveId)`로만 기록.
 *
 * **UI** (`QuestHUD`)
 * - 활성 미션 1건: `getActiveMission()` → `mission.title` + 첫 미완료 `objective.description` 표시.
 * - 타입별 전용 UI·진행률 바는 없음(텍스트만). 신규 타입 추가 시 HUD 분기 명세를 이 파일에 추가할 것.
 *
 * ---
 * ### `reach_system`
 * - **의미**: 플레이어 함선이 지정 성계에 도달.
 * - **완료 조건**: 월드/항법 플로우에서 `targetId` 성계 진입 시 해당 `objectiveId`에 대해 `completeObjective` 호출(현재 구현은 미션 스토어 외부에서 연결 필요).
 * - **targetId**: `StarSystem.id` (예: `vega_outpost`).
 *
 * ### `defeat_enemy`
 * - **의미**: 전투(또는 스크립트)로 표적 격파.
 * - **완료 조건**: `combat.tsx` 등에서 `obj.type === 'defeat_enemy' && obj.targetId === enemyTemplate.id`일 때 승리 처리와 함께 `completeObjective` (targetId는 `ENEMY_TEMPLATES` 키·미션 작성 시 일치 필수).
 * - **quantity**: v1에서는 미사용(1체 격파 가정). 추후 다수 격파 시 스토어에 카운터 필드 추가 후 이 문서 개정.
 *
 * ### `deliver_cargo`
 * - **의미**: 화물 인도(목표 행성/거점·품목은 미션 데이터로 기술).
 * - **완료 조건**: v1 — 인도 UI/스토어 연결 시 `completeObjective` 호출 규약을 여기에 추가.
 * - **targetId**: 인도 대상 키(행성 id 등). 스키마 확정 전까지 미션 작성자와 코드가 동일 문자열을 사용해야 함.
 *
 * ### `buy_goods`
 * - **의미**: 상점에서 지정 상품을 `quantity`만큼 구매.
 * - **완료 조건**: v1 — 무역 화면에서 구매 완료 시 `completeObjective` (누적 수량 검증은 호출 측).
 * - **targetId**: `TradeGood.id` 등 상품 키.
 *
 * **MissionObjective.complete** 필드는 데이터 시드용이며, 런타임 진행은 `MissionProgress.objectives`가 우선한다.
 */
export const MISSION_OBJECTIVE_SCHEMA_VERSION = 1 as const;
