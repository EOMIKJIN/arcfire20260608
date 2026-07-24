# 아크코어 서브코어 운용 재점검 · 최적화 · 신명(神名) 12좌 · 외곽 배치 (v0.1)

> **상태**: **김클로드 착수 지시 완료 (READY)** · 구현은 김클로드 → 김팀장 검수  
> **작성**: 2026-07-24 · READY: `tools/kim-team-lead/reports/kim-claude-ready-arc-core-pantheon-relics.md`  
> **교차**: `docs/ARC_CORE_WORLD_SUBCORE_SITES_AND_FINAL_GATE_PLAN.md` · `registerDefaultArcSubCores.ts`

---

## 0. 용어 (혼동 금지)

| 층 | 의미 |
|----|------|
| **허브** | `arcCoreHub` — gameLoop 단일 벽시계 |
| **코드 SubCore** | `*SubCore` 클래스 (본 문서 최적화·신명 대상) |
| **세계 거점** | `arc_core_world_nodes` 행성에 앉힌 **로어 노드** (신명 좌와 1:1 매핑) |
| **본체** | `eternity` / `eternal_throne` — 12좌에 **포함하지 않음** (근원) |

---

## 1. 운용 재점검 결과 (코드 근거)

### 1-1. 허브 — **정상 운용**

- `bootstrapDefaultSubCores()` → 12개 등록 → `start()` 시 `onBoot` + `gameLoop.subscribe`로 전 SubCore `_advanceWallClock`
- 오프라인 catch-up는 **청크+yield** (타이틀 무반응 회귀 방어 유지)
- 백그라운드 `suspendWallClock` OK
- 고빈도 밸런스는 DailyOps **일 1회**로 수렴 — 헌법과 일치

### 1-2. 등록 12 + inert 1

| # | id | 핫패스 | 효율 판정 |
|---|-----|--------|-----------|
| 1 | `arc_core_daily_ops_subcore` | boot 지연 probe · **60s** planetDev+배치 probe | **KEEP · 핵심** |
| 2 | `arc_core_territorial_combat_subcore` | **60s** probe (캠페인 1h) | **KEEP** |
| 3 | `ai_aabs_subcore` | boot `loadAsync` only · **틱 없음** | **THIN · KEEP 좌** (도메인 명확) |
| 4 | `ai_npc_subcore` | **매 틱** 수송 · snapshot 스로틀 | **KEEP · 핫패스** |
| 5 | `arc_inbound_drone` | **매 틱** 캠페인 · 0.25s publish | **KEEP · 핫패스** |
| 6 | `arc_core_spy_subcore` | pulse 간격 틱 | **KEEP** |
| 7 | `ai_planets_subcore` | boot bootstrap only | **THIN · KEEP 좌** |
| 8 | `economy_subcore` | boot 명령구독+지연 패스 · **틱 없음** | **KEEP** |
| 9 | `trade_port_level_policy_subcore` | **빈 onBoot · 틱/명령 없음** | **SHELL → MERGE** |
| 10 | `arc_news_board_subcore` | 24h timed + 명령 | **KEEP** (일일 요약은 DailyOps와 역할 분리 OK) |
| 11 | `arc_planet_nebula_subcore` | unlock 명령 + 24h ecology | **KEEP** |
| 12 | `world_expansion_subcore` | boot sync/해금 only | **THIN · KEEP 좌** |
| — | `arc_attack_subcore` | **미등록 inert** | **12좌 재편 시 승격 후보** |

### 1-3. 효율이 낮은 지점

1. **`AiTradePortLevelPolicySubCore`** — 허브 Map만 차지하는 **완전 셸**. 진열 정책은 이미 Economy / DailyOps / MemoryGovernor 경로.
2. **AABS / Planets / WorldExpansion** — 틱 없음(의도된 얇음). **통합 강제 시 도메인 경계만 흐려짐** → 좌는 유지, 내부는 hydrate만.
3. **Attack 미등록** — 드론·스파이와 중복 골격. **지금 등록하면 이중 틱 위험** → 승격 시 Inbound/Spy를 **패사드만 유지하거나 Attack로 디스패치 수렴** 후 등록.
4. **매 프레임 12회 `_advanceWallClock`** — 대부분 mission 빈 Map + no-op. **비용은 작음**(측정상 PSS 주원인이 아님). 최적화 여지: “틱 구독자만 허브에 등록” 플래그(선택 Phase).

### 1-4. 통합 권고 (12좌 유지)

```text
BEFORE: 12 registered + 1 inert Attack
OPTIMIZE:
  • TradePortLevelPolicy → Economy 로 흡수(클래스 삭제 또는 no-op facade 제거)
  • Attack 을 12번째 좌로 승격하되, Phase A는 display/좌석+world node만
    (onWallTick은 Inbound/Spy 이관 완료 전엔 비활성 유지)
AFTER: 여전히 등록 12개 (Trade 자리 → Athena/Attack 좌)
```

