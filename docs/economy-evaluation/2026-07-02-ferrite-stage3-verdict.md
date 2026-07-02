# Stage-3 — 페라이트 10 CR · 최종 판정 및 조정 권고

> **작성**: 김경제 · **2026-07-02 KST** · **최종 검수**: 김팀장

---

## 1. Executive Summary

| 항목 | 결론 |
|------|------|
| **대상** | `ore_ferrite` (페라이트) · **sellPriceAnchorCr = 10** |
| **질문** | 저레벨 채굴(30s/개) 대비 10 CR가 은하계 **기초 재화**로 적정한가? |
| **최종 판정** | **조건부 적정 (CONDITIONAL)** |

**한 줄**: 10 CR는 **tier1 카탈로그·저레벨 upgrade sink·UI 인지**에는 **적정**하나, **BM/play_scenario/BRU T0가 가정하는 10,000 CR/h “순수 채굴 판매” 앵커와는 8.3~10× 불일치**. 현재 구조는 **「채굴 = 저효율 기초 공급 + 혼합 활동 EV = 10k/h」** 이중 축으로 해석하는 것이 정합적.

---

## 2. 3단계 통합 수치

| 축 | CR/h | 근거 |
|----|------|------|
| **실채굴 판매** (zone1, 10 CR) | **1,200** | 30s×2/min×10 |
| **BM · BRU T0** | **10,020** | bm_economy_policy · reward_tier_bru |
| **play_scenario implied** | **10,000** | requiredCredits/miningMin |
| **실판매 / 앵커** | **0.12×** | 구조적 갭 |
| **F2P 5h 순수채굴** | **~6,000** | vs BM 50,000 (혼합) |
| **9스탯 Lv5 ferrite** | **4,250 CR** | ~3.5h 채굴 |

---

## 3. 「10 CR가 옳은가?」 — 다층 답변

### 3-1. Tier ladder · UI 기초 단위 → **적정 (KEEP)**

- catalog tier1=10 → tier10=420 (**42×** 기하) — MAU notes 유지
- 무기/함 upgrade cost lines tier1 ore로 ferrite 사용 — **숫자 친숙도**

### 3-2. 순수 채굴 시간당 가치 · BM 앵커 → **부적정 (MISALIGNED)**

- 설계 문서·BM이 **암묵적으로** 10k/h를 “플레이어 시간 가치”로 쓰나, **실채굴만으로는 1.2k/h**
- play_scenario zone1 **2,000 CR** 목표 vs **200 CR** ore 판매 — **9:1** 혼합 활동 전제

### 3-3. 저레벨 성장 체감 → **적정 (PLAYABLE)**

- 1 upgrade ≈ 4~6 min — 튜토리얼·Arcadia 루프 **플레이 가능**
- 전투/배달 EV >> 채굴 — **의도적 incentive** 구조와 부합

### 3-4. Macro cohort · Whale/F2P → **현재 PASS (간접)**

- whale/F2P **3.12** — 10 CR **즉시 변경 불필요** (cohort 붕괴 없음)
- 단, ferrite 가격 **10× 상향** 시 SIM·weapon cascade **재검증 필수**

---

## 4. 조정 시나리오 (코드/CSV 미적용 · 향후 레버)

| ID | 내용 | ferrite CR | cycle | BM anchor | 리스크 |
|----|------|------------|-------|-----------|--------|
| **R0 (현행 유지+문서)** | 10 CR 유지 · BM/play_scenario를 **「혼합 EV」**로 공식 재정의 | 10 | 30s | 10,000 | 낮음 · **권고 1순위** |
| R1 | 가격 **83~100 CR** (×8.3~10) | 83~100 | 30s | 10,000 | tier ladder·무기가 **전면 cascade** |
| R2 | cycle **3s** (×10 속도) | 10 | 3s | 10,000 | allowance·세션 cap·idle 밸런스 |
| R3 | play_scenario zone1 **requiredCredits→200** (판매액 정합) | 10 | 30s | **~1,000** | BM·F2P 50k/일 **하향 연쇄** |
| R4 | 혼합: 10 CR + **채굴 완료 BRU 직접 지급** | 10 | 30s | 10,000 | 시스템 복잡 |

### 권고 (김경제 · 김팀장 합의)

1. **단기 (분석만)**: **R0** — 10 CR **유지**. baseline JSON에 **「혼합 EV vs 순수 판매」** 이중 축 명시.
2. **중기 (밸런스 패스)**: 순수 채굴을 10k/h에 **실제로** 맞추려면 **R1 또는 R2** 중 **하나만** 선택 · SIM+cohort 재실행.
3. **비권고**: R3 단독 (BM 전체 붕괴) · R1+R2 동시 (double 10×).

---

## 5. baseline JSON 확정 필드

`tools/economy-evaluation/ferrite-anchor-baseline.json`:

- `finalVerdict`: **CONDITIONAL_KEEP_10CR**
- `recommendedScenario`: **R0**
- `adjustmentLevers.*.stage3Recommended` populated

---

## 6. 후속 (김팀장 · 코드 변경 시)

- [ ] `docs/ECONOMY_TRADE_ECOSYSTEM_REFERENCE.md` — 기초재화 이중 축 1절
- [ ] R1/R2 선택 시: `mining_mineral_catalog` · `miningConfig` · `sim:economy` · cohort gate
- [ ] **코드 변경 없이** 본 분석만으로 **완료 선언** (사용자 지시)

---

## 7. Gate 완료 체크

| Gate | 상태 |
|------|------|
| Stage-1 | ✅ |
| 검수-1 | ✅ |
| Stage-2 | ✅ |
| 검수-2 | ✅ |
| Stage-3 | ✅ |
| 최종 리포트 | ✅ |
