# 김클로드 착수 — 은하 지도 플레이어 독립국 국가명 라벨 (스텔리움/크림슨과 동일)

> **배정**: 김팀장 (Cursor 본창) · **2026-07-27 20:19 KST**  
> **대표님 지시**: 은하계 지도에서 **스텔리움 연합·크림슨 레기온**처럼, 플레이어 **점령(소유권) 성계**에도 **동일 폰트·동일 위치 계산**으로 국가명 표시  
> **김클로드 즉시 착수** · 완료 후 handoff **PENDING** · **git commit 금지**  
> **task_id**: `galaxy-map-independent-nation-label-20260727`

---

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=worldmap_useMemo_1회 · alloc=라벨배열N개상한 · cache=voronoi모델기존
[pss-pre-dev] stage=galaxy_map · risk=P1(틱금지)·P3(memo deps)
[pss-pre-dev] verdict=PASS — 렌더/틱 신규루프금지·기존 occupationLabels 파이프라인확장만
```

---

## 0. 김팀장 현황 (이미 있는 것 · 갭)

### 이미 있는 파이프라인

| 축 | 경로 |
|----|------|
| 라벨 SVG(폰트) | `GalaxyMapTerritoryOccupationLabelsSvg.tsx` — `TERRITORY_LABEL` (white 70% · size 13 · weight 700) · **blue/red/independent 공용** |
| 문구 | `worldmap.tsx` `territoryNationLabels.independent` = `t('worldmap.territory.nation.independent', { name: nickname })` |
| 위치 계산 | `buildGalaxyTerritoryVoronoi.ts` `buildOccupationLabels` — 동일 side 연결성분 · **면적가중 중심** |
| side | `resolveMapFactionSideFromClanId` → `independent` (솔로 클랜 소유) |

### 유력 갭 (검수·수정 포인트)

1. **`MIN_LABEL_COMPONENT_AREA_PX2 = 12_000`** — 플레이어가 **1~소수 성계**만 독립국이면 Voronoi 셀 면적이 임계 미만 → **라벨 통째로 skip** (블루/레드 대륙은 통과, 독립국만 안 보임)
2. 위치는 이미 “성계 중앙”이 아니라 **연결성분 면적 중심** — 대표님 「동일 위치 지정계산」= **블루/레드와 같은 `buildOccupationLabels`** 유지. 노드(별) 좌표 하드코딩 분기 **금지**(별도 알고리즘이면 대표님 재확인)
3. 폰트는 이미 공용 — **새 Text스타일 만들지 말 것**. 안 보이면 생성/게이트 문제

---

## 1. 범위 (M0~M4)

### ✅ 김클로드

| # | 내용 |
|---|------|
| **M0** | 재현·원인 확정 — 독립국 1성계·다성계에서 `occupationLabels`에 `factionSide:'independent'` 진입 여부 · 면적 게이트 skip 여부 로그/단위테스트로 증명 |
| **M1** | 플레이어 독립국 라벨이 **스텔리움/크림슨과 동일 SVG 스타일**로 항상 보이도록 수정(권장 1안: independent 성분만 면적 하한 완화 또는 **성계≥1이면 라벨 허용**; blue/red 임계는 **기존값 유지** — 기존값 변경 재확인 회피) |
| **M2** | 위치는 **기존** `buildOccupationLabels` 면적가중 중심만 사용 — 월드맵에 별도 Text/절대좌표 라벨 추가 금지 |
| **M3** | 문구 = 기존 i18n `worldmap.territory.nation.independent` (닉네임) — CSV/기존 i18n 키 무단 개서 금지 |
| **M4** | 단위테스트 또는 순수함수 테스트 — independent 소면적도 라벨 1개 생성 · blue/red 대면적 동작 회귀 없음 |

### ❌ 금지

- `TERRITORY_LABEL`과 다른 폰트/색/크기 신규 상수
- planetId/`sirius` 하드코딩
- 틱·setInterval · Skia Make/Paint
- blue/red `MIN_LABEL_COMPONENT_AREA_PX2` 기존값 무단 변경(independent만 분기 권장)
- git commit / 「완료」선언

---

## 2. 주요 파일

- `src/galaxyMap/buildGalaxyTerritoryVoronoi.ts` — `buildOccupationLabels` · `MIN_LABEL_COMPONENT_AREA_PX2`
- `src/galaxyMap/GalaxyMapTerritoryOccupationLabelsSvg.tsx` — 스타일 공용 유지
- `app/(game)/worldmap.tsx` — `territoryNationLabels` (이미 independent 있음 · 불필요하면 미수정)
- `src/galaxyMap/computeGalaxyMapTerritoryVoronoiModel.ts` — side 주입 확인

---

## 3. 게이트

```bash
npx tsc --noEmit -p tsconfig.client.json
npm run audit:memory:all
# 순수 라벨 빌더 테스트 추가 시
npx tsx --test <해당.test.ts>
```

실기: 소유권 보유 성계 1곳+ 있는 세이브로 월드맵 — **닉네임 독립국** 문구가 스텔리움/크림슨과 **같은 흰 굵은 글씨**로 영토 중앙에 보이는지.

---

## 4. handoff

status=`PENDING` · task_id=`galaxy-map-independent-nation-label-20260727` · M0 원인 1줄 · M1 선택안 · 변경 파일 · 실기 soft/확인 · commit 금지
