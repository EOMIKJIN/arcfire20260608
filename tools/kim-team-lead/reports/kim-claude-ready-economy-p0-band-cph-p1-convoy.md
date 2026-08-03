# 김클로드 착수 — 경제 P0/P1 핵심 보완 (level-band · convoy · 배치 원자성)

> **배정**: 김팀장 · **2026-08-03** · 대표님 「분석된 경제 문제 수정 · 김클로드 작업진행」  
> **근거**: `docs/economy-evaluation/2026-08-03-economy-full-rescan.md` · **최종 재점검** `2026-08-03-economy-concept-scenario-full-recheck.md` · balance-ops 2026-08-02  
> **task_id**: `economy-p0-band-cph-p1-convoy-20260803`  
> **김클로드 즉시 착수** · handoff **PENDING** · **git commit 금지**  
> **김팀장 지시 재검수 의무** (CLAUDE.md 2026-08-02~) — AGREE/PARTIAL/DISAGREE + 파일:줄 근거  
>  
> **주의 (2026-08-03 컨셉 재독)**: 본 READY = Phase **A–C**(감사/곡선·convoy·배치).  
> **플레이어 CR·시나리오 정렬(Phase D)은 별도 READY** — A–C만으로 「경제 수정 완료」 선언 금지.

---

## 0. 수정 가능 여부 (김팀장 판정 — 착수 전 재검수)

| P | 이슈 | 수정 가능? | 담당 축 | 본 READY 범위 |
|---|------|------------|---------|---------------|
| **P0** | level-band ↔ 무기 가격 CPH gap CRITICAL | **✅ 가능** (원인 실측 고정) | 감사 식 · 밴드 CSV · 필요 시 가격 곡선 · `sim:economy` | **Wave 1 필수** |
| **P1** | convoy `core_prime` fail | **✅ 가능** (경로 단일) | `runArcCoreConvoyDailySettlementPass` · trade route 배정 | **Wave 2 필수** |
| **P1** | 재정 바닥 허브 · shadow_market 0.04× | **🟡 부분** | 루트/수요/수수료 정책 | Wave 2 진단 후 **표·정책만 최소** (대규모 월드 재설계 금지) |
| **P1** | 플레이어 CR thin | **🟡 부분** | 미션/전투 CR 곡선 | **본 READY 제외** → 후속 READY |
| **P2** | 이중 시장 · 배치 started/complete | **✅ 배치 원자성** / 이중시장은 큼 | daily ops state | **Wave 3 = 배치만** |
| **P3** | SIM delta 고정 · R 문서 | **✅ SIM 재실행 · 문서** | `sim:economy` · docs | Wave 1 말미 + 문서 1페이지 |

**결론**: 대표님 요청 범위에서 **지금 김클로드가 끝까지 가져갈 수 있는 것 = P0 + core_prime convoy + 배치 원자성 + SIM 재실행**.  
플레이어 CR 풀루프·단일 시장 통합은 **2차 READY**.

