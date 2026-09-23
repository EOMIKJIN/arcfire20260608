# 행성개발 완료 실시간성 — 전수 조사 + 미커밋 WIP 재검수 (2026-09-22)

```text
status=PENDING
task_id=planet-dev-realtime-completion-audit-20260922
kind=AUDIT (코드 변경 0 — 조사만. 대상 코드는 이미 워킹트리에 미커밋 상태로 존재)
대표님 보고 원문=방어위성 1레벨 개발완료가 착륙 순간에만 뜨는 것으로 보임 · 개척선 출현/궤도이동도 동일 증상
```

## 0. 결론 (AGREE)

**대표님 진단 AGREE.** 이 문제는 `tables/`·밸런스가 아니라 완료 판정을 **누가 언제 호출하느냐**의 문제였다. 커밋된 HEAD 기준으로는 "행성개발 job 완료"를 확인하는 코드가 다음 세 지점에서만 호출됐다:

1. 착륙 시 (`syncPlanetHubDevelopmentOnLanding.ts:24`)
2. 행성개발 목록 UI를 열 때 (`PlanetDevelopmentListContent.tsx:59`)
3. ArcCore RED 소유 행성의 60초 틱 (`runArcCorePlanetDevWallTick.ts` — 단, 이는 **ArcCore 점유 행성만** 대상이고 플레이어 소유 행성은 대상이 아님)

**플레이어가 설치한 방어위성처럼 완료를 벽시계로 기다리는 항목은, 그 행성에 착륙하거나 개발 목록 화면을 열기 전까지는 시스템 어디에서도 완료 판정이 실행되지 않는다.** `completeAtMs`가 지나도 `upgradeJob`은 그대로 저장돼 있고, `installed`/`level`도 그대로다 — 실제로 "설치가 안 끝난 상태"로 남아있다가, 착륙(또는 목록 열람)이라는 UI 이벤트가 처음으로 판정 함수를 불러야 그 순간 완료 처리·알림·개척선 발진이 한꺼번에 일어난다. 대표님이 보신 "착륙 순간 완료되는 것 같다"는 관찰은 **UI 착시가 아니라 실제 게임 상태가 그렇게 동작하고 있었다는 뜻**이다.

## 1. 중요 — 이 문제의 수정판이 이미 워킹트리에 미커밋 상태로 존재함

`git status`로 확인: 아래 파일들이 **커밋되지 않은 채** 이미 이 문제를 정면으로 다루는 변경을 담고 있다.

| 파일 | 상태 | 내용 |
|---|---|---|
| `src/game/planetDevelopment/planetDevJobRealtimeWatch.ts` | `??` 신규 | 전역 타이머 1개 + 활성 행성 Set. job이 있는 한 벽시계로 완료를 감지해 `tryCompleteAllPlanetDevJobs` 호출 |
| `src/store/planetCoreRuntimeStore.ts` | `MM` | 부트 hydrate·레거시 마이그레이션 후·계정 초기화 후 `rebuildPlanetDevJobWatch()` 호출 추가 |
| `app/_layout.tsx` | `MM` | 앱 포그라운드 복귀(AppState active) 시 `tickPlanetDevJobsRealtime()` 즉시 호출 추가 |
| `src/game/planetDevelopment/planetDefenseSatelliteRuntime.ts` | `MM` | `writeDefenseSatelliteDetailToPlanet` 쓰기마다 `notePlanetDevJobMaybe` 호출 — 워치 등록 |
| `src/game/planetDevelopment/planetFacilityModuleRuntime.ts` | `M` | 범용 모듈 쓰기(`writeFacilityModuleDetail`) — 위와 동일하게 워치 등록. 무역소·연구소·바 시설·조선소가 모두 이 경로 |
| `src/game/planetDevelopment/planetCoreStatRdRuntime.ts` | `M` | 코어 스탯 R&D job도 동일 워치에 등록 |
| `src/store/playerStore.ts` | 관련 diff 있음 | 조선소 광물 강화 job 시작 시에도 `schedulePlanetDevJobWatch()` 호출 |

