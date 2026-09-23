# PSS 1GB 초과 메모리 할당 전수 조사 (분석 전용, 코드 미착수)

```text
status=ANALYSIS_ONLY
task_id=pss-1gb-memory-spike-investigation-20260911
kind=MEMORY_INVESTIGATION
code_changes=NO
author=김클로드
date=2026-09-11
trigger=대표님 — "오늘 김팀장 작업분량 적용으로 PSS가 1GB를 넘고 있다. 최적화 가능한 부분 전수 정밀 조사 후 별도로 김팀장에게 보고."
```

## 정정 (2026-09-12) — §2의 "오늘 80장 이미지 추가" 근거는 틀렸음, 철회

최초 보고에서 "오늘(09-11) 행성 허브 이미지 80장이 새로 추가돼 PSS 스파이크의 최유력 원인"이라고 썼는데, **이건 틀렸다.** 대표님이 "오늘 작업 내용에 없었는데?"라고 지적해 재확인한 결과:

- `assets/images/planet/baked/*.png` 실제 파일 수정일 — **08-22**(3주 전)
- `assets/images/nebula/baked/*.png` 재베이크 — **09-06**(5일 전, 이전 세션 에셋 감사 직후로 추정)
- `src/game/tempAdminArcadiaGlobeBakeFlag.ts` 최종 수정 — **09-10**(어제)

전부 "오늘"이 아니었다. **판단 오류의 원인**: 이 저장소는 마지막 커밋이 08-09이고 그 뒤로 한 달 넘게 아무것도 커밋되지 않아, `git status`의 `A`(added)/`M`(modified) 표시가 "최근 워킹트리 대비 변경"이 아니라 "8/9 커밋 대비 전부 변경"을 의미했다 — 즉 git status만으로는 "오늘 변경"을 절대 판별할 수 없는 상태였는데, 그걸 "오늘"로 잘못 해석했다. §2 전체를 철회하고, 아래는 **실제 파일 시스템 수정시각**(`Get-ChildItem`의 `LastWriteTime`, 09-11 00:00~23:59 KST 범위)으로 다시 조사한 결과다.

---

## 0. 결론 먼저

**대표님 관찰이 실측으로 확인된다.** `tools/long-run-monitor/logs/mem-timeline.csv` 원자료를 직접 읽어 오늘(09-11) 22:15~23:04 사이 **PSS가 세 번 1GB를 넘었다**(1179.5MB·1056.7MB·1133.3MB). 기존 자동 GL 회복 로직이 발동해도 PSS는 거의 안 줄었고, **프로세스가 강제 재시작된 뒤에야** 663MB로 떨어졌다(pid 13717→21475).

원자료를 컬럼 단위로 뜯어보니 **기존 모니터의 "범인 추정"(GL/Skia)이 틀렸다** — 실제로 안 줄어들고 남아있는 건 `native_heap_mb`(485~623MB, 총 PSS의 절반 이상)이지 `gl_mb`가 아니다. "GL_RECOVERED"가 찍혀도 native_heap은 거의 그대로였다.

실제 파일 시스템 수정시각으로 "오늘 09-11 진짜 변경분"을 다시 추린 결과(§2), **오늘 하루에만 5개 이상의 서로 다른 시스템이 동시에 작업됐다** — 전투/웨이브 디펜스(오후), 행성 "체류(dwell)" 신규 시스템(오후 5시대), BM 상점(오후 8시), 선술집 음성 재생(오후 9시), **은하지도 보더/보로노이/안개 렌더링 전면 개편(밤 10~11시)**. 이 중 **은하지도 개편만 시간대가 PSS 스파이크 구간(22:15~23:04)과 정확히 겹친다** — 가장 강한 정황 후보이지만, 코드를 직접 읽어본 결과 memo 처리가 꼼꼼해 정적 검토만으로는 확실한 버그를 못 찾았다. **이번엔 "유력 후보"를 단정하지 않고, 실기 재현으로만 좁힐 수 있는 상태임을 그대로 보고한다.**

---

## 1. 실측 데이터 — 오늘 PSS 1GB 초과 3건

`tools/long-run-monitor/logs/mem-timeline.csv` 직접 판독(컬럼: `iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note`):

