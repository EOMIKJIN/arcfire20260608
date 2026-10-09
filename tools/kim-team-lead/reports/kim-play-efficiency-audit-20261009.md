# 비효율 연산·로그·메모리 정리 주기 일괄 검수 (김플레이 주도 · 김클로드 교차검수 · 2026-10-09)

대표님 지시(15:3x): 틱 관련 중 게임성과 무관한 연산, 로그(출시 때 빠지는 것 포함), 메모리 정리 주기 일원화를 일괄 검수하고 효율화한다.

## 0. 측정 근거 (pid 19243 · dev-client · logcat 14:21~15:29 · 68분)

| 로그 태그 | 줄 수 | 분당 |
|---|---|---|
| `[arc-hitch]` (30ms 이상 JS 정지) | 5,172 | 약 76 |
| `[MEM]` (회수 패스) | 356 | 약 5 |
| `[MEM_PROFILE]` | 90 | 약 1.3 |
| 그 밖 | 수십 | — |

`[arc-hitch]` 세부 (30ms 이상만 기록되므로 실제 호출 수는 더 많다):

| 출처 | 횟수 | 평균 / 최대 ms | 68분 누적 JS 정지 |
|---|---|---|---|
| `settle:convoy_plan` — 수송선 정박마다 `planArcConvoyRouteAtSupply` 재계산 (`runArcTransportTradePass.ts:227-234`) | 2,134 | 73 / 237 | 약 156초 |
| `tick:ai_npc_subcore` — `AiNpcSubCore` 0.25초 스냅샷 | 1,313 | 43 / 221 | 약 56초 |
| `tick:arc_inbound_drone_subcore` — 0.25초 스냅샷 | 366 | 66 / 155 | 약 24초 |
| `tick:arc_core_spy_subcore` — 1초 lookup | 672 | 34 / 161 | 약 23초 |
| `plan:synth_*` — 행성별 교역 경로 계획(`arcConvoyTradePlanner.ts:60-86`) | 행성당 약 25 | 약 120 | (convoy_plan에 포함) |

- 합계 약 4~5분/시간의 JS 스레드 정지 → 입력 지연·프레임 히치·GC churn(허브 구간 GC 약 271회/분)의 주 원인 후보.
- 출시 빌드는 `babel.config.js` `transform-remove-console`로 console이 빠진다. 다만 `performance.now()` 계측 분기와 로그 문자열 생성은 dev에서 비용이고, 측정 환경을 오염시킨다.

회수 패스: 인바운드 드론 웨이브 1회마다 `hubSkiaNativeReclaim` ×2 · `runPlanetHubPostSkiaPeakReclaimPass` ×2 · `backdropRemount` ×2 · `hubInboundSettleReclaim` · `runSoftNativeReclaimPass` · `runPlanetHubSoftNativeReclaimPass` · `deferredNativeReclaim` 등 **7~9개**가 연달아 돈다. 은하 지도는 ingress · post_ingress_settle · followup · periodic(5분) · periodic_deep이 각각 따로 돈다.

## 1. 검수 축과 담당

| ID | 축 | 대상 | 담당(분석→구현) | 교차검수 |
|---|---|---|---|---|
| E1 | 틱 | 호송 정박 경로 계획 재계산(convoy_plan · plan:synth_*) | 김플레이 | 김클로드 |
| E2 | 틱 | AiNpcSubCore 0.25초 스냅샷 | 김클로드 | 김플레이 |
| E3 | 틱 | ArcInboundDroneSubCore 0.25초 스냅샷 | 김클로드 | 김플레이 |
| E4 | 틱 | ArcCoreSpySubCore 1초 lookup | 김클로드 | 김플레이 |
| E5 | 로그 | dev 로그 전수(arc-hitch · MEM · combat-hitch 등) — 분당 요약 1줄로 묶기, 계측 분기 비용 제거 | 김플레이 | 김클로드 |
| E6 | 메모리 정리 주기 일원화 | 웨이브·스테이지·주기 회수 패스를 하나의 스케줄러로(전환 트리거 + 단일 주기) | 김플레이(설계) | 김클로드 |
| E7 | GC churn | E1~E4 이후 `[MEM_HEAP]` gc/분 · alloc 저점으로 재측 | 김플레이 | 김클로드 |