**동작 방식**: job을 쓸 때마다 `notePlanetDevJobMaybe(planetId)` → 전역에서 가장 이른 `completeAtMs`까지 `setTimeout` 1개 예약 → 시간이 되면 `tickPlanetDevJobsRealtime()`이 해당 행성들의 `tryCompleteAllPlanetDevJobs`를 실행해 완료·알림·(방어위성 Lv1이면) 개척선 발진까지 처리한다. 앱이 백그라운드였다면 포그라운드 복귀 시 같은 함수를 즉시 재호출해 따라잡는다. 부팅 시에도 이미 기한이 지난 job이 있으면 지연 0으로 즉시 실행된다.

**즉, 대표님이 요구하신 "성계착륙트리거와 상관없이 실시간 진행·완료·팝업"은 이미 코드로 구현되어 있다.** 다만 미커밋 상태이며, 김팀장 검수·커밋 전이므로 실기 빌드에는 반영되지 않았을 수 있다(대표님이 보신 증상이 이 WIP 반영 전 빌드였을 가능성 큼).

## 2. WIP 재검수 — 발견한 결함/공백

이 WIP을 그대로 신뢰하지 않고 코드로 재확인했다.

**A. [P2] 쓰기 실패가 조용히 삼켜짐 → 팬텀 완료 알림 가능성**
`writeFacilityModuleDetail`(`planetFacilityModuleRuntime.ts:44-46`)은 `usePlanetCoreRuntimeStore`에 해당 행성 런타임 엔트리가 있으면 `true`를 반환하지만, 내부에서 호출하는 `store.patchPlanetCore()`(`planetCoreRuntimeStore.ts:669-670`)는 `useWorldStore.systems`에서 그 행성을 못 찾으면 **아무 것도 쓰지 않고 조용히 return**한다. `writeFacilityModuleDetail`은 이 실패를 확인하지 않고 그대로 `true`를 반환한다.
- 파급: `tryCompleteUpgrade` 계열 함수들은 반환값을 확인하지 않고 `finalizePlanetFacilityLevelApplied`(알림 표시 + 방어위성 개척 발진)를 무조건 실행한다. 만약 실제 저장이 실패하면(`upgradeJob`이 지워지지 않음) **완료 알림은 뜨는데 상태는 안 바뀌는 팬텀 완료**가 생기고, 다음 tick에서 같은 job이 다시 "완료"로 잡혀 **알림이 중복**될 수 있다.
- 발동 조건: `useWorldStore.systems`에 해당 행성이 없는 경우(아직 로드 전 레이스, 동기화 후 id 불일치 등) — 일반적인 플레이어 착륙 흐름에서는 거의 발생하지 않지만, 이번 수정으로 완료 판정이 "행성에서 멀리 떨어진 채, 부팅 직후" 실행될 수 있게 됐으므로 예전보다 이 레이스가 발생할 여유가 늘었다.
- 재현: 코드 경로 확인만 했고 실기 재현은 안 함(트리거 조건이 좁음).
- 제안: `patchPlanetCore`가 실패 여부를 반환하도록 고치고, `writeFacilityModuleDetail`·`writeDefenseSatelliteDetailToPlanet`이 그 값을 보고 `false`를 돌려주거나 재시도하게 한다.

**B. [정보] 개척선 발진(`tryEnqueueStelliumColonizeFromLanding`)이 이제 "착륙"과 무관하게 실행됨**
`finalizePlanetFacilityLevelApplied`(`planetFacilityLevelApplied.ts:31-48`)은 방어위성 Lv1 완료 시 이 함수를 이름 그대로("FromLanding") 무조건 호출한다. 내부를 확인한 결과 이 함수는 UI/씬 의존이 없는 순수 데이터 큐잉(`tryEnqueueStelliumColonize`)이라 **백그라운드 틱에서 불러도 안전**하다. 다만 부수효과로 `markVisited(systemId)`가 함께 실행되므로, 이제는 "플레이어가 실제로 그 성계를 방문/착륙하지 않았는데도" 방어위성 완료 시점에 그 성계가 방문 처리된다. 함수 이름과 실제 호출 맥락이 어긋나 있다는 점만 참고용으로 남긴다 — 동작 자체가 버그는 아니라고 판단(대표님이 원하신 "실시간 완료"의 자연스러운 결과).