| 시각 | pss_mb | gl_mb | native_heap_mb | java_heap_mb | views | note |
|------|--------|-------|-----------------|---------------|-------|------|
| 22:15:54 | **1179.5** | 231.5 | **623.1** | 44.9 | 186 | GL_DELTA background_or_transition |
| 22:48:02 | **1056.7** | 126.6 | **485.2**(추정 구간) | 46.9 | 201 | GL_DELTA background_or_transition |
| 23:03:56 | **1133.3** | 150 | **485.2** | 47.5 | 212 | GL_DELTA background_or_transition |
| 23:19:38 | 1016.5 | 46.7(↓GL 회복) | **457.3**(거의 그대로) | 38.7 | 393 | GL_RECOVERED idle_ok |
| 23:20:29 | **663**(프로세스 재시작 후) | 8.3 | — | — | 99 | POST_REMEDIATION_VERIFY_OK(pid 13717→21475) |

**핵심 관찰**: 23:03→23:19 구간에서 `gl_mb`는 150→46.7로 정상 회복했는데 `pss_mb`는 1133.3→1016.5로 겨우 116.8MB만 빠졌다. **`native_heap_mb`는 485.2→457.3으로 거의 안 빠졌다.** GL이 회복돼도 PSS가 1GB 밑으로 안 내려온 이유가 여기 있다 — 기존 자동회복 로직이 잡는 건 GL/그래픽 레이어이지, 이번에 진짜 문제인 native_heap이 아니다. 프로세스를 통째로 재시작(=native_heap을 OS가 강제로 회수)해야만 663MB로 떨어졌다.

`mem-alerts.log`를 보면 09-06부터 "GL +N MB" 패턴 자체는 계속 있었지만, **PSS 1000MB를 넘긴 건 오늘(09-11)이 처음**이다(9/6~9/10 로그 전부 PSS 200MB대 이하). "오늘 김팀장 작업분량 적용으로"라는 대표님 진단과 시점이 정확히 일치한다.

## 2. 코드 추적 (정정판) — 실제 파일 수정시각 기준 "오늘 09-11" 작업 전수

`Get-ChildItem`으로 `src/`·`app/`·`tables/`·`assets/` 전체를 `LastWriteTime` 09-11 00:00~23:59 범위로 필터링해 재조사했다(git status 아님). 하루 동안 서로 다른 5개 시스템이 순차로 작업됐다:

| 시간대 | 시스템 | 대표 파일 |
|--------|--------|-----------|
| 09:10~10:05 | 아크코어 채널 잡음(파이어베이스 설정류 소폭) | `cloudConversationalProvider.ts` 등 |
| 15:08~16:04 | 전투/웨이브 디펜스 — 신규 테스트 벤(Draco), 함선 사격범위·기동 로직 | `dracoCombatTestVenue.ts`, `capitalManeuverDecision.ts`, `capitalHeavyTurnLaw.ts` |
| 17:38~17:50 | 행성 "체류(dwell)" **신규 시스템** — 시민정책·중력·판정, 일일배치·`AiNpcSubCore`에 연결 | `planetDwellCivicPolicy.ts`, `runPlanetDwellCivicDailyPass.ts`, `runArcCoreDailyOpsBatch.ts` |
| 20:09~20:12 | BM 상점 신규 + **밸런스 generated CSV 약 130개 일괄 재생성**(`build:balance-tables`류 실행 흔적) | `BmShopOverlayContent.tsx`, `src/data/balance/generated/*.ts` |
| 20:52~21:17 | 선술집 **음성 재생 신규 시스템**(대사/노래 오디오) | `barVoicePlayer.ts`, `barVoiceResolve.ts`, `bar.tsx` |
| **22:14~23:30** | **은하지도 보더·보로노이 영토·안개·별빛 렌더링 전면 개편** | `computeGalaxyMapTerritoryVoronoiModel.ts`, `buildGalaxyTerritoryVoronoi.ts`, `buildGalaxyBlueRedVoronoiBorders.ts`, `galaxyMapTravelFog.ts`, `selectGalaxyMapVoronoiSites.ts`, `worldmap.tsx` |

**시간 정렬**: PSS 스파이크 3건(22:15·22:48·23:03)이 **은하지도 개편 작업 구간(22:14~23:30)과 정확히 겹친다.** 다른 4개 시스템은 그보다 몇 시간 앞서 끝나 있어 시간상 정합성이 약하다.

