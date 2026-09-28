# 현재 열린 문제 정리 — 김클로드 → 김팀장

```text
status=REVIEWED
task_id=open-issues-brief-20260928
kind=BRIEF (김클로드 코드 변경 0 · 커밋 0)
date=2026-09-28
대표님 지시=「지금 문제가 있는 부분이 무엇인지 다시 정리해서 김팀장에게 보고」
김팀장=AGREE (A·B) · PARTIAL (A-1 트리거 단독 조건) · 훅 수정 적용 2026-09-28
```

## 김팀장 검수 (2026-09-28)

| 항목 | 판정 | 조치 |
|---|---|---|
| A-1 프롬프트마다 incident P0 | **AGREE** · 트리거는 handoff **없을 때**만 단독 충분(보고 문구 PARTIAL) | `incidentHandoffGate` — handoff·trigger mtime 둘 다 ack 비교 |
| A-2 sessionStart ack 없음 | **AGREE** | 동일 게이트 적용 |
| A-3 표 정규식만 · 옛 REVIEWED | **AGREE** | `kimClaudeHandoffCore` 최소 오프셋(표+코드블록) |
| A-4 `main();` 뒤 `신` | **AGREE** | 제거 · `무동작ㅎ` → `무동작` |
| B-1 views 1순위 철회 | **AGREE** | 유지 |
| B-2 허브 단독 285 오판 | **AGREE** | 재판정 §3을 **380–399**로 정정 |
| B-3 계단 현재진행 | **AGREE** | 런타임 패치 없음 |
| C 09-23 GL_HARD_CEILING | **AGREE (프로세스 닫음)** | handoff 아카이브 후 ack. 원인 축은 B(native floor) |

09-23 알림을 잊은 것이 아니다. 자동 P0 주입만 닫고, PSS 계단은 기존 재판정대로 둔다.

전제: `kim-team-lead-pss-staircase-rejudge-20260926.md` 판정과 09-27 도구 적용분을 **모두 읽고 반영**했다. 중복 보고는 뺐다.

---

## 0. 한 줄 요약

**시급도 1위는 메모리가 아니라 «훅 자동화»다.** 09-23 알림 하나가 5일째 안 닫혀서, 대표님이 무엇을 입력하든 김팀장에게 «즉시 코드 수정» P0가 자동 주입되고 있다. 반대로 **김클로드 handoff 자동검수 훅 2개는 정규식 불일치로 한 번도 발동한 적이 없다.**

---

## A. 훅/자동화 — 신규 발견 (P0)

### A-1. incident auto-fix가 모든 프롬프트에 P0 주입 (09-23~ 5일째)

`.cursor/hooks/on-before-submit-prompt-incident-auto-fix.cjs` 가 `beforeSubmitPrompt` 에 등록되어 **프롬프트 제출마다** 실행된다. 주입문은 「**사용자 별도 지시 없이 즉시 수행** — logcat 원인 특정 → 코드 최소 diff 수정 → tsc」.

발동 조건이 **독립 충분조건 2개**나 살아 있다:

| 파일 | 시각 | 상태 |
|---|---|---|
| `tools/long-run-monitor/outbox/cursor-incident-handoff.md` | 09-23 19:23:21 | 존재 |
| `tools/long-run-monitor/outbox/incident-handoff-acked-at.txt` | **2026-08-13T10:19:32Z** | ⚠️ handoff보다 **41일 과거** |
| `.cursor/trigger-incident-auto-fix.json` | 09-23 19:23:22 | 존재 (단독으로도 충분) |

