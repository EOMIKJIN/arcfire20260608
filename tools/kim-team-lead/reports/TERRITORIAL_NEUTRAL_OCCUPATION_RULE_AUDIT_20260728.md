# 분쟁·순차 점유 · 중립 변경 정밀 재검수 (작업지시 전)

> **일자**: 2026-07-28 · 김팀장  
> **범위**: 코드·CSV·노드그래프 대조 · **코드 수정 없음**  
> **대표님 정본 재확인**: 노드 1홉 — 블루만 또는 레드만 연결(중립 연결은 무시) → 해당 팩션 고확률 점령 · **범용** · 헬리오스↔블루 / 타이탄↔레드 대칭

---

## 1. 대표님 룰 (이번 지시로 재확정한 문장)

| # | 규칙 |
|---|------|
| R1 | **노드라인 1홉**으로 팩션 연결을 본다 |
| R2 | **블루만** 이어짐(또는 **레드만** 이어짐) → 그 팩션이 **더 높은 확률**로 점유 |
| R3 | **중립** 성계가 연결되어 있어도 **비대칭을 깨지 않음**(무시) |
| R4 | 헬리오스(블루 측) / 타이탄(레드 측)은 **같은 규칙의 대칭 적용 |
| R5 | **타 성계도 동일 조건이면 동일 규칙**(범용 · planetId 분기 금지) |
| R6 | 이 규칙은 **점유 변경 스택에서 항상 최우선** |

**양쪽(블루·레드) 모두 1홉에 있을 때**는 이번 지시 문장에 **명시 없음** → 아래 §4에서 갭으로 분리.

---

## 2. 순차 점유 파이프라인 (현행)

```text
runTerritorialCombatPass (≈60s probe / 캠페인 1h 1행성)
  → draco_front 로테이션 1곳만 due
  → runTerritorialCombatPassForPlanet
       ① DEV 시드그래프 vs CSV warn
       ② hold=INDEPENDENT → 침공 분기(P0 비적용)
       ③ rollDecision(CSV: battle58 / declare12 / status_quo30)  ← 여기가 P0보다 앞
       ④ status_quo / neutral_declare → 점유 거의 불변 종료
       ⑤ battle만:
            supplyAdjacency = countAdjacentFriendlySystems(BLUE/RED)  ← 중립 홀드 미가산
            effectiveMode = resolveEffectiveTerritorialCombatMode
              NEUTRAL + 블루만 → blue_neutral
              NEUTRAL + 레드만 → red_neutral
              NEUTRAL + 둘다 → blue_red   ← CSV geo-flank 덮어씀
              NEUTRAL + 둘다0 → CSV 폴백
            blue/red_neutral → dominantSideWeightPct(70%) 이진 점유
            blue_red → 퀵컴뱃 + (분쟁시) 전술역전
```

**캠페인 멤버(정책 enabled)**:  
`draco_haven` → `omega_hub` → `shadow_market` → `helios_core` → `titan_ruins` (1h×5 ≈ 5h/바퀴)

---

## 3. 인접 카운트 vs 대표님 R3

`countAdjacentFriendlySystems`는 **런타임 holds** 기준 · 성계 1홉 · **NEUTRAL 홀드는 가산하지 않음**.

→ **「중립은 연결되어도 상관없음」과 이미 일치.**

시드 정적 스냅샷으로 동일 로직을 재현한 결과: `tools/debug/audit-neutral-adjacency-p0.mjs`

---

## 4. 헬리오스 · 타이탄 — 시드 인접 (핵심 발견)

| 성계 | self | 1홉 (시드 owner) | B/R/N | 비대칭? | 대표님 기대 | 순수 P0(비대칭) |
|------|------|------------------|-------|---------|-------------|-----------------|
| **helios** | NEUTRAL | iron=**BLUE**, omega=**RED**, titan=NEUTRAL, perseus=**RED** | 1/2/1 | **BOTH** | 블루 고확률 | **미적용** |
| **titan_gate** | NEUTRAL | iron=**BLUE**, omega=**RED**, helios=NEUTRAL, shadow=**NEUTRAL** | 1/1/2 | **BOTH** | 레드 고확률 | **미적용** |

### 해석

- 시드 그래프만으로 보면 헬리오스·타이탄 **둘 다「단독 연결」이 아님**.
- 따라서 **순수 인접 비대칭 룰만**으로는 부트 직후 헬리오스→블루 / 타이탄→레드가 **나오지 않음**(기대와 불일치).
- geo-flank CSV(`helios=blue_neutral` / `titan=red_neutral`, dom 70%)는 이 **BOTH** 구간을 메우려고 넣은 보조축.
- 그런데 현 P0는 BOTH일 때 **`blue_red`로 CSV를 덮어씀** → geo-flank 우세가 **battle 진입 시 무력화**.