### 2-1. 은하지도 개편 코드를 직접 읽어봄 — 뚜렷한 버그는 못 찾음

`computeGalaxyMapTerritoryVoronoiModel.ts`는 순수 계산 함수(Skia·네이티브 호출 없음, `<Path d=...>` SVG 문자열만 생성)다. `worldmap.tsx`의 실제 사용부(921~957행)를 보면 `useMemo` + "이전 결과와 값이 같으면 참조를 재사용"하는 커스텀 훅(`reuseGalaxyMapIdSetIfSame`, `sameGalaxyMapSystemIdSeq`)까지 붙어 있어 — **불필요한 재계산·참조 처짐을 막으려는 의도가 코드에 뚜렷하다.** 정적으로 읽은 범위에서 명백한 누수 패턴(dispose 누락, 무한 append, 매 프레임 재생성)은 못 찾았다.

같은 날 추가된 선술집 음성 시스템(`barVoicePlayer.ts`)도 확인했다 — `Audio.Sound` 슬롯을 dialog/song 최대 2개로 제한하고 재생 전 이전 슬롯을 `stopAsync`+`unloadAsync`로 명시 해제하며, `app/(game)/bar.tsx`에서 `stopBarVoice()` 호출부도 확인됨 — 이쪽도 정적으로는 문제를 못 찾았다.

**즉 이번엔 "코드에서 원인을 찾았다"고 말할 수 없다.** 두 유력 후보(은하지도 개편, 선술집 음성) 모두 짜임새 자체는 괜찮아 보이는데, 그럼에도 같은 날 PSS 1GB가 처음 발생했다 — 여러 시스템이 동시에 올라간 총합 효과이거나, 정적 코드로는 안 보이는 런타임 상호작용(예: 은하지도 재진입 반복 시 SVG 엘리먼트 수 누적, 오디오 슬롯과 무관한 다른 네이티브 리소스)일 가능성이 있다.

## 3. 확정하지 못한 부분 — 정직하게 남김

정적 코드 추적만으로는 확정할 수 없다. 오늘 실제 스파이크 순간의 로그캣 채증(`incident-logcat-20260911-232018.log`)을 열어봤는데, **자동회복(프로세스 재시작) 이후 시점을 채증**해서 스파이크 당시 신호가 안 남아있었다(채증 스크립트가 "회복 검증" 시점에 찍히는 것으로 보임 — 이건 오늘 작업과 무관한 기존 모니터링 툴의 타이밍 갭이다, §5-3 참고).

즉 **"80장 베이크 PNG 전환이 native_heap 1GB의 직접 원인"은 지금까지 근거 중 가장 강한 가설이지만, 실기로 확정된 사실은 아니다.** 김팀장 지시 재검수 원칙(추측만으로 원인 확정 금지)에 따라 결론이 아니라 최우선 가설로만 보고한다.

## 4. 확정을 위한 재현 절차 (정정판 — 제안, 실행은 안 함)

이번엔 단일 유력 후보가 없으므로, **소거법**을 제안한다 — 5개 시스템 중 은하지도 개편이 시간상 가장 유력하지만 코드는 깨끗해 보였다는 점을 감안:

1. `mem-timeline.csv`를 계속 관측하면서, **오늘 밤(22:14~23:30) 실제로 무엇을 하고 있었는지**(은하지도를 계속 열어놨는지, 전투를 반복했는지, 허브/행성을 계속 오갔는지) 대표님/플레이 로그로 먼저 확인 — 코드 레벨 소거보다 훨씬 빠르게 범위를 좁힐 수 있다.
2. 위로 범위가 좁혀지면, 해당 화면만 반복 재현(예: 은하지도 진입→이탈 10회 반복)하며 `native_heap_mb` 추세를 관찰 — 우상향하면 그 화면이 범인 확정.
3. 5개 시스템을 한 번에 의심하기보다, **가장 최근에 작업이 끝난 은하지도(22:14~23:30)부터** 먼저 재현 시도 권장 — 시간 정합성이 가장 높음.
4. **채증 타이밍 갭도 별도 확인 권고**(§5-3) — 이번 조사와 무관하게, 향후 같은 스파이크가 또 나도 지금처럼 "회복 후" 채증이면 원인 규명이 매번 막힌다. 이걸 먼저 고치면 다음 스파이크부터는 이런 소거법 없이 바로 원인이 보일 것이다.

