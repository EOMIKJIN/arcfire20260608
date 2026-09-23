# 국가 대출 · 군수업체 대주 — 의도 설정 (2026-09-21)

> **김팀장** · 대표님 지시: 의도설정만. **고도화 때 재설계.**  
> **코드 상태**: CSV 정본 + 장부 재산정 읽기. 이자·조달중단·점령청산 **런타임 없음.**

```text
[pss-pre-dev] hot_path=없음(일1회 미연결) alloc=0 cache=모듈 KV 1회
[pss-pre-dev] stage=월드 정책 · persist 신규키 없음 risk=없음
[pss-pre-dev] verdict=PASS
```

정본: `tables/balance/arc_core_sovereign_loan_policy.csv` · `arc_core_sovereign_loan_books.csv`  
읽기: `src/arcCore/economy/sovereignLoanIntentPolicy.ts` · `sovereignLoanDebtInventory.ts`

---

## 0. 한 줄

국가 대출의 **원금 장부**는 군수업체 자금으로 돌리고, 잔액이 커지면 군수업체 **이자수입**이 늘며, 못 갚으면 **군수물자 조달 중단**. 점령지는 **반환 → 중립국화 → 대출 비용청산**이 가능하게 예약한다. 지금은 이 관계만 잠그고, 엔진은 고도화에서 다시 짠다.

---

## 1. 부채 재산정 (현재 경제 운용)

| 항목 | 분류 | 지금 |
|------|------|------|
| 스텔리움 개척 `loanCredits` | **유일한 실부채** | 블루 운용, 상환 자리표시=`arccore_vault` |
| 개척 의장·운용·시도·보증의 **현금 차감** | 지출 | 부채 아님 |
| 행성 유지비 800 | 지출 | 기존값 유지 · 부채 아님 |
| 재정 프록시 오펙스 | 지출 | 부채 아님 |
| 중앙은행 함대/개방 소각·개발 예산 | 지출 | 부채 아님 |
| 수송선단 잔액 | 운영현금 | 대주 아님 (G8) |
| 금고 시드 | 자본 | 부채 아님 |
| 플레이어 위성 L1 · `player.credits` | 개인 지출 | 국가 대출 아님 |

예약 장부(잔액 0, 고도화 신설): `crimson_military_ops` · `neutral_ops` · `independent_ops`

---

## 2. 잠근 관계 (고도화 입력)

| 축 | 설정 |
|----|------|
| 대주(향후) | `military_industry_vault` — 대출 원금의 출처 · 이자수입 귀속. **스토어 미생성** |
| 대주(지금) | `arccore_vault` — 개척 상환 자리표시만 |
| 차주 | 국가 단위: 스텔리움 · 아크코어 · 중립 · 독립국 |
| 이자 | 잔액(outstanding)이 클수록 군수업체 수입 증가. **금리 숫자는 미잠금** |
| 디폴트 | 국가가 제대로 못 갚으면 `halt_military_procurement` |
| 조달 중단 범위 | 국가 함체·무기·장비·개척 의장. 플레이어 위성 L1 제외 |
| 점령 청산 | `return_hold` → `neutralize` → `settle_loan_cost` |
| 시계 | 일 1회 배치만. 틱·가격탄력 금지 |
| persist | 신규 키 금지. 실잔액은 기존 개척 fiscal 키 |

---

## 3. 고도화 때 다시 할 일 (지금 하지 않음)

1. 군수업체 월드 금고 신설 · 개척 상환을 중앙에서 이관  
2. 일 1회 이자 발생 · 디폴트 판정 · 군수 카탈로그/의장 게이트  
3. 점령 반환 시 해당 행성 묶인 원금 청산 + hold 중립화  
4. 금리·디폴트 임계 · 국가별 한도 — **그때 수치 재확인**

`intent_lock=true` · `runtime_*_enabled=false` 가 꺼져 있는 동안 위 엔진을 켜지 않는다.
