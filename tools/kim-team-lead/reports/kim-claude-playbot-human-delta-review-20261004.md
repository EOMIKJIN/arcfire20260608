# 김클로드 재검수 — 플레이봇 인간델타 학습 최소구현

```text
task_id=playbot-human-delta-review-20261004
reviewer=김클로드
일시=2026-10-04
대상 커밋/변경=김팀장 구현 (humanDelta.ts 신규 · policy.adaptPolicy · refreshHumanSeed.importHumanSeedFromMemProfile · humanSeed.verbToActionKind · run-harness.onDay)
정본 합의=playbot-human-learn-consult-conclusion-20261004.md
verdict=PARTIAL
```

## 판정: PARTIAL

합의 3대 최소범위는 **코드로 재검수한 결과 모두 올바르게 구현**됐다. 다만 미소비 델타가 덮어써져 **학습이 유실되는 실재 경로 1건**이 있어 PARTIAL로 둔다. 나머지는 인지용 메모(합의 위반 아님).

---

## 합의 대조 — PASS 항목 (근거)

- **미소비 human-delta일 때만 학습**: `adaptPolicy`는 매 가상일 호출되지만 내부에서 `readUnconsumedHumanDelta()`가 null이면 `skipped:true`로 조기 반환(policy.ts:278-291). 가중치 bump는 델타 분기(policy.ts:304-314)에서만 발생. 전 repo에서 `savePolicy`/`policy.personas[persona]=`를 쓰는 곳은 `adaptPolicy`와 `resetPolicyForTest`뿐(grep 확인). `recordDailyLearning`은 정책 가중치를 건드리지 않음. → 봇 자기점수로 가상일마다 돌던 과거 동작 제거 확인. **AGREE**
- **KPI(승패·레벨·퀘스트 수) 범프 금지**: `adaptPolicy`에서 `report.kpi`는 밴드 계산(level/10, policy.ts:294)과 런 리셋 판정에만 쓰이고 가중치로 전혀 들어가지 않음. bump는 오직 `delta.newPairs → verbToActionKind → +0.02`(policy.ts:306-314). 과거 점수기반 `windowScore`/`shouldRollbackScore`는 `adaptPolicy`에서 호출되지 않음. **AGREE**
- **델타 학습 때 lastScore 비움(M3)**: 델타 분기에서 `health.lastScore/lastScoreDay/lastScoreLevel`를 null로(policy.ts:296-302). `adaptPolicy`는 더 이상 lastScore를 non-null로 쓰지 않으므로 델타 학습이 열릴 때 과거 고레벨 기준점수는 항상 비워진다. **AGREE**
- **import 직후 델타 사용·1회 소비**: `consumeHumanDelta`로 consumed=true 기록(policy.ts:319 / humanDelta.ts:171-177) → 같은 델타는 다음 날/다른 호출에서 재학습 안 됨. **AGREE**
- **동일 재수입 무시**: `planHumanDelta`가 직전 시드 대비 `beatSig` 동일 세션은 fresh에서 제외, fresh=0이면 null(humanDelta.ts:84-91). `memProfileToTraces` sessionId가 owner 디렉터리명 기준으로 안정적이라 재수입 idempotent. **AGREE**
- **델타 산출이 시드 기록보다 먼저**: `importHumanSeedFromMemProfile`에서 `planHumanDelta(outDir, traces)`를 `writeHumanSeed`보다 먼저 호출(refreshHumanSeed.ts:187-189). 시드를 먼저 쓰면 델타가 항상 비게 되는데, 순서가 올바름. **AGREE**
- **사람 세션만 델타**: `planHumanDelta`가 prev/fresh 양쪽 모두 `isBlendableSessionKind`(qa·profiler 제외)만 집계(humanDelta.ts:79,86). **AGREE**
- **범위 밖 미착수**: 기능 추가 루프·전투 효율 카드 없음. `delta.missingVerbs`/`combatMethod`는 이름만 남기고 기능화 안 함(humanDelta.ts:22-24, policy.ts:316). 앱/CSV/세이브 미접촉(run-harness 전부 Node 전용). **AGREE**