## 5. 부수 발견 (참고용, 이번 스파이크의 직접 원인은 아닐 수 있음)

### 5-1. 재베이크 자체는 잘 된 방향

`nebula/baked` 21장 평균 900KB→530KB 하락 확인 — 이전 세션 에셋 용량 감사(§4-1 nebula/baked 권고)가 실제로 반영된 것으로 보인다. 다만 530KB 평균은 그 감사가 제안한 600KB hardCap에 근접해 있어, 개별 파일 중 일부는 아직 캡을 넘을 수 있음(이번 조사에서 파일 단위 재검사는 안 함 — 필요 시 `npm run audit:asset-size-budget` 재실행 권고, 이미 존재하는 스크립트).

### 5-2. 정적 memory audit은 전부 PASS — 이번 스파이크를 못 잡는 종류의 검사

`npm run audit:memory:all`류(코드 계약 검사, STAGE dispose·replace() 사용 등)는 오늘도 37/37·7/7 PASS다. **이 감사들은 "코드가 올바른 패턴을 쓰는지"만 보지, "실제로 몇 MB가 남는지"는 측정하지 않는다** — 그래서 이번처럼 패턴은 맞게 짰는데(resizeMethod 적용 등) 실측 수치가 튀는 종류의 문제는 이 감사망 밖에 있다. 이번 스파이크가 정적 감사를 다 통과한 채로 발생했다는 사실 자체가, 새 이미지 기능류 변경에 대한 감사 커버리지가 비어 있다는 신호다(정적 감사 확장 여부는 별도 판단 필요 — 이번 지시 범위 밖).

### 5-3. 채증 타이밍 갭(모니터링 툴 자체의 한계)

`incident-logcat-20260911-232018.log`가 스파이크 순간이 아니라 재시작 직후(`POST_REMEDIATION_VERIFY_OK`) 시점을 찍고 있었다. 스파이크 **감지 시점에** meminfo/logcat을 채증하도록 트리거 타이밍을 당기면, 다음에 비슷한 일이 또 생겼을 때 원인 규명이 훨씬 빨라진다 — 이번 지시 범위 밖이라 제안만 남긴다.

---

## 6. 요약 — 대표님께 보고할 핵심 (정정판)

1. **PSS 1GB 초과, 실측으로 확인됨**(09-11 22:15~23:04, 최고 1179.5MB).
2. **기존 자동회복 로직이 진짜 범인(native_heap)을 못 잡고 있다** — GL만 보고 있어서, GL이 회복돼도 PSS는 거의 안 내려간다. 프로세스 강제 재시작만 효과 있었다.
3. **최초 보고("80장 이미지가 오늘 추가돼 원인")는 틀렸음, 철회함** — 실제 파일 수정시각 재확인 결과 그 이미지들은 08-22·09-06·09-10 것이었다(§정정 참고).
4. 재조사 결과 09-11 하루에 **5개 시스템이 동시 작업**됐다(전투/웨이브·행성체류 신규·BM상점·선술집 음성·은하지도 개편) — 이 중 **은하지도 보더·보로노이·안개 렌더링 개편(22:14~23:30)만 시간대가 PSS 스파이크와 겹친다.** 다만 코드를 직접 읽어본 결과 memo 처리가 꼼꼼해 뚜렷한 버그는 못 찾았다 — **이번엔 확정된 원인이 없다.**
5. 확정을 위해선 코드 재검토보다 **오늘 밤 실제 플레이 동선 확인**(은하지도를 계속 열어뒀는지 등)이 더 빠른 길로 보인다(§4).

**이번 조사는 읽기·측정만 했다** — 코드·설정·플래그 어느 것도 바꾸지 않았다.

---

## 7. 추기 — 김팀장 재검수로 더 정확한 결론이 나옴 (2026-09-12)

이 문서를 핸드오프한 뒤 김팀장이 직접 다시 검증해, 내가 §정정에서 "80장이 원인은 아닌 것 같다"고 방향만 짚은 걸 **숫자로 확정**해 줬다(`kim-claude-handoff-pending.md` 해당 항목 참고):

