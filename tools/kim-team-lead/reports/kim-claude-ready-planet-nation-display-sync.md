# 김클로드 착수 — 성계 점령·중립화·소유권 구매 후 「국가」표시 연동 전수 수정

> **배정**: 김팀장 (Cursor 본창) · **2026-07-27** · 대표님 지시: 시리우스 점령→중립화→소유권 구매 후 **국경(녹색)은 맞는데 행성정보에 여전히 `[국가: …]`(스텔리움/크림슨 등 CSV 고정)**  
> **목표**: 점유/소유권 변경 후 **모든 UI 「국가·점유」표기가 hold·지도 side와 불일치하지 않게** 단일 런타임 해석기로 수렴  
> **완료 후**: `kim-claude-handoff-pending.md` 상단 **PENDING** · **git commit 금지**  
> **task_id**: `planet-nation-display-sync-20260727`

---

## [pss-pre-dev] (코딩 전 필수)

```text
[pss-pre-dev] hot_path=행성정보오버레이오픈·스냅샷1회 · alloc=문자열치환1회 · cache=hold키미사용금지
[pss-pre-dev] stage=dispose불필요(순수표시) · risk=P3(설명memo시hold미포함)·P1(틱경로금지)
[pss-pre-dev] verdict=PASS — CSV기존값불변·런타임접두만재작성·틱/persist추가금지
```

---

## 0. 김팀장 전수검사 요약 (이미 완료 · 재분석 최소)

### 재현·증상

대표님 경로: **시리우스 성계 점령 → 중립화 → 소유권 구매 → 국경선(독립/녹색) 표시 OK**  
그러나 **행성정보**에 여전히 **`[국가: 스텔리움 연합]`**(또는 CSV 시드 국가명) 표기.

> 참고: `sirius_border` CSV 시드는 **크림슨 레기온**(`planet_occupation_seeds` RED). 대표님 언급 「스텔리움」은 동일 버그 클래스(정적 `[국가:]` 접두)로 취급 — **행성 id 하드코딩 금지**, 전 행성 공통 수정.

### 왜 국경만 맞고 행성정보는 틀리는가

| 축 | 정본 경로 | 현재 동작 |
|----|-----------|-----------|
| **국경·영토색** | `claimPlanetOwnershipByPurchase` → `occupierClanId=solo_clan_*` · `kind=player_independent` → `resolveEffectiveMapOccupierClanId` / Voronoi | ✅ 런타임 hold |
| **월드맵 국가 라벨** | `worldmap.territory.nation.*` + `independent` 닉네임 | ✅ 런타임 |
| **행성정보 설명** | `resolvePlanetTableDescription` → `planets.csv` / stage 설명 | ❌ **CSV에 박힌 `[국가: …]` 고정** — hold 미반영 |
| **행성정보 「점유 팩션」행** | `buildPlanetEconomyInfoSnapshot` → `resolveOccupierFactionKindForHold` | △ hold 기준이면 OK. 단 **설명 접두와 제품 언어가 다름**(「점유 팩션」vs「국가」) |

### 정적 `[국가:]` 발생처 (정본 CSV · generated는 빌드 산출)

- `tables/content/planets.csv` `description` / `descriptionEn` — 예: `[국가: 크림슨 레기온] …` / `[Nation: Crimson Legion] …`
- `formatPlanetNationDescriptionPrefix` (`megaFactionNationPolicy.ts`) — BLUE/RED 접두 헬퍼만 존재, **independent·neutral 재작성 경로 없음**
- UI 소비: `PlanetEconomyInfoOverlayContent` ← 스냅샷 `planetDescription` / `resolvePlanetTableDescription`

### ❌ 이번 범위에서 **하지 말 것**

- `planets.csv` 기존 `[국가:…]` 문구 **일괄 삭제·개서**(기존값 변경 재확인 대상) — **런타임 재작성만**
- 점유 시드·구매·국경 색 로직 재설계 (`claimPlanetOwnershipByPurchase` 이미 독립국 OK)
- 총사령관 notesKo 로어 문구 변경
- planetId/`sirius` 하드코딩 분기
- git commit / 「완료」선언

