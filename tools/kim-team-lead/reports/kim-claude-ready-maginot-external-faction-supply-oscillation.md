# 김클로드 착수 — 마지노선(N≤5) · 외부팩션(F2·F4) 국가보급 · 전황 진동(→10 대등)

> **배정**: 김팀장 (Cursor 본창) · **2026-08-01**  
> **대표님 확정(대화)**:  
> 1. 집계·적용 범위 = **21코어 성계** (`planet_occupation_seeds` 시나리오 행성 · **synth 제외** · 확장은 추후)  
> 2. **하한 N≤5**가 Maginot HARD 핵심 (일방 전멸 방지)  
> 3. 외부팩션 = 게임 **4대 팩션(F1–F4)** 중 전쟁 축(F1 서부·F3 동부)을 뺀 **F2 남부·F4 북부** — **NEUTRAL/INDEPENDENT 아님**  
> 4. **레드 대칭** (블루만 특혜 금지)  
> 추가 의도: 지원으로 **최대 ~10행성**까지 수복 → 대등 → 지원 감쇠 → 다시 밀림 가능 → **반복 패턴**  
> 전술: **기존 교전 확률 + 외부팩션 국가보급(NEW)** 합산. 미네르바(차수2·RED 돌출)는 대표 사례(planetId 하드코딩 금지).  
> **선행**: `supply-envelope-occupy-rebellion-neutral-20260801`(3포위 STRONG) — **유지**. 본 task는 **상위 전략 레이어**(성계수 밴드).  
> **김클로드 즉시 착수** · 완료 후 `kim-claude-handoff-pending.md` **PENDING** · **git commit 금지**  
> **task_id**: `maginot-external-faction-supply-oscillation-20260801`

---

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial due 1회 · N집계 O(21) dirty/캐시 · alloc=밴드해석1회 · cache=hold-revision
[pss-pre-dev] stage=arcCore territorial · Skia/UI 무관 · risk=P1(틱금지)·P6(persist불필요·파생만)
[pss-pre-dev] verdict=PASS — onBoot 전은하 스캔 금지 · 21코어 hold 카운트만 · 기존 CSV combat 행 무단변경 금지
```

---

## 0. 제품 1안 (고정)

### 0-1. 4대 팩션 정본 (오해 금지)

| 코드 | 지역 | `GALAXY_ROUTE` `factionId` | 전쟁 역할 |
|------|------|---------------------------|-----------|
| **F1** | 서부(W) | `federation` | **스텔리움(블루)** 축 |
| **F2** | 남부(S) | `trade_coalition` | **외부** 보급원 |
| **F3** | 동부(E) | `scientists` | **크림슨(레드)** 축 |
| **F4** | 북부(N) | `miners_guild` | **외부** 보급원 |

정본: `planet_trade_route_profile.csv` · `galaxyRouteFactionPolicy.ts` · `galaxyRouteFactionBridge.ts` · `megaFactionNationPolicy`(블루=서부항로·레드=동부항로).

**금지**: 외부를 `NEUTRAL`/`INDEPENDENT`로 치환.

### 0-2. 성계수 N

```text
N_blue = 21코어 중 holdSide===BLUE 인 행성 수
N_red  = 21코어 중 holdSide===RED 인 행성 수
(독립국·순수 NEUTRAL 홀드는 어느 쪽 N에도 안 넣음)
synth_* 제외
```

### 0-3. 진동 밴드 (대칭)

```text
N ≤ 5          → MAGINOT_HARD  — 외부(F2+F4) 국가보급 MAX
5 < N < 10     → SUPPORT       — 외부 보급 유지(수복 추진)
N ≥ 10         → SUPPORT_COOL  — 외부 보급 감쇠/0 → 대등·재압박 가능
```

블루 `N_blue`·레드 `N_red` **각각** 독립 평가(한쪽 HARD여도 반대편은 자기 N 기준).

### 0-4. 기존 교전 + 외부보급 (합산)

| 층 | 내용 |
|----|------|
| 기존 | `rollDecision` · `resolveEffectiveTerritorialCombatMode` · 퀵컴뱃·1홉 보급 · **3포위 envelope**(이미 있음) |
| **NEW** | Maginot/SUPPORT일 때 **약세 팩션**의 수복·유지 due에 **외부국가보급 보정** |

**HARD 목표 (대표 사례·범용)**: 약세 팩션이 **적 홀드 전선**을 칠 때(예: 미네르바 RED·블루 인접≥1~2), **due 1회 최종 점유(수복) 확률 ≥ 80%**.  
→ battle 미진입만으로는 상한에 걸리므로, HARD에서는 **가중/점유 롤을 최종 P≥0.80에 맞게** 설계(순수 함수 + CSV). planetId 분기 금지.

**SUPPORT_COOL (N≥10)**: 외부보급 **적용 안 함**(또는 mul≈0) — 기존 교전만.

### 0-5. CSV / 기존값

| 대상 | 조치 |
|------|------|
| `arc_core_territorial_combat_policy.csv` 기존 행 | **무단 변경 금지** |
| `arc_core_supply_envelope_policy.csv` | **유지**(3포위와 병행) |
| **신규** `tables/balance/arc_core_maginot_external_supply_policy.csv` (권장) | `corePlanetCountScope=scenario21`, `floorSystems=5`, `paritySystems=10`, `hardFinalOccupyPct=80`, `supportMul`/`coolMul`, `externalFactionCodes=F2\|F4`, notes |
| `faction_political_relations` / occupation seeds | 본 task에서 **기존행 무단 변경 금지**(필요 시 신규 행만·김팀장 재확인) |

---

## 1. 범위 (M0~M8)

### ✅ 김클로드

| # | 내용 |
|---|------|
| **M0** | `docs/strategy/…`에 짧은 § — 진동 밴드 · F1–F4 · 외부=F2\|F4 · 기존 교전+외부보급 · 3포위와 우선순위 |
| **M1** | `listScenarioCorePlanetIds()`(또는 seeds 21) + `countFactionSystemsInCore(holds, 'BLUE'\|'RED')` 순수/얇은 모듈. unit. |
| **M2** | `resolveMaginotBand(N)` → `'hard'\|'support'\|'cool'`. 대칭. |
| **M3** | `resolveExternalFactionSupplyBonus({ band, defendingOrReclaimingSide, … })` — HARD/SUPPORT만 보너스 · COOL=0. 키는 **F2\|F4**. |
| **M4** | `runTerritorialCombatPassForPlanet`에 연결: supplyAdjacency·envelope **이후**(또는 직전) Maginot 보정. HARD에서 **최종 수복 P≥80%**를 만족하도록 roll/dominant/퀵컴뱃 mul 중 **최소 변경·테스트 가능**한 1경로만(권장: NEUTRAL/적홀드 수복 시 dominate·또는 전용 reclaim 롤). DEV 로그 1줄. |
| **M5** | 미네르바급: 연결수&lt;3(envelope STRONG 불가)여도 **HARD+아군인접≥1(또는 ≥2)·적인접 조건**이면 외부보급으로 80% 가능함을 unit으로 증명. `if (planetId==='minerva_deep')` **금지**. |
| **M6** | ActivePool: HARD 약세 측 전선 후보가 due에 안 잡히면 수복 불가 — **필요 시** dirty 시 promote 우선(기존 governor 티어와 충돌 없이 얇게). 범위 과하면 soft로 남기고 handoff에 기록. |
| **M7** | 신규 CSV + generated + O(1) 로더. |
| **M8** | unit + territorial 회귀(envelope·eligibility·governor·ActivePool·effectiveMode) · `tsc` PASS. |

### ❌ 금지

- 외부를 NEUTRAL/INDEPENDENT로 구현  
- `planetId === 'minerva_deep'|'iron_remnant'` 하드코딩  
- territorial combat **기존행** 수치·combatMode 무단 변경  
- onBoot 전 은하 스캔 · 새 setInterval  
- 3포위 envelope 계약 파기  
- git commit · 「완료」선언  

### 우선순위 (충돌 시)

```text
SAFE_HINTERLAND (기존)
  → Maginot band + F2|F4 외부보급 (본 task)
    → Supply Envelope STRONG (기존 3포위)
      → resolveEffectiveTerritorialCombatMode P0
        → CSV rollDecision 기본