- 80장 전부 **256×256** 실측, 디스크 합 6.1MB, 전량 디코드해도 RGBA ≈ **21MB** — native_heap 485~623MB와 자릿수 자체가 안 맞음(**DISAGREE 확정**, 내 §정정의 "확실친 않지만" 수준보다 더 명확하게 기각됨).
- 기존 trim(`trimNativeBitmapCachesAsync`)은 hub soft/planet_change/map ingress에 **이미 배선돼 있음** 확인 — 내가 "미연결일 가능성"이라고 남긴 우려는 과했음(PARTIAL로 정정).
- **새로 찾은, 시각이 훨씬 정확히 맞는 축**: 22:02 계정 리셋 + `WorldExpansion target=78` + `set_catalog`(152+93+169행성) — native_heap이 330→504→623MB로 뛴 시점과 정확히 일치. 은하지도 Voronoi/별빛은 JS 피크 축이라 native floor 본축은 아닌 것으로 정리됨.

**다음에 이어갈 실마리는 이제 "은하지도"가 아니라 "22:02 계정 리셋 + WorldExpansion 카탈로그 세팅"이다.**

---

## 8. 전체 작업코드 정밀 전수 검사 (2026-09-12, 대표님 지시)

대표님 지시로 오늘(09-11) 실제로 작업된 **전체 5개 시스템**을 코드 레벨로 정밀 재검사하고, 관련 문서를 재학습했다.

### 8-1. 직접 확인 — 계정 리셋·WorldExpansion 경로 (김팀장이 지목한 축)

- `src/account/localAccountReset.ts` `purgeLocalAccountData` — 30개 이상의 스토어를 순차 `await`로 리셋하는 **큰 일회성 버스트**다(미션·NPC캡틴진행·행성코어런타임·광물원장·월드·월드오브젝트·바보드·바후원·BM원장 등).
- 이어서 `syncArcCoreGlobalWorldExpansionSync()` 호출 → `worldStore.ts:653` "일괄 개방 1회 enroll(+행성별 set_catalog)" — `target=78`이면 78개 성계를 한 번에 `reconcileGlobalSynthUnlocks`.
- `set_catalog` 실체(`AiEconomySubCore.ts:154-159`) 확인 — 행성별 `replaceTradePortCatalog(planetId, itemIds)`, 문자열 배열 교체 수준이라 **그 자체는 가볍다.**
- `enqueueColonizedPlanetGlobeBake`(런타임 원반 베이크 큐)도 이 경로에서 78회 호출될 수 있는데, 큐 자체가 **`QUEUE_MAX=2`로 강하게 제한**돼 있어(`planetGlobeRuntimeBake.ts:12,90-93`) 76개는 즉시 버려진다 — 이것도 원인이 아님.
- **결론**: `set_catalog`·globe-bake 큐 개별로는 가볍다. 진짜 무거운 건 **`purgeLocalAccountData`의 30여 개 스토어 리셋 + 78성계 일괄 재통합이 한 프레임/한 틱 안에서 동시에 도는 총합 버스트**라는 쪽으로 무게가 실린다 — 개별 조각은 전부 가벼운데, 한 번에 몰리면 크다.

### 8-2. 서브에이전트 정밀 재검사 — 나머지 4개 시스템(전투/체류/BM상점/은하지도 잔여)

| 시스템 | 결과 |
|--------|------|
| 전투/웨이브디펜스(Draco 신규 테스트 벤) | **메모리 누수 없음.** 미사일·히트FX 배열 전부 compact+리셋 확인. 단 **`isDracoCombatTestVenue()`가 `__DEV__`/피처플래그 가드 없이 실제 은하 데이터(`draco_haven`)에 그대로 연결돼 있어 전 플레이어에게 라이브임을 확인** — 메모리와 무관한 별도 QA 리스크로 기록 |
| 행성 "체류(dwell)" 신규 시스템 | **누수 없음.** 일일배치 1일 1회 호출 확인, 누적버퍼는 leftover<1e-6이면 자동 delete, 캐시는 단일 슬롯 교체(누적 아님) |
| BM 상점 | **누수 없음.** 기존 오버레이 dispose 계약 사용, 이미지 없음(유니코드 글리프), 비동기 fetch에 취소 플래그 있음 |
| 은하지도 잔여(Voronoi 사이트 선정·SVG 배치·안개) | **누수 없음.** 사이트 수를 "해금 일수 비례 증가" 대신 명시적으로 제한(주석에 그 실패모드를 직접 언급하며 방지), SVG는 색×투명도 버킷으로 배치, `useMemo`+참조 재사용 일관 |