원칙
- 게임성(가격·재고·점유·전투 결과)에 영향을 주는 연산은 결과가 같아야 한다. 바꾸는 것은 「언제·얼마나 자주·중복 여부」뿐이다. 결과가 바뀌면 대표님 확인을 받는다(기존값 변경 규칙).
- 경제 고빈도 금지(CLAUDE.md 금지 4)와 충돌하는 실시간 경로가 있으면 함께 기록한다.
- 각 항목: `[pss-pre-dev]` 3줄 → 구현 → tsc · 관련 테스트 · audit → 실기 수치(arc-hitch 횟수/ms · GC/분 · PSS) → 교차검수.
- 같은 파일을 두 세션이 동시에 고치지 않는다(파일 소유는 위 담당 기준).

## 2. 진행 기록

- 15:3x 측정·목록화 (이 문서)
- 16:0x E2·E3(1차)·E4 김클로드 구현 → 김플레이 검수 PASS. E1 김플레이 구현(행성→성계 조회 캐시 · 행성 쌍 거리 캐시) → 김클로드 교차검수 조건부 PASS → 운송비 캐시 상한 문제 수정(품목 키 제거) 후 PASS.
- 16:06 dev 크래시: 김플레이가 비컴포넌트 경제 모듈을 저장해 전체 리로드 → expo-modules-core dev 리로드 SIGABRT. 게임 결함 아님. 규칙: 측정 중·장시간 상태 보존 중 비컴포넌트 모듈 저장 금지(저장 시 콜드스타트 전제).
- 16:28~16:48 수정 후 1차(pid 17218, 대표님 이동 플레이 포함, 기준선 68분과 분당 비교): convoy_plan 31→2.5회/분(73→39ms) · ai_npc 19→1.1 · spy 10→0.2 · **inbound_drone 5.4→13.8회/분(66→76ms) = 남은 1순위** → E3 후속(김클로드): planet.tsx 드론 배열 구독 → boolean 2개, 드론 레이어 내부 구독, orbit clock effect deps length→boolean(생성·파괴마다 오비트 미러 0 재설정 결함 동반 해소).
- **Hermes 누수 확정(원인 미특정)**: GC 프로브(collectGarbage 직후 alloc, pid 17218) 27.5 → 31.5 → 35.5 → 40.3 → 45.0 → 48.3MB / 25분(약 0.83MB/분 단조 증가) · heap 44→92. 15:24~15:53 허브 PSS 상승분(+56)도 같은 축. heap snapshot 도구는 Metro 인스펙터 프록시가 대용량 청크 전송 중 연결을 끊어 파일이 잘림 → 후속 과제(직접 연결·청크 완료 확인 재설계).
- 16:59 E5: `src/arcCore/devArcHitchLog.ts` — [arc-hitch] 이벤트별 console.log 5곳 → 분당 요약 `[arc-hitch-min] kind:label=횟수/합계ms/최대ms` 1줄(전역 핸들로 Fast Refresh 중복 방지). 행성별 plan 라벨은 `plan:convoy_route` 하나로 묶고 구간 분해 줄은 200ms 이상만.
- 16:58 E3 후속(김클로드): planet.tsx 드론 배열 구독 → 0/1 원시값 선택자 2개 · 드론 레이어 내부 구독(planetId prop) · orbit clock effect deps length→count. 김플레이 검수 PASS.
- 17:01 콜드스타트 pid 21762 · adb로 아르카디아 진입 · 19분 최종 측정(`tools/play-bot-console/logs/soak/final-20261009-1702/`).

## 3. 최종 결과 (17:02~17:21 · 아르카디아 허브 · 무조작 · FATAL/hook 오류 0)

