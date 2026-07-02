# 페라이트(ore_ferrite) 10 CR — 은하계 기초재화 경제 정밀 분석 **최종 리포트**

> **일자**: 2026-07-02 KST  
> **실행**: 김경제 (관측·분석 only) · **검수**: 김팀장  
> **코드/CSV 변경**: **없음**

---

## 요약 (Executive Summary)

**페라이트(`ore_ferrite`) 기본 판매가 10 CR**는 **tier1 표시·저레벨 upgrade sink·채굴 30초/개와의 내부 정합** 측면에서는 **유지 가능(조건부 적정)** 입니다.

다만 **BM·BRU·play_scenario가 사용하는 10,000 CR/h 시간 가치 앵커**와 **순수 채굴 판매 수입(1,200 CR/h)** 은 **약 8.3~10× 어긋납니다**.  
현재 경제는 **「채굴 = 저효율 기초 ore 공급」+「혼합 활동(전투·배달·미션) = 10k/h EV」** 이중 구조로 읽는 것이 데이터와 일치합니다.

**권고**: **단기 10 CR 유지(R0)** + 경제 문서에 이중 축 명시. 순수 채굴을 10k/h에 맞추는 조정은 **별도 밸런스 패스(R1 가격×10 또는 R2 속도×10)** 로 진행.

---

## 1. 분석 범위·방법

| 단계 | 내용 | 산출 |
|------|------|------|
| **Stage-1** | 채굴 물리 · catalog · allowance · BM 앵커 | [stage1-report](./2026-07-02-ferrite-stage1-report.md) |
| **검수-1** | 코드·CSV 교차 | PASS |
| **Stage-2** | sink · zone1~3 trade · BRU · macro SIM | [stage2-report](./2026-07-02-ferrite-stage2-report.md) |
| **검수-2** | SIM KPI · Stage-1 재현 | PASS |
| **Stage-3** | 통합 판정 · 조정 시나리오 | [stage3-verdict](./2026-07-02-ferrite-stage3-verdict.md) |

**계획 정본**: [2026-07-02-ferrite-anchor-3stage-plan.md](./2026-07-02-ferrite-anchor-3stage-plan.md)  
**기준 데이터**: [ferrite-anchor-baseline.json](../../tools/economy-evaluation/ferrite-anchor-baseline.json)

---

## 2. 핵심 수치표

### 2-1. 채굴 · Arcadia (zone1 · R≈50)

| 항목 | 값 |
|------|-----|
| 사이클 | 30초 / 1개 |
| zone1 드랍 | 100% 페라이트 |
| **CR/min** | 20 |
| **CR/h** | **1,200** |
| 일 allowance | 950개 → **9,500 CR/일** (순수판매 상한) |
| 세션 cap | 100개 → 1,000 CR |

### 2-2. 경제 앵커

| 항목 | CR/h |
|------|------|
| BM `play_scenario_credit_per_hour_anchor` | 10,000 |
| BRU T0 (16.7 G/10min) | ~10,020 |
| **실채굴 판매** | **1,200** |
| **갭 (앵커÷실판매)** | **~8.3×** |

### 2-3. play_scenario (전 zone 공통 패턴)

- `requiredCredits / pureMiningMinutes × 60` = **10,000 CR/h** (혼합 EV 목표)
- `mineralQty × 10 / pureMiningMinutes × 60` = **1,000 CR/h** (순수 ore 판매)
- **비율 10:1** — zone1~18 일관

### 2-4. Sink · 저레벨 (combat ≤14, upgrade max 5)

| 항목 | 값 |
|------|-----|
| 1스탯 1레벨 ferrite | 7~12개 (70~120 CR) |
| 9스탯 Lv5 총 ferrite | **425개 → 4,250 CR** |
| 채굴 소요 (~2/min) | **~3.5h** |

### 2-5. 활동 EV (BRU)

| 활동 | CR/h (approx) | vs 실채굴 |
|------|---------------|-----------|
| T0 채굴 (BRU 표기) | 10,020 | 8.3× |
| T2_2 배달 | 24,000 | 20× |
| T3_1 전투 | 34,800 | 29× |

### 2-6. Macro SIM (2026-07-02)

| KPI | 결과 |
|-----|------|
| whale/F2P | **3.12** (OK, <5) |
| cohort | OK |
| `mineral_income_per_hour=12` | macro **추상 mineral power** — 실 1,200 CR/h과 **비연동** |

---

## 3. 최종 질문에 대한 답

### Q. 10 CR는 적정한가?

| 관점 | 판정 | 설명 |
|------|------|------|
| tier1 **기초 표시가** · catalog ladder | ✅ **적정** | 10→420×42 기하 유지 |
| **채굴 시간 대비** 저레벨 upgrade sink | ✅ **적정** | 4~6 min/upgrade |
| **BM 10k/h 순수 채굴** 앵커 | ❌ **부적정** | 실입 1.2k/h |
| **은하계 혼합 EV** (전투·배달 포함) | ⚠️ **조건부** | 10 CR 유지 + **문서상 혼합 EV 명시** |

**종합**: **CONDITIONAL_KEEP_10CR** — 가격 자체보다 **「10 CR = 순수 시간당 가치」로 해석하면 안 됨**.

---

## 4. 권고 조치 (코드 변경 없음)

| 우선순위 | 조치 | 담당 |
|----------|------|------|
| **P0** | baseline JSON·본 리포트를 향후 AABS/밸런스 조정 **기준 데이터**로 사용 | 김경제 보관 |
| **P1** | 경제 문서에 **「혼합 EV 10k/h vs 순수 채굴 1.2k/h」** 이중 축 명문화 | 김팀장 (별도 지시 시) |
| **P2** | 순수 채굴 10k/h **실달성** 원하면 R1(83~100 CR) 또는 R2(3s cycle) **택1** + SIM 재검 | 김팀장 밸런스 패스 |

---

## 5. 조정 시나리오 요약

| ID | 요약 | 권고 |
|----|------|------|
| **R0** | 10 CR 유지 · BM=혼합 EV로 재정의 | **★ 단기 채택** |
| R1 | 가격 ×8.3~10 | 중기 · cascade 주의 |
| R2 | 채굴 속도 ×10 | 중기 · cap/allowance |
| R3 | BM 앵커 하향 | 비권고 (연쇄 파괴) |
| R4 | 10 CR + BRU 직접 지급 | 복잡도 ↑ |

---

## 6. 산출물 목록

| 파일 | 용도 |
|------|------|
| `docs/economy-evaluation/2026-07-02-ferrite-FINAL-REPORT.md` | **본 최종 리포트** |
| `docs/economy-evaluation/2026-07-02-ferrite-stage{1,2,3}-*.md` | 단계별 상세 |
| `tools/economy-evaluation/ferrite-anchor-baseline.json` | **기초재화 baseline v1.0.0** |
| `tools/kim-team-lead/reports/kim-economy-handoff.md` | handoff [관측] |

---

## 7. 결론

**10 CR는 “틀린 숫자”라기보다, BM 10,000 CR/h과 “같은 축”으로 묶으면 오해를 부르는 숫자**입니다.  
저레벨 유저 행동반경(Arcadia·zone1)에서 **채굴 루프는 동작**하지만, **시간당 크레딧 기대치는 전투·배달·시나리오 목표가 채굴 판매의 ~10×** 입니다.

**현 단계 조치**: **가격 변경 없음** · 분석 데이터 저장 완료 · 중기 조정 시 **R0→R1/R2** 순으로 검토.

---

*End of report — Kim Economy 3-stage analysis complete · no code changes*