---

## 지적 1 (버그 · PARTIAL 근거) — 미소비 델타 덮어쓰기로 학습 유실

**위치**: `refreshHumanSeed.ts:189` `if (delta) writeHumanDelta(outDir, delta);` + `humanDelta.ts:144-149` `writeHumanDelta`(기존 파일 무조건 atomicWrite 덮어쓰기).

**시나리오**: 하니스가 꺼진 상태에서 서로 다른 owner 세션 2건이 순차 import되면 —
1. import A: 시드 S0 대비 델타A(세션 A의 newPairs) 기록, 미소비.
2. import B: 시드는 이미 A를 머지한 S1. `planHumanDelta(S1, B)`는 B의 newPairs만 산출. `writeHumanDelta`가 **델타A를 통째로 덮어씀**.
3. 하니스 기동 → `adaptPolicy`는 델타B만 소비. **세션 A의 신규 동사쌍은 시드 baseline에 이미 들어가 버려 어떤 델타에도 다시 나타나지 않고, 가중치 bump를 영영 못 받는다.**

합의 「원시가 새로 쌓일 때만 분석 후 학습 1회」에서 "쌓인 원시 1배치"가 소비 전에 유실되는 구멍. collision 창은 좁지만(18:00/수동 import vs 하니스 가상일), 하니스가 꺼진 동안 2세션이 들어오면 재현된다.

**고칠 문장**: `writeHumanDelta` 호출 전에 기존 미소비 델타를 읽어 병합한다. 예) `importHumanSeedFromMemProfile`에서
```ts
if (delta) {
  const prev = readUnconsumedHumanDelta(outDir);
  writeHumanDelta(outDir, prev ? mergeHumanDelta(prev, delta) : delta);
}
```
`mergeHumanDelta`는 `newPairs`(상한 PAIR_CAP 유지)·`coveredKinds`·`missingVerbs`를 합집합, `combatMethod`는 `present` 우선, `sessionId`/`capturedAt`는 더 최근 것으로. 이렇게 하면 미소비 상태에서 들어온 복수 배치가 한 델타로 누적돼 1회 학습에 모두 반영된다.

---

## 지적 2 (인지 메모 · 합의 위반 아님) — 델타 없이도 savePolicy 하는 경로

**위치**: `policy.ts:264-288`. 가중치가 `isCollapsedWeights`로 붕괴 판정되면 델타가 없어도 기준가중으로 복구하고 `savePolicy`·`generation++`.

**판단**: KPI/봇점수를 전혀 쓰지 않는 **붕괴 복구(안전장치)**라 「KPI 범프 금지」·「델타일 때만 학습」의 취지를 깨지 않는다. 오히려 델타가 영영 안 올 때 붕괴 상태 고착을 막는다. 다만 "델타일 때만 adaptPolicy 실행"이라는 합의 문구와 표면상 어긋나므로, 김팀장이 의도된 예외임을 handoff에 명시해 두길 권함. (제거 권고 아님.)

## 지적 3 (정리 메모 · 무해) — 점수기반 잔존 코드

`learnGate.ts`의 `windowScore`/`shouldRollbackScore`/`isSaturatedGrowth`와 `PolicyHealth.rollbackPersonas`(policy.ts:300에서 delete만, 기록은 없음)는 이번 개편으로 `adaptPolicy` 경로에서 호출이 끊겼다. 동작에 해는 없으나 오해 소지가 있어 향후 별도 정리 대상(이번 최소범위에서 삭제는 불필요). 가비지 기준상 "현재 도달 가능 여부"를 grep로 확정한 뒤 제거할 것.

---

## self-check
- 타입/빌드 영향 변경 없음(검수만, 코드 미수정).
- src/·app/·tables/·kim-claude-handoff-pending.md 미접촉. 본 리포트 1건만 작성.
- 근거는 전부 파일:줄 인용 + grep 재확인(가중치 변경 경로 단일성).

**결론: PARTIAL.** 합의 3대 최소범위는 올바름. 지적 1(델타 덮어쓰기 유실)만 수정하면 AGREE 수준. 착수는 대표님 지시 후.