`isAckedAfter()`([:21](.cursor/hooks/on-before-submit-prompt-incident-auto-fix.cjs#L21))는 ack ≥ handoff mtime 이어야 잠잠해진다. 지금은 영구 미확인이며 `ack-incident-handoff.cjs` 를 아무도 실행하지 않았다.

> **대표님이 김팀장에게 작업을 지시한 것이 아니다.** 트리거는 키 입력, 작업지시 내용은 훅 생성분이다.

### A-2. sessionStart triage 는 ack 검사가 아예 없다

`on-session-start-incident-triage.cjs:37` — `fs.existsSync(HANDOFF)` 만 본다. ack 여부 무관. **Cursor 창을 열기만 해도** 동일 P0가 주입된다(키 입력조차 불필요).

→ A-1만 닫아도 이쪽이 남는다. **두 경로를 같이 닫아야 한다.**

### A-3. 🔴 김클로드 handoff 자동검수 훅 2개가 «무효»

`kimClaudeHandoffCore.cjs:27` 의 status 정규식이 **표 형식만** 인식한다.

```js
text.match(/\|\s*\*\*status\*\*\s*\|\s*\*\*`([^`]+)`/)
```

실제 실행 결과:

```text
readTopHandoffStatus = {"status":"REVIEWED","taskId":"transit-combat-skia-backdrop-fix-20260916"}
readPendingHandoff   = null
```

- 훅이 집는 값 = **09-16자 옛 표 항목**. 진짜 최상단은 **`PENDING`**(코드블록 `status=PENDING`).
- handoff 파일에 표 형식 **27건** / 코드블록 형식 **145건** 혼재. 훅은 «파일 내 첫 표 매치»를 집으므로 위치와 무관하게 옛 항목을 읽는다.
- 근거: `.kim-claude-auto-review-followup.json` 이 **존재하지 않는다** → `saveState`가 followup 직전에 돌므로, **한 번도 발동한 적 없음**이 확정.

**영향**: `on-stop-kim-claude-handoff-auto-review.cjs` · `on-before-submit-prompt-kim-claude-handoff-review.cjs` **둘 다 죽어 있다.** 대표님 2026-07-26 지시(「김클로드 작업 끝나면 자동 검수」)가 **미작동 상태**다.

**수정 방향**: `readTopHandoffStatus` 가 두 형식을 모두 인식하고 **파일 최상단에 가까운 쪽**을 택하게 한다(코드블록 `^status=` + 표 형식 중 오프셋이 작은 것). ARCHIVE 오탐 방지 목적은 «첫 매치»가 아니라 «최소 오프셋»으로 달성된다.

### A-4. 훅 파일 오타 문자

`on-stop-kim-claude-handoff-auto-review.cjs`
- **line 90** `main();` 뒤에 ` 신` — 정의되지 않은 식별자 → `main()` 실행 후 **ReferenceError 종료**(exit≠0). stdout은 이미 나간 뒤라 기능은 살지만 훅이 매번 실패로 끝난다.
- line 7 주석 `무동작ㅎ` — 무해하나 같은 오타 흔적.

---

## B. PSS 계단 — 김팀장 판정 수용 + 김클로드 주장 1건 철회

### B-1. ✅ 「views +264 = 트리 잔류가 1순위」 — **철회한다**

김팀장 DISAGREE가 맞다. 그 후 나온 근거 2개가 모두 김팀장 쪽이다.

**근거 ①** 신설 `audit:memory:session-floor` 의 최근 STAIRCASE 5건 — **전부 `views_stable=N`, `late_views` 300~391 = 450 미달**:

| start | pid | span | retain | last_floor | late_views |
|---|---|---|---|---|---|
| 09-21 13:55 | 9234 | 102.0 | 0.90 | 801.8 | 354 |
| 09-21 18:40 | 23320 | **442.4** | 1.00 | **981.4** | 375 |
| 09-23 01:07 | 3817 | 227.1 | 0.87 | 849.3 | 300 |
| 09-23 23:41 | 13923 | 249.9 | 1.00 | 914.6 | 344 |
| 09-26 11:21 | 14287 | 252.8 | 1.00 | 883.6 | 391 |

**views가 정상대(300~391)인데 PSS floor가 801~981MB로 정착한다.** 트리 잔류로 설명되지 않는다.

**근거 ②** 실기 측정(09-27, pid 27152, 허브 idle 8.5분 · 70초 간격):

```
시각      pss     native   views
01:35:32  700.0   357.7    380
01:39:10  712.7   351.1    380
01:41:42  711.8   370.3    381
01:42:55  736.8   362.1    404  ← 스파이크
01:44:07  733.7   360.5    380  ← 복귀
```

**views 평탄(380) · PSS만 상승** — 김팀장이 지목한 본축(`views 평탄 + native floor 상승`)이 실기에서 그대로 관측됐다. 해당 세션은 감사에서도 `SAWTOOTH retain 0.22` 로 분류되어 내 관측과 일치한다.

### B-2. ⚠️ 김팀장 P0 절차의 기대값 정정 필요

재판정 §수정방향 3번이 **「허브 단독 views ~285 → 시설 push ~575 → back 후 285 복귀」** 로 적혀 있다.
**실기 허브 단독 views 는 380~399 였다** (시설 push 없음, Activities=1, ViewRootImpl=1).

→ 285를 복귀 기준으로 쓰면 **정상을 실패로 오판**한다. 실측 baseline을 먼저 고정한 뒤 판정할 것을 요청한다.

### B-3. 계단은 현재진행 (완료 선언 불가)

`audit:memory:session-floor` → `verdict=FAIL long=192 stair=116 recent_stair=5` · `median_stair_span_mb=230.1`.
최근 7일 내 5건이므로 «과거 데이터»로 치울 수 없다.

### B-4. 실기 현재 상태 (참고값)

허브 idle, pid 27152 기동 33분 시점: **PSS 722MB · native 356MB · GL 37MB · EGL 41MB · Views 399 · threads 108**.
- GL 은 정상(전투 시 120~140MB 대비 낮음) → **GL 축 아님** 재확인.
- Views 399 는 프로젝트 idle 기준(≤380) 상시 소폭 초과 · FAIL(≥450) 미달.
- **허브는 완전 idle 이 아니다** — `hub_inbound_drone_end` / `hub_inbound_vfx_cleared` 사이클이 자율 반복, 33분간 `hubSkiaNativeReclaim epoch=56`. 회수는 매번 동작 확인.

---

## C. 09-23 원 알림이 미해결 (A-1의 근원)

```
alertLine: [2026-09-23 19:19:34] GL_HARD_CEILING gl=52.4 pss=979.3 views=454
reason: mem_anomaly
```

이 한 건이 안 닫혀서 A-1·A-2가 5일째 발동 중이다. **ack 만 찍고 넘기면 원인은 그대로 남는다** — B-3의 recent_staircase 와 같은 현상일 가능성이 높으니, ack 은 B 계열 판정과 묶어 처리할 것을 권한다.

---

## D. 김클로드 완료분 (참고 · 조치 불필요)

- PowerShell 한글 깨짐 **54파일 BOM** 수정 → **09-28 스케줄러 실행 로그에서 실증**: `VERIFY OK — 커밋·푸시 완료 확인.` 정상 출력.
- `analyze-playtest-session.ps1:82` `$k:` → `${k}` 파서 오류 수정 → 스크립트 실행 복구(exit 0). BOM 추가 전에도 있던 **선재 결함**이었다.
- 위 2건 모두 HEAD 에 반영 확인(미커밋 `.ps1` 0건). 데일리 커밋 09-27·09-28 연속 성공, 원격 동기 확인.

---

## 착수 순서 제안

| 순위 | 조치 | 비고 |
|---|---|---|
| **1** | **A-3 정규식 수정** | 자동검수가 죽은 채로는 이 게이트 자체가 무의미. 런타임 무관·저위험 |
| **2** | **A-1 + A-2 동시 차단** | `ack-incident-handoff.cjs` 실행 + `trigger-incident-auto-fix.json` 제거 + A-2 에 ack 검사 추가. **한쪽만 닫으면 안 됨** |
| 3 | A-4 오타 문자 제거 | 1분 |
| 4 | B-2 baseline 실측 고정 후 B 계열 P0 진행 | 285 가정 폐기 |
| 5 | C ack — B 판정과 묶어서 | 단독 ack 금지 |

**김클로드는 A·C 를 임의 실행하지 않았다** — handoff 삭제·ack 는 되돌리기 어렵고 대표님/김팀장 판단 사항이다.

---

**김클로드 코드 변경 0 · 커밋 0.**