| 작업 | 수정 전(68분 기준선) | 최종 | 판정 |
|---|---|---|---|
| 호송 경로 계산 convoy_plan | 31회/분 · 73ms | 4.0회/분 · 36ms | 개선 (빈도 −87%, 회당 −51%) |
| ai_npc_subcore | 19회/분 · 43ms | 1.4회/분(가끔 165~323ms 단발) | 개선 (−93%) |
| arc_core_spy_subcore | 10회/분 · 34ms | 0.2회/분 | 개선 |
| arc_inbound_drone_subcore | 13.8회/분 · 76ms | 14.8회/분 · 60ms | 부분 개선(회당 −20%) — 잔여 = 드론 레이어 동기 렌더(publish 25~75ms) |
| dev 로그 | 분당 약 76줄 | 분당 1줄 요약 | 개선 |
| 허브 PSS | 848~940(30분 시점 · 이전 프로세스) | 635~731(19분) | 프로세스 경과 시간이 달라 직접 비교 불가 |

- **Hermes 누수는 그대로(원인 미특정)**: 최종 프로세스 GC 직후 alloc 25.0 → 30.2 → 33.4 → 39.1 → 40.4MB / 20분(평균 약 0.8MB/분, 마지막 5분 +1.3). 수정 전과 같은 속도 → 이번 효율화 대상(틱 churn)과는 다른 축이다.
- tsc PASS · audit:skia-memory 31/31 · galaxyMap 48/48 · 모니터 relaunch 원복(paused.flag 삭제).

## 3-1. 2라운드 — dev 빌드 안정화(대표님 1순위 지시) · 2026-10-09 저녁

### Hermes 누수 원인 확정 = SDK 54 dev 도구 체인(React DevTools 렌더러 인터페이스)
- 추적 경로: heap snapshot은 기기 쪽 인스펙터 연결이 약 91MB 지점에서 끊김(CONNECTION_LOST) → 샘플링 프로파일러도 10여 초 만에 끊김 → 단발 Runtime.evaluate 도구로 전환(`tools/play-bot-console/soak/hermes-retention-probe.cjs` · `hermes-eval.cjs` · `arccore-subcore-mute.cjs` · `rdt-toggle-abab.ps1`).
- store 51개 · 내보낸 컨테이너 606개는 8분 동안 합계 약 1KB 증가 → store가 아님.
- 아크코어 월드 시계 정지 8분이면 평탄 · 서브코어를 절반씩 정지하면 그대로 증가 → 커밋(리렌더) 빈도에 비례하는 경로.
- SDK 54(RN 0.81.5 · React 19.1.0 · Hermes for RN 0.81.5 · old arch 유지)에서 `__REACT_DEVTOOLS_GLOBAL_HOOK__`가 backends 0인데도 rendererInterfaces 2(앱 + RN Skia reconciler) → 커밋마다 추적.
- 훅 처리 no-op 8분: 0.79 → 0.26MB/분(−70%). **수정 후 RDT OFF 세션 30분(pid 29913 · 아르카디아 허브): GC 직후 alloc 22.7 → 23.7MB 평탄(이전 25.0 → 40.4 / 20분).** → 확정.

### 반영 (김플레이·김클로드 교차검수 PASS · Metro 재시작 · 콜드스타트)
| 파일 | 내용 | 담당 |
|---|---|---|
| `index.js`(신규) · `package.json` main → `index.js` | 엔트리 맨 앞에서 dev 대책 모듈 실행 후 `expo-router/entry` | 김클로드 |
| `src/dev/arcDisableReactDevToolsHook.js`(신규) | dev 기본: 설치된 훅에 `isDisabled = true`(객체 교체 없음). 다시 켜기: `EXPO_PUBLIC_ARC_ENABLE_RDT=1`로 Metro 재시작. release는 __DEV__로 제거 | 김클로드 |
| `src/game/devMetroReloadGuard.ts` | dev 기본: 전체 리로드(Fast Refresh full refresh · dev 메뉴 · Metro 'r') → `restartAppAsync` 프로세스 재시작. 재시작을 먼저 부르고 실패 시 prepare + 원래 리로드. 예전 동작: `EXPO_PUBLIC_ARC_DEV_RELOAD_INPLACE=1` | 김플레이 |
| `tools/long-run-monitor/report-watch.ps1` | EXIT_SELF → 황색 「앱 자체 재시작」(밑줄·공백 정규화) · 사유 괄호 잘림 표시 버그 수정 | 김클로드 |

