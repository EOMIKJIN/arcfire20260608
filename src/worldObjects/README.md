# World Object 공통 레이어

소행성, 잔해물, 방위위성 등 궤도 오브젝트를 **행성 `planetId` 단위**로 공통 모델·조회한다.

## 목표

- 그래픽·기획 기능(채광/수거/요격)과 **오브젝트 목록**을 분리
- 종류별 도메인은 `src/systems/*` 프로바이더로 등록 — `query.ts` 단일 병합
- 인스턴스 id: `makeWorldObjectId(planetId, kind, instanceKey)` (예: `eden_prime:defense_satellite:1`)

## 구성

| 경로 | 역할 |
|------|------|
| `types.ts` | 공통 타입 |
| `ids.ts` | 행성·종류·인스턴스 id 생성/파싱 |
| `query.ts` | `listPlanetWorldObjects` + kind/id 조회 (메모 캐시) |
| `providers/registry.ts` | 프로바이더 등록·병합 |
| `providers/*` | 소행성·잔해 등 범용 프로바이더 |
| `applyInstanceRuntime.ts` | `objectId`별 영속 상태 병합 |
| `planetContext.ts` | `planetId` → 성계 컨텍스트 |

## 확장 규칙

1. **새 오브젝트 종류** — `src/systems/<도메인>/`에 `PlanetWorldObjectProvider` 구현 후 `providers/registry.ts`에 등록
2. **행성별 개수·CSV** — 해당 도메인 빌더만 수정 (query/registry는 건드리지 않음)
3. **인스턴스 상태(hp·depleted)** — `worldObjectRuntimeStore.patchInstanceState` + 빌더에서 `withWorldObjectInstanceRuntime` 병합
4. **인터랙션 UI** — `src/systems/worldObjects/interactionComponents.tsx`

## 방위위성

- 프로바이더: `src/systems/planetaryDefense/defenseSatelliteWorldObjectProvider.ts`
- 빌더: `buildPlanetDefenseSatelliteObjects` (행성 레벨·정책 CSV)
- 조회: `listPlanetDefenseSatellites(planetId)` → `listPlanetWorldObjectsByKind` 위임