**총 5개 시스템 + 계정리셋/WorldExpansion 경로까지 전수 확인한 결과, 어느 하나에서도 "그 자체로 500MB급을 새는" 고전적 버그(dispose 누락·무한 누적·매 프레임 재할당)를 찾지 못했다.** 전부 이 프로젝트의 기존 관례(캡·메모이제이션·dispose 토큰)를 지키고 있었다.

### 8-3. 문서 재학습 — 발견한 것

- `docs/expansion/아크파이어_확장시스템_설계안.md` 재독 — 남·북 국가 수송선단 확장 설계 문서. 오늘 시스템들과 직접 겹치진 않지만, "확장은 기존 배치·서브코어를 재사용하고 신규 스토어/13번째 서브코어를 만들지 않는다"는 원칙이 오늘 dwell/BM 시스템에도 실제로 지켜지고 있음을 재확인.
- `docs/MEMORY_REFACTOR_MASTER_PLAN.md` 재학습 — **중요한 사실 발견**: 이 문서의 마지막 실측 기록이 **2026-06-27**(석 달 전)이고, 그때도 이미 목표 초과 상태였다: PSS p50 937.9MB(목표 750) · PSS max 1134.9MB(목표 950 hard) · native p50 565.5MB(목표 350) · PSS≥800MB 비율 95.9%. `tools/long-run-monitor/logs/arc-memory-budget-ledger-latest.md`도 그 이후 **2.5개월간 재실행되지 않은 채 방치**돼 있었다.
- **직접 재측정(읽기전용, `npm run audit:memory-budget-ledger`, 기기 연결 확인 후 실행)**: 지금(09-12) 기준 PSS p50 **792.8MB** · p90 850.6MB · native p50 **374.3MB** · PSS≥800 **40.7%**. 6월 말 대비 상당히 개선됐지만(특히 native_heap 565→374), 여전히 목표(750/350)를 살짝 못 채운다.
- 감사 리포트 상단의 참고문서 링크(`docs/2.1.memory.md`, `docs/rendering-pipeline-baseline.md`)는 **실제로 저장소에 존재하지 않는 깨진 참조**임을 확인(`Glob` 전수 검색 0건).

### 8-4. 종합 재평가

- 지금 정상 운영 중 수치(p50 793MB)는 어젯밤 스파이크(1179MB)보다 확실히 낮다 — **어젯밤 스파이크는 평소보다 튀어나온 이상치가 맞다**(6월의 "원래 안 좋았던 상태"와는 다른 얘기). 김팀장이 찾은 "계정 리셋+WorldExpansion" 연관은 여전히 가장 시각이 정확한 단서다.
- 다만 개별 코드에서 버그를 못 찾았으므로, 현재 최선의 가설은 **"버그가 아니라 사이즈"** 쪽이다 — `purgeLocalAccountData`(30여 스토어 순차 리셋) + `syncArcCoreGlobalWorldExpansionSync`(78성계 일괄 재통합)가 **한 번에 동시에 도는 진짜 큰 일회성 버스트**이고, 이후 안드로이드 네이티브 할당기·Fresco 등이 메모리 압박이 오기 전까지 굳이 즉시 반환하지 않는 특성과 겹쳐 native_heap이 한동안 높게 유지됐을 가능성이 가장 유력하다.
- 이건 "고쳐야 할 누수"라기보다 **"큰 일회성 작업 뒤에 명시적 반환(trim)을 한 번 더 걸어줘야 하는가"의 운영 판단**에 가깝다 — 이미 이 프로젝트엔 같은 패턴(`runPlanetHubSoftNativeReclaimPass`의 Fresco deferred trim)이 있으니, 계정 리셋 완료 직후에도 같은 종류의 trim을 붙이는 게 실질적인 다음 조치 후보로 보인다(코드 변경 제안만, 이번엔 미착수).