```

---

## 2. 구현 힌트

| 파일 | 역할 |
|------|------|
| (신규) `resolveMaginotExternalSupply.ts` + `.test.ts` | N·band·bonus·HARD 80% 수학 순수부 |
| (신규) `arcCoreMaginotExternalSupplyPolicy.ts` + CSV | Table-First |
| `runTerritorialCombatPass.ts` | due 경로에 보정 배선 |
| `galaxyRouteFactionBridge.ts` / trade profile | F1–F4 참조만(가능하면 재사용) |
| `contestedPoolGovernor*` | M6 선택 |
| `docs/strategy/ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md` | M0 |

---

## 3. self-check

```bash
npx tsc --noEmit -p tsconfig.client.json
npx tsx --test src/arcCore/territorial/resolveMaginotExternalSupply.test.ts
npx tsx --test src/arcCore/territorial/resolveSupplyEnvelope.test.ts
npx tsx --test src/arcCore/territorial/resolveEffectiveTerritorialCombatMode.test.ts
npx tsx --test src/arcCore/territorial/contestedEligibility.test.ts
npx tsx --test src/arcCore/territorial/contestedPoolGovernor.test.ts
npx tsx --test src/arcCore/territorial/contestedActivePool.test.ts
```

handoff: `[pss-pre-dev]` · M0~M8 · HARD 80% 근거(수식/가중) · F2\|F4 · 대칭 · soft(실기 N≤5·미네르바) · **commit 안 함**.

---

## 4. 김팀장 검수 포인트

- [ ] N=21코어 only · synth 제외  
- [ ] 외부 = **F2\|F4만** (중립/독립국 아님)  
- [ ] N≤5 HARD · N≥10 COOL · 블루·레드 대칭  
- [ ] HARD 전선 수복 **최종 P≥80%** unit 근거  
- [ ] planetId 하드코딩 없음 · territorial 기존 CSV 행 diff 없음  
- [ ] envelope(3포위) 회귀 PASS · tsc PASS · commit 없음