---

## 1. 범위 (M0~M5)

### ✅ 김클로드 구현

| # | 요약 |
|---|------|
| **M0** | **단일 해석기** — `planetId` → 런타임 hold → `MapFactionSide`(blue/red/neutral/independent) → **표시용 국가명** (ko/en) |
| **M1** | **설명 접두 재작성** — 기존 `[국가:…]` / `[Nation:…]` strip 후 M0 결과로 재접두. 중립이면 접두 제거(또는 i18n 「중립」1안 — handoff에 선택 명시) |
| **M2** | **단일 주입점** — `resolvePlanetTableDescription`(또는 스냅샷 직전 1곳)에만 연결해 행성정보·동일 헬퍼 소비처 **전부** 동기화 |
| **M3** | **표시 정합 감사** — 점령/중립/구매 후 UI 표면 체크리스트 통과(아래 §3). 불일치 발견 시 **같은 해석기**로 수정 |
| **M4** | **점유 팩션 행** — independent일 때 `econSnap.playerClanOccupied`만으로는 「국가」체감 부족하면, 값에 **닉네임/독립국 라벨**(월드맵 `territory.nation.independent`와 동일 키) 정렬. 기존 blue/red 라벨은 메가팩션 국가명과 어긋나지 않게 |
| **M5** | **단위 테스트** — hold `player_independent` → 설명에 시드 국가명 **없음** + 독립/닉네임 접두 **있음**; blue/red seed hold → CSV와 동일 국가명; neutral → 시드 국가 접두 **없음** |

### ⭕ 선택 (시간 되면 · 없으면 handoff에 「미착수」)

| M6 | 행성정보 전용 「국가」필드 행 추가(설명 접두와 중복이면 **추가하지 말 것** — 접두 재작성 우선) |
| M7 | 월드맵 하단/선택 패널에 CSV 설명이 그대로 나오면 동일 M1 적용 |

---

## 2. 구현 가이드 (1안)

### M0 — 해석기 (권장 위치)

`src/world/` 또는 `src/clanWar/` 신규 소형 모듈 (예: `resolvePlanetRuntimeNationDisplay.ts`):

1. `useClanWarFoundationStore.getState().getHold(planetId)` (+ 필요 시 `resolveEffectiveMapOccupierClanId`)
2. side 판정: 기존 `resolveMapFactionSideFromClanIdPure` / independent 판정(`kind==='player_independent'` · `isPlayerOriginatedClanId`) **재사용** — 지도와 **동일 규칙**
3. 표시명:
   - `blue` / `red` → `resolveMegaFactionNationDisplayName` / `resolveNationDisplayNameForMapSide`
   - `independent` → `t('worldmap.territory.nation.independent', { name: nickname })` 또는 기존 `INDEPENDENT_NATION_LABEL` + 닉네임(월드맵과 **동일 문구**)
   - `neutral` → 접두 없음(권장) 또는 「중립」

**금지**: 렌더/`useMemo`에서 economy dispatch · 전 행성 루프 · persist.

### M1 — strip + reprefix

```ts
// 개념 — 구현은 프로젝트 스타일 맞춤
function stripNationDescriptionPrefix(text: string): string {
  return text
    .replace(/^\[국가:\s*[^\]]+\]\s*/u, '')
    .replace(/^\[Nation:\s*[^\]]+\]\s*/i, '')
    .trim();
}

function withRuntimeNationPrefix(raw: string, planetId: string, locale: AppLocale): string {
  const body = stripNationDescriptionPrefix(raw);
  const nation = resolvePlanetRuntimeNationDisplay(planetId, locale); // null if neutral
  if (!nation) return body;
  return locale === 'en' ? `[Nation: ${nation}] ${body}` : `[국가: ${nation}] ${body}`;
}
```

