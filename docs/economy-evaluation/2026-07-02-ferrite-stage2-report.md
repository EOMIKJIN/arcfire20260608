# Stage-2 — 페라이트 10 CR · 은하계 연관 경제 (2차 분석) — **완료**

> **작성**: 김경제 · **2026-07-02 KST** · **검수-2**: PASS

---

## 1. Sink — 업그레이드 곡선 (ore_ferrite)

정본: `mineral_upgrade_cost_lines.csv` · `mineral_upgrade_level_caps.csv`

| combat Lv | maxUpgradeLevel |
|-----------|-----------------|
| ≤14 | **5** |
| ≤30 | 8 |
| ≤50 | 12 |
| 999 | 15 |

### 1-1. 1스탯 1레벨 (ferrite qty)

7~12개/level · 평균 **9.4** · **70~120 CR** (@10 CR) · **3.5~6 min** 채굴

### 1-2. 저레벨 풀세팅 (9스탯 × Lv5)

| stat | ferrite/Lv × 5 |
|------|----------------|
| hull/shield/missile dmg 등 | 425 **총 ore** |

| 지표 | @10 CR |
|------|--------|
| CR 환산 | **4,250 CR** |
| 채굴 시간 (2/min) | **~212 min (~3.5h)** |
| 일 allowance (950) | **45%** 소진 |

> **판정**: 10 CR에서 **저레벨 성장 sink는 성립**. BM 10k/h 혼합 EV 기준으론 **~25 min**이면 충분 → **앵커 대비 sink가 가벼움**.

---

## 2. Zone 1~3 · 무역·채굴 풀

| zone | planets (예) | mineral pool | ferrite sell |
|------|--------------|--------------|--------------|
| 1 | arcadia_prime | ferrite only | 10 CR |
| 2~3 | vega, solar | ferrite 88% + silicate | 10 / 12 CR |
| drop | primary 88~100% | — | — |

- 무역소 buy = ceil(sell/0.9) → ferrite **12 CR**
- zone1~3 **trade port 보유** (planets.csv) — ferrite listing 전 구간 동일 anchor
- zone2~3 EV uplift: silicate 12 CR mix **~+2.4%** (88/12 blend rough)

---

## 3. 활동 EV · play_scenario 교차

| zone | requiredCredits | mineralQty | mining min | implied CR/h | sell@10 CR/h |
|------|-----------------|------------|------------|--------------|--------------|
| 1 | 2,000 | 20 | 12 | 10,000 | **1,000** |
| 3 | 5,000 | 50 | 30 | 10,000 | **1,000** |
| 5 | 20,000 | 200 | 120 | 10,000 | **1,000** |

**패턴**: `requiredCredits / pureMiningMinutes × 60` = **항상 10,000 CR/h**  
**실판매** (mineralQty × 10 / minutes × 60) = **항상 1,000 CR/h**

→ play_scenario의 `requiredCredits`는 **“해당 구간 목표 총수입(혼합 EV)”**이며, **동일 구간 순수 페라이트 판매액의 10×**로 설계됨.

| BRU tier | CR/h (G×100) | vs 실채굴 |
|----------|--------------|-----------|
| T0_BASE | 10,020 | 8.35× |
| T2_2 배달 | 24,000 | 20× |
| T3_1 전투 | 34,800 | 29× |

---

## 4. Macro SIM 교차

| 항목 | 값 | 해석 |
|------|-----|------|
| `mineral_income_per_hour` | **12** | macro cohort **추상 mineral power/h** · `playTime × 12` |
| 실채굴 CR/h | 1,200 | **직접 연동 없음** |
| whale/F2P (2026-07-02) | **3.12** | KPI OK |
| F2P 5h optimal (BM) | 50,000 CR | **혼합 EV** 가정 |
| F2P 5h 순수채굴 | ~6,000 CR | 10 CR 기준 |

> SIM은 **tier1 실가격을 반영하지 않는** macro 축. ferrite 10 CR 조정 시 **`economy_sim_macro_policy`·cohort 재검증** 필요.

---

## 5. Stage-2 판정

| 질문 | 답 |
|------|-----|
| 10 CR + sink로 저레벨 루프? | ✅ **성립** |
| 10 CR = BM 10k/h 순수 채굴 앵커? | ❌ **불일치 (0.1×)** |
| play_scenario requiredCredits | **혼합 EV 10×** · ore 판매액과 **별도 축** |
| 전투/배달 vs 채굴 | 채굴 = **저속 기초 공급** · 고효율은 비채굴 |

**검수-2**: Stage-1 수치 재현 OK · SIM KPI OK · **Stage-3 진행 승인**
