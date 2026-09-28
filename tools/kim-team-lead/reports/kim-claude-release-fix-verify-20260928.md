# 릴리즈 UI 정지 수정분 — 김클로드 전수 검증

```text
status=PENDING
task_id=release-fix-verify-20260928
kind=VERIFY (김클로드 코드 변경 0 · 커밋 0)
date=2026-09-28
대상=kim-claude-release-build-ui-flow-audit-20260928.md R-1~R-7 에 대한 김팀장 수정
verdict=R-1·R-2·R-5·R-6 «완료» · R-4 «호출측만 완료» · R-3 «미완(감사가 자동 실행되지 않음)»
```

주장을 받아쓰지 않고 **전부 실행 기반으로 검증**했다(감사 실행 · 테스트 실행 · 줄 단위 재집계).

---

## 0. 한 줄

**핵심 수정은 모두 실제로 동작한다.** 다만 **R-3(재발 방지)이 미완**이다 — 감사를 만들었으나 **아무도 자동으로 실행하지 않는다.** 이러면 "세 번 당하고도 차단 장치가 없다"는 원래 문제가 그대로 남는다.

---

## 1. 항목별 판정

| 항목 | 판정 | 검증 방법 |
|---|---|---|
| **R-1** 바 대화창 | ✅ **완료** | `bar.tsx` bare IM **0건**, `runStageUiAfterIdle` 1건 |
| **R-2** UI 차단 7곳 | ✅ **5곳 수정 + 2곳 allowlist** | 6개 파일 **잔여 bare IM 0** |
| **R-3** 재발 방지 감사 | ⚠️ **미완** | 감사는 PASS 하나 **어디서도 호출되지 않음** → §2 |
| **R-4** 큐잉/true 계약 | ✅ **호출측 완료** · 코어는 주석만 | §3 |
| **R-5** flush 1건만 shift | ✅ **완료** | 루프 + 재진입 가드 |
| **R-6** 후처리 상한 | ✅ **완료** | 상수 대폭 축소 + `BLANK_ABORT` 신설 |
| **R-7** dev/release UI 차이 | — | 문서 과제, 미확인 |

**게이트**: `audit:no-bare-interaction-manager` **PASS** · 신설/변경 테스트 **4/4 PASS**
(`transitCombatPostFlow` · `hubCombatEndPresentContract` · `uiForegroundSequence` · `governorQuestDestination`)

### R-2 줄 단위 재집계

저장소 bare IM **21건 → 13건**. 수정 대상 파일 잔여 **0**:

| 파일 | 잔여 bare | 가드 |
|---|---|---|
| `app/(game)/bar.tsx` | 0 | 1 |
| `presentArcCoreDailyOpsSummaryAlert.ts` | 0 | 1 |
| `GameSaveRestorePendingConsumer.tsx` | 0 | 1 |
| `useStageAssetPrewarm.ts` | 0 | 1 |
| `arcCoreChatWorldProposalExecute.ts` | 0 | 1 |
| `localAccountReset.ts` | 0 | 2 |
| `presentPendingMissionClearDialog.ts` | 0 | — (isActive 확인 방식) |

### R-6 상한 축소 (실측)

| 상수 | 이전 | 현재 |
|---|---|---|
| adhoc 대화 재시도 | 12,000 | **5,000** |
| 미션클리어 대기 | 20,000 | **8,000** |
| 대화 idle 대기 | 20,000 | **8,000** |
| **블랭크 중단** | 없음 | **10,000 신설** |

---

## 2. 🔴 남은 지적 1 (P0) — 감사가 자동 실행되지 않는다

`audit:no-bare-interaction-manager` 는 **어디에도 물려 있지 않다.**

```text
audit:memory:all = audit:memory && audit:skia-memory && audit:worklet-contract
                   && audit:native-reclaim && audit:resident-set && audit:hot-path
                   ← no-bare 없음
audit:daily      = run-daily-audit.cjs        ← 내부 grep 결과 no-bare 호출 없음
audit:dev-process-gate                         ← 호출 없음
.cursor/rules/*.mdc                            ← 등록 없음
package.json 내 다른 스크립트                   ← 자기 자신 외 참조 0
```

**R-3의 목적은 「사람이 기억하지 않아도 막히게 하는 것」이었다.** 지금은 누군가 그 명령을 **직접 타이핑해야만** 돈다 — 이전과 같은 상태다.

**요청**: `audit:memory:all` 체인 또는 `audit:dev-process-gate` 에 추가. 최소한 `.cursor/rules/arcfire-memory-leak-audit-first.mdc` §2 완료 게이트 표에 명기.

---

