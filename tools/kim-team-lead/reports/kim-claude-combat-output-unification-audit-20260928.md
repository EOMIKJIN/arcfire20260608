# 전투 종료 출력 — 범용성·일관성·안정성 전수 검수

```text
status=PENDING
task_id=combat-output-unification-audit-20260928
kind=CODE_AUDIT (김클로드 코드 변경 0 · 커밋 0)
date=2026-09-28
대표님 지시=전체 전투시스템 범용·일관성 + 안정성 + 「최종 출력 일원화·프로세스 효율화」 점검
verdict=**안정성 확보 ✅ / 일원화 미달 ❌** — 결과창은 통합됐으나 «그 뒤 체인»이 경로마다 다르다
```

**게이트**: `tsc` **EXIT=0** · 테스트 **22/22 PASS** · `audit:no-bare-interaction-manager` **PASS** · `audit:ui-overlay` **PASS**

---

## 0. 한 줄

**결과창(카드) 자체는 성공적으로 일원화됐다.** 그러나 대표님이 짚으신 **「최종적으로 출력되는 부분」은 카드 한 장이 아니라 «결과창 → 레벨업 → 미션대사 → 알림 → 백채널» 체인 전체**이고, **이 체인이 경로마다 서로 다른 구현·다른 순서·다른 실행 방식으로 갈라져 있다.**

---

## 1. ✅ 확보된 것 — 안정성과 카드 통합

| 항목 | 상태 |
|---|---|
| 결과 카드 | `presentCombatResultOverlay` 단일 진입점 · `venue` 로 행 가림 |
| 4경로 배선 | 웨이브 · 허브 궤도 · 이동중 승 · 이동중 패 |
| **R-A 수정 확인** | `LevelUpOverlayBridge.tsx:40` → `stack.some((e) => e.kind === 'levelUp')` **id 무관**. 레벨업 2장 위험 해소 ✅ |
| 중복 방지 | 허브 `hubOrbitCombatResultSession.presented` · `queueMicrotask` |
| 고착 방지 | `TRANSIT_POST_FLOW_BLANK_ABORT_MS` · venue별 자동닫힘 |
| 정적 게이트 | tsc 0 · 22/22 · 감사 2종 PASS |

**시스템 안정성은 확보됐다고 본다.** 이하는 «구조 품질» 지적이다.

---

## 2. 🔴 U-1 (P1) — 레벨업 present 구현이 **3개**

| # | 구현 | 오버레이 id | 사용처 |
|---|---|---|---|
| 1 | `presentCombatResultOverlay.ts:66` `presentPendingCombatLevelUpThen` | `combat-result-level-up` | 허브 웨이브 · 허브 궤도 |
| 2 | **`transitCombatPostFlow.ts:237` `presentLevelUpIfPending`** | `transit-post-combat-level-up` | **이동중 — 통합 함수 미사용** |
| 3 | `LevelUpOverlayBridge.tsx:44` | `auto-level-up` | 범용 폴백 |

**같은 일을 하는 코드가 3벌.** R-A 로 «동시 2장 표시»는 막았으나 **코드 일원화는 안 됐다.** 이동중만 자체 구현을 유지한다.

→ **`presentPendingCombatLevelUpThen` 하나로 수렴**하고 2번을 제거하는 것이 일원화의 본체다.

---

## 3. 🔴 U-2 (P1) — 미션 클리어 표시가 **2가지 메커니즘**

| 경로 | 방식 | 성격 |
|---|---|---|
| 허브 웨이브 `planet.tsx:1301` · 허브 궤도 `PlanetEdenRaidTestLayer.tsx:3348·3400` | `tryPresentPendingMissionClearDialog()` | **동기 1회 호출** |
| 이동중 `transitCombatPostFlow.ts:255·390·397` | **`presentMissionClearWhenReady()`** | **8초 폴링 루프 자체 구현** |

목적이 같은데 이동중만 별도 함수·별도 대기 정책을 쓴다. 저장소 전체에서 `tryPresentPendingMissionClearDialog` 는 **9곳**(바·무역소·월드맵·허브)에서 쓰이는 **사실상의 정본**이다.

→ 이동중도 정본으로 수렴하거나, 폴링이 꼭 필요하면 **그 대기 로직을 정본 쪽에 흡수**해야 한다.

---

## 4. 🔴 U-3 (P1) — 전투종료 **아크코어 백채널이 웨이브에만** 뜬다

`reason: 'combat_end'` 호출처 전수 = **`app/(game)/planet.tsx:1294` 단 1곳**.

- 허브 웨이브 종료 → 백채널 **뜸**
- **허브 궤도 일반 전투 종료 → 안 뜸**
- **이동중 전투 종료 → 안 뜸**

「모든 전투는 동일한 출력」 기준에서 **가장 눈에 띄는 불일치**다. 대표님이 드라코 일반 전투에서 이질감을 느끼신 원인이 결과창만은 아닐 수 있다.

→ **의도적 차등인지 확인 필요.** 동일해야 한다면 체인 공통화 시 함께 올린다.

---

## 5. 🟠 U-4 (P2) — 「이탈(flee)」에는 결과창이 여전히 없다 (R-B 미반영)