- dev 리로드 SIGABRT 원인: 같은 프로세스 JS 재시작 뒤 expo-modules-core `expo::LazyObject::get`이 이전 런타임의 HybridData(null)에 접근 → JNI abort(오늘 전체 리로드 2/2 재현, expo-modules-core 3.0.30·expo 54.0.37 최신이라 업스트림 수정 없음). 대책 검증: `DevSettings.reload` → 「full reload → app process restart」 → exit-info EXIT_SELF → 새 pid · 크래시 0.
- Metro: 종료하면 장시간 모니터가 자동으로 다시 띄운다(`tools/long-run-monitor/logs/metro-*.log`).
- 부작용: dev 기본 세션에서는 React DevTools 컴포넌트 패널·Element Inspector를 쓸 수 없다(필요하면 opt-in). 비컴포넌트 파일 저장은 크래시 대신 앱 재시작(타이틀부터).

### 성능 측정 전용 release 빌드 플래그 (2026-10-09 · 김클로드 검수 PASS)
- `EXPO_PUBLIC_ARC_PERF_LOG=1`로 빌드할 때만 release에서 console 유지(babel.config.js) · 아크코어 틱 계측(ArcCoreHub `measureTicks`). 플래그 없는 release는 기존과 같다.
- **주의(캐시)**: Metro 변환 캐시 키에 환경변수가 없고 babel `api.cache(true)`라, perf 빌드와 일반 release 빌드가 서로의 캐시를 재사용할 수 있다. → 두 빌드 모두 Metro 캐시를 비우고 번들링하고, 산출 `index.android.bundle`에서 `arc-hitch-min` 문자열을 검사한다(perf ≥ 1건, 일반 release = 0건이어야 함).

## 3-2. E6 회수 패스 일원화 1단계 (김플레이 · 2026-10-09 21:3x · 크레딧 중단 후 재개)

### 회수 실효 판정 (대표님 지시 20:3x 「회수가 실제로 작동하는지」)
- 원본: `tools/play-bot-console/logs/soak/release-perf-20261009-2028/`(release-perf 빌드 · pid 5540 · 허브 무조작 · 웨이브 약 61초 간격).
- 웨이브 종료(`vfx_cleared`) 16회 기준, 종료 전 12초 평균 대비 종료 후 5~17초 평균: **Native −2.9 · GL −0.8 · PSS −2.5 · Unknown +0.8MB**.
- 노이즈 기준(같은 계산을 기준점만 +15·+30·+45초로 옮김): Native +4.6 · −3.6 · +2.0, PSS +6.0 · −6.1 · +4.5 → **웨이브 종료 회수 효과는 노이즈 범위 안**.
- Bitmap(malloced) 5.4MB가 세션 내내 고정 → Fresco trim이 해제할 대상이 없음(김클로드 인벤토리 §4-1 예상과 일치).
- 장기 추세: 앱이 계속 실행된 상태로 21:34(경과 약 66분)에 다시 측정 → PSS 375~385 · Native 약 131 · Unknown 47 · GL 32.7(웨이브 뒤). 20:48(PSS 약 400 · Unknown 약 57)보다 낮거나 같음 → **release 허브 체류 누수 없음(평탄)**.
- 결론: 회수 패스는 「돌지만 효과가 없는 반복」이다. 1회로 줄여도 손실이 없다 → 1단계 진행.