## 3. 🟠 남은 지적 2 (P1) — allowlist 가 «파일 단위»다

`run-no-bare-interaction-manager.cjs:65` — `if (ALLOWLIST.has(r)) return [];` 로 **파일 전체를 건너뛴다.**

```js
const ALLOWLIST = new Set([
  'app/_layout.tsx',
  'src/store/planetCoreRuntimeStore.ts',
  ...
]);
```

**문제**: `app/_layout.tsx`·`planetCoreRuntimeStore.ts` 는 **크고 자주 고치는 파일**이다. 앞으로 그 파일에 **UI를 막는 bare IM 을 새로 추가해도 감사는 조용히 통과**한다. 정확히 이번에 터진 사고의 재발 경로다.

**권고**: 파일+줄 고정, 또는 파일별 **허용 건수 pin**(초과 시 FAIL), 또는 코드에 `// audit-allow: background-idle` 마커 요구.

### 3-1. allowlist 1건은 근거를 다시 봐야 한다

`src/store/planetCoreRuntimeStore.ts:557`

```js
InteractionManager.runAfterInteractions(() => {
  const { rebuildPlanetDevJobWatch } = require('.../planetDevJobRealtimeWatch');
  rebuildPlanetDevJobWatch();
});
```

allowlist 사유는 「PSS·타이틀 히치·재탈환 조기 실행」인데, 이건 **행성 개발 잡 실시간 워치 재구축** — 배경 최적화가 아니라 **게임 진행 기능**이다. 안 돌면 행성 개발 잡 갱신이 멈출 수 있다.
`:119`(legacy 마이그레이션)도 같은 성격이다.

**요청**: 두 줄에 대해 「배경이라 데드라인 불필요」인지 **명시적으로 판단**해 주기 바란다. 배경이 맞다면 그 근거를 주석에 남겨야 다음 사람이 다시 묻지 않는다.

---

## 4. 🟡 남은 지적 3 (P2) — 상한 상수 하나가 빠졌다

`transitCombatPostFlow.ts:136` — `waitForArcOverlayKindsIdle(kinds, maxMs = 20000)` 가 **하드코딩 20,000** 그대로다. 형제 대기 함수들은 전부 명명 상수(8,000)로 내렸는데 이것만 남았다. 의도적이면 상수화만이라도 권고.

---

## 5. ✅ 김팀장이 내 보고를 넘어선 부분 — 그리고 내 오류 정정

**내 보고 §8의 「전투 결과 표시 경로는 `runTransitCombatPostFlow` 단일 경로다」는 틀렸다.**

`app/(game)/planet.tsx:1264-1324` 에 **허브 웨이브 전투 종료** 경로가 별도로 있다. 김팀장이 이를 찾아내 같은 결함 클래스로 고쳤고, 계약 테스트까지 신설했다(`hubCombatEndPresentContract.test.ts`):

```js
test('wave end still shows result if operator dialog did not open', () => {
  assert.match(planetSrc, /runAfterIngameDialogIdle\(presentWaveEndResult\)/);
  assert.match(planetSrc, /presentWaveEndResult\(\)/);
});
```

→ **오퍼레이터 대사가 안 열려도 전투 결과는 반드시 표시**되게 폴백을 넣었다. 대표님이 보고한 「전투 결과가 안 나옴」이 **허브 웨이브 전투**였다면 내 보고만으로는 못 고쳤을 것이다. 내가 경로 전수를 덜 한 것이 맞다.

`presentPendingMissionClearDialog.ts` 도 `bypassScreenShell` + `isActive` 확인으로 같이 정리됐다.

---

## 6. 결론 · 요청

| 순위 | 요청 | 근거 |
|---|---|---|
| **1** | `audit:no-bare-interaction-manager` 를 **자동 실행 체인에 배선** | §2 — 안 하면 R-3 미달성 |
| **2** | allowlist 를 **줄 단위/건수 pin** 으로 | §3 — 현재 재발 경로가 열려 있음 |
| **3** | `planetCoreRuntimeStore.ts:119,557` 배경 여부 **명시 판단 + 주석** | §3-1 — 진행성 기능 의심 |
| 4 | `waitForArcOverlayKindsIdle` 20,000 상수화 | §4 |
| 5 | R-7 QA 문서(dev/release UI 차이) | 미착수 |

**실기 확인은 여전히 필요하다.** 위는 전부 정적·게이트 검증이다. 앱 데이터 삭제 → 릴리즈 첫 실행 → 바 공연 중 대화 · 퀘스트 전투 승리까지가 최종 판정이다.

---

**김클로드는 읽고 실행만 했다** — 코드 변경 0 · 커밋 0.
