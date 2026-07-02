# 페라이트(ore_ferrite) 기준가 10 CR — 3단계 고정밀 경제 분석 계획

> **발행**: 김팀장 · **실행**: 김경제 (`@김경제`)  
> **기준일**: 2026-07-02 KST  
> **정본 가격**: `mining_mineral_catalog.csv` · `sellPriceAnchorCr=10` · `ore_ferrite` (페라이트)  
> **사용자 지침**: 은하계 **기초 재화**로서 10 CR 인위 설정의 적정성 — 채굴(시간↔량) vs 전체 경제 대비 **전수 재조사**

---

## 0. 분석 목표

| # | 질문 | 산출 |
|---|------|------|
| Q1 | 30초/개 채굴 × 10 CR 판매가가 **실제 크레딧 유입**으로 적정한가? | CR/h · CR/일 · F2P 5h 수입 |
| Q2 | `play_scenario` · BRU · BM **10,000 CR/h 앵커**와 정합하는가? | 갭 배율 · 조정 레버 |
| Q3 | 무역·업그레이드·전투·배달 대비 **기초 재화 지위**가 유지되는가? | sink/source 비율 |
| Q4 | 향후 AABS·일일 배치 조정용 **기준 데이터** | `ferrite-anchor-baseline.json` |

---

## 1. 워크플로 (6 Gate)

```text
[Plan] ──► 1차 Stage-1 분석 ──► 2차 검수-1 (김팀장)
                │
                ▼
         3차 Stage-2 분석 ──► 4차 검수-2 (김팀장 + sim 교차)
                │
                ▼
         5차 Stage-3 통합 ──► 6차 최종 판정 + baseline JSON 확정
```

| Gate | 담당 | 합격 기준 |
|------|------|-----------|
| Stage-1 | 김경제 | 채굴 물리·카탈로그·zone1 수치 재현 · 갭 1차 정량화 |
| 검수-1 | 김팀장 | 수식·CSV 정본·코드 경로 교차 확인 |
| Stage-2 | 김경제 | 무역 sink · upgrade cost · macro SIM · 저레벨 행성 샘플 |
| 검수-2 | 김팀장 | `sim:economy` · `audit:balance-ops` KPI와 모순 없음 |
| Stage-3 | 김경제 | BRU/BM/play_scenario 통합 · 권고 밴드 · 조정 시나리오 3안 |
| 최종 | 김팀장 | baseline JSON commit · CSV 조정 여부 결정 |

---

## 2. Stage-1 — 채굴 물리 · 카탈로그 앵커 (1차)

**범위**

- `ORBIT_MINING_CYCLE_MS` (30s) · `runMiningTick` · drop policy zone1
- `mining_mineral_catalog` · `mining_sell_price_policy` · `mineralTradePricing.ts`
- `planet_mineral_ledger_policy` — Arcadia R≈50 일일 allowance
- `play_scenario_economy` zone1 · `reward_tier_bru_policy` T0_BASE

**산출**: `2026-07-02-ferrite-stage1-report.md`

---

## 3. Stage-2 — 은하계 연관 경제 (2차)

**범위**

- `mineral_upgrade_cost_lines.csv` — ore_ferrite 소비 sink
- 무역소 buy/sell spread (`resolveMineralListingBuyPrice` ÷0.9)
- `economy_sim_macro_policy` · `bm_economy_policy` · cohort whale/F2P
- 저레벨 행성군(zone1~3) primary mineral pool · trade port listing
- 전투/배달 BRU tier 대비 T0 채굴 EV

**산출**: `2026-07-02-ferrite-stage2-report.md`

---

## 4. Stage-3 — 통합 판정 · 조정 레버 (3차)

**범위**

- Stage-1·2 synthesis
- 적정가 **밴드** (유지 / 상향 / 하향 / 분리: 채굴속도 vs 가격)
- AABS·`runArcCoreDailyOpsBatch` 연동 조정 가능 필드 목록
- `ferrite-anchor-baseline.json` v1.0.0 확정

**산출**: `2026-07-02-ferrite-stage3-verdict.md`

---

## 5. 데이터 저장 (향후 조정용)

| 파일 | 용도 |
|------|------|
| `tools/economy-evaluation/ferrite-anchor-baseline.json` | 기초재화 기준 스냅샷·판정·레버 |
| `docs/economy-evaluation/2026-07-02-ferrite-*.md` | 단계별 리포트 |
| `kim-economy-handoff.md` `[관측]` | 진행·검수 게이트 |

---

## 6. 김경제 배정 (코드 수정 금지)

```text
@김경제 페라이트 10CR 3단계 분석 실행.
Stage-1 리포트 완료 후 검수-1 대기 → Stage-2 → 검수-2 → Stage-3 → baseline JSON.
sim:economy · audit:balance-ops 결과 인용. src/ tables/ 수정 금지.
```

---

## 7. 관련 정본

- `tables/balance/mining_mineral_catalog.csv`
- `src/game/miningConfig.ts`
- `tables/balance/bm_economy_policy.csv` (`play_scenario_credit_per_hour_anchor=10000`)
- `docs/ECONOMY_TRADE_ECOSYSTEM_REFERENCE.md`
