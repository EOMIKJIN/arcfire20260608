/**
 * 실시간 전함 교전 **공통 규약** (뉴에덴 궤도 시험 = 참조 구현).
 *
 * 대규모 전투·추가 스테이지도 **로직 분기 없이** 이 규약을 따른다. 척수만
 * `src/npc/edenCapitalFleetConfig.ts`의 소규모/대규모 프리셋으로 바꾼다.
 *
 * - **팀**: `slot0`·`slot1` 레이아웃이 팀 전체에 적용, 승패는 팀 생존(`useCapitalRealtimeDuelOutcome`).
 * - **표적**: 함선마다 `currentTargetAgentId`, 격침 시 `resolveCombatOpponent`로 재지정.
 * - **미사일 살보**: `CAPITAL_REALTIME_SALVO_SIZE`연발, 그중 정확히 `CAPITAL_REALTIME_SALVO_UNGUIDED_PER_VOLLEY`발은
 *   비유도(발사 시 베지어·낙점 고정·무피해), 나머지는 표적 추적 후 도착 시 명중.
 * - **궤도**: 미사일 궤적은 Skia 단일 Canvas(레거시 주석의 SVG 경로는 참고용).
 * - **상한**: 시뮬 내 미사일·명중 이펙트 배열은 각각 상한을 두며, 만료분이 없으면 **가장 오래된 항목**부터 제거해 장시간 대규모 전투에서도 메모리가 비대해지지 않게 한다.
 */

/** 한 번의 미사일 살보 발수 */
export const CAPITAL_REALTIME_SALVO_SIZE = 3;

/**
 * 살보당 비유도(미스) 탄 수 — 현재는 `spreadIdx` 0..SIZE-1 중 무작위 한 발.
 * 값이 1이 아니면 `PlanetEdenRaidTestLayer`의 `salvoMissSpreadIdx` 로직을 같이 조정할 것.
 */
export const CAPITAL_REALTIME_SALVO_UNGUIDED_PER_VOLLEY = 1;

/** 동시에 시뮬에 유지할 미사일 상한 — `trimMissilesToMaxCap`은 만료분 우선, 없으면 가장 오래된 탄 제거 */
export const CAPITAL_REALTIME_MISSILES_MAX_SIMULATED = 64;

/** 동시에 유지할 미사일 명중 이펙트 엔티티 상한(만료 우선, 없으면 가장 오래된 FX 제거) */
export const CAPITAL_REALTIME_MISSILE_HIT_FX_MAX_SIMULATED = 96;

/*
 * ── 궤도 미사일 VFX 퍼포먼스(연출 유지·비용 절감) 로드맵 ─────────────────────
 *
 * 현재: `react-native-svg` + 매 rAF `setState` → 탄마다 `<Polyline>`·`<Circle>` 노드.
 * 탄 수가 늘면 **JS 레이아웃 + 네이티브 브릿지**가 병목이 된다(베지어 정점은 이미 LOD).
 *
 * 1) **Unity 프리팹에 가깝게**: 탄 하나 = 데이터(시작·제어점·travelMs·guided)만 두고,
 *    **풀링된 단일 메시/단일 DrawCall**에 박는 방식. RN에선 `@shopify/react-native-skia`
 *    Canvas에서 한 `Path`/`drawPoints`로 N탄 궤적을 한 번에 그리거나, `expo-gl`/`three.js`
 *    로 동일 인스턴스 버퍼 업데이트.
 *
 * 2) **별도 이펙트 매니저**: 시뮌(rAF)과 **렌더 FPS 디커플**(예: 30Hz로 궤적만 보간).
 *    `Reanimated` shared value + worklet에서 점 배열만 갱신, UI 스레드는 Canvas 1회.
 *
 * 3) **레이어 분리**: 함선 SVG / 미사일 Canvas / HUD React 3층 — 미사일만 네이티브
 *    레이어에서 갱신해 React reconciliation 비용 제거.
 *
 * 4) **히트 이펙트**: 지금은 Circle×파티클 수 — Skia 파티클 시스템 또는 스프라이트 시트
 *    + 단일 애니메이션 인스턴스.
 *
 * 단기(코드 내): `resolveCombatOrbitVfxBudget`으로 세그먼트·탄두 점·레이저 글로우만 완화.
 */
