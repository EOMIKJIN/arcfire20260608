# 김클로드 착수 준비 — 플레이어 독립국가(녹색 국경)

> **status**: `READY` (구현 대기 · 김클로드 착수 전)  
> **updated**: 2026-07-07 18:10 KST  
> **assigned_by**: 김팀장 (Cursor 본창) — 대표님 지시 대기  
> **task_id**: `player-independent-nation-m1-m2-20260707`  
> **구현 명세 정본**: `docs/PLAYER_INDEPENDENT_NATION_IMPLEMENTATION_SPEC.md`

---

## 대표님이 김클로드에게 전달할 한 줄 지시 (복사용)

```text
@김클로드 docs/PLAYER_INDEPENDENT_NATION_IMPLEMENTATION_SPEC.md 와 tools/kim-team-lead/reports/kim-claude-ready-player-independent-nation.md 를 읽고 M1+M2 구현해. 완료 후 kim-claude-handoff-pending.md status=PENDING. 커밋 금지.
```

---

## 작업 요약

플레이어 **소유권 증서 구매** 시 행성을 **블루 영토에서 독립** → **녹색 국경·채움** 독립국가. **우호=스텔리움 연합(블루) / 적대=크림슨 레기온(레드)** (M3는 2차).

### M1 코어 (필수)

1. `MapFactionSide` + `'independent'` + 녹색 border
2. CSV 색상 행 추가 + `build:balance-tables`
3. `PlanetHoldKind` + `'player_independent'`
4. `claimPlanetOwnershipByPurchase` → occupier = player clanId (국가 시드 X)
5. 일일 reconcile이 independent hold를 블루로 되돌리지 않게 보호

### M2 지도·UI (1차에 포함)

6. Voronoi 국경·채움·라벨 independent 처리
7. 허브 플레이트 독립국 표기 + i18n

### M3 보류 (이번 범위 X)

- `faction_diplomacy_policy.csv` · ArcCore 접전 전투 연동

---

## 핵심 수정 지점 (시작 파일)

| 우선순위 | 파일 | 변경 |
|----------|------|------|
| P0 | `src/store/clanWarFoundationStore.ts` | `claimPlanetOwnershipByPurchase` occupier/kind |
| P0 | `src/galaxyMap/mapFactionSideCore.ts` | independent side |
| P0 | `src/arcCore/balance/seedPlanetOccupationFromBalance.ts` | reconcile 보호 |
| P1 | `tables/balance/clan_map_faction_color_policy.csv` | 녹색 행 추가 |
| P1 | `src/galaxyMap/buildGalaxyBlueRedVoronoiBorders.ts` | 녹색 국경 |
| P1 | `src/galaxyMap/buildGalaxyTerritoryVoronoi.ts` | 채움·라벨 |
| P2 | `src/clanWar/planetOwnershipModel.ts` | 허브 플레이트 |

---

## 분석 결론 (왜 가능한가)

- `occupierClanId`(영토) vs `deedOwnerClanId`(증서) **이미 분리** — 확장 토대 OK
- 막는 것: 구매 시 occupier=국가 시드 + map side가 blue/red/neutral만 지원
- 4대 갭: (1) independent side (2) 녹색 렌더 (3) 구매 occupier 전환 (4) 외교 CSV — **1~3은 M1~M2, 4는 M3**

---

## self-check (완료 시 김클로드 실행)

```bash
npm run build:balance-tables
npx tsc --noEmit -p tsconfig.client.json
npm run audit:memory:all
```

선택: `seedPlanetOccupationFromBalance.test.ts` 또는 side 단위 테스트 추가.

---

## 금지·주의

- **git commit / merge / 「완료」 선언 금지** (`CLAUDE.md`)
- `tables/balance/planet_occupation_seeds.csv` **기존 행 변경 금지**
- blue/red 색상 **기존값 변경 금지** — independent **신규 행만**
- `migratePlanetHoldOwnershipSplit` 역방향 마이그레이션 함정 — occupier·deedOwner **둘 다** player clanId
- M3(외교·접전) **착수 금지** — 명세 2차 task

---

## 완료 후

`tools/kim-team-lead/reports/kim-claude-handoff-pending.md` 상단에 **PENDING** handoff 작성 → 대표님께 **「김팀장(Cursor 본창) 검수 요청」** 안내.
