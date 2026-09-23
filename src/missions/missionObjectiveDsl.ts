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
 * - 주·부선: `resolveMissionHudSlots()` — 주선(tutorial/main_story) + 부선(quest) 병행.
 * - 트랙: `mission_*` 튜토리얼 · `story_*` 메인스토리 · `sandbox_*` 수락 의뢰.
 * - 병행 objective 완료는 `listActiveMissionBundles()` 전체를 순회(허브·월드맵·무역·전투).
 *
 * ---
 * ### `reach_system`
 * - **의미**: 지정 성계의 행성 허브에 착륙(월드맵 성계 도착만으로는 완료되지 않음).
 * - **완료 조건**: `syncPlanetHubMissionAndDialog` / `applyLandedMissionObjectives`
 *   → `applyReachSystemMissionObjectives(..., gate: 'hub_landing')`.
 *   배송 화물 소모·클리어 대사도 착륙 후에만.
 * - **targetId**: `StarSystem.id` (예: `minerva`).
 * - **게이트**: `shouldApplyReachSystemObjective` 는 현재 `hub_landing` 만 true.
 *   `system_arrival`(월드맵 성계 도착)은 연출 전용 — 성계 지도 이동만으로 끝나는
 *   소수 퀘스트가 필요해지면 미션 플래그 분기를 **새로** 넣는다(지금 수단 없음).
 * - **동시 완료**: `pendingMissionClearQueue` 로 클리어 대사를 한 건씩 이어 띄움.
 *
 * ### `reach_planet`
 * - **의미**: 지정 행성 허브(STAGE 1)에 **진입**(착륙 + planet route focus).
 * - **완료 조건**: `syncPlanetHubMissionAndDialog(planetId)` — `landOnPlanet` 후 planet 허브 포커스.
 * - **targetId**: `Planet.id` (예: `vega_base`). 성계 도달만으로는 완료되지 않음.
 *
 * ### `defeat_enemy`
 * - **의미**: 전투(또는 스크립트)로 표적 격파.
 * - **완료 조건**: `applyDefeatEnemyMissionObjectives` —
 *   `QuestCombatLock` 베뉴(`transit` / `hub_orbit` / `wave_assault`)와
 *   `enemyTemplateId === targetId` 가 맞을 때만. 행성 id 단독 완료 금지.
 * - **quantity**: v1에서는 미사용(1체 격파 가정). 추후 다수 격파 시 스토어에 카운터 필드 추가 후 이 문서 개정.
 *
 * ### `deliver_cargo`
 * - **의미**: 화물 인도(목표 행성/거점·품목은 미션 데이터로 기술).
 * - **완료 조건**: v1 — 인도 UI/스토어 연결 시 `completeObjective` 호출 규약을 여기에 추가.
 * - **targetId**: 인도 대상 키(행성 id 등). 스키마 확정 전까지 미션 작성자와 코드가 동일 문자열을 사용해야 함.
 *
 * ### `buy_goods`
 * - **의미**: 지정 상품을 `quantity`만큼 보유(구매 또는 기존 인벤).
 * - **완료 조건**: `applyBuyGoodsMissionObjectives` — 무역 구매·수락·착륙 시 인벤 수량 검증.
 * - **targetId**: `TradeGood.id` 등 상품 키.
 *
 * ### `talk_npc`
 * - **의미**: 지정 함장과 1차 인게임 대화를 마친다 (허브 [대화] 또는 바).
 * - **완료 조건**: `applyTalkNpcMissionObjectives` — 대화 dismiss.
 * - **targetId**: `captainId` 또는 `captainId|planetId` (행성 한정).
 * - **씬**: `story_dialog_{objectiveId}` (manual).
 * - **순서**: `missionObjectiveSequence` — 앞 목표가 끝나야 완료.
 * - **인증(attest)**: 미구현 시스템(블랙마켓·회피 등)은 새 overlay/목표 타입을 만들지 않는다.
 *   마지막 페이지 `story_scene_pages.actionLabel` 동사 버튼 + 기존 `talk_npc` 완료만 쓴다.
 *   정본: `docs/MAIN_QUEST_FOUNDATION.md`.
 *
 * **MissionObjective.complete** 필드는 데이터 시드용이며, 런타임 진행은 `MissionProgress.objectives`가 우선한다.
 */
export const MISSION_OBJECTIVE_SCHEMA_VERSION = 1 as const;
