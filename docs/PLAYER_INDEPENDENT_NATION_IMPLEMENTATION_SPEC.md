# 플레이어 독립국가(녹색 국경) — 김클로드 구현 명세 v1.0

> **작성**: 김팀장 (Cursor 본창) · 2026-07-07  
> **상태**: `READY` — 대표님 지시 시 김클로드 즉시 착수  
> **handoff**: `tools/kim-team-lead/reports/kim-claude-ready-player-independent-nation.md`  
> **분석 근거**: Cursor 본창 세션 2026-07-07 (occupier/deed 분리·4대 갭 분석)

---

## 0. 제품 목표 (한 줄)

플레이어가 **소유권 증서**를 구매한 행성은 **블루(스텔리움 연합) 영토에서 독립**하여 **녹색 국경·채움**의 **독립국가**가 되며, **우호=블루 / 적대=레드(크림슨 레기온)** 관계를 갖는다.

---

## 1. 현재 아키텍처 (이미 있는 것)

| 개념 | 필드 | 역할 |
|------|------|------|
| 영토·국경 | `PlanetClanHold.occupierClanId` | Voronoi side·색·접전 판정 |
| 소유권 증서 | `PlanetClanHold.deedOwnerClanId` | 무역소 혜택·허브 플레이트 |
| 저장 | `clanWarFoundationStore.planetHolds` → Firestore `planet_holds` 단발 병합 | v4.0 §6-3 |

**구매 진입**: `app/(game)/trade.tsx` → `claimPlanetOwnershipByPurchase` (`clanWarFoundationStore.ts`).

**문제 (반드시 수정)**: 구매 시 `occupierClanId = nationOccupierId`(블루/레드 국가 시드)로 **강제** → 지도가 블루/레드로 유지됨.

```typescript
// src/store/clanWarFoundationStore.ts ~297 — 현재
occupierClanId: nationOccupierId,  // ← 독립을 막는 지점
deedOwnerClanId: clanId,
```

**이미 있는 유틸**:
- `isPlayerOriginatedClanId` — `src/clanWar/planetOwnershipModel.ts`
- `resolveMapFactionSideFromClanIdPure` — `src/galaxyMap/mapFactionSideCore.ts` (blue/red/neutral만)
- `resolveEffectiveMapOccupierClanId` — hold.occupier 기준 지도 occupier
- `shouldSkipOccupationSeedReconcile` — `player_home`·플레이어 uid 거점 보호 (`seedPlanetOccupationFromBalance.ts`)

**주의 — 역마이그레이션 함정**:
`migratePlanetHoldOwnershipSplit`는 occupier=플레이어 클랜 & deedOwner=null 이면 **국가 occupier로 되돌림**. 신규 구매는 **occupier·deedOwner 모두 player clanId** 로 설정해 이 분기 회피.

---

## 2. 설계 결정 (김팀장 확정 · 변경 시 대표님 승인)

| 항목 | 결정 |
|------|------|
| Map side 키 | `'independent'` (별칭 표기: green / 독립국) |
| 녹색 hex | `#3FBF6B` (채움·국경 공용, CSV 정본) |
| 구매 후 occupier | **플레이어 solo/클랜 id** (`ensureSoloClan` 결과) |
| 구매 후 kind | **`player_independent`** (신규 `PlanetHoldKind` 값) |
| megaFactionId (solo clan) | 구매자 `player.political.megaFactionId` **유지** (출신국) — side 판정은 **occupier 기준 independent** |
| 외교 | independent ↔ `mega_stellium_alliance` = **ally**, ↔ `mega_crimson_legion` = **hostile** |
| 기존 blue/red CSV 시드 | **행 미변경** — 신규 행·분기만 추가 |
| F6(전투 연동) | **2차 마일스톤** — 1차는 side·색·구매·지도·플레이트 |

---

## 3. 구현 마일스톤

### M1 — 코어 (필수 · 1차 PR)

| ID | 작업 | 파일 |
|----|------|------|
| M1-A | `MapFactionSide`에 `'independent'` 추가; `resolveMapFactionSideFromClanIdPure`가 **플레이어 유래 occupier** → independent; `resolveMapFactionBorderColor` 녹색 | `src/galaxyMap/mapFactionSideCore.ts` |
| M1-B | CSV **신규 행**: `faction_side,independent,#3FBF6B,...` + `npm run build:balance-tables` | `tables/balance/clan_map_faction_color_policy.csv` |
| M1-C | `PlanetHoldKind`에 `'player_independent'` 추가 | `src/types/index.ts` |
| M1-D | `claimPlanetOwnershipByPurchase`: `occupierClanId: clanId`, `kind: 'player_independent'` | `src/store/clanWarFoundationStore.ts` |
| M1-E | reconcile: `shouldSkipOccupationSeedReconcile`에 `kind === 'player_independent'` 보호; `shouldRestoreNationSeedOccupier`가 independent occupier 복구 **금지** | `src/arcCore/balance/seedPlanetOccupationFromBalance.ts` |
| M1-F | `resolveTerritorialSideForHold` — player_independent → independent side (occupier 경유로 M1-A면 자동일 수 있음 — 테스트로 확인) | `src/clanWar/planetOwnershipModel.ts` |

### M2 — 지도·UI (1차 PR에 포함 권장)