**대규모 클래스 병합(Npc+Spy+Drone 등)은 비권장** — 핫패스·메모리 계약이 도메인별로 이미 분리됨.

---

## 2. 신명 12좌 재정의 (고유명사)

허브 메타명: **아크코어** = 근원 (본체 `eternal_throne`).  
서브코어 `displayName` / 세계 거점 `godNameKo` 정본 후보:

| 좌 | 신명(KO) | 신명(EN id) | 코드 도메인 (현/재편) | 역할 한 줄 |
|----|----------|-------------|----------------------|------------|
| 01 | **크로노스** | `chronos` | DailyOps | 일일 배치·행성개발 벽시계 |
| 02 | **아레스** | `ares` | TerritorialCombat | 접전·영토 전투 |
| 03 | **테미스** | `themis` | AABS | 능동 밸런스 정책 |
| 04 | **헤르메스** | `hermes` | Npc | 궤도 수송·NPC 트래픽 |
| 05 | **아폴론** | `apollon` | InboundDrone | 인바운드 드론 타격 |
| 06 | **닉스** | `nyx` | Spy | 스파이·T 침식 |
| 07 | **가이아** | `gaia` | Planets | 행성 코어·광물 런타임 |
| 08 | **플루토스** | `plutos` | Economy (+구 TradePolicy) | 무역소·경제 |
| 09 | **아테나** | `athena` | Attack (승격·얇은 좌) | 통합 공격 골격(단계 활성) |
| 10 | **이리스** | `iris` | NewsBoard | 공지·선술집 보드 |
| 11 | **아스트라이아** | `astraia` | Nebula | 성운 프로필·일일 변조 |
| 12 | **야누스** | `janus` | WorldExpansion | 월드/synth 해금 |

> 기존값(`displayName` 한국어 기술명) 변경 → **대표님 승인 후**만 `displayName`·CSV 반영 (`arcfire-existing-value-change-confirm`).

---

## 3. 은하 외곽 미발견 배치 (권장 12행)

정본 후보: `synth_*` 중 **아르카디아 hop ≥10 · zoneIndex ≥13** (해금 전 지도 암흑).  
본체·수도 제외: `eternal_throne` / `eden_city` / `core_prime`.

| 좌(신) | systemId | planetId | hops | zone | 방위 | 성계(EN) |
|--------|----------|----------|------|------|------|----------|
| 크로노스 | synth_035 | synth_035_p | 11 | 15 | south | Specter Energy Belt |
| 아레스 | synth_063 | synth_063_p | 11 | 15 | south | Arc Colony |
| 테미스 | synth_061 | synth_061_p | 11 | 15 | north | Cross Colony |
| 헤르메스 | synth_040 | synth_040_p | 11 | 15 | west | Opal Energy Belt |
| 아폴론 | synth_048 | synth_048_p | 10 | 15 | west | Ridge Trade Hub |
| 닉스 | synth_030 | synth_030_p | 10 | 14 | east | Nova Mining Site |
| 가이아 | synth_027 | synth_027_p | 10 | 14 | south | Zenith Mining Site |
| 플루토스 | synth_056 | synth_056_p | 10 | 14 | west | Flare Border |
| 아테나 | synth_077 | synth_077_p | 10 | 14 | north | Gate Base |
| 이리스 | synth_074 | synth_074_p | 10 | 14 | east | Base Base |
| 아스트라이아 | synth_079 | synth_079_p | 10 | 13 | south | Sanctum Base |
| 야누스 | synth_064 | synth_064_p | 10 | 14 | west | Stone Colony |

방위 요약: N2 · E2 · S4 · W4 (hop≥10 풀 한계). 더 균등히 하려면 Fable이 hop9·zone12 동급으로 **행만 교체**(좌 수 12 고정).

### Table-First (Phase 1)

`tables/content/arc_core_world_nodes.csv` (가칭):

| 컬럼 | 예 |
|------|-----|
| `nodeId` | `seat_chronos` |
| `role` | `subcore` (`prime`는 eternal_throne 단독) |
| `godNameKo` / `godNameEn` | 크로노스 / Chronos |
| `subCoreId` | `arc_core_daily_ops_subcore` |
| `planetId` / `systemId` | `synth_035_p` / `synth_035` |
| `mapVisibleWhileLocked` | `false` |

코드 SubCore **물리 이전 불필요** — 거점은 로어·점유·최종 게이트용. 런타임은 계속 허브 모듈.

---

## 3-A. 정보 공개 경로 — **잔해 수색 → 유물** (대표님 지시 2026-07-24)

> **원칙**: 12좌 신명·거점 좌표·역할은 **월드맵/설정/HUD에 기본 노출하지 않는다.**  
> 플레이어는 **궤도 잔해 수색**으로 얻은 **유물(아티팩트)** 을 통해서만 확인한다.

### 플레이 루프

