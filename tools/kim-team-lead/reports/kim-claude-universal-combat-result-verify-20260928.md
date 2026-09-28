# 범용 전투 결과 UI 구현 — 김클로드 전수 검증

```text
status=PENDING
task_id=universal-combat-result-verify-20260928
kind=VERIFY (김클로드 코드 변경 0 · 커밋 0)
date=2026-09-28
대상=김팀장 「모든 전투 동일 결과 UI」 구현분
verdict=구현 «양호» — D-1~D-3 전부 반영 · 게이트 통과. 잔여 리스크 5건(P1 1 · P2 3 · P3 1)
```

**게이트**: `tsc` **EXIT=0** · 관련 테스트 **15/15 PASS**
(`presentCombatResultOverlay` 5 · `hubCombatEndPresentContract` 5 · `transitCombatPostFlow` 5)

---

## 1. 반영 확인 — 내 명세 D-1~D-3 전부 처리됐다

| 항목 | 명세 요구 | 구현 | 판정 |
|---|---|---|---|
| 계약 확장 | `kind:'waveResult'` 유지 · `venue` optional 기본 `'wave'` | `presentCombatResultOverlay.ts:39` `input.venue ?? 'wave'` | ✅ |
| **D-1** 비-웨이브 보상 없음 | 보상 행 0개면 「보상 없음」 | `combatResultOverlayView.ts:56` `showNoReward` · **게다가 허브 exp 를 실제로 집계**(`PlanetEdenRaidTestLayer.tsx:2126`) | ✅ **기대 이상** |
| **D-2** 리스폰형 자동닫힘 | 허브 비-웨이브 8~10초 | `HUB_ORBIT_COMBAT_RESULT_AUTO_DISMISS_MS = 10_000` · venue별 분기 | ✅ |
| **D-3** `reward` kind 제거 금지 | 존치 | 타입·`showArcOverlayReward` 존치 | ✅ (단 §3 R-C) |
| 4경로 배선 | 웨이브·허브 비-웨이브·이동중 승/패 | `planet.tsx:1267` · `PlanetEdenRaidTestLayer.tsx:3366` · `transitCombatPostFlow.ts:161` · `combat.tsx:290` | ✅ |

### 설계상 잘한 점

- **순수 view-model 분리** — `combatResultOverlayView.ts` 가 RN·store 의존 없이 «행 가림»만 계산. 그래서 테스트가 실제 동작을 검증할 수 있다(내가 요구한 「문자열 매칭 금지」가 반영됨).
- **파손 장비 중복 차단** — 승리 시 결과창에 넣고, `transitCombatPostFlow.ts:380·389` 에서 `if (payload.kind !== 'victory')` 로 별도 alert 를 막았다. **팝업 2개 → 1개.** (내가 중복을 의심했으나 이미 처리돼 있었다)
- **허브 dedupe** — `hubOrbitCombatResultSession.presented` 로 sim 루프 재진입 시 중복 present 차단. `queueMicrotask` 로 sim 루프 밖에서 present.
- **레벨업 브리지 억제** — `LevelUpOverlayBridge.tsx:23` 에 `combatResultOpen` 추가.

---

## 2. 🟠 R-A (P1) — 레벨업 카드가 «2장» 뜰 수 있다

**서로 다른 id 를 쓰는 두 경로가 상대를 인식하지 못한다.**

| 경로 | id |
|---|---|
| 브리지 | `LEVEL_UP_OVERLAY_ID = 'auto-level-up'` |
| 결과창 체인 | `COMBAT_RESULT_LEVEL_UP_OVERLAY_ID = 'combat-result-level-up'` |

`LevelUpOverlayBridge.tsx:38-40` 의 중복 검사가 **자기 id 로 한정**돼 있다:

```js
const exists = stack.some((e) => e.kind === 'levelUp' && e.id === LEVEL_UP_OVERLAY_ID);
```

**시나리오(허브 비-웨이브)**
1. 전투 종료 · 레벨업 발생 → `levelUpPending = true`
2. 결과창 present → 브리지 억제(`combatResultOpen === true`) ✓
3. 결과창 닫힘 → `onClose` → `presentPendingCombatLevelUpThen` 이 **`combat-result-level-up`** present
4. 같은 순간 `combatResultOpen` → **false**. `levelUpPending` 은 아직 true(레벨업 카드 `onClose` 에서만 clear)
5. 브리지 effect 재실행 → 자기 id 가 없으므로 **`auto-level-up` 을 추가 present**

→ **레벨업 카드 2장.**

**완화 조건**: 4단계에서 `orbitCombatActive` 가 아직 true 면 브리지가 계속 억제된다. 이동중 전투는 `transitPostFlowRunning` 이 true 라 **안전**하다. **위험은 허브 경로에 한정**되며, `orbitCombatActive` 해제 시점에 좌우되므로 **PLAUSIBLE(조건부)** 로 본다.