**C. [P3] 워치 상한 128행성**
`MAX_WATCHED_PLANETS = 128`. 계정 하나가 동시에 128개 초과의 행성에서 개발 job을 돌리는 상황은 현재 규모에서 비현실적이라 실질 위험은 낮음. 향후 확장 항목으로만 기록.

**D. 재현 검증 미실시**
이번 조사는 정적 코드 추적으로 결론을 냈고, RN 런타임(에뮬레이터/실기)에서 "설치 → 앱을 켜둔 채 방치 → 착륙 없이 알림 발생"을 직접 재현하지는 못했다(도구 제약 — Metro/RN 런타임을 이 세션에서 구동할 수 없음). **김팀장 쪽에서 실기 확인 요청.**

## 3. 유사 시스템 점검 — 이미 같은 패턴으로 고쳐진 것 / 안 고쳐진 것

**이미 동일 패턴(전역 setTimeout 워치 + 포그라운드 복귀 캐치업)으로 미커밋 수정된 것:**
- 의뢰 제한시간 만료 — `src/missions/missionExpireRealtimeWatch.ts` (신규, `app/_layout.tsx`에 배선됨)
- 바 후원 만료 — `src/game/bar/patronage/barPatronageExpireRealtimeWatch.ts` (신규, 동일 배선)
- 조선소 광물 강화(mineral upgrade) — `playerStore.ts`에서 `planetDevJobRealtimeWatch`에 합류(별도 파일 아님, 같은 워치 공유)

→ 이번 건은 단발 패치가 아니라 "완료가 벽시계 기준인데 UI 트리거에만 의존하던" 여러 시스템을 한 번에 손대는 작업의 일부로 보인다. 검수 범위를 방어위성 하나로 좁히지 말고 위 3개를 묶어서 볼 것을 권한다.

**이미 실시간인 것(문제 없음, 참고):**
- 스텔리움 개척(outpost) 도착·핸드오프 — `src/arcCore/colonize/tickStelliumColonizeRealtime.ts`는 별도의 자체 setTimeout 워치(`scheduleStelliumColonizeOutpostWatch` 등)를 이미 갖고 있음. 오늘 조사 이전부터 존재.

**같은 클래스로 보이지만 다른 문제라 이번 범위에서 제외한 것:**
- 잔해/소행성 `cooldownUntilMs`(월드오브젝트 리스폰) — 완료 "알림"이 필요한 항목이 아니라, 화면에 그릴 때 조회 시점에 평가되는 상태값이라 지연 완료·알림 누락과는 성격이 다름. 문제 없음으로 판단.

**미확인(이번 세션에서 못 본 범위)**: 클랜전 점령/공성 타이머, NPC 함장 관련 지연 이벤트, 드론 귀환 등 `completeAtMs` 계열 문자열을 쓰지 않는 다른 이름의 지연 완료가 더 있을 수 있음. 이번 grep은 `completeAtMs`류 명명 규칙에 의존했다 — 전 repo 전수 스캔은 CLAUDE.md 지침상 하지 않았다.

## 4. 김팀장(Cursor 본창) 확인 요청
1. `planetDevJobRealtimeWatch.ts` 외 위 표의 미커밋 변경 6개 파일이 **의도한 작업물**인지(본 세션 작업인지, 이전 세션 잔여물인지) 확인.
2. §2-A(쓰기 실패 무시) 보완 필요 여부 판단.
3. 실기(에뮬레이터/디바이스)에서 "방어위성 설치 → 앱 켜둔 채 대기(착륙·목록 열람 없이) → 완료 시각 도래 시 알림 발생" 재현 확인.
4. §3의 의뢰 만료·바 후원 만료 WIP도 같은 검수 묶음으로 포함할지.

**김팀장(Cursor 본창) 검수 요청.**