```text
행성 허브 잔해(WO kind=wreck) → 수색(salvage)
  → (희귀) 아크코어 유물 획득
  → 유물 열람/감정 → 해당 좌 1조각 해금
       · godNameKo (예: 크로노스)
       · 역할 한 줄 (일일 운영 등)
       · 외곽 성계/행성 단서 (해금 전엔 성계 id 암시·별칭만, 좌표 직공개는 단계적)
  → 12조각 수집 시 「판테온 도감」완성 · (선택) 최종 게이트 힌트
```

### 기존 코드 연결 (구현 시)

| 축 | 경로 | 비고 |
|----|------|------|
| 잔해 WO | `wreckWorldObjectProvider.ts` | 이미 `salvage` 액션 stub |
| 수색 루트 | `planetSalvageSearch.ts` | 현재 광물 풀만 → **유물 테이블 분기 추가** |
| 아이템 | `item_defs.csv` | `type=relic` / `arc_core_pantheon_shard` 12종(+본체 단서 1) |
| 진행 | 계정 귀속 store (가칭 `arcCorePantheonCodexStore`) | **purge 연동 필수** |
| UI | 인벤 유물 상세 · (선택) 선술집/도감 패널 | `ArcOverlayHost`만 |

### Table-First (가칭)

`tables/content/arc_core_pantheon_relics.csv`

| 컬럼 | 예 |
|------|-----|
| `relicItemId` | `relic_seat_chronos` |
| `nodeId` / `godNameKo` | `seat_chronos` / 크로노스 |
| `loreBodyKo` | 유물 비문 전문(신명·역할·외곽 단서) |
| `dropWeight` | 수색 가중 |
| `allowedPlanetPool` | `any_unlocked` \| `iron_remnant` \| `near_seat` … |
| `revealLevel` | `name_only` → `role` → `system_hint` → `planet_id` (조각 중복/강화로 단계 공개 가능) |

### 드롭·밸런스 계약

- **기본 수색**: 기존 광물 루트 유지.
- **유물**: 저확률 · 좌당 **계정 1회 확정 해금**(중복 시 크레딧/잔여 파편만).
- **틱/렌더 금지**: 드롭 판정은 salvage **실행 시 1회**만. 전 행성 폴링·맵 마커 상시 생성 금지.
- **외곽 거점 행성**에 잔해가 없어도 됨 — 단서는 **이미 열린 잔해권**(예: 아이언 크로스) 등에서 나와 “어디에 숨었는지”만 알려 탐색을 유도.

### 스포일러 게이트

| 노출 | 기본 | 유물 해금 후 |
|------|------|----------------|
| 신명·역할 | 숨김 | 해당 좌만 |
| 거점 system/planet | 숨김 | `revealLevel`에 따라 |
| 코드 SubCore 기술 id | **영구 비표시**(개발자/DEV만) | — |
| 본체 이터니티 | 엔드 스토리/별도 유물 | 판테온과 분리 |

---

## 4. 구현 단계 (승인 후)

| Phase | 담당 | 내용 | 코드 |
|-------|------|------|------|
| **A** | 문서·승인 | 본안 · 신명·배치 · **유물 수색 공개** 확정 | 없음 |
| **B** | Fable | `arc_core_world_nodes.csv` + `arc_core_pantheon_relics.csv` + `item_defs` 유물 12행 + build | Table-First |
| **C** | 김팀장 | TradePolicy → Economy · Attack 좌 · `displayName` 신명 | `src/arcCore/subcores/*` |
| **C2** | 김팀장 | salvage → 유물 드롭 · codex store(purge) · 유물 열람 UI | `planetSalvageSearch` · overlay |
| **D** | 김팀장 | (선택) 허브 틱 옵트인 · Attack 디스패치 수렴 | 핫패스 재검수 |
| **E** | 기존 기획 | 전점령 → 최종 시스템 훅 | world-nodes Phase 2+ |

### PSS 1차 (Phase C 전)

```text
[pss-pre-dev] hot_path=hub_wall_tick_12→동일또는감소 alloc=틱당신규없음(병합시_감소) cache=world_nodes_O1
[pss-pre-dev] stage=부트_onBoot_지연유지 risk=P1,P6
[pss-pre-dev] verdict=PASS — 셸 제거·틱 추가 금지(Attack 틱 비활성)
```

---

## 5. 결론 (대표님 보고용)

| 질문 | 답 |
|------|----|
| 지금 최적화되어 운용 중인가? | **허브·핫패스(NPC/드론/스파이/일일)는 정상.** 셸 1개·얇은 좌 3개·Attack inert. |
| 통합 필요한가? | **TradePort 셸만 필수 통합.** 나머지 대통합은 비권장. |
| 12개 유지? | **예** — Trade 자리 → **아테나(Attack)** 좌로 교체. |
| 신명·외곽 배치? | **§2·§3 후보표** — 승인 후 Fable CSV + 김팀장 displayName. |
| 정보는 어떻게 보나? | **§3-A** — 잔해 수색 유물로만 확인(맵/HUD 기본 비공개). |

**다음 한 줄 지시 예**

```text
§2·§3·§3-A 승인. Phase B 유물CSV + Phase C/C2 salvage·도감 진행.
```
