# Stage-1 — 페라이트 10 CR · 채굴 물리 × 카탈로그 앵커 (1차 분석)

> **작성**: 김경제 (김팀장 배정) · **2026-07-02 KST**  
> **상태**: Stage-1 완료 · **검수-1 PASS**

---

## 1. 정본 가격·명칭

| 항목 | 값 |
|------|-----|
| mineralId | `ore_ferrite` |
| 표시명 | **페라이트** (Ferrite) |
| tier | 1 |
| **sellPriceAnchorCr** | **10** |
| 정본 CSV | `tables/balance/mining_mineral_catalog.csv` |
| 런타임 | `resolveMineralCatalogSellPrice` · `mining_sell_price_policy.csv` (zone 1~99 = 10) |

---

## 2. 채굴 물리 (코드 정본)

| 상수 | 값 | 출처 |
|------|-----|------|
| 사이클 | **30초 / 1개** | `ORBIT_MINING_CYCLE_MS` |
| tick 평가 | 500ms interval | `useMiningDriver` |
| 세션 상한 | **100개/세션** | `ORBIT_MINING_SESSION_MAX_UNITS` |
| zone1 드랍 | **100% 페라이트** | `mining_zone_mineral_pool` 1~1 · drop 100% |

### 2-1. 이론 CR 유입 (zone1 · 100% ferrite · 10 CR)

| 지표 | 계산 | 결과 |
|------|------|------|
| 분당 채굴 | 60/30 | **2.0 개/min** |
| **CR/min (순수 판매)** | 2 × 10 | **20 CR/min** |
| **CR/h** | ×60 | **1,200 CR/h** |
| 세션 100개 | 50min · 100×10 | **1,000 CR/세션** |

---

## 3. 일일 allowance (Arcadia · R≈50)

`resolvePlanetMineralReserveMaxUnits(50)`:

```text
400 + (50/100) × 2200 × 0.5 = 950 units/day
```

| 지표 | 값 |
|------|-----|
| 일일 채굴 상한 | **950개** |
| 일 순수 판매 상한 (10 CR) | **9,500 CR/일** |
| 5h 연속 채굴 (이론) | 600개 → **6,000 CR** (세션 cap·allowance 내) |

> **메모**: allowance는 R 부분 반영 + `mineral_pool_base_units=400`. R=100 시 ~1,500개/일.

---

## 4. 경제 앵커 대비 (1차 갭)

### 4-1. BM · BRU 앵커

| 정책 | 값 | 출처 |
|------|-----|------|
| `play_scenario_credit_per_hour_anchor` | **10,000 CR/h** | `bm_economy_policy.csv` |
| `bru_g_credit_ratio` | 1 G = 100 CR | 동일 |
| `bru_base_g_per_min` | **1.67 G/min** | = 167 CR/min = 10,020 CR/h |
| T0_BASE 10min | 16.7 G | `reward_tier_bru_policy` |

### 4-2. play_scenario zone1

| 필드 | 값 |
|------|-----|
| requiredCredits | 2,000 |
| mineralQtyTotal | 20 |
| pureMiningMinutes | 12 |

| 해석 | CR/h | 비고 |
|------|------|------|
| 시나리오 **앵커** (required/min) | 2,000÷0.2h = **10,000** | BM 정책과 일치 |
| **실판매** (20×10 CR / 12min) | **1,000** | 페라이트 10 CR 기준 |
| **갭 (앵커 / 실판매)** | **10.0×** | ⚠️ 1차 RED FLAG |

### 4-3. Stage-1 1차 판정

| 항목 | 판정 |
|------|------|
| 10 CR가 **채굴 속도(30s)와 self-consistent** | ✅ (내부 산술 일관) |
| 10 CR가 **BM 10,000 CR/h 앵커와 정합** | ❌ **~8.3×~10× 부족** |
| play_scenario zone1 **requiredCredits** | ❌ 단순 판매로는 **200 CR** (목표 2,000) |

**Stage-1 결론 (가설)**: 10 CR는 **카탈로그 tier1 표시가**로는 유지되나, **은하계 BRU/BM 기준 시간당 가치**와는 **체계적 불일치**. 조정은 (A) 가격 상향 · (B) 채굴 주기 단축 · (C) 앵커 하향 · (D) 복합 중 Stage-2·3에서 EV·sink와 함께 결정.

---

## 5. 검수-1 체크리스트 (김팀장)

- [ ] `ORBIT_MINING_CYCLE_MS=30000` 코드·주석 일치
- [ ] zone1 pool ferrite only CSV 확인
- [ ] allowance 수식 `planetMineralLedgerPolicy.ts` 재현
- [ ] 10× 갭 인정 → Stage-2 진행 승인

---

## 6. Stage-2 예고

- `mineral_upgrade_cost_lines` ferrite sink (무기/함체 upgrade)
- 무역 buy price ceil(sell/0.9) = 12 CR
- `sim:economy` cohort (2026-07-02: whale/F2P **3.12** OK)
- 전투 T3_1 (58 G/10min) vs T0 (16.7 G/10min) — 채굴 vs 전투 유인