### 김클로드 인벤토리 재검수 (`kim-claude-e6-reclaim-inventory-20261009.md`)
| 주장 | 판정 | 근거 |
|---|---|---|
| `signalHubSkiaNativeReclaim` 구독자 0 | AGREE | `subscribeHubSkiaNativeReclaim` 호출처 0건(정의 `hubSkiaNativeReclaimSignal.ts:30`만) |
| `followup_90s` 실행 0회 | AGREE(범위 보정) | vfx_cleared effect deps(at-planet count)가 다음 웨이브 0→1에서 cleanup → 타이머 취소. **단 전투 orbit 종료·웨이브 간 트리거는 다음 웨이브 cleanup이 없어 실행될 수 있다** → 그쪽 followup은 유지 |
| flying→0 패스(#1)는 고유 효과 없음 | AGREE | release 21/21 · rdt-off 31/31 웨이브에서 drone_end 뒤 약 0.5초에 vfx_cleared가 1:1로 따라옴. #1 고유 목적(sticky dodge 해제 신호)은 구독자 0 |
| 웨이브당 Fresco trim 약 5~6회 | AGREE | 패스 #1·#2 즉시 trim + 각 deferred + settle soft deferred + settle 끝 즉시 trim |

### 반영 (결과 동일 · 횟수만 축소)
| 파일 | 내용 |
|---|---|
| `app/(game)/planet.tsx` | flying→0 effect(`hub_inbound_drone_end`) 제거 → 웨이브 종료 진입점은 `hub_inbound_vfx_cleared` 1개 |
| `src/game/nativeReclaim/runPlanetHubPostSkiaPeakReclaimPass.ts` | settle이 뒤따르는 경로는 패스 즉시 trim과 패스 deferred를 건너뛰고 settle soft의 deferred 1회로 합침(`deferBitmapTrimToSettle`) · settle 경로는 90초 followup 미생성 · settle 끝의 중복 `runCombatSkiaPresentationReclaim` + 즉시 trim 제거 |
| `src/game/nativeReclaim/runPlanetHubSoftNativeReclaimPass.ts` | 직접 호출하던 `runCombatSkiaPresentationReclaim` 제거(`runSoftNativeReclaimPass` 안에서 1회 수행) — 5분 주기 soft에도 적용 |

- 웨이브당: 패스 2 → 1 · Fresco trim 약 5~6 → 1 · deferred listener 2~3 → 1 · 전투 Skia 회수 약 5 → 2(T0 + settle) · heap purge 2(즉시 + 900ms, 그대로) · 90초 타이머 생성 → 0.
- 건드리지 않음: STAGE 이탈(route_blur·ingress) · 전투 orbit 종료 · 웨이브 간 · battleReady 직전 · 15분 deep · `signalHubSkiaNativeReclaim` 호출과 모듈(상시 마운트 커밋 뒤 삭제 판단).
- self-check: tsc exit 0 · audit:skia-memory 31/31 · `hubPeakBackdropRemountPolicy.test` · `planetHubIngressReclaim.test` PASS.
- **미완(실기)**: release-perf 재빌드(직전 33분) 뒤 30분 허브 체류로 웨이브 전후 Native·GL floor와 PSS 추세를 20:28 세션과 비교해야 한다. 판정 기준: floor 추세가 20:28 세션 이하이면 PASS.
- 2단계(미착수): 5분 soft·15분 deep 단일 타이머 통합, native 단계 최소 간격.

## 4. 다음 라운드

1. **Hermes 누수 원인 특정 (P1)** — heap snapshot 도구 수정이 먼저다(Metro 프록시 경유 시 대용량 청크 도중 연결 끊김). 원인을 특정한 뒤 수정한다.
2. **드론 레이어 동기 렌더** — TEMP-DIAG `[arc-hitch-split] drone`(ArcInboundDroneSubCore.ts, dev 전용)은 유지하고 레이어 쪽까지 계측을 넓힌다. 후보: droneIds 서명 안정화 · publishCampaignSnapshot의 미변경 드론 객체 재사용 · 렌더 경로 할당 제거. dev 부풀림을 보려면 release 성격 빌드로 1회 측정한다.
3. E6 회수 패스 일원화(웨이브 1회당 7~9개).
4. 별건: dev 전체 리로드마다 expo-modules-core SIGABRT(JNI HybridData null, 16:06·16:57 재현) — 개발 환경 P2. `tradeRouteItemCanon.test` tg_002 src 태그 실패(item_defs CSV, 기존 문제).
