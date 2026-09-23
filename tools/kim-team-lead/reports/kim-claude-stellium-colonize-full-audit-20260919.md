# 개척선(Stellium Colonize) 시스템 — 김팀장 구현 전수 정밀조사

```text
status=ANALYSIS_ONLY
task_id=stellium-colonize-full-audit-20260919
kind=CODE_AUDIT
code_changes=NO
commit=FORBIDDEN
target=src/arcCore/colonize/* (오늘 02:36~09:54, 16개 파일)
[pss-pre-dev] hot_path=착륙 1회·허브 재진입·일 배치 — 실시간 루프 없음
[pss-pre-dev] alloc=레코드 in-place 갱신·타이머 dispose 등록됨
[pss-pre-dev] cache=해당 없음
[pss-pre-dev] stage=허브 세션 · Skia 없음
[pss-pre-dev] verdict=PASS(구조) — 아래 2건은 메모리 위험이 아니라 기능 연동 결함
```

> **대표님 지시**: "김팀장이 모두 구현완료 했고 고도화 중이다. 김팀장 작업만 전수 정밀조사 — 리스크·메모리 문제·연동 정상 여부. 코드단위 조사만."

---

## 0. 결론

메모리·PSS 관점에서는 **위험 신호 없음** — 신규 setTimeout은 전부 `registerPlanetSessionResource`로 dispose 등록되고, 일일 배치·계정초기화 연동도 정상 확인됨. 대신 **기능 연동 결함 1건(확정)**과 **경미한 리소스 정리 미비 1건**을 발견했다 — 둘 다 크래시·메모리 폭증은 아니지만 "고도화 중" 표현과 맞게 미완성 지점이다.

---

## 1. 확정 버그 — 「5분 핸드오프 대기」가 실제로는 항상 무시됨

### 설계 의도
`stelliumColonizeDispatch.ts` 자체 주석: *"임무 종료 후 handoffSec(5분) 지나야 다음 대기 성계로 출항"* — 개척선 슬롯(최대 3대)이 임무를 마치면 5분 쉬었다가 다음 대기 목표로 출발해야 한다.

### 실제 동작
`fleetReadyAtMs`(각 함선 슬롯이 "몇 시에 다시 출항 가능한지" 배열)는 `tickStelliumColonizeDay()` 함수 **호출 1회 안에서만** 살아있는 지역 변수다. 이 값을 영속시키는 저장소 필드가 어디에도 없다:

```
grep fleetReadyAtMs → stelliumColonizeEngine.ts · stelliumColonizeDispatch.ts 딱 2곳뿐
stelliumColonizeStore.ts(영속 스토어)에는 없음
runStelliumColonizePass.ts / tickStelliumColonizeRealtime.ts 호출부 어디서도
  tickStelliumColonizeDay({ ... })에 fleetReadyAtMs를 넘기지 않고, 반환값도 저장하지 않음
```

`seedFleetReadyAtMs(readyAtMs, cap, activeCount)`(`stelliumColonizeDispatch.ts:34-44`)는 `readyAtMs`가 없으면 **유휴 슬롯 전부를 "즉시 가능(0)"으로 새로 만든다.** 즉:

1. 함선이 임무 성공 → `pushHandoffReadyAt`로 "5분 뒤에나 가능"한 시각이 계산됨 (엔진 내부에서만)
2. 함수가 끝나고 반환값의 `fleetReadyAtMs`는 **아무도 저장하지 않고 버려짐**
3. 다음 호출(허브 재진입·다음 착륙·다음 일일 배치 등 무엇이든) 때는 `readyAtMs`가 다시 `undefined`로 들어와 **처음부터 "전부 즉시 가능"으로 재계산**

**결과**: 개척선이 임무를 마치자마자(다음 아무 틱에서든) 대기 중인 성계로 즉시 재출항한다 — 기획된 5분 쿨다운이 사실상 없는 것과 같다. 크래시나 메모리 문제는 아니고 순수하게 **밸런스/연출 의도가 반영 안 되는 기능 결함**이다.

### 근거 파일:줄
- `stelliumColonizeDispatch.ts:34-44` (`seedFleetReadyAtMs`)
- `stelliumColonizeEngine.ts:196-201` (`tickStelliumColonizeDay` 내부에서 매번 재시드)
- `tickStelliumColonizeRealtime.ts:41-48`, `runStelliumColonizePass.ts:47-54` (호출부 — `fleetReadyAtMs` 미전달·반환값 미저장)