### 8-5. 다음 조치 — 정밀 설계 (2026-09-12 재작성, 대표님 지시 「실제 적용 가능하게 더 정밀하게」)

기존 §8-5는 방향만 있고 어디를 어떻게 고치라는 건지가 없었다. 실제 코드를 다시 열어 **파일:줄 단위로 바로 적용 가능한 수준**까지 좁혔다. 여전히 코드는 안 건드렸다 — 김팀장이 이 설계를 그대로 diff로 옮길 수 있게 준비만 했다.

#### A. 계정 리셋 직후 네이티브 트림 — 정확한 설계

**지금 구조 확인**: 이 프로젝트엔 이미 "STAGE blur 시 native 회수" 체계가 있다(`src/game/nativeReclaim/`).

```ts
// nativeReclaimContracts.ts:3
export type NativeReclaimStage = 'planet_hub' | 'galaxy_map' | 'combat';
```

**세 가지 stage만 있고 `account_reset`은 없다** — 계정 리셋은 이 회수망 밖에 있다는 게 코드로 확정됐다. 실제 trim 본체(`nativeReclaimBootstrap.ts:44-52`)는 `arcfire-native-memory` 네이티브 모듈의 `trimNativeBitmapCachesAsync()`를 호출하고, 성운 프로필 캐시도 같이 정리한다(28-42행) — **이건 Fresco/비트맵 캐시 축**이다.

**제안 diff (3곳, 전부 기존 패턴 재사용 — 새 메커니즘 발명 안 함)**:

1. `nativeReclaimContracts.ts:3` — union에 한 개 추가:
   ```ts
   export type NativeReclaimStage = 'planet_hub' | 'galaxy_map' | 'combat' | 'account_reset';
   ```
2. `nativeReclaimBootstrap.ts:30`과 `:46` — 기존 두 리스너의 `stages` 배열에 `'account_reset'` 추가(로직 변경 없음, 트리거 축만 하나 늘림):
   ```ts
   stages: ['planet_hub', 'galaxy_map', 'combat', 'account_reset'],
   ```
3. `src/account/localAccountReset.ts` — `finalizeLocalAccountResetNavigation`의 `navigateToTitle()` 호출(314행) 직후, 기존 `runStageUiAfterIdle(...)` 콜백과 같은 자리에 한 줄 추가:
   ```ts
   import { scheduleDeferredNativeReclaimPass } from '../game/nativeReclaim/deferredNativeReclaimScheduler';
   // ...
   navigateToTitle();
   scheduleDeferredNativeReclaimPass({ stage: 'account_reset', reason: 'account_reset_complete' });
   runStageUiAfterIdle(() => { ... });
   ```
   `scheduleDeferredNativeReclaimPass` 자체가 이미 `InteractionManager.runAfterInteractions` + 2×rAF + 지연(`DEFERRED_NATIVE_RECLAIM_DELAY_MS`)으로 게이트돼 있어(`deferredNativeReclaimScheduler.ts:27-44`) 타이틀 전환 애니메이션과 안 겹친다 — 별도 타이밍 조율 불필요.

**솔직한 한계(과신 금지)**: 이 trim은 **Fresco 비트맵 캐시**를 겨냥한다. 스파이크의 native_heap이 진짜 비트맵 캐시인지, 아니면 Hermes JS 엔진 힙(안드로이드 `dumpsys meminfo`는 Hermes 힙도 종종 "Native Heap"으로 잡는다)인지는 이번 조사로 확정 못 했다 — 그래서 이 diff를 적용한 뒤 **반드시 §B의 재측정 절차로 실제 효과를 검증**해야 한다. 효과가 없으면 "버스트 자체를 쪼개서 순차 처리"(예: `purgeLocalAccountData`의 스토어 리셋 그룹 사이에 `await new Promise(r => setTimeout(r, 0))` 삽입해 GC에 숨 돌릴 틈을 주는 방식) 쪽으로 방향을 바꿔야 한다 — 이건 검증 후 2단계로 남겨둔다.

#### B. 검증 절차 (A 적용 여부와 무관하게 먼저 해도 됨)