`formatPlanetNationDescriptionPrefix`는 BLUE/RED 전용으로 두되, **런타임 경로는 M0/M1만** 쓰게 문서화.

### M2 — 주입점

**권장**: `resolvePlanetTableDescription` 반환 직전에 `withRuntimeNationPrefix`  
→ `buildPlanetEconomyInfoSnapshot` / `PlanetEconomyInfoOverlayContent` / stage 폴백 설명 **자동 동기화**.

`useMemo`로 설명을 캐시하는 UI가 있으면 deps에 **`hold.occupierClanId` · `hold.kind` · `hold.deedOwnerClanId`**(또는 hold revision) 포함 — **P3 방지**.

### M4 — 점유 팩션 라벨 정렬

`occupierFactionLabelKo` / i18n:

- independent → 월드맵과 같은 「{닉네임} 독립국」류 (신규 키 필요 시 `econSnap.*`만 추가, CSV 기존값 변경 금지)
- blue/red → 가능하면 `econSnap.blueOccupied`가 「스텔리움 연합」과 **제품적으로 같은 의미**인지 확인; 어긋나면 국가 displayName 사용(기존 i18n 키 재사용 우선)

---

## 3. 전수검사 체크리스트 (M3 · 구현 후 handoff에 PASS/FAIL 표)

성계 1곳(시리우스 보더 권장) 시나리오: **국가시드 → 플레이어 중립화 → 소유권 구매**.

| # | 표면 | 기대 |
|---|------|------|
| C1 | 월드맵 국경/채움 | independent(녹색) |
| C2 | 월드맵 영토 국가 라벨 | independent 닉네임 |
| C3 | 행성정보 **설명** 첫머리 | `[국가: …]` = **독립/닉네임** (시드 스텔리움·크림슨 **금지**) |
| C4 | 행성정보 **점유 팩션** | 플레이어/독립 (블루·레드 시드 라벨 **금지**) |
| C5 | 허브 소유 플레이트 | `(소유중)` / 클랜명 — 국가시드 기본 플레이트 아님 |
| C6 | 중립화만(구매 전) | 국경 neutral · 설명에 시드 `[국가:]` **없음** |
| C7 | 미점령 시드 행성 | CSV와 동일 국가 접두 유지 |

코드 grep으로 추가 소비처 확인:

```text
resolvePlanetTableDescription
resolvePlanetDescription
formatPlanetNationDescriptionPrefix
econInfo.occupierFaction
worldmap.territory.nation
```

---

## 4. 게이트 (김클로드 self-check)

```bash
npx tsc --noEmit -p tsconfig.client.json
npm run audit:memory:all
# 단위 테스트 추가 시 해당 파일만 실행
```

Skia/Reanimated **비해당**.  
`planets.csv` **기존행 수정 금지**(기존값 변경 규칙).

---

## 5. handoff 필수 기록

`kim-claude-handoff-pending.md` 상단:

- status=`PENDING` · task_id=`planet-nation-display-sync-20260727`
- 변경 파일 목록 · M0~M5 체크
- C1~C7 표 (실기 불가 시 단위테스트+코드추적 근거)
- `[pss-pre-dev]` 3줄 재기재
- **commit 금지** · 김팀장 검수 요청

---

## 6. 교차 참조

- 독립국 구매: `clanWarFoundationStore.claimPlanetOwnershipByPurchase`
- 지도 side: `planetOwnershipModel` · `mapFactionSideCore`
- 국가명 정책: `megaFactionNationPolicy.ts`
- 행성정보: `resolvePlanetTableDescription.ts` · `planetEconomyInfoSnapshot.ts` · `PlanetEconomyInfoOverlayContent.tsx`
- 명세: `docs/PLAYER_INDEPENDENT_NATION_IMPLEMENTATION_SPEC.md` (국경은 완료 · **본 태스크=표시 연동 잔여**)
