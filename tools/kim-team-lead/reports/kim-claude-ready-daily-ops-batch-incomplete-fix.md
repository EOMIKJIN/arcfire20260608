# 김클로드 착수 — 일일 배치「시작만·완료 없음」복구 (통합)

> **배정**: 김팀장 · **2026-08-03** · 대표님 「내일 김클로드 수정」  
> **task_id**: `daily-ops-batch-incomplete-fix-20260803`  
> **김클로드**: 구현 → handoff **PENDING** · **git commit 금지** · 김팀장 지시 **재검수(AGREE/PARTIAL/DISAGREE+근거)** 필수  
> **흡수**: 기존 `daily-ops-batch-step-isolation-20260803` (패스 격리 초안) — **격리만으로 완료 선언 금지**  
> **실기 근거(요약)**: `arcfire_arc_core_daily_ops_v1` 에서 dayKey=당일·lastBatchAtMs≈2026-07-17T15:00Z 불일치 · statOpsTrend kstDayKey 고정 2026-07-18.

---

## 0. 범위

### ✅ 한다

| Wave | 내용 |
|------|------|
| **A 게이트** | `shouldRun` 기준을 **완료 dayKey/AtMs** 로 전환 · **시작 dayKey 선기록으로 당일 잠금 제거** (세션/`batchRunning`/cooldown으로 재진입만 제어) · 2026-07-19 타이틀 경합 회귀 금지 |
| **B 격리** | `runArcCoreDailyOpsBatch` 패스별 try/catch · step 로그 (워크트리 초안 검수·보완) · 부분 step 실패여도 batch return + SubCore `markCompleted` 가능 |
| **C trend bulk** | `patchPlanetCoreStatOpsTrendBulk` **O(N) in-place** (현 O(N²) 스프레드 루프 제거) — 757행성 late-OOM/ANR 유력 후보 |
| **C′ bulk 군** | **F12** — 동일 O(N²) 패턴: `patchPlanetCoresBulk` · `patchPlanetMasterBalanceBulk` · `runPlanetPgpDailyPass` (일 배치 경로) — C와 **함께** in-place 수정 |
| **B′ 진입 가드** | **F10** — `bootstrapFromWorldAsync` / `beginPlanetCoreStatOpsTrendSnapshot` 을 **첫 try 안**으로 이동(또는 자체 try/catch). markStarted 이후 preamble throw → day 잠금 |
| **A′ SubCore catch** | **F3** — `probeDailyBatch` batchWork에 `catch` · throw 시 `markCompleted` 금지 + 쿨다운 (현재 try/finally만) |
| **D 검증·복구** | tsc · (가능 시) unit · 배포 후 실기 합격 기준 문서화 · **RKStorage 수동 조작은 승인 시에만** |

### 재검수 코드 맵 (2026-08-03 · 22:00 KST까지 롤링)

정본 상태: `tools/kim-team-lead/reports/(?쒓굅??쨌 22:00 ?댄썑)`  
본 task 소속: **F1 F2 F3 F4 F5 F10 F12** (F5만 PASS여도 완료 선언 금지)

### ❌ 하지 않는다

| 제외 | 이유 |
|------|------|
| level-band CPH·밸런스 CSV | `economy-p0-band-cph-…` 별 task |
| 팩션 vault hydrate / trade.tsx await | `faction-vault-fee-hydrate-race` (CONDITIONAL) |
| 점유 플립 vault 일일 스냅 정책 | 기획 미확정 |
| Firebase Auth/rules 전면 재설계 | 상관 가설 · isolation 배포 후 step 로그로만 2차 |
| 드론 D 하락·시드 vs UI | 별축 (recon 부록) |
| `onBoot`에 전 행성 거대 패스 신규 동기 실행 | 메모리/부트 헌법 |

---

## 1. 원인 요약 (재검수용)

**확정**

1. 실기: `lastBatchDayKey=오늘` + `lastBatchAtMs≈2026-07-17T15:00Z` + trend day 전부 `2026-07-18` + summary null.  
2. 코드: `markStarted`가 dayKey를 선기록 → `shouldRun`이 당일 재시도 차단.  
3. 실기: 8/2 unlock·AABS 성공, 7/22 upkeep 성공 → **배치 중반까지 여러 차례 돌았으나 completed/trend 미달**.