### 개선 방향 (미적용 — 제안만)
`StelliumColonizeState`(스토어)에 `fleetReadyAtMs: number[]` 필드를 추가하고, 위 두 호출부에서 이 값을 넣어 호출→반환값을 다시 스토어에 저장하도록 왕복시키면 된다. 새 서브코어·새 store 불필요, 기존 `stelliumColonizeStore.ts` 필드 하나 추가로 해결 가능한 저위험 수정.

---

## 2. 경미 — 허브 재진입마다 「전초기지 워치」 타이머가 중복 예약됨

`scheduleStelliumColonizeOutpostWatch(planetId, nowMs)`(`tickStelliumColonizeRealtime.ts:66-102`)는 매번:
```ts
let timer = setTimeout(fire, remain);
registerPlanetSessionResource({ ownerId: 'stellium_colonize_outpost', planetId: id, dispose: ... });
```
동일 `planetId`에 대해 **이미 예약된 타이머가 있어도 확인하지 않고 새 타이머를 또 추가**한다. `syncStelliumColonizeOnHubPresence`가 착륙마다(`planet.tsx:1320-1322`) 호출되므로, 같은 행성에 개척선이 `in_flight`인 동안 허브를 여러 번 드나들면 그때마다 중복 타이머가 쌓인다.

**심각도는 낮다** — `fire()`는 매번 스토어 최신 상태를 다시 읽어 `phase !== 'in_flight'`면 아무 것도 안 하므로 중복 실행 자체는 안전(idempotent)하고, 각 타이머는 세션 종료 시 정상 dispose된다(`registerPlanetSessionResource` 자체는 정상 동작). 다만 **불필요한 타이머·엔트리가 세션 중 계속 누적**되는 건 이 저장소의 "제로 낭비" 관례와는 어긋난다.

### 개선 방향 (미적용 — 제안만)
함수 시작부에 `planetId`별 "이미 예약됨" 플래그(간단한 `Set<string>` 모듈 변수)를 두고 중복 호출 시 조기 반환하면 된다. 신규 상태·store 불필요.

---

## 3. 정상 확인된 연동 (문제 없음)

| 연동 지점 | 확인 결과 |
|---|---|
| 일일 배치 | `runArcCoreDailyOpsBatch.ts:15,187` → `runStelliumColonizePass()` 정상 호출 |
| 착륙 트리거 | `planet.tsx:1318-1322` → `tryEnqueueStelliumColonizeFromLanding` + `syncStelliumColonizeOnHubPresence` 둘 다 정상 호출 |
| 계정 초기화 | `localAccountReset.ts:42,257` → `resetStelliumColonizeForAccountPurge()` 정상 호출 |
| 성공 시 hold 반영 | `applyStelliumColonizeTick.ts:25-29` → `applyPlayerColonizeHold` 정상 호출, 알림(`showArcAlert`)·뉴스(`publishStelliumColonizeSuccessNotice`) 동반 |
| 타이머 dispose | `scheduleStelliumColonizeOutpostWatch` → `registerPlanetSessionResource`로 세션 종료 시 정리(§2의 "중복 생성"과는 별개로, 정리 자체는 됨) |
| 정책 게이트 | `stellium_colonize_policy.csv` `enabled=true` — 정책 자체는 켜져 있음 |
| phase→마크 표시 | `isStelliumColonizeMarkPhase`가 `in_flight`/`outpost`/`fail_wait`만 표시, `queued`는 의도적으로 비표시(주석 확인) — 일관됨 |

---

## 4. 참고 — 이전 「아웃포스트 베이스」 조사와의 관계

이 감사는 이전 대화의 `synth_073_p`(아웃포스트 베이스) 미표시 건과는 **별개**다. 그 건은 진행 중 파악한 사실(`resolvePlanetSystemId`가 신스 행성엔 시드 폴백이 없어 `world.systems` 등록 여부에 전적으로 의존)까지만 확인됐고 최종 확정은 못 한 상태였다. 이번 전수조사에서 그 경로 자체의 새로운 결함은 추가로 발견되지 않았다 — 필요하면 그 건은 실기 재현으로 별도 이어가는 게 맞다.

---

*작성: 김클로드 · 2026-09-19 · 코드 단위 분석만(실기 미접근). commit 없음.*