### 타이탄「레드 고확률」과 룰 동일성

- **규칙 문장(R1~R5)**: 타이탄=레드 / 헬리오스=블루는 **같은 비대칭 규칙의 대칭. **동일 규칙 맞음.**
- **시드 실측**: 둘 다 BOTH라 **그 규칙의 자격 조건(단독 연결)을 시드에서 못 채움.**
- 섀도우가 나중에 RED가 되고 아이언이 빠지면 타이탄은 RED_ONLY가 될 수 있음(런타임). 시드만으로는 RED_ONLY 아님.

---

## 5. 캠페인 행 vs 순수 P0 자격 (시드)

| planet | CSV mode | 시드 비대칭 | 순수 P0 적용? |
|--------|----------|-------------|---------------|
| draco_haven | blue_red | BOTH | NO |
| omega_hub | blue_neutral | **BLUE_ONLY** | YES(단 hold가 NEUTRAL일 때; 시드는 RED라 초기 P0 비활성) |
| shadow_market | red_neutral | **RED_ONLY** | YES(시드 NEUTRAL → **규칙과 정합**) |
| helios_core | blue_neutral | BOTH | NO |
| titan_ruins | red_neutral | BOTH | NO |

**섀도우**는 시드 NEUTRAL + RED_ONLY → 대표님 룰과 **가장 잘 맞음**.  
**오메가**는 인접상 BLUE_ONLY이나 self가 이미 RED → P0(NEUTRAL 한정) 비활성.

---

## 6. 현행이 대표님 R6(최우선)을 깨는 지점

| # | 결함 | 영향 |
|---|------|------|
| G1 | `rollDecision`이 supply/P0 **앞** | 단독 연결이어도 status_quo 30%면 점유 불변 |
| G2 | docs §6-3 「P2가 P0보다 바깥」 | 지시와 **반대**로 문서화됨 |
| G3 | BOTH → effective=`blue_red` 강제 | 헬리오스/타이탄 geo-flank CSV **무력** |
| G4 | 점유 변경은 **정책·캠페인 멤버** 위주 | 시드상 비대칭인 타 성계(예: eternity/genesis RED_ONLY)는 캠페인 미편입 시 **순차 판정 없음** |

G4는 「범용」과 「캠페인 분쟁만 순차」의 제품 범위 충돌 — 수정 시 **범위 확정 필요**.

---

## 7. 룰 일치 판정 (한 줄)

| 질문 | 판정 |
|------|------|
| 헬리오스 블루 / 타이탄 레드가 **같은 규칙**인가? | **예** (대칭 비대칭 인접) |
| 현 코드가 그 규칙을 **항상 최우선·범용**으로 구현했는가? | **아니오** (G1~G3, 헬리오스/타이탄은 시드 BOTH) |
| 「중립 연결 무시」는 맞는가? | **예** (보급 카운트와 일치) |

---

## 8. 재수정을 위한 설계 후보 (코드 전 · 대표님 승인용)

작업지시 전 **BOTH(양쪽 인접) 처리**만 선택 필요.

### 1안 (권장 · 지시·geo-flank·범용 정합)

| 순위 | 조건 | 동작 |
|------|------|------|
| **P0** | NEUTRAL + (블루만 XOR 레드만), 중립 무시 | **roll 무시·battle 강제** → 해당 팩션 `dominant` 고확률(기존 70%) |
| **P1** | NEUTRAL + **BOTH** | **CSV `combatMode` 유지**(헬리오스 blue_neutral / 타이탄 red_neutral) · P0가 blue_red로 **덮지 않음** |
| **P2** | rollDecision | P0가 아닐 때만(또는 BOTH·고립) |
| 범위 | 우선 **기존 contested/캠페인 정책 행성** | 타 성계 확대는 별도 승인 |

→ 시드 BOTH인 헬리오스·타이탄도 CSV 우세로 **기대(블루/레드 고확률)** 회복.  
→ 단독 연결 성계(섀도우 등)는 **절대 최우선**으로 규칙 충족.

### 2안 (순수 인접만 · geo-flank 약화)

- BOTH면 항상 `blue_red` 접전 유지(현 P0).
- 헬리오스·타이탄은 시드에서 **블루/레드 고확률 보장 불가**(그래프·시드 변경 없으면).

### 3안 (시드/연결 변경)

- 헬리오스에서 레드 인접 제거 등 — **기존값 변경·재확인 필수**, 비권장.

---

## 9. 다음 단계

대표님께서 **§8 1안 / 2안** 중 하나를 지정하시면, 그다음에만 김클로드 READY를 **재작성**하고 착수합니다.  
(이전에 발행한 `p0-asymmetric-adjacency-absolute` READY는 G1만 고치고 G3·헬리오스/타이탄 BOTH는 그대로라 **불완전** — 1안 승인 시 폐기·병합.)