**유력**

4. `patchPlanetCoreStatOpsTrendBulk` 루프마다 `{...next}` → O(N²), N=757 시 late-stage 폭주.

**약함**

5. Firebase Auth 단독 root — learning이 이미 try/catch였고 mid-pass 성공과 상충.

상세 표·명령: recon §1–§3.

---

## 2. 구현 지침 (권장 1안)

### 2.1 Wave A — 상태 스키마

`arcfire_arc_core_daily_ops_v1` 권장 필드:

```ts
type Persisted = {
  // 레거시 호환 유지 가능
  lastBatchDayKey: string | null;      // DEPRECATED for gate — 쓰려면 completed와 동기화 명시
  lastBatchDate?: string | null;
  lastBatchAtMs: number | null;        // 마지막 **완료** 시각만
  lastBatchCompletedDayKey?: string | null; // 게이트 정본 (신규)
  // 선택: lastBatchStartedDayKey / lastBatchStartedAtMs — 관측·쿨다운용, shouldRun 금지에 사용 X (or short cooldown only)
};
```

- **migrate**: 기존 페이로드에서 `lastBatchAtMs` 가 있고 dayKey 와 AtMs 날짜가 **불일치**하면 completedDayKey를 AtMs 기준 KST day로 간주(또는 null + 즉시 재시도). **절대** `lastBatchDayKey` 단독으로 “오늘 완료” 취급하지 말 것.  
- `shouldRunArcCoreDailyBatch`: `completedDayKey === todayKey` → false; 그 외 기존 signup/12:00/catch-up 규칙 유지.

### 2.2 Wave A — SubCore

- `markStarted`: **디스크 dayKey 잠금 제거** 또는 started 전용 필드만.  
- `batchRunning` 유지.  
- batch **return 후** `markCompleted` (step 일부 false 여도 OK).  
- batch **throw** 시: completed **금지**, log, 쿨다운(예: 세션 내 1회 또는 10분)으로 부트 스팸만 방지.  
- 타이틀 `waitForArcCoreDailyBatchIdle` · batch 내부 `yieldJsThread` **삭제 금지**.

### 2.3 Wave B — 격리

- 현재 isolation 패턴 유지.  
- hydrate/begin이 throw 가능하면 최소 가드.  
- `reportDailyOpsStepFailure` 유지.

### 2.4 Wave C — bulk

```ts
// 올바른 형태 (개념)
const next = { ...get().byPlanetId };
for (const planetId of keys) {
  const prev = next[planetId];
  if (!prev) continue;
  next[planetId] = { ...prev, detail: { ...prev.detail, statOpsTrend: updates[planetId] } };
}
set({ byPlanetId: next });
```

루프 안 `next = { ...next, ... }` 금지.

### 2.5 테스트

- 게이트 unit: started-only → same-day shouldRun **true**; completed today → false.  
- (가능) bulk 800 keys 동기 완료.  
- `npx tsc --noEmit -p tsconfig.client.json`.  
- tsc · 배치 return 후 complete 경로 단위 검증 권장.

### 2.6 실기 PASS (김팀장 완료 선언 전)

recon §6 표 그대로.

---

## 3. handoff 필수 기록

```text
status=PENDING
task_id=daily-ops-batch-incomplete-fix-20260803
recheck=AGREE|PARTIAL|DISAGREE — 근거(파일:줄)
waves=A,B,C
code_changes=YES
commit 금지
[pss-pre-dev] 3줄
```

재검수 시 recon과 코드가 다르면 **정정 후 진행** (CLAUDE.md 2026-08-02 조항).

---

## 4. 의존·병행

| 병행 가능 | 순서 |
|-----------|------|
| vault fee trade.tsx await | 본 task **후** 또는 병렬 소파일 |
| economy band CPH | 본 task 완료·실기 배치 살아난 뒤 |

---

**END READY · 2026-08-03**