1. 기기 연결 확인 후 계정 리셋을 실행하며 `tools/long-run-monitor/logs/mem-timeline.csv`를 실시간 관찰(이미 상시 가동 중인 워치 스택이 자동 기록).
2. 리셋 시작 직후(수 초 이내)와, 이후 첫 행성 허브 재진입 시점을 구분해서 `native_heap_mb`가 어느 타이밍에 뛰는지 확인 — **리셋 직후 뛰면 A안이 맞는 지점**, 허브 재진입 시점에 뛰면 원인이 §2-1의 globe-bake/hub 경로 쪽으로 다시 이동함을 뜻한다.
3. A를 적용했다면 같은 재현을 다시 돌려 `native_heap_mb`가 실제로 내려가는지 전후 비교.

#### C. 메모리 예산 원장(ledger) 정기 재실행 — 정확한 훅 지점

**지금 구조 확인**: 데일리 08:00 KST 보고는 우연히 도는 게 아니라 `tools/long-run-monitor/schedule-8am-kim-daily-auto-report.cjs`가 **영구 루프**로 상시 가동 중이고(`main()` 하단 `while(true)`), 매일 `runDailyReport()` 함수 하나가 실제 작업을 한다. 이 함수는 이미 `adb shell dumpsys meminfo`로 PSS/GL을 직접 찍어 `memLine`을 만들고(359-378행), 그 값을 handoff·`DAILY_8AM_REPORT_LATEST.md`·CHAT 리포트에 전부 반영한다.

**제안 diff (이 파일 1곳만, 새 스케줄러 발명 안 함)**: `runDailyReport()` 안, `memLine`을 만드는 블록(378행) 직후에 기존 `shSafe()` 헬퍼(145-151행, 이미 파일에 있음 — 실패해도 데일리 보고 자체를 FAIL시키지 않는 안전한 패턴)로 원장 재생성을 한 번 끼워 넣고, 그 결과를 `memLine` 옆에 같이 적는다:

```js
// runDailyReport() 안, memLine 계산 직후
let ledgerLine = '';
if (adbOk) {
  shSafe('powershell', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
    path.join(__dirname, 'build-arc-memory-budget-ledger.ps1'),
  ]);
  try {
    const ledgerMd = fs.readFileSync(path.join(logDir, 'arc-memory-budget-ledger-latest.md'), 'utf8');
    const p50 = ledgerMd.match(/PSS p50 \| ([\d.]+) MB/);
    const nat = ledgerMd.match(/Native p50 \| ([\d.]+) MB/);
    if (p50 && nat) ledgerLine = `ledger p50=${p50[1]}MB native=${nat[1]}MB`;
  } catch { /* ignore */ }
}
```

그리고 기존 `block`(452행대) 배열에 `memLine` 다음 줄로 `ledgerLine`을 하나 추가하면, **매일 아침 handoff에 그날의 p50/native가 자동으로 찍힌다** — `MEMORY_REFACTOR_MASTER_PLAN.md`를 손으로 다시 열어 비교할 필요 없이, 이번처럼 2.5개월 방치되는 일 자체가 구조적으로 막힌다. FAIL/OK 판정 로직(414-420행)은 건드리지 않음 — 원장은 참고 정보로만 추가, 데일리 보고의 필수 통과 조건에 새로 끼워 넣지 않는다(하드 게이트로 만들면 원장 실행 실패가 매일 보고 자체를 막는 새 장애점이 되므로).

#### D. 우선순위

| 순서 | 항목 | 근거 |
|------|------|------|
| 1 | §B 검증(재현 관찰) — **코드 변경 전에 먼저** | A를 적용하기 전에 어느 시점에 뛰는지부터 확인해야 A가 맞는 지점인지 알 수 있음 |
| 2 | §A 3곳 diff 적용 | 근거 확인되면 리스크 최소(기존 패턴 재사용, 신규 로직 없음) |
| 3 | §C 1곳 diff 적용 | 완전히 독립적, 리스크 없음(실패해도 데일리 보고에 영향 없음) — 언제 적용해도 무방 |
| 4 | `docs/2.1.memory.md`·`docs/rendering-pipeline-baseline.md` 깨진 참조 정리 | 낮은 우선순위 |
| 5 | Draco 전투 테스트 벤 프로덕션 노출 | 메모리와 무관한 별도 QA 이슈로 김팀장께 같이 전달 |

**END(정정판+추기+전수검사+정밀설계)** — 2026-09-12 · 김클로드