---

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=일1회_daily_batch·감사CLI · alloc=배치_기존패스만 · cache=store_coalesce_유지
[pss-pre-dev] stage=none_UI · risk=P6(persist_기존)·부트동기배치금지
[pss-pre-dev] verdict=PASS — onBoot_전행성루프_추가금지 · price_elasticity=0 유지
```

---

## 1. 김클로드 재검수 고정 결과 (2026-08-03 김팀장 선측정 — **반드시 독립 재현**)

### 1.1 P0 공식 (변경 금지 없이 먼저 재현)

`tools/balance-audit/run-balance-audit.cjs`:

```text
affordableInBandWindow = targetCreditsPerHour × (targetMinutesPerLevel / 60)
gapRatio = median(band 내 무기 구매가) / affordableInBandWindow − 1
```

**실측 재현 (BOM 제거 후 weapon_list):**

| band | n | median 구매가 | windowCR (1레벨 창) | gap% |
|------|---:|-------------:|------------------:|-----:|
| early | 49 | **2,100** | **200** (800×0.25h) | **950** |
| mid_early | 17 | **142,500** | 2,400 | **5,837.5** |
| mid | 18 | **684,250** | 9,000 | **7,502.8** |
| late | 18 | **5,081,750** | 24,000 | **21,074** |

**근본 원인 (재검수 시 AGREE 예상):**  
감사는 “**다음 레벨 1칸 구간의 예상 수입으로 중앙값 무기 1정 구매**”를 전제로 한다.  
실제 구매가 곡선은 **밴드 전체 누적 수입 스케일**(및 엔드 무기)이라 **단위가 구조적으로 안 맞음**.  
early만 잡아도 `800 × (10레벨×15분) = 2,000 CR` ≈ med 2,100 → **밴드 전 구간 수입 환산 시 early는 정합에 가깝다.**  
→ **1순위는 감사·밴드 정합 식 수정**이며, late처럼 밴드 전체로도 수배 남으면 **2순위 가격/레벨 맵 조정**.

### 1.2 금지 (기존값·헌법)

- `price_elasticity=0` **유지** · 실시간 reprice **금지**
- 일일 배치 외 고빈도 AABS/시세 **금지**
- **페라이트 10CR CONDITIONAL_KEEP** (`docs/economy-evaluation/2026-07-02-ferrite-*`) — mineral base 무단 붕괴 금지
- Whale/F2P **&lt; 5** 유지 목표 (현재 ~3.12)
- `onBoot` 동기 전행성 경제 패스 **추가 금지**
- git commit 금지

### 1.3 기존값 변경 (대표님 승인 전제)

대표님 “수정 진행” 승인으로 **본 task에 한해** 다음 기존값 수정 **허용**:

| 허용 | 조건 |
|------|------|
| `tables/balance/level_band_targets.csv` | CPH/분/밴드 창 — 변경 전·후 표 handoff 기록 |
| 감사 식 (`run-balance-audit.cjs` / ops 공유 시 동기) | **설계 의도 문서 1단락** + gap 재계산 |
| 무기 구매가 / trade price policy | early 붕괴·페라이트 앵커 깨면 **중단** · handoff DISAGREE |
| SIM overlay 재생성 | `npm run sim:economy` 산출만 |

---

## 2. Wave 1 — P0 level-band 정합 (필수)

### 2.1 권장 1안 (먼저 이 안)

**밴드 전체 누적 수입 창으로 감사 기준을 바꾼다.**

```text
bandEarnHours = (maxLevel − minLevel + 1) × (targetMinutesPerLevel / 60)
affordableCR = targetCreditsPerHour × bandEarnHours × weaponAffordShare
```

- `weaponAffordShare`: 기본 **1.0** 또는 CSV `level_band_targets` 신규 컬럼 / policy 1키 (예: 0.8~1.2)  
- **한 밴드에서 “중앙값 무기 1정을 그 밴드 플레이로 산다”** 로 해석을 바꾼다.  
- early 재계산 기대: ≈ 2,000 vs 2,100 → gap **~5% OK**  
- mid/late: 잔여 gap이 **critical(≥20%)** 면 Wave 1.2로 가격 곡선.

구현 위치:

1. `tools/balance-audit/run-balance-audit.cjs` — 위 식  
2. `tools/balance-ops-audit/*` 가 logic_input 드리프트를 재사용하는지 확인 후 **동기**  
3. (선택) `tables/balance/level_band_targets.csv` 에 `weaponAffordShare` 컬럼 Table-First

### 2.2 Wave 1.2 — 잔여 late/mid CRITICAL 시만

1. `weaponTradePricing` · `weapon_list` 구매가 · `weapon_trade_base_price_policy` 중 **정본 경로 1개** 확정  
2. **밴드별 중앙값이 새 식 affordableCR의 ±15%~35%** 가 되도록 **약한 스케일** (일괄 ×0.1 금지 — 커브 유지)  
3. `npm run build:content-tables` / `build:balance-tables` 해당 시  
4. **페라이트·기본 광물 시세 회귀 스모크**

### 2.3 Wave 1.3 — SIM

```bash
npm run sim:economy
```

- `src/data/balance/generated/economySimOverlayDelta.ts` 의 **deltaId 날짜가 2026-08-03 이후**로 바뀌는지 확인  
- Whale/F2P 로그 **&lt;5**  
- handoff에 deltaId **before → after**

### 2.4 Wave 1 완료 게이트

```bash
npm run audit:balance
npm run audit:balance-ops   # 또는 프로젝트 관측 스크립트 정본
npx tsc --noEmit -p tsconfig.client.json
```

- Level-band: **critical 0** (warn ≤ 소수 허용 시 handoff 사유)  
- overall balance-ops: **PASS 또는 WARN only** (band critical 제거)

---

## 3. Wave 2 — P1 convoy `core_prime`

### 3.1 조사

| 파일 |
|------|
| `src/arcCore/economy/runArcCoreConvoyDailySettlementPass.ts` |
| `executeArcConvoyRoundTrip` / `runArcTransportTradePass` |
| `tradeRouteRegistry` · `tradeRoutePlanetAssignmentRegistry` |
| `listConvoySupplyPlanetIds` / demand 목록 |

`core_prime` 이 **supply 1-path fail** 인지 **demand backfill fail** 인지 `failedPlanetIds` 경로로 확정.

### 3.2 수정 원칙

- **한 원인 한 패치** (재고 0 · tg 미배정 · minQty · bank 부족 등)  
- 헤드리스로 재현: `npm run audit:planet-economy-3h` 또는 동등  
- fail 목록에서 `core_prime` **제거** · demandCovered 회귀 없음  
- 전 허브 무차별 보급 buff **금지**

### 3.3 재정 min 0.04× (shadow_market)

- **원인 메모 필수** (루트 없음 / qty / fee %)  
- 수정은 **최소 1개 정책·배정**만 (전 행 일괄 CR 버프 금지)  
- 안 되면 handoff **PARTIAL** + 2차 READY 이관

---

## 4. Wave 3 — 배치 started / complete 분리

파일: `src/arcCore/schedule/arcCoreDailyOpsState.ts` · `runArcCoreDailyOpsBatch.ts` · `ArcCoreDailyOpsSubCore.ts` · `shouldRunArcCoreDailyBatch`

| 요구 |
|------|
| “시작”과 “**성공 완료**” 플래그 분리 (또는 complete 시각만 게이트) |
| 배치 중 크래시 시 **미완료면 당일 재시도 가능** |
| 성공 후에만 “오늘 완료” → 멱등 유지 |
| partial resume **전 패스 재실행**(중복 허용 가능한 기존 패스) vs 위험 패스 스킵 — **안전한 전량 재실행** 우선, 이중 이체 위험 있으면 handoff에 명시 |

로컬 단위 테스트 권장: state 머신 순수 함수 테스트.

---

## 5. 문서 (최소)

- `docs/economy-evaluation/2026-08-03-economy-full-rescan.md` 하단에  
  **「P0 조치 후속」(deltaId·band 식 요약)** 3~8줄 **또는** 별도 `2026-08-03-economy-p0-fix-note.md`  
- R 의미 갭: AGENTS 수준 **한 줄 카피 정정만** (원장 DB 구현 금지)

---

## 6. 명시적 비범위 (2차)

- 플레이어 CR 커브 전면 (미션 EXP·전투 전리품 대수술)  
- 카탈로그 vs tg **단일 read model** 통합  
- BM IAP  
- 가격 실시간 탄성  
- 기존 territorial READY와 무관

---

## 7. self-check (필수)

```bash
# 재현
node -e "/* band med/window 재계산 */"   # 또는 audit:balance

