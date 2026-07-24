# 김클로드 착수 — 아크코어 판테온 12좌 · 외곽 거점 · 잔해 유물 수색 (전체)

> **배정**: 김팀장 (Cursor 본창) · **2026-07-24** · 대표님 지시: **김클로드가 해당 전체 내용 개발**  
> **정본 기획**: `docs/ARC_CORE_SUBCORE_PANTHEON_OPTIMIZATION_PLAN.md`  
> **교차**: `docs/ARC_CORE_WORLD_SUBCORE_SITES_AND_FINAL_GATE_PLAN.md`  
> **완료 후**: `kim-claude-handoff-pending.md` 상단에 **PENDING** 추가 · **git commit 금지** · 김팀장 검수 요청  
> **task_id**: `arc-core-pantheon-relics-20260724`

---

## [pss-pre-dev] (코딩 전 필수 — handoff에도 복사)

```text
[pss-pre-dev] hot_path=salvage실행1회드롭·허브wall_tick(등록수유지) · alloc=틱당신규금지·codex는이벤트시만 · cache=world_nodes·relics_O1_Map
[pss-pre-dev] stage=planet_hub_wreck·account_purge · risk=P1(틱금지)·P6(persist코얼레싱)
[pss-pre-dev] verdict=PASS — Attack onWallTick 비활성·맵상시마커금지·전행성폴링금지
```

---

## 0. 범위 / 비범위

### ✅ 이번 전체 구현 (김클로드)

| # | 축 | 요약 |
|---|-----|------|
| M1 | Table-First | `arc_core_world_nodes.csv` · `arc_core_pantheon_relics.csv` · `item_defs` 유물 12(+선택 본체 단서 1) · build |
| M2 | 서브코어 12좌 | TradePolicy **셸 제거→Economy 흡수** · Attack **등록(틱 비활성)** · `displayName`=신명 |
| M3 | 잔해→유물 | `planetSalvageSearch` 유물 분기 · 저확률 · 좌당 1회 해금 |
| M4 | 도감 store | `arcCorePantheonCodexStore` + **`purgeLocalAccountData` 연동** |
| M5 | UI | 유물 열람(신명·역할·단서) · `ArcOverlayHost`만 · 맵/HUD **기본 비공개** |
| M6 | 기반 훅만 | 전점령 `ALL_OWNED` / 최종 게이트는 **stub+플래그 자리** (본편 스토리·리셋 **금지**) |

### ❌ 이번 금지

- NPC+드론+스파이 **대통합** / Attack `onWallTick` 실제 디스패치
- 월드맵에 거점 마커·신명 상시 표시
- `Navigation.navigate` · `onSnapshot` · Skia 루프 할당
- 기존 L1~N 밸런스 CSV 임의 덮어쓰기
- git commit / 「완료」선언
- Phase D 허브 틱 옵트인 (선택·김팀장 후속)

---

## 1. 신명 12좌 ↔ 코드 ↔ 외곽 배치 (확정표)

본체 `eternal_throne` / `eternity` = **아크코어 근원** (12좌 밖).  
수도 `eden_city` / `core_prime` **배치 금지**.

| 신명 | godId | subCoreId (등록 후) | systemId | planetId |
|------|-------|---------------------|----------|----------|
| 크로노스 | chronos | `arc_core_daily_ops_subcore` | synth_035 | synth_035_p |
| 아레스 | ares | `arc_core_territorial_combat_subcore` | synth_063 | synth_063_p |
| 테미스 | themis | `ai_aabs_subcore` | synth_061 | synth_061_p |
| 헤르메스 | hermes | `ai_npc_subcore` | synth_040 | synth_040_p |
| 아폴론 | apollon | (InboundDrone 현 id 유지) | synth_048 | synth_048_p |
| 닉스 | nyx | `arc_core_spy_subcore` | synth_030 | synth_030_p |
| 가이아 | gaia | `ai_planets_subcore` | synth_027 | synth_027_p |
| 플루토스 | plutos | `economy_subcore` | synth_056 | synth_056_p |
| 아테나 | athena | `arc_attack_subcore` | synth_077 | synth_077_p |
| 이리스 | iris | `arc_news_board_subcore` | synth_074 | synth_074_p |
| 아스트라이아 | astraia | `arc_planet_nebula_subcore` | synth_079 | synth_079_p |
| 야누스 | janus | `world_expansion_subcore` | synth_064 | synth_064_p |

`displayName` 예: `크로노스` 또는 `크로노스 · 일일 운영` (한국어 UI용 · 기술 id는 DEV만).

---

## 2. M1 — Table-First

### 2-1. `tables/content/arc_core_world_nodes.csv`

컬럼(최소):

`nodeId,role,godNameKo,godNameEn,godId,subCoreId,planetId,systemId,mapVisibleWhileLocked,notesKo`

- `role=prime` 1행: `eternal_throne` / `eternity` / god 없음 또는 `arc_core`
- `role=subcore` 12행: 위 표
- `mapVisibleWhileLocked=false` (서브코어)

`npm run build:content-tables` (또는 프로젝트 기존 build 스크립트에 맞춰 generated TS 생성).  
레지스트리: `getArcCoreWorldNodeByGodId` / `listArcCoreSubcoreNodes` — **모듈 레벨 Map 1회**.

### 2-2. `tables/content/arc_core_pantheon_relics.csv`

`relicItemId,nodeId,godId,godNameKo,loreBodyKo,dropWeight,allowedPlanetPool,revealLevelDefault`