**수정 제안(1줄)**: 브리지 중복 검사를 id 무관으로.
```js
const exists = stack.some((e) => e.kind === 'levelUp');
```

---

## 3. 🟠 R-B (P2) — 「이탈(flee)」에는 결과창이 없다

대표님 지시는 **「모든 전투」**다. 그런데 이동중 전투 **이탈**은:
- `transitCombatPostFlow.ts:151` `if (payload.kind !== 'victory') return Promise.resolve();` → **결과창 없음**
- 오퍼레이터 대사 + 장비 파손 alert 만

게다가 `outcome` 타입이 **`'win' | 'lose'`** 뿐이라 이탈을 표현할 수단 자체가 없다.

**판단 필요**: 이탈을 ① 결과창 대상에서 제외(현행) ② `outcome: 'lose'` 로 표시 ③ `outcome` 에 `'flee'` 추가.
**김클로드 권고 = ③** — 이탈은 패배가 아니고, 「교전 이탈 · 손실 최소화」 전과를 보여주는 편이 지시에 부합한다.

---

## 4. 🟠 R-C (P2) — `reward` 오버레이 경로 전체가 «죽었다»

`showArcOverlayReward` **호출 0건**. `kind: 'reward'` 도 타입 정의와 그 함수 내부에만 남았다.

```
showArcOverlay.ts:25  export function showArcOverlayReward(...)   ← 호출처 없음
showArcOverlay.ts:40    kind: 'reward',
arcOverlayStore.ts:80   kind: 'reward';                            ← 타입만
```

D-3 에서 「제거 금지」라고 한 것은 **다른 소비자가 있을까 봐**였는데, 실측 결과 **소비자가 없다.**

→ 대표님 「쓰레기 코드」 기준(호출처 0 확인 시 즉시 삭제)에 해당한다. 다만 **미션 보상 UI 로 되살릴 계획이 있으면 존치**가 맞다. **의도 확인 후 결정** 요청.
(`RewardOverlayContent` 렌더러도 함께 확인할 것)

---

## 5. 🟡 R-D (P3) — 의미 없는 `0` 이 엔트리에 저장된다

`presentCombatResultOverlay.ts:43-44`
```js
wavesCleared: input.wavesCleared ?? 0,
totalWaves: input.totalWaves ?? 0,
```

비-웨이브에서도 `0/0` 이 엔트리에 들어간다. view-model 이 `totalWaves > 0` 로 **화면에서는 가려주므로 동작은 정상**이다. 다만 스토어 덤프·후속 소비자(로그·분석)에서 「0웨이브 클리어」로 오독될 수 있다. optional 로 그대로 넘기는 편이 깔끔하다.

---

## 6. 🟠 R-E (P2 · 실기 확인 필요) — 허브 10초 안에 못 읽을 수 있다

`HUB_ORBIT_COMBAT_RESULT_AUTO_DISMISS_MS = 10_000` 은 **내가 권고한 값**(8~10초)이다. 다만:

- 자동닫힘으로 닫혀도 `onClose` 체인(레벨업 → 미션 대사 → 격침 알림)은 정상 실행된다 — 구조는 맞다.
- 그러나 **격파 대상·경험치를 10초 안에 읽을 수 있는지**는 실기로만 판단된다. 리스폰형 교전 방해와의 균형점이라 값 조정이 필요할 수 있다.

**실기 확인 항목**: 드라코 일반 교전 승리 → 결과창이 뜨는가 · 10초가 적절한가 · 연속 교전 시 방해되지 않는가.

---

## 7. 종합

**구현 품질은 양호하다.** 명세 요구를 전부 반영했고, 내가 우려한 중복(파손 알림)은 이미 막혀 있었으며, 허브 exp 집계는 명세보다 한 발 더 나갔다. 테스트도 문자열 매칭이 아닌 **view-model 동작 검증**으로 만들어졌다.

| 순위 | 조치 |
|---|---|
| **1** | **R-A** 브리지 중복 검사를 id 무관으로 (1줄) |
| 2 | **R-B** 이탈 결과창 — `outcome: 'flee'` 추가 여부 결정 |
| 3 | **R-C** `reward` 경로 삭제 vs 존치 결정 |
| 4 | **R-E** 실기로 10초 적정성 확인 |
| 5 | R-D `0` 대신 optional 전달 |

---

## 8. 한계

- **정적 분석 + 게이트 실행**이다. R-A 는 `orbitCombatActive` 해제 타이밍에 좌우되므로 **실기 재현(레벨업이 걸린 허브 전투 승리)** 으로 확정해야 한다.
- 퀘스트 전용 전투(`resolveQuestCombatLock`)가 별도 결과 연출을 요구하는지는 이번에도 확인하지 않았다.
- `vega_base` 자동 전투(QA 베드)에서 10초 결과창이 반복될 때의 체감은 미확인.

---

**김클로드는 읽고 게이트만 돌렸다** — 코드 변경 0 · 커밋 0.