- `arcOverlayStore.ts` `outcome: 'win' | 'lose'` — **`flee` 없음**
- `transitCombatPostFlow.ts:152` `if (payload.kind !== 'victory') return Promise.resolve();` → **이탈 시 결과창 미표시**

지시가 「**모든** 전투」이므로 미달 상태다. 앞선 보고에서 `outcome: 'flee'` 추가를 권고했으나 반영되지 않았다.

---

## 6. ⚡ E-1 (P1 · 효율) — 이동중만 «폴링», 허브는 «콜백»

대표님이 말씀하신 **프로세스 효율화**의 핵심이다.

| 경로 | 진행 방식 | 비용 |
|---|---|---|
| 허브 웨이브·궤도 | `onClose` **콜백 체인** — 결과창 닫힘 → 레벨업 → 미션대사 → 알림 | 이벤트 구동 · 지연 0 |
| **이동중** | **`await waitFor…` 11회** + `delay(32)` **폴링 루프 3개** | 32ms 간격 폴링 · 단계마다 최대 8~42초 |

`transitCombatPostFlow` 는 각 단계를 「오버레이가 스택에서 사라질 때까지 32ms 간격으로 확인」하는 방식으로 잇는다. 허브는 이미 콜백으로 잇고 있으므로 **같은 결과를 훨씬 싸게 얻는 패턴이 저장소 안에 이미 존재**한다.

→ **이동중도 `onClose` 콜백 체인으로 전환**하면 폴링 11곳·루프 3개가 사라진다. 이것이 요청하신 효율화의 실체다.

### E-2 (P2) — 대기 상한이 3중으로 겹친다

같은 단계에 ① 카드 자동닫힘(40s) ② `awaitOverlayClose` 데드라인(42s) ③ `waitForArcOverlayKindsIdle`(8~20s)가 동시에 걸려 있다. 어느 것이 실제로 먼저 끊는지 코드만 봐서는 불명확하다. 콜백 전환 시 ②③은 대부분 불필요해진다.

---

## 7. 제안 — 「전투 종료 출력」 단일 파이프라인

현재 결과 **카드**는 통합됐으니, 그 **뒤 체인**을 같은 방식으로 한 번 더 통합한다.

```ts
// src/game/combat/runCombatEndOutcomeFlow.ts (신설 제안)
export function runCombatEndOutcomeFlow(input: {
  venue: CombatResultVenue;
  outcome: 'win' | 'lose' | 'flee';   // ← U-4 흡수
  result: PresentCombatResultInput;
  planetId?: string | null;
  onFinished?: () => void;
}): void
```

**고정 순서(전 경로 공통)**
1. 결과 카드 `presentCombatResultOverlay`
2. → `presentPendingCombatLevelUpThen` (**U-1 수렴**)
3. → `tryPresentPendingMissionClearDialog` (**U-2 수렴**)
4. → 격침/파손 알림
5. → `presentArcCoreBackchannel({ reason: 'combat_end' })` (**U-3 수렴** — 차등이면 venue 플래그)

전부 **`onClose` 콜백 체인**으로 연결 → **E-1 해소**.
허브 2경로는 이미 이 모양이라 **호출 교체만**으로 끝나고, 이동중만 폴링을 걷어내면 된다.

---

## 8. 착수 순서 (위험 낮은 순)

| 순위 | 조치 | 위험 |
|---|---|---|
| **1** | **U-3 결정** — 백채널을 모든 전투에 올릴 것인가(의도 차등인가) | 판단만 |
| **2** | `runCombatEndOutcomeFlow` 신설 + **허브 2경로 이관** (이미 같은 모양) | 낮음 |
| **3** | **이동중 이관** — 폴링 11곳·루프 3개 제거, 콜백 체인화 | **중** — 현재 동작 중 |
| 4 | U-1 `presentLevelUpIfPending` 제거 (3에 흡수) | 3과 동시 |
| 5 | U-2 `presentMissionClearWhenReady` 정본 흡수 | 3과 동시 |
| 6 | U-4 `outcome: 'flee'` 추가 | 낮음 |

**검증 요구**: venue 3종 × outcome 3종(win/lose/flee) 조합에서 **① 결과창 ② 레벨업 ③ 미션대사 ④ 백채널이 같은 순서로 나오는가**를 **동작 검증**으로. 현행 계약 테스트는 경로별로 따로 존재해 «순서 일치»를 검사하지 않는다.

---

## 9. 한계

- **정적 분석 + 게이트 실행**이다. 체인 순서 불일치는 코드로 확정했으나, 실제 체감(백채널 누락이 문제인지)은 실기 판단이 필요하다.
- U-3 이 **의도된 차등**일 가능성을 배제하지 못했다 — 웨이브만 서사적 비중이 크다는 설계일 수 있다.
- 3번(이동중 이관)은 **현재 정상 동작하는 경로를 바꾸는 것**이라, 앞서 D-3 에서 지적한 것과 같은 회귀 위험이 있다. 단계 분할 권고.

---

**김클로드는 읽고 게이트만 돌렸다** — 코드 변경 0 · 커밋 0.