npm run audit:balance
npm run audit:balance-ops
npm run sim:economy
npm run audit:planet-economy-3h   # convoy
npx tsc --noEmit -p tsconfig.client.json
```

handoff 기록:

```text
[agree] P0 root=… AGREE|PARTIAL|DISAGREE
[band] early gap before→after …
[sim] deltaId before→after · whaleF2p=
[convoy] core_prime fail→ok · failedPlanetIds=
[daily-ops] started/complete 분리 = yes
[existing-value-change] <파일> <필드> before→after
```

---

## 8. 김팀장 검수 포인트

- [ ] 감사 식이 “1레벨 창 vs 밴드 누적” 중 **의도 문서화**  
- [ ] band critical 해소 · SIM 신규 delta  
- [ ] 페라이트/elasticity/부트경로 회귀 없음  
- [ ] core_prime fail 제거  
- [ ] 배치 미완료 재시도  
- [ ] commit 없음 · PENDING handoff

---

## 9. 대표님/김클로드 붙여넣기 프롬프트

```text
@김클로드
tools/kim-team-lead/reports/kim-claude-ready-economy-p0-band-cph-p1-convoy.md 읽고
task_id=economy-p0-band-cph-p1-convoy-20260803 구현.
김팀장 분석을 CLAUDE.md대로 재검수(AGREE/PARTIAL) 후 Wave1→2→3 순서.
npm run audit:balance · sim:economy · audit:planet-economy-3h · tsc.
kim-claude-handoff-pending.md PENDING · commit 금지.
```

---

**문서 종료 — READY economy P0/P1 2026-08-03**
