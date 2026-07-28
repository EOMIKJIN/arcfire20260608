# 김클로드 착수 — 중립 점령 **런타임 인접(보급) P0** 범용 규칙

> **배정**: 김팀장 (Cursor 본창) · **2026-07-28**  
> **대표님 지시**: 노드 성계 연결에 **적국이 없으면** 중립 지역은 인접 팩션 점령 고확률. 예: 타이탄↔블루만 유효 인접 → **블루 점령 고확률**. **모든 중립 지역 범용** · **최우선**. 이전 개발이 미적용으로 보임 → 재검수 후 개발.  
> **김팀장 설계 1안 (대표님 「김클로드 지시」승인)**: 중립 hold에서 **런타임 1홉 보급 비대칭 = P0**, CSV `combatMode`는 보조.  
> **김클로드 즉시 착수** · 완료 후 handoff **PENDING** · **git commit 금지**  
> **task_id**: `neutral-adjacency-occupation-priority-20260728`

---

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial_pass_1h · alloc=보급카운트O(인접)·모드해석1회 · cache=없음
[pss-pre-dev] stage=arcCore_territorial · risk=P1(틱추가금지)·planetId하드코딩금지
[pss-pre-dev] verdict=PASS — NEUTRAL hold에서만 effectiveMode 해석·CSV행무단변경금지(런타임오버라이드)
```

---

## 0. 김팀장 재검수 요약 (이미 완료 · 재분석 최소)

### 0-1. 대표님 규칙 (정본)

| # | 규칙 |
|---|------|
| 1 | **적국(반대 팩션) 성계가 1홉에 없으면** → 중립 행성은 **붙어 있는 팩션** 점령 확률이 높아야 함 |
| 2 | **전 중립 지역 범용** (행성 id 분기 금지) |
| 3 | 이 규칙은 **점령 판정 최우선(P0)** |

### 0-2. 현재 결함 (미적용 원인)

| 층 | 동작 | 문제 |
|----|------|------|
| A | `blue_red` + 중립일 때만 `supplyAdjacency`로 **공격자** 확정 | 점령 **우세 70%**까지는 안 감 · `blue_neutral`/`red_neutral`은 **우회** |
| B | geo-flank CSV: 헬리오스=`blue_neutral` · 타이탄=`red_neutral` | **고정 우세**가 A를 덮음 → 타이탄은 블루 인접만 살아도 **레드 축** |
| C | `rollDecision` status_quo 30% / neutral_declare 12% | battle 아니면 **70% 미진입** (별층 · 본 task에서 가중치 CSV 무단 변경 금지) |

### 0-3. 타이탄 체감

- 그래프(시드): 아이언(BLUE)+섀도우(RED) → `blue_red` 경고  
- 정책 CSV: `red_neutral` → battle 시 **RED 70%**  
- 대표님 예시(블루만 유효 인접 → 블루 고확률)와 **충돌** → P0 런타임 비대칭으로 해소

---

## 1. 제품 우선순위 스택 (고정 · 1안)

**적용 조건**: `holdSide === 'NEUTRAL'` (이미 BLUE/RED/INDEPENDENT면 **기존 CSV combatMode 경로 유지**).

| 순위 | 이름 | 동작 |
|------|------|------|
| **P0** | 런타임 1홉 보급 비대칭 | `countAdjacentFriendlySystems(BLUE/RED)` — **블루만>0** → effective=`blue_neutral` · **레드만>0** → `red_neutral` · **둘 다>0** → effective=`blue_red` · **둘 다 0** → battle 생략·`status_quo` 유지(또는 동등) |
| **P1** | CSV `combatMode` + `dominantSideWeightPct` | P0가 **양쪽 다>0**(접전)이거나 P0를 쓸 수 없을 때 — **기존 policy 그대로** (오메가·섀도우·geo-flank 보조) |
| **P2** | `rollDecision` | battle / neutral_declare / status_quo — **기존 CSV 가중치 무단 변경 금지** |
| **P3** | 퀵컴뱃·전술 역전 | `blue_red` 접전 시 기존 경로 |

### P0 → 우세 확률

- effective가 `blue_neutral`/`red_neutral`이면 기존 `resolveBinaryDominantHoldTarget` + policy **`dominantSideWeightPct`(없으면 70 폴백)** 재사용  
- 즉 「한쪽만 인접」이면 **그 팩션이 70%로 점유**(battle 분기 진입 시). planetId 하드코딩 없음.

### CSV 행 정책 (기존값)

| 대상 | 조치 |
|------|------|
| `helios_core` / `titan_ruins` / omega / shadow / draco | **CSV combatMode·가중치 무단 변경 금지** |
| 동작 | 중립 hold에서 **런타임이 CSV를 덮어씀**(P0). 행 삭제·모드 환원 불필요 |
| seeds / FrontPressure CSV | 무수정 |

---

## 2. 범위 (M0~M5)

### ✅ 김클로드

| # | 내용 |
|---|------|
| **M0** | `docs/strategy/ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md`에 짧은 § — 「중립 점령 P0=런타임 보급 비대칭 · CSV는 접전/보조」· geo-flank §6-1과 **충돌 시 P0 우선** 한 줄 |
| **M1** | `resolveEffectiveTerritorialCombatMode` (또는 동등 순수 함수) 신설 — 입력: `holdSide`, `policy.combatMode`, `supplyAdjacency{blue,red}` → 출력 effective mode. **NEUTRAL이 아니면** `policy.combatMode` 그대로 |
| **M2** | `runTerritorialCombatPassForPlanet`의 battle 경로 — `resolveAttackerDefenderSides` / `resolveBattleHoldTarget` / binary dominance에 **effective mode** 사용. DEV warn은 `policy.combatMode != effective`(또는 graph)를 구분 로그로 정리(패스 중단 금지) |
| **M3** | `blue_red` 전용으로만 있던 「한쪽만 보급 → 공격자 확정」과 P0가 **이중·모순 없이** 합류 — 중립+비대칭이면 effective가 이미 blue/red_neutral이므로 공격자·우세가 같은 방향 |
| **M4** | 단위테스트 (planetId 하드코딩 분기 금지 · 시나리오는 성계/holds로 구성): (1) 중립+블루만 인접 → effective=`blue_neutral` · battle 시 타깃 분포상 블루 우세(또는 dominant 롤 고정 mock) (2) 중립+레드만 → `red_neutral` (3) 중립+둘 다 → `blue_red`(CSV가 red_neutral이어도 **P0가 blue_red**) (4) 중립+둘 다 0 → status_quo/불변 (5) hold가 이미 BLUE면 CSV mode 유지(오버라이드 없음) (6) 타이탄·헬리오스 **정책 행은 읽기만** · `if (planetId==='titan_ruins')` 금지 |
| **M5** | (선택) strategy/주석에 「geo-flank CSV는 접전·시드 편향용 · 중립 단일 인접은 런타임 P0」 |

### ❌ 금지

- `planetId === 'titan_ruins'|'helios_core'` 우세 분기  
- territorial / occupation **CSV 기존행 수치·combatMode 무단 변경**  
- `battleWeightPct` 등 가중치 임의 상향(기존값 재확인 대상 — 본 task 범위 밖)  
- FrontPressure·일일배치·Skia/STAGE UI 대공사  
- git commit / 「완료」선언  

---

## 3. 구현 힌트 (경로)

| 파일 | 역할 |
|------|------|
| `src/arcCore/territorial/runTerritorialCombatPass.ts` | effective mode 적용 · battle 분기 |
| `src/arcCore/territorial/territorialSupplyLine.ts` | `countAdjacentFriendlySystems` 재사용 |
| (신규 권장) `resolveEffectiveTerritorialCombatMode.ts` | 순수 함수 + 테스트 용이 |
| `docs/strategy/ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md` | M0 문서 |

---

## 4. self-check (김클로드)

```bash
npx tsc --noEmit -p tsconfig.client.json
npx tsx --test src/arcCore/territorial/resolveEffectiveTerritorialCombatMode.test.ts
# (또는 동등 테스트 경로) + runTerritorial / supply / geoFlank 회귀 일부
```

handoff: `[pss-pre-dev]` 3줄 · M0~M4 · soft(실기 1h 패스 체감 미확인) · **commit 안 함**.

---

## 5. 김팀장 검수 포인트

- [ ] 중립+한쪽만 보급 → effective blue/red_neutral · CSV red_neutral이어도 블루만 있으면 **블루**
- [ ] 중립+양쪽 보급 → blue_red (CSV 덮어씀)
- [ ] 비중립 hold → CSV mode 유지
- [ ] planetId 하드코딩 없음 · CSV 기존행 git diff 없음(또는 문서만)
- [ ] tsc · unit PASS · commit 없음