- `relicItemId` = `relic_seat_{godId}` (예: `relic_seat_chronos`)
- `allowedPlanetPool`: MVP는 `any_with_wreck` 또는 `iron_remnant` 우선 + `any_unlocked` 폴백 (구현 단순화 OK · CSV로 조절)
- `loreBodyKo`: 신명 + 역할 한 줄 + 외곽 단서(성계 별칭·방향). **해금 전 planetId 직서 금지**(단서 문구만). `revealLevel`로 단계 확장 가능하면 가산점.

### 2-3. `tables/content/item_defs.csv`

12행 추가 (기존 행 **수정 금지**):

- id = `relic_seat_*`
- type/category: 프로젝트 관례에 맞는 `relic` / quest-lore 계열 (기존 `tg_091` 유물 파편과 구분)
- name: `〔유물〕크로노스 비문` 등
- trade 판매 강제 불필요 · 인벤 보유·열람 중심

`npm run build:content-tables` 후 `getItemDef` 조회 가능해야 함.

---

## 3. M2 — 서브코어 최적화 (12개 유지)

파일: `src/arcCore/subcores/*` · `registerDefaultArcSubCores.ts`

1. **`AiTradePortLevelPolicySubCore` 등록 제거**  
   - 클래스 파일 삭제 **또는** deprecated 주석+미등록.  
   - Economy에 정책 슬롯 주석 1줄(진열은 기존 Economy/DailyOps 경로).
2. **`ArcCoreAttackSubCore` 등록**  
   - `onBoot`: 정책 워밍만(현 골격 유지).  
   - **`onWallTick` 정의/활성 금지** (드론·스파이 이중화 방지).
3. 등록 순서 유지하되 **최종 12개** = 기존 − Trade + Attack.
4. 각 SubCore `super(id, displayName)` 의 **displayName → 신명** (§1 표).

감사: `arcCoreHub.listSubCores().length === 12` (DEV assert 또는 단위 메모).

---

## 4. M3 — 잔해 수색 → 유물

기존:

- `src/worldObjects/providers/wreckWorldObjectProvider.ts`
- `src/game/planetSalvageSearch.ts`
- salvage UI: `src/systems/worldObjects/interactionComponents.tsx`

요구:

1. `pickSalvageLoot…` 확장:  
   - 기본 = 기존 광물 풀.  
   - 확률 `P` (CSV 또는 상수 **≤5%** MVP, 밸런스 CSV면 가산점)로 판테온 유물 시도.  
   - 이미 codex에 해금된 `godId`는 풀에서 제외.  
   - 전부 해금이면 광물/소액 크레딧 폴백.
2. **salvage 버튼 실행 시 1회만** 판정 — interval/틱/전행성 스캔 금지.
3. 획득 시: 인벤 추가(프로젝트 인벤 API 준수) + `codex.unlock(godId, revealLevel)`.
4. 알림: `showArcAlert` / overlay — 「유물을 회수했다」+ 신명(해금 직후만).

---

## 5. M4 — `arcCorePantheonCodexStore`

- AsyncStorage 키 예: `arcfire_arc_core_pantheon_codex_v1`
- state: `{ unlocked: Record<godId, { revealLevel, unlockedAtMs }> }`
- API: `hydrate` · `unlockGod` · `isUnlocked` · `listUnlocked` · `resetForAccountPurge`
- **persist**: unlock 시에만 · **디바운스/코얼레싱** (틱 persist 금지)
- `src/account/localAccountReset.ts` → `purgeLocalAccountData`에 reset 호출 등록
- 계정 생성 시 빈 도감(별도 시드 불필요)

---

## 6. M5 — UI (최소)

1. 유물 아이템 탭/상세 → Overlay 카드: 신명 · 역할 · loreBody · (revealLevel에 따른) 성계 단서  
2. (선택) 선술집/설정에 「판테온 도감」목록 — **미해금 슬롯은 `???`**  
3. **월드맵·허브 HUD에 거점/신명 상시 노출 금지**

`ArcOverlayCard` + i18n 키 한국어.

---

## 7. M6 — 최종 게이트 stub만

- `onArcCoreWorldNodesAllPlayerOwned()` 자리 또는 observation kind 예약  
- 플래그 store/AsyncStorage `pending|armed|triggered` 중 **미사용 기본 `pending`**  
- **스토리모드·전체 리셋 실행 금지** (주석으로 Phase E 명시)

---

## 8. Self-check (김클로드 필수)

```bash
npx tsc --noEmit -p tsconfig.client.json
npm run audit:memory:all
# content build 사용 시
npm run build:content-tables
```

handoff에 기록:

- 변경 파일 목록
- 등록 SubCore 12개 id + displayName
- salvage 드롭 확률·풀 제외 로직 한 줄
- purge 연동 여부
- `[pss-pre-dev]` 3줄
- 리스크: Attack 틱 미활성 확인 · 맵 스포일러 없음

---

## 9. 완료 시 김클로드 행동

1. `tools/kim-team-lead/reports/kim-claude-handoff-pending.md` **맨 위**에 PENDING 블록 추가  
2. `task_id=arc-core-pantheon-relics-20260724` · ready 경로 본 파일  
3. 대표님께: **「김팀장(Cursor 본창) 검수 요청」**  
4. **commit 하지 말 것**

---

## 10. 김팀장 검수 포인트 (참고)

- Trade 미등록 · Attack 등록·틱 없음 · displayName 신명  
- 유물 12 + world_nodes 정합 · 맵 비공개  
- purge · tsc · audit:memory:all  
- 커밋은 대표님 지시 시에만 김팀장