| ID | 작업 | 파일 |
|----|------|------|
| M2-A | Voronoi site side 타입에 `independent` | `buildGalaxyBlueRedVoronoiBorders.ts`, `computeGalaxyMapTerritoryVoronoiModel.ts` |
| M2-B | 국경: independent↔blue / independent↔red / independent↔neutral 변 분기 (녹색 segment) | `buildGalaxyBlueRedVoronoiBorders.ts` |
| M2-C | territory fill: `factionSide === 'independent'` 채움; 라벨 타입 확장 | `buildGalaxyTerritoryVoronoi.ts` |
| M2-D | 허브 플레이트: 독립국 표기 + 녹색 (`resolvePlanetHubOwnershipPlate`, i18n) | `planetOwnershipModel.ts`, `src/i18n/locales/ko.ts` 등 |
| M2-E | (선택) 기존 구매 hold 마이그레이션: occupier=nation & deedOwner=player → independent 전환 1회 패스 | `migratePlanetHoldOwnershipSplit` 인접 또는 boot hydrate |

### M3 — 외교·전투 (2차 · 별도 task)

| ID | 작업 |
|----|------|
| M3-A | `tables/balance/faction_diplomacy_policy.csv` 신설 + generated |
| M3-B | `resolveTerritorialDiplomacyRelation(aSide, bSide)` — NPC/접전 연동 |
| M3-C | ArcCore `applyArcCoreTerritorialHold` independent 분기 |

---

## 4. 파일 체크리스트 (김클로드 diff 기준)

```
src/types/index.ts                          — PlanetHoldKind
src/galaxyMap/mapFactionSideCore.ts           — side + border color
src/galaxyMap/resolveMapFactionSide.ts        — re-export only (확인)
src/galaxyMap/buildGalaxyBlueRedVoronoiBorders.ts
src/galaxyMap/buildGalaxyTerritoryVoronoi.ts
src/galaxyMap/computeGalaxyMapTerritoryVoronoiModel.ts
src/clanWar/planetOwnershipModel.ts           — plate, territorial side, (canPurchase 검토)
src/store/clanWarFoundationStore.ts           — claimPlanetOwnershipByPurchase
src/arcCore/balance/seedPlanetOccupationFromBalance.ts
tables/balance/clan_map_faction_color_policy.csv
src/data/balance/generated/                   — build 산출 (직접 수정 금지)
```

**건드리지 말 것 (1차)**:
- `planetOwnershipDeedPricing` / v5 가격 곡선
- Skia 전투·STAGE dispose
- `tables/balance/planet_occupation_seeds.csv` **기존 행**

---

## 5. Voronoi 국경 분기 (M2-B 가이드)

현재 (`buildGalaxyBlueRedVoronoiBorders.ts` ~106-108):

```typescript
const hasBlue = sideA === 'blue' || sideB === 'blue';
const hasRed = sideA === 'red' || sideB === 'red';
if (!hasBlue && !hasRed) continue; // ← independent만 있으면 국경 안 그림
```

**목표**: `hasIndependent` 추가. 예시 우선순위:

| 인접 | kind | color |
|------|------|-------|
| blue + red | contest | amber (기존) |
| independent + red | contest 또는 independent-hostile | 기획: **contest amber** 또는 red-green 혼합 — **1안: independent 변은 녹색** |
| independent + blue | independent | `#3FBF6B` |
| independent + neutral | independent | `#3FBF6B` |
| blue + neutral | blue | (기존) |
| red + neutral | red | (기존) |

1차 구현: **independent가 포함된 모든 국경 = 녹색** (단순·안전). blue-red contest 로직 **유지**.

---

## 6. 테스트·검증 (김클로드 self-check)

```bash
npm run build:balance-tables
npx tsc --noEmit -p tsconfig.client.json
npm run audit:memory:all
# Voronoi/SVG만 변경 시 Skia audit 영향 낮음 — worldmap SVG 수정 시에도:
npm run audit:skia-memory
```

**단위 테스트 추가 권장**:
- `mapFactionSideCore` — player clan id → independent
- `claimPlanetOwnershipByPurchase` — occupier === clanId, kind === player_independent
- `seedPlanetOccupationFromBalance` — reconcile 후 independent hold 유지

**수동 smoke** (대표님):
1. 블루 영토 행성 무역소에서 소유권 구매
2. worldmap — 해당 성계 **녹색 채움·녹색 국경**
3. 허브 — 클랜 플레이트 **독립국** 표기
4. 앱 재시작·12:00 배치 후에도 **블루로 복구되지 않음**

---

## 7. 메모리·헌법 게이트

```text
[pss-pre-dev] hot_path=정적 Voronoi 빌드·hold patch 1회 alloc=구매·reconcile O(1) cache=clanWarFoundationStore
[pss-pre-dev] stage=worldmap SVG 정적·부트 동기 전행성 루프 없음 risk=P7 없음
[pss-pre-dev] verdict=PASS
```

- v4.0 §16: `planet_holds` 단발 병합 유지 · `runTransaction` 금지
- Table-First: 색·외교는 CSV · generated 직접 편집 금지
- 기존 blue/red **행·곡선 변경 금지** — 신규 추가만

---

## 8. 김클로드 완료 시 handoff

1. `tools/kim-team-lead/reports/kim-claude-handoff-pending.md` **상단** 갱신
2. `status` → **`PENDING`**
3. `task_id` → `player-independent-nation-m1-m2-20260707`
4. 변경 파일·self-check·M2-E 마이그레이션 적용 여부·smoke 체크리스트
5. **git commit 금지** — 김팀장 검수 후 커밋

---

## 9. 참조

| 문서/코드 | 경로 |
|-----------|------|
| v4.0 행성 점유 | `.cursor/rules/Arcfire_Master_Spec_v4.0-*.mdc` §6-3 |
| 소유권 증서 CSV | `tables/content/item_defs.csv` `ownership_*` |
| 메가팩션 국가명 | `src/world/megaFactionNationPolicy.ts` |
| 김클로드 규칙 | `CLAUDE.md` |
