## [愿痢? 2026-07-03 22:00 KST ??吏묒쨷 媛먯떆 16:00??2:00 쨌 22:00 ?먮룞蹂닿퀬

- **focus**: ArcCore economy 쨌 RED planet dev automation 쨌 memory leak / abnormal occupation
- watch-30m PID **25024** report-watch **18556** auto-fix=ON
- mem-monitor: **OK** (APP_NOT_RUNNING)
- report: D:\arcfire20260607\tools\long-run-monitor\logs\evening-watch-report-20260703-2200.md
- latest: tools/long-run-monitor/logs/DAILY_10PM_REPORT_LATEST.md
- timeline marker: INTENSIVE_WATCH_1600_START
- incidents actionable: 2
  - [2026-07-03 09:51:12] PSS_SOFT_CEILING pss=852.1 gl=133.2 views=564 native_reclaim_advisory
  - [2026-07-03 16:04:03] INTENSIVE_WATCH_1600_START KST intensive watch 16:00-22:00
- rec: intensive window stable ??review sections 9??2 in report

> status: monitor-ok 쨌 22:00 KST intensive report done
## [obs] 2026-07-03 18:00 KST evening watch 18:00 report

- watch-30m PID **25024** report-watch **18556** auto-fix=ON
- mem-monitor: **OK** (PSS 676.9MB GL 44.9MB Views 364 pid=16676)
- report: D:\arcfire20260607\tools\long-run-monitor\logs\evening-watch-report-20260703-1800.md
- latest: tools/long-run-monitor/logs/DAILY_6PM_REPORT_LATEST.md
- timeline marker: EVENING_WATCH_6PM_START
- incidents actionable: 2
  - [2026-07-03 09:51:12] PSS_SOFT_CEILING pss=852.1 gl=133.2 views=564 native_reclaim_advisory
  - [2026-07-03 11:32:39] EVENING_WATCH_6PM_START 2026-07-03 11:32 KST watch until 18:00 integrated report + ArcCore balance-ops
- rec: evening soak OK retention snapshot + release soak
- future dev: see report section 7

> status: monitor-ok 18:00 KST report done
## [관측] 2026-07-03 16:04 KST — **집중 감시 16:00–22:00** (김경제 · 사용자 요청)

- **감시 가동**: watch-30m **25024** · report-watch **16512** · 22:00 scheduler **11784** · adb OK
- **auto-fix**: **ON** (심각 이상 즉시 처리 — monitor-paused 제거)
- **marker**: `INTENSIVE_WATCH_1600_START` @ 16:04:03 · brief: `EVENING_WATCH_10PM_BRIEF.md`
- **22:00 산출**: `evening-watch-report-*-2200.md` · `DAILY_10PM_REPORT_LATEST.md` · `CHAT_REPORT_PENDING.md`
- **현재 mem** (16:04): pid **16676** · PSS **658MB** · GL **44MB** · Views **361**
- **직전 이상** (marker 이전): 14:27 GL spike PSS 727→735 (허브 Skia) · 15:13~15:43 PROCESS_NOT_RUNNING · 15:58 재기동 PSS **354MB** floor
- **ArcCore balance-ops** (16:04 baseline): **WARN** · daily batch OK · whale/F2P **3.12 ok** · convoy fail 1 · fiscal max fee/upkeep **3×**
- **행성개발 자동화**: 60s tick · RED-only · vault 실지출 · central bank→budget pool · device-local world

> status: **intensive-watch-ACTIVE** · **22:00 auto-report scheduled** · auto-fix=ON



- **감시 가동**: watchdog **4844** · watch-30m **24156** · report-watch **19228** · adb OK
- **auto-fix**: **OFF** (`monitor-paused.flag` record-only)
- **18:00 스케줄러**: `monitor:schedule-6pm-report` **시작** (11:32) → `evening-watch-report-20260703-1800.md` · `DAILY_6PM_REPORT_LATEST.md` · `CHAT_REPORT_PENDING.md`
- **marker**: `EVENING_WATCH_6PM_START` @ 11:32:39 · brief: `tools/long-run-monitor/logs/EVENING_WATCH_6PM_BRIEF.md`
- **현재 mem** (11:23): pid **1499** · PSS **556MB** · GL **31MB** · Views **362**
- **야간 통합**: 03:28 PSS peak **1084** → GL_RECOVERED ✓ · 04:13 재기동 후 floor **664~710** stable
- **오전 이상**: 09:51 GL_SPIKE PSS 852 → 10:06 GL_RECOVERED ✓ · 11:07 PID_CHANGE 10002→1499
- **ArcCore balance-ops** (11:33): **WARN** · daily batch OK · SIM whale/F2P **3.12 ok** · level-band gap CRITICAL(P1 backlog) · convoy fail 1(core_prime) · fiscal max fee/upkeep **3×**
- **코드**: **동결** (비정상 오류만) · AI 클랜 registry 반영 후 mem-post-dev-recheck 18:00 창 포함

> status: **afternoon-watch-ACTIVE** · **18:00 auto-report scheduled** · improvement plan in EVENING_WATCH_6PM_BRIEF.md


## [관측] 2026-07-03 04:15 KST — **메모리 감시 체계 점검** (김팀장 · 사용자 요청)

- **가동 상태**: **OK** — watchdog **4844** · watch-30m **24156** · report-watch **19228** · schedule-8am **9156** · retention **21588**
- **adb**: OK (`192.168.45.67:36803`) · 앱 pid **10002** · PSS **~621MB** · GL **~24MB** · Views **358**
- **08:00 보고**: 스케줄러 대기 중 → **2026-07-03 08:00 KST** 자동 (`overnight-final-report-20260703-0800.md`) · 내일(7/4)도 영구 루프
- **auto-fix**: **OFF** (`monitor-paused.flag` — overnight record-only · handoff만)
- **야간 이상 (03:00~04:15)**:
  - PSS **1083.9MB** @ 03:28 (CRITICAL ≥950) · GL 144.6 · Views 560
  - 03:58 `PROCESS_NOT_RUNNING` → 04:13 **PID_CHANGE** 4540→10002 (재기동·회수)
  - GL **GL_RECOVERED** @ 03:43 idle_ok — Skia footprint 정상 패턴
- **조치**: `monitor:ensure-daily-8am` · `monitor:ensure-always-on` 재확인 PASS · sessionStart 훅에 8am ensure 보강
- **08:00 P0**: VIEWS 480~570 peak · PSS floor post-restart · `mem-post-dev-recheck` retention

> status: **monitor-stack-ok** · **08:00 자동보고 예약됨** · PSS spike는 8am report에 포함 · 코드 P0는 retention FAIL 시 본 세션


- **개발 반영**: synth ownership 79행 → `tables/content/item_defs.csv` (총 100) · 이중 CSV/빌드 merge 제거 · trade useMemo resync 제거
- **규칙 반영**: `AGENTS.md` · `arcfire-main-lead-agent.mdc` §Table-First ownership · `arcfire-memory-leak-audit-first.mdc` §0-A-2
- **정적 게이트**: audit:memory:all PASS · audit-planet-ownership PASS · tsc PASS
- **감시 재가동** @ 03:00 KST: watch-30m 24156 · 8am scheduler 9156 · watchdog 4844
- **03:00 mem**: PSS 783.7 · GL 59.8 · **Views 480** → VIEWS_RETAINED **watch/FAIL 후보**
- **08:00 보고**: `OVERNIGHT_WATCH_8AM_BRIEF.md` · `overnight-final-report-20260703-0800.md` 예정

> status: **mem-post-dev-recheck PENDING** — 김경제 retention/PSS floor 08:00 handoff · 실기 오로라 무역 아이템탭 확인

## [관측] 2026-07-02 KST — **페라이트 10 CR 3단계 분석 완료** ✅

- **최종**: `docs/economy-evaluation/2026-07-02-ferrite-FINAL-REPORT.md`
- **판정**: **CONDITIONAL_KEEP_10CR** — tier1·sink 적정 / BM 10k/h **순수채굴** 앵커와 **8.3× 불일치**
- **권고 R0**: 10 CR **유지** · BM/play_scenario = **혼합 EV** 공식화 (코드 변경 없음)
- **baseline**: `tools/economy-evaluation/ferrite-anchor-baseline.json` v1.0.0
- **macro SIM**: whale/F2P **3.12** OK

> status: **ferrite-analysis COMPLETE** · no code changes

## [관측] 2026-07-02 KST — **페라이트(ore_ferrite) 10 CR 3단계 경제 정밀 분석** (김경제 배정)

- **지시(김팀장)**: 기초재화 페라이트 10 CR 적정성 — 채굴(30s/개) vs 은하계 전체 경제 **전수 재조사** · 3단계 + 검수 2회
- **계획**: `docs/economy-evaluation/2026-07-02-ferrite-anchor-3stage-plan.md`
- **baseline JSON**: `tools/economy-evaluation/ferrite-anchor-baseline.json`
- **Stage-1 완료**: `docs/economy-evaluation/2026-07-02-ferrite-stage1-report.md`
- **1차 핵심**: 실판매 **1,200 CR/h** vs BM앵커 **10,000 CR/h** → **~8.3×~10× 갭**
- **macro SIM**: KPI ok · whale/F2P **3.12**
- **다음**: 검수-1 → Stage-2 (sink·무역·cohort) → Stage-3 판정

> status: ferrite-analysis **stage1-done** · review1-pending · 코드 수정 없음

## [obs] 2026-07-01 18:00 KST evening watch 18:00 report

- watch-30m PID **25556** report-watch **16916** auto-fix=OFF(record-only)
- mem-monitor: **OK** (PSS 644.8MB GL 45.6MB Views 365 pid=29266)
- report: D:\arcfire20260607\tools\long-run-monitor\logs\evening-watch-report-20260701-1800.md
- latest: tools/long-run-monitor/logs/DAILY_6PM_REPORT_LATEST.md
- timeline marker: EVENING_WATCH_6PM_START
- incidents actionable: 1
  - [2026-07-01 14:40:24] EVENING_WATCH_6PM_START 2026-07-01 14:40 KST ? watch until 18:00 comprehensive report
- rec: evening soak OK retention snapshot + release soak
- future dev: see report section 7

> status: monitor-ok 18:00 KST report done
# 김경제 → 김팀장 Handoff

> **작성**: 김경제 에이전트 (`@김경제`) — 작업 완료·테스트 후 갱신  
> **검수**: 김팀장 에이전트 (`@김팀장`) — `npm run audit:team-lead:daily`

## [관측] 2026-07-01 14:40 KST — 저녁 감시 · **18:00 종합보고** 예약

- **요청**: 18:00까지 상태감시 · 이상·미회수·관리 빈틈·잠재 리스크·향후 개발 메모리 포커스 **일괄 보고**
- **감시**: watch-30m · report-watch · auto-fix=OFF(record-only)
- **baseline**: PSS **689MB** · GL **43MB** · Views **365** (14:29 timeline)
- **18:00 산출**: `evening-watch-report-*.md` · `DAILY_6PM_REPORT_LATEST.md` · `CHAT_REPORT_PENDING.md`
- **brief**: `tools/long-run-monitor/logs/EVENING_WATCH_6PM_BRIEF.md`
- **marker**: `EVENING_WATCH_6PM_START` in incidents.log
- **스케줄러**: `npm run monitor:schedule-6pm-report` (TargetTime 18:00 KST)

> status: monitor-ok · 18:00 KST 종합보고 대기

## [관측] 2026-07-01 00:48 KST — overnight watch → **08:00 정각 보고** 예약

- **요청**: 내일(7/1) AM 8:00까지 메모리 이상 감지 · **08:00 KST 정각 보고**
- **감시**: watch-30m PID **21300** · schedule-8am PID **26052** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **baseline**: PID **23575** · PSS **714MB** · GL **28MB** · Views **365**
- **08:00 산출**: `overnight-final-report-20260701-0800.md` · `DAILY_8AM_REPORT_LATEST.md` · `CHAT_REPORT_PENDING.md`
- **brief**: `tools/long-run-monitor/logs/OVERNIGHT_WATCH_8AM_BRIEF.md`
- **P0**: PSS floor creep · PID_CHANGE(00:13) · PSS_SOFT≥800 advisory

> status: monitor-ok · 08:00 KST 자동보고 대기

## [관측] 2026-06-30 23:28 KST — PSS 계단 787→864 (pid=17958) 전수조사

- **샘플(15m)**: 22:28 PSS **787** GL **32** views **367** → 23:28 PSS **864** (+77) GL **38** (±) views **369** (±)
- **판정**: **PSS_FLOOR_UP** — native_heap **444→485MB** (+41). GL·Views 누수 아님.
- **22:39 +44MB**: 22:34~22:37 **galaxy 왕복**(departure→transit_combat_nav→hub ingress) 직후. STAGE2 ingress Native 할당.
- **22:52·23:22**: `hub_periodic` deep + **hubBackdropNativeRemount** epoch=1·2 — remount 후 native_heap **469→478→485** 계단 (postRemountTrim 미회수).
- **22:19 Fast Refresh**: `route_blur`×3·`boot-perf root_layout` 재실행 — **devMetroReloadGuard 미경유**(Dependency-cycle HMR).
- **조치(김팀장)**: `hub_periodic` **skipBackdropRemount** · HMR `module.hot.dispose` guard · route_blur 20s skip window
- **게이트**: `tsc` · 허브 60m soak native_heap floor · ⚠️ 앱 완전 재시작 후 측정(Metro r floor 잔류)

## [관측] 2026-06-30 20:xx KST — mem 19:43 이후 +218MB 스파이크 전수조사

- **19:43 baseline**: PSS **706** · GL **35** · Native **258** · Views **392** (heartbeat·mem-timeline 일치)
- **19:51 spike**: PSS **924** (+218) · GL **125** (+90) · Native **417** (+159) · Views **558** (+166)
- **직접 트리거(logcat 19:49:23~)**: Metro **Fast Refresh** — `boot-perf root_layout` 재부트·`planet_first_render` 다중·**galaxy_map dispose→mount 2회/초** · `trade_port_planet_resync`×3
- **19:43 이후 코드(미커밋·HEAD=00:01)**: SUB-STAGE blur 버그(**기기 미반영 시** shipyard→route_blur) · genesis hydrate · mining/scan · transit_combat_nav · **19:49 전후 Metro r 리로드**가 주원인
- **현재(~21:xx)**: PSS **~1018** · GL **~224** · Views **558** — 19:51 duplicate tree **미회수** 상태 지속
- **조치(김팀장)**: hubSubStageNavRef(이미) · Metro reload guard **galaxy+combat release** · focus blur `isDevMetroReloadPrepareInFlight` skip · soft Fresco deferred-only
- **필수**: ⚠️ **앱 완전 재시작**(Metro r만으로는 Views 558 잔류) → SUB-STAGE 왕복·mem snapshot
- **예약**: 2h delayed recheck **21:39→23:39 KST** · `run-delayed-mem-recheck.ps1` · 산출 `MEM_RECHECK_DELAYED_LATEST.md`

## [관측] 2026-06-30 — mem-contract-fix (SUB-STAGE blur · soft Fresco · selector)

- **근본 원인**: Phase 2 lifecycle(`beginPlanetHubSuspendingNavigation`) 도입 시 SUB-STAGE push와 STAGE replace가 동일 suspend 경로를 쓰지만, `useFocusEffect` blur는 **무조건** `releasePlanetMainStageSession(route_blur)` 호출 → 허브 마운트 유지 중 Skia/memo/Fresco 전량 teardown → 복귀 re-arm 시 GL spike·Native floor·Views 558
- **감사 공백**: `audit:memory:all` 33/33 PASS였으나 SUB-STAGE blur 게이트 **미검** → 정적 PASS·런타임 FAIL 공존
- **조치(김팀장)**: `hubSubStageNavRef` blur 게이트 · hub soft Fresco **deferred-only** · `planetHubStoreMemoRevisions` · epoch poll session registry · scan unlock account purge · 감사 3건 추가
- **재발 방지**: `usePlanetSubStageMemory` 주석 + `run-memory-audit.cjs` SUB-STAGE/Fresco/selector 체크 · SUB-STAGE 왕복 5회 playtest 필수
- **게이트**: `tsc` · `audit:memory:all` — 런타임: 무역소 왕복 후 GL idle ±15MB · PSS floor

## [관측] 2026-06-30 — mem-post-dev-recheck (스캔·채굴 UI · transit worldmap · genesis)

- **개발 반영**: `planetHubScanUnlockState` session Map · 채굴 일일한도·알림 · `transit_combat_nav` worldmap 복귀 · genesis CSV realign · RevealSlot settled latch · `featureMenuRow` useMemo
- **메모리 조사**: Skia/Canvas 신규 없음 · scan unlock Map 휘발(session·출발 clear) · mining driver 500ms tick·2s UI 스로틀 유지 · transit_combat_nav는 heavyUi abort 생략(의도)
- **정적 게이트**: `tsc` PASS · `audit:memory:all` PASS · `audit:transit-combat-flow` PASS
- **런타임 권장**: 스캔→채굴 탭 10회 서브메뉴 깜박 없음 · 이동중 전투 도주→worldmap 지도 표시 · genesis realign 후 Arcadia R floor

> status: mem-post-dev-recheck · 김경제 retention/GL 실측 대기

## [관측] 2026-06-30 09:38 KST — **정오(12:00) 감시 시작** · 자동보고 예약

- **김경제 감시**: watch-30m PID **21300** · report-watch PID **13188** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **baseline**: PSS **721.8MB** · GL **27.3MB** · Views **381** · pid=1094
- **간격**: mem 15m · incident 10m · **12:00 KST** 자동보고(`NOON_WATCH_START` marker)
- **brief**: `tools/long-run-monitor/logs/NOON_WATCH_BRIEF.md`
- **P0**: mem-profile-fix soak — native_heap floor 계단 재발 여부

> status: monitor-ok · 정오 보고 대기

## [관측] 2026-06-30 — mem-profile-fix (PSS≥950 · native floor 계단)

- **근본**: 6/30 02:00 KST `PSS_SPIKE +214MB` — GL ~26MB 유지, **native_heap 314→483MB** (graphics 아님). 01:45 idle(views=21) → 02:00 hub 재활성(views=371)과 15분 `runDeepNativeReclaimPass` 겹침.
- **원인**: deep reclaim이 **Fresco trim 전 RN 백드롭 remount** → 구 bitmap 해제 전 신규 Image 할당(native floor 계단). soft(5m)·deep(15m) 동시 발화 race. PSS_SOFT_CEILING은 monitor만 기록·앱 측 trim 미약.
- **조치(김팀장)**: trim 선행 → cooldown(30m) 후 remount · post-remount 2차 trim · hub reclaim 45s coalesce · 백그라운드 trim+deep(skip remount) · mineral deposit 캐시 genesis-only 빌드
- **게이트**: `tsc` · `audit:memory:all` — 런타임: 허브 30m soak native_heap floor · route_blur PSS 회복

## [관측] 2026-06-29 — mem-post-dev-recheck (자원 생태계 Phase2)

- **개발 반영**: 광물 레저·5스탯 genesis·채굴 소행성 부착(RN) · worldmap 다중홉 · stat authority environment gate
- **메모리 조사**: 신규 Skia Canvas 없음 · ledger persist 1.5s coalesce · mining driver 기존 500ms tick · daily batch 1회
- **정적 게이트**: `tsc` PASS · `build:balance-tables` PASS (100 synth genesis rows)
- **런타임 권장**: 채굴 start/stop GL mtrack · worldmap 3홉 이동 후 PSS floor 확인

## [관측] 2026-06-27 17:04 KST — 오후 감시 · 17:00 자동보고

- **김경제 감시**: watch-30m PID **30408** · report-watch PID **26380** · auto-fix=OFF(record-only)
- **mem-monitor**: **OK** (PSS 788.3MB · GL 34.2MB · Views 368 · pid=20481)
- **report**: `D:\arcfire20260607\tools\long-run-monitor\logs\afternoon-watch-report-20260627-1700.md`
- **latest summary**: `tools/long-run-monitor/logs/DAILY_5PM_REPORT_LATEST.md`
- **timeline marker**: AFTERNOON_WATCH_START
- **incidents (actionable tail)**: 10
  - [2026-06-27 10:34:58] PSS_SOFT_CEILING pss=930.9 gl=152.7 views=553 native_reclaim_advisory
  - [2026-06-27 10:55:45] PSS_SOFT_CEILING pss=934.7 gl=156.7 views=575 native_reclaim_advisory
  - [2026-06-27 11:15:33] PSS_SOFT_CEILING pss=807.7 gl=40.1 views=388 native_reclaim_advisory
  - [2026-06-27 11:16:32] PSS_SOFT_CEILING pss=811.8 gl=42.1 views=388 native_reclaim_advisory
  - [2026-06-27 11:26:56] PSS_SOFT_CEILING pss=852.5 gl=46.5 views=403 native_reclaim_advisory
  - [2026-06-27 11:37:16] PSS_SOFT_CEILING pss=840 gl=46.3 views=389 native_reclaim_advisory
  - [2026-06-27 11:45:58] PSS_SOFT_CEILING pss=873.1 gl=47.2 views=392 native_reclaim_advisory
  - [2026-06-27 11:47:36] PSS_SOFT_CEILING pss=849 gl=49 views=393 native_reclaim_advisory
  - [2026-06-27 13:21:22] PSS_SOFT_CEILING pss=883.5 gl=90.2 views=465 native_reclaim_advisory
  - [2026-06-27 08:00:05] AFTERNOON_WATCH_5PM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\afternoon-watch-report-20260627-1700.md
- **권장(김팀장 1안)**: afternoon soak OK — review mem-timeline floor

> status: monitor-ok · 17:00 KST 자동보고 완료

## [관측] 2026-06-28 09:02:56 KST — **데일리 08:00 상시 자동보고** (CRITICAL)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **33096** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **CRITICAL** (PSS 1015.7MB · GL 141.5MB · Views 555 · pid=4624)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260628-0800.md
- **verdict**: **CRITICAL**
- **incidents (actionable tail)**: 3
  - [2026-06-28 08:00:01] DAILY_8AM_REPORT 2026-06-28 08:00:01 KST
  - [2026-06-28 08:57:10] DAILY_8AM_REPORT 2026-06-28 08:57:10 KST
  - [2026-06-28 09:02:56] DAILY_8AM_REPORT 2026-06-28 09:02:56 KST
- **권장(김팀장 1안)**: PSS>=950 — hub exit / Skia dispose P0

> status: **ready-for-team-lead-action** · **08:00 보고체 유지**

## [관측] 2026-06-28 22:00 KST — 저녁 감시 · 22:00 자동보고

- **김경제 감시**: watch-30m PID **33096** · report-watch PID **3976** · auto-fix=OFF(record-only)
- **mem-monitor**: **OK** (PSS 559.9MB · GL 12.2MB · Views 99 · pid=15084)
- **report**: `D:\arcfire20260607\tools\long-run-monitor\logs\evening-watch-report-20260628-2200.md`
- **latest summary**: `tools/long-run-monitor/logs/DAILY_5PM_REPORT_LATEST.md`
- **timeline marker**: EVENING_WATCH_START
- **incidents (actionable tail)**: 6
  - [2026-06-28 14:18:55] PSS_SOFT_CEILING pss=876.5 gl=36 views=328 native_reclaim_advisory
  - [2026-06-28 14:29:14] PSS_SOFT_CEILING pss=939 gl=54.7 views=420 native_reclaim_advisory
  - [2026-06-28 15:00:19] PSS_SOFT_CEILING pss=870.6 gl=40 views=352 native_reclaim_advisory
  - [2026-06-28 15:00:56] PSS_SOFT_CEILING pss=836 gl=39.4 views=326 native_reclaim_advisory
  - [2026-06-28 15:52:02] PSS_SOFT_CEILING pss=913 gl=59.2 views=332 native_reclaim_advisory
  - [2026-06-28 19:33:38] PSS_SOFT_CEILING pss=845.8 gl=114.4 views=632 native_reclaim_advisory
- **권장(김팀장 1안)**: afternoon soak OK — review mem-timeline floor

> status: monitor-ok · 22:00 KST 자동보고 완료

## [관측] 2026-06-29 08:00:00 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **23520** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 760.1MB · GL 35.0MB · Views 393 · pid=31958)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 1
  - [2026-06-29 08:00:00] DAILY_8AM_REPORT 2026-06-29 08:00:00 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-06-29 08:02:04 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **23520** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 763.2MB · GL 35.0MB · Views 377 · pid=31958)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 3
  - [2026-06-29 08:00:00] DAILY_8AM_REPORT 2026-06-29 08:00:00 KST
  - [2026-06-29 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:02:04] DAILY_8AM_REPORT 2026-06-29 08:02:04 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-06-29 08:04:06 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **23520** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 754.5MB · GL 33.0MB · Views 376 · pid=31958)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 5
  - [2026-06-29 08:00:00] DAILY_8AM_REPORT 2026-06-29 08:00:00 KST
  - [2026-06-29 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:02:04] DAILY_8AM_REPORT 2026-06-29 08:02:04 KST
  - [2026-06-29 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:04:06] DAILY_8AM_REPORT 2026-06-29 08:04:06 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-06-29 08:06:07 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **23520** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 776.7MB · GL 33.7MB · Views 377 · pid=31958)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 7
  - [2026-06-29 08:00:00] DAILY_8AM_REPORT 2026-06-29 08:00:00 KST
  - [2026-06-29 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:02:04] DAILY_8AM_REPORT 2026-06-29 08:02:04 KST
  - [2026-06-29 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:04:06] DAILY_8AM_REPORT 2026-06-29 08:04:06 KST
  - [2026-06-29 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:06:07] DAILY_8AM_REPORT 2026-06-29 08:06:07 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-06-29 08:08:10 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **23520** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 764.4MB · GL 33.3MB · Views 402 · pid=31958)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 9
  - [2026-06-29 08:00:00] DAILY_8AM_REPORT 2026-06-29 08:00:00 KST
  - [2026-06-29 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:02:04] DAILY_8AM_REPORT 2026-06-29 08:02:04 KST
  - [2026-06-29 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:04:06] DAILY_8AM_REPORT 2026-06-29 08:04:06 KST
  - [2026-06-29 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:06:07] DAILY_8AM_REPORT 2026-06-29 08:06:07 KST
  - [2026-06-29 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:08:10] DAILY_8AM_REPORT 2026-06-29 08:08:10 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-06-29 08:10:11 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **23520** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 764.5MB · GL 35.0MB · Views 373 · pid=31958)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 11
  - [2026-06-29 08:00:00] DAILY_8AM_REPORT 2026-06-29 08:00:00 KST
  - [2026-06-29 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:02:04] DAILY_8AM_REPORT 2026-06-29 08:02:04 KST
  - [2026-06-29 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:04:06] DAILY_8AM_REPORT 2026-06-29 08:04:06 KST
  - [2026-06-29 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:06:07] DAILY_8AM_REPORT 2026-06-29 08:06:07 KST
  - [2026-06-29 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:08:10] DAILY_8AM_REPORT 2026-06-29 08:08:10 KST
  - [2026-06-29 08:08:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:10:11] DAILY_8AM_REPORT 2026-06-29 08:10:11 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-06-29 08:12:12 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **23520** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 771.4MB · GL 35.0MB · Views 377 · pid=31958)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 13
  - [2026-06-29 08:00:00] DAILY_8AM_REPORT 2026-06-29 08:00:00 KST
  - [2026-06-29 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:02:04] DAILY_8AM_REPORT 2026-06-29 08:02:04 KST
  - [2026-06-29 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:04:06] DAILY_8AM_REPORT 2026-06-29 08:04:06 KST
  - [2026-06-29 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:06:07] DAILY_8AM_REPORT 2026-06-29 08:06:07 KST
  - [2026-06-29 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:08:10] DAILY_8AM_REPORT 2026-06-29 08:08:10 KST
  - [2026-06-29 08:08:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:10:11] DAILY_8AM_REPORT 2026-06-29 08:10:11 KST
  - [2026-06-29 08:10:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:12:12] DAILY_8AM_REPORT 2026-06-29 08:12:12 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-06-29 08:14:13 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **23520** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 756.2MB · GL 33.0MB · Views 376 · pid=31958)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 15
  - [2026-06-29 08:00:00] DAILY_8AM_REPORT 2026-06-29 08:00:00 KST
  - [2026-06-29 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:02:04] DAILY_8AM_REPORT 2026-06-29 08:02:04 KST
  - [2026-06-29 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:04:06] DAILY_8AM_REPORT 2026-06-29 08:04:06 KST
  - [2026-06-29 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:06:07] DAILY_8AM_REPORT 2026-06-29 08:06:07 KST
  - [2026-06-29 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:08:10] DAILY_8AM_REPORT 2026-06-29 08:08:10 KST
  - [2026-06-29 08:08:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:10:11] DAILY_8AM_REPORT 2026-06-29 08:10:11 KST
  - [2026-06-29 08:10:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:12:12] DAILY_8AM_REPORT 2026-06-29 08:12:12 KST
  - [2026-06-29 08:12:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260629-0800.md verdict=OK
  - [2026-06-29 08:14:13] DAILY_8AM_REPORT 2026-06-29 08:14:13 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-06-30 08:00:00 KST — **데일리 08:00 상시 자동보고** (CRITICAL)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **23520** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **CRITICAL** (PSS 971.1MB · GL 30.4MB · Views 387 · pid=23098)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md
- **verdict**: **CRITICAL**
- **incidents (actionable tail)**: 1
  - [2026-06-30 08:00:00] DAILY_8AM_REPORT 2026-06-30 08:00:00 KST
- **권장(김팀장 1안)**: PSS>=950 — hub exit / Skia dispose P0

> status: **ready-for-team-lead-action** · **08:00 보고체 유지**

## [관측] 2026-06-30 08:02:04 KST — **데일리 08:00 상시 자동보고** (CRITICAL)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **23520** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **CRITICAL** (PSS 953.5MB · GL 30.2MB · Views 382 · pid=23098)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md
- **verdict**: **CRITICAL**
- **incidents (actionable tail)**: 3
  - [2026-06-30 08:00:00] DAILY_8AM_REPORT 2026-06-30 08:00:00 KST
  - [2026-06-30 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:02:04] DAILY_8AM_REPORT 2026-06-30 08:02:04 KST
- **권장(김팀장 1안)**: PSS>=950 — hub exit / Skia dispose P0

> status: **ready-for-team-lead-action** · **08:00 보고체 유지**

## [관측] 2026-06-30 08:04:06 KST — **데일리 08:00 상시 자동보고** (CRITICAL)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **23520** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **CRITICAL** (PSS 957.4MB · GL 32.2MB · Views 384 · pid=23098)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md
- **verdict**: **CRITICAL**
- **incidents (actionable tail)**: 5
  - [2026-06-30 08:00:00] DAILY_8AM_REPORT 2026-06-30 08:00:00 KST
  - [2026-06-30 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:02:04] DAILY_8AM_REPORT 2026-06-30 08:02:04 KST
  - [2026-06-30 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:04:06] DAILY_8AM_REPORT 2026-06-30 08:04:06 KST
- **권장(김팀장 1안)**: PSS>=950 — hub exit / Skia dispose P0

> status: **ready-for-team-lead-action** · **08:00 보고체 유지**

## [관측] 2026-06-30 08:06:07 KST — **데일리 08:00 상시 자동보고** (CRITICAL)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **23520** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **CRITICAL** (PSS 958.8MB · GL 30.2MB · Views 384 · pid=23098)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md
- **verdict**: **CRITICAL**
- **incidents (actionable tail)**: 7
  - [2026-06-30 08:00:00] DAILY_8AM_REPORT 2026-06-30 08:00:00 KST
  - [2026-06-30 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:02:04] DAILY_8AM_REPORT 2026-06-30 08:02:04 KST
  - [2026-06-30 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:04:06] DAILY_8AM_REPORT 2026-06-30 08:04:06 KST
  - [2026-06-30 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:06:07] DAILY_8AM_REPORT 2026-06-30 08:06:07 KST
- **권장(김팀장 1안)**: PSS>=950 — hub exit / Skia dispose P0

> status: **ready-for-team-lead-action** · **08:00 보고체 유지**

## [관측] 2026-06-30 08:08:10 KST — **데일리 08:00 상시 자동보고** (CRITICAL)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **23520** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **CRITICAL** (PSS 960.9MB · GL 30.2MB · Views 384 · pid=23098)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md
- **verdict**: **CRITICAL**
- **incidents (actionable tail)**: 9
  - [2026-06-30 08:00:00] DAILY_8AM_REPORT 2026-06-30 08:00:00 KST
  - [2026-06-30 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:02:04] DAILY_8AM_REPORT 2026-06-30 08:02:04 KST
  - [2026-06-30 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:04:06] DAILY_8AM_REPORT 2026-06-30 08:04:06 KST
  - [2026-06-30 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:06:07] DAILY_8AM_REPORT 2026-06-30 08:06:07 KST
  - [2026-06-30 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:08:10] DAILY_8AM_REPORT 2026-06-30 08:08:10 KST
- **권장(김팀장 1안)**: PSS>=950 — hub exit / Skia dispose P0

> status: **ready-for-team-lead-action** · **08:00 보고체 유지**

## [관측] 2026-06-30 08:10:11 KST — **데일리 08:00 상시 자동보고** (CRITICAL)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **23520** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **CRITICAL** (PSS 985.8MB · GL 30.9MB · Views 385 · pid=23098)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md
- **verdict**: **CRITICAL**
- **incidents (actionable tail)**: 11
  - [2026-06-30 08:00:00] DAILY_8AM_REPORT 2026-06-30 08:00:00 KST
  - [2026-06-30 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:02:04] DAILY_8AM_REPORT 2026-06-30 08:02:04 KST
  - [2026-06-30 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:04:06] DAILY_8AM_REPORT 2026-06-30 08:04:06 KST
  - [2026-06-30 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:06:07] DAILY_8AM_REPORT 2026-06-30 08:06:07 KST
  - [2026-06-30 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:08:10] DAILY_8AM_REPORT 2026-06-30 08:08:10 KST
  - [2026-06-30 08:08:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:10:11] DAILY_8AM_REPORT 2026-06-30 08:10:11 KST
- **권장(김팀장 1안)**: PSS>=950 — hub exit / Skia dispose P0

> status: **ready-for-team-lead-action** · **08:00 보고체 유지**

## [관측] 2026-06-30 08:12:13 KST — **데일리 08:00 상시 자동보고** (CRITICAL)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **23520** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **CRITICAL** (PSS 979.9MB · GL 32.5MB · Views 409 · pid=23098)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md
- **verdict**: **CRITICAL**
- **incidents (actionable tail)**: 13
  - [2026-06-30 08:00:00] DAILY_8AM_REPORT 2026-06-30 08:00:00 KST
  - [2026-06-30 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:02:04] DAILY_8AM_REPORT 2026-06-30 08:02:04 KST
  - [2026-06-30 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:04:06] DAILY_8AM_REPORT 2026-06-30 08:04:06 KST
  - [2026-06-30 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:06:07] DAILY_8AM_REPORT 2026-06-30 08:06:07 KST
  - [2026-06-30 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:08:10] DAILY_8AM_REPORT 2026-06-30 08:08:10 KST
  - [2026-06-30 08:08:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:10:11] DAILY_8AM_REPORT 2026-06-30 08:10:11 KST
  - [2026-06-30 08:10:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:12:13] DAILY_8AM_REPORT 2026-06-30 08:12:13 KST
- **권장(김팀장 1안)**: PSS>=950 — hub exit / Skia dispose P0

> status: **ready-for-team-lead-action** · **08:00 보고체 유지**

## [관측] 2026-06-30 08:14:15 KST — **데일리 08:00 상시 자동보고** (CRITICAL)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **23520** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **CRITICAL** (PSS 972.7MB · GL 30.2MB · Views 384 · pid=23098)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md
- **verdict**: **CRITICAL**
- **incidents (actionable tail)**: 15
  - [2026-06-30 08:00:00] DAILY_8AM_REPORT 2026-06-30 08:00:00 KST
  - [2026-06-30 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:02:04] DAILY_8AM_REPORT 2026-06-30 08:02:04 KST
  - [2026-06-30 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:04:06] DAILY_8AM_REPORT 2026-06-30 08:04:06 KST
  - [2026-06-30 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:06:07] DAILY_8AM_REPORT 2026-06-30 08:06:07 KST
  - [2026-06-30 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:08:10] DAILY_8AM_REPORT 2026-06-30 08:08:10 KST
  - [2026-06-30 08:08:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:10:11] DAILY_8AM_REPORT 2026-06-30 08:10:11 KST
  - [2026-06-30 08:10:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:12:13] DAILY_8AM_REPORT 2026-06-30 08:12:13 KST
  - [2026-06-30 08:12:13] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260630-0800.md verdict=CRITICAL
  - [2026-06-30 08:14:15] DAILY_8AM_REPORT 2026-06-30 08:14:15 KST
- **권장(김팀장 1안)**: PSS>=950 — hub exit / Skia dispose P0

> status: **ready-for-team-lead-action** · **08:00 보고체 유지**

## [관측] 2026-06-30 12:00 KST — 저녁 감시 · 12:00 자동보고

- **김경제 감시**: watch-30m PID **21300** · report-watch PID **16916** · auto-fix=OFF(record-only)
- **mem-monitor**: **OK** (PSS 742.7MB · GL 36.9MB · Views 375 · pid=8290)
- **report**: `d:\arcfire20260607\tools\long-run-monitor\logs\evening-watch-report-20260630-1200.md`
- **latest summary**: `tools/long-run-monitor/logs/DAILY_5PM_REPORT_LATEST.md`
- **timeline marker**: NOON_WATCH_START
- **incidents (actionable tail)**: 5
  - [2026-06-30 09:37:56] AFTERNOON_WATCH_START 2026-06-30 09:37:56 KST
  - [2026-06-30 09:53:32] PSS_SOFT_CEILING pss=801.2 gl=35.5 views=392 native_reclaim_advisory
  - [2026-06-30 10:08:53] PSS_SOFT_CEILING pss=800.1 gl=37.3 views=372 native_reclaim_advisory
  - [2026-06-30 10:24:14] PSS_SOFT_CEILING pss=843.4 gl=39.5 views=375 native_reclaim_advisory
  - [2026-06-30 10:39:34] PSS_SOFT_CEILING pss=912.9 gl=149.3 views=371 native_reclaim_advisory
- **권장(김팀장 1안)**: afternoon soak OK — review mem-timeline floor

> status: monitor-ok · 12:00 KST 자동보고 완료

## [관측] 2026-07-01 08:00:00 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **21300** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 695.4MB · GL 29.5MB · Views 372 · pid=23575)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 1
  - [2026-07-01 08:00:00] DAILY_8AM_REPORT 2026-07-01 08:00:00 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-01 08:02:05 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **21300** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 709.9MB · GL 28.1MB · Views 380 · pid=23575)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 3
  - [2026-07-01 08:00:00] DAILY_8AM_REPORT 2026-07-01 08:00:00 KST
  - [2026-07-01 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:02:05] DAILY_8AM_REPORT 2026-07-01 08:02:05 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-01 08:04:06 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **21300** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 686.3MB · GL 27.5MB · Views 367 · pid=23575)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 5
  - [2026-07-01 08:00:00] DAILY_8AM_REPORT 2026-07-01 08:00:00 KST
  - [2026-07-01 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:02:05] DAILY_8AM_REPORT 2026-07-01 08:02:05 KST
  - [2026-07-01 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:04:06] DAILY_8AM_REPORT 2026-07-01 08:04:06 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-01 08:06:07 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **21300** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 685.5MB · GL 27.5MB · Views 367 · pid=23575)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 7
  - [2026-07-01 08:00:00] DAILY_8AM_REPORT 2026-07-01 08:00:00 KST
  - [2026-07-01 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:02:05] DAILY_8AM_REPORT 2026-07-01 08:02:05 KST
  - [2026-07-01 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:04:06] DAILY_8AM_REPORT 2026-07-01 08:04:06 KST
  - [2026-07-01 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:06:07] DAILY_8AM_REPORT 2026-07-01 08:06:07 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-01 08:08:08 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **21300** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 687.8MB · GL 27.5MB · Views 372 · pid=23575)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 9
  - [2026-07-01 08:00:00] DAILY_8AM_REPORT 2026-07-01 08:00:00 KST
  - [2026-07-01 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:02:05] DAILY_8AM_REPORT 2026-07-01 08:02:05 KST
  - [2026-07-01 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:04:06] DAILY_8AM_REPORT 2026-07-01 08:04:06 KST
  - [2026-07-01 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:06:07] DAILY_8AM_REPORT 2026-07-01 08:06:07 KST
  - [2026-07-01 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:08:08] DAILY_8AM_REPORT 2026-07-01 08:08:08 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-01 08:10:11 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **21300** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 682.3MB · GL 27.5MB · Views 368 · pid=23575)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 11
  - [2026-07-01 08:00:00] DAILY_8AM_REPORT 2026-07-01 08:00:00 KST
  - [2026-07-01 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:02:05] DAILY_8AM_REPORT 2026-07-01 08:02:05 KST
  - [2026-07-01 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:04:06] DAILY_8AM_REPORT 2026-07-01 08:04:06 KST
  - [2026-07-01 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:06:07] DAILY_8AM_REPORT 2026-07-01 08:06:07 KST
  - [2026-07-01 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:08:08] DAILY_8AM_REPORT 2026-07-01 08:08:08 KST
  - [2026-07-01 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:10:11] DAILY_8AM_REPORT 2026-07-01 08:10:11 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-01 08:12:12 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **21300** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 711.6MB · GL 28.1MB · Views 389 · pid=23575)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 13
  - [2026-07-01 08:00:00] DAILY_8AM_REPORT 2026-07-01 08:00:00 KST
  - [2026-07-01 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:02:05] DAILY_8AM_REPORT 2026-07-01 08:02:05 KST
  - [2026-07-01 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:04:06] DAILY_8AM_REPORT 2026-07-01 08:04:06 KST
  - [2026-07-01 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:06:07] DAILY_8AM_REPORT 2026-07-01 08:06:07 KST
  - [2026-07-01 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:08:08] DAILY_8AM_REPORT 2026-07-01 08:08:08 KST
  - [2026-07-01 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:10:11] DAILY_8AM_REPORT 2026-07-01 08:10:11 KST
  - [2026-07-01 08:10:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:12:12] DAILY_8AM_REPORT 2026-07-01 08:12:12 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-01 08:14:14 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **21300** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 684.2MB · GL 29.5MB · Views 367 · pid=23575)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 15
  - [2026-07-01 08:00:00] DAILY_8AM_REPORT 2026-07-01 08:00:00 KST
  - [2026-07-01 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:02:05] DAILY_8AM_REPORT 2026-07-01 08:02:05 KST
  - [2026-07-01 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:04:06] DAILY_8AM_REPORT 2026-07-01 08:04:06 KST
  - [2026-07-01 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:06:07] DAILY_8AM_REPORT 2026-07-01 08:06:07 KST
  - [2026-07-01 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:08:08] DAILY_8AM_REPORT 2026-07-01 08:08:08 KST
  - [2026-07-01 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:10:11] DAILY_8AM_REPORT 2026-07-01 08:10:11 KST
  - [2026-07-01 08:10:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:12:12] DAILY_8AM_REPORT 2026-07-01 08:12:12 KST
  - [2026-07-01 08:12:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:14:14] DAILY_8AM_REPORT 2026-07-01 08:14:14 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-01 08:20:23 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **21300** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.197:37573)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 811.8MB · GL 127.1MB · Views 558 · pid=23575)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 15
  - [2026-07-01 08:02:05] DAILY_8AM_REPORT 2026-07-01 08:02:05 KST
  - [2026-07-01 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:04:06] DAILY_8AM_REPORT 2026-07-01 08:04:06 KST
  - [2026-07-01 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:06:07] DAILY_8AM_REPORT 2026-07-01 08:06:07 KST
  - [2026-07-01 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:08:08] DAILY_8AM_REPORT 2026-07-01 08:08:08 KST
  - [2026-07-01 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:10:11] DAILY_8AM_REPORT 2026-07-01 08:10:11 KST
  - [2026-07-01 08:10:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:12:12] DAILY_8AM_REPORT 2026-07-01 08:12:12 KST
  - [2026-07-01 08:12:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:14:14] DAILY_8AM_REPORT 2026-07-01 08:14:14 KST
  - [2026-07-01 08:14:14] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260701-0800.md verdict=OK
  - [2026-07-01 08:20:23] DAILY_8AM_REPORT 2026-07-01 08:20:23 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-02 08:05:18 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **24156** · auto-fix=OFF(record-only)
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 660.2MB · GL 39.8MB · Views 368 · pid=18681)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260702-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 1
  - [2026-07-02 08:05:18] DAILY_8AM_REPORT 2026-07-02 08:05:18 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-02 08:07:22 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **24156** · auto-fix=OFF(record-only)
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 643.5MB · GL 39.8MB · Views 368 · pid=18681)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260702-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 3
  - [2026-07-02 08:05:18] DAILY_8AM_REPORT 2026-07-02 08:05:18 KST
  - [2026-07-02 08:05:18] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260702-0800.md verdict=OK
  - [2026-07-02 08:07:22] DAILY_8AM_REPORT 2026-07-02 08:07:22 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-02 08:09:23 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **24156** · auto-fix=OFF(record-only)
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 632.1MB · GL 37.8MB · Views 368 · pid=18681)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260702-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 5
  - [2026-07-02 08:05:18] DAILY_8AM_REPORT 2026-07-02 08:05:18 KST
  - [2026-07-02 08:05:18] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260702-0800.md verdict=OK
  - [2026-07-02 08:07:22] DAILY_8AM_REPORT 2026-07-02 08:07:22 KST
  - [2026-07-02 08:07:22] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260702-0800.md verdict=OK
  - [2026-07-02 08:09:23] DAILY_8AM_REPORT 2026-07-02 08:09:23 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-02 08:11:25 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **24156** · auto-fix=OFF(record-only)
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 635.0MB · GL 37.8MB · Views 370 · pid=18681)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260702-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 7
  - [2026-07-02 08:05:18] DAILY_8AM_REPORT 2026-07-02 08:05:18 KST
  - [2026-07-02 08:05:18] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260702-0800.md verdict=OK
  - [2026-07-02 08:07:22] DAILY_8AM_REPORT 2026-07-02 08:07:22 KST
  - [2026-07-02 08:07:22] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260702-0800.md verdict=OK
  - [2026-07-02 08:09:23] DAILY_8AM_REPORT 2026-07-02 08:09:23 KST
  - [2026-07-02 08:09:23] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260702-0800.md verdict=OK
  - [2026-07-02 08:11:25] DAILY_8AM_REPORT 2026-07-02 08:11:25 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-02 08:13:27 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **24156** · auto-fix=OFF(record-only)
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 638.3MB · GL 37.8MB · Views 367 · pid=18681)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260702-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 9
  - [2026-07-02 08:05:18] DAILY_8AM_REPORT 2026-07-02 08:05:18 KST
  - [2026-07-02 08:05:18] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260702-0800.md verdict=OK
  - [2026-07-02 08:07:22] DAILY_8AM_REPORT 2026-07-02 08:07:22 KST
  - [2026-07-02 08:07:22] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260702-0800.md verdict=OK
  - [2026-07-02 08:09:23] DAILY_8AM_REPORT 2026-07-02 08:09:23 KST
  - [2026-07-02 08:09:23] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260702-0800.md verdict=OK
  - [2026-07-02 08:11:25] DAILY_8AM_REPORT 2026-07-02 08:11:25 KST
  - [2026-07-02 08:11:25] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260702-0800.md verdict=OK
  - [2026-07-02 08:13:27] DAILY_8AM_REPORT 2026-07-02 08:13:27 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-03 08:00:00 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **24156** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.67:36803)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 686.9MB · GL 35.7MB · Views 389 · pid=10002)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 1
  - [2026-07-03 08:00:00] DAILY_8AM_REPORT 2026-07-03 08:00:00 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-03 08:02:04 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **24156** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.67:36803)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 686.7MB · GL 33.6MB · Views 366 · pid=10002)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 3
  - [2026-07-03 08:00:00] DAILY_8AM_REPORT 2026-07-03 08:00:00 KST
  - [2026-07-03 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:02:04] DAILY_8AM_REPORT 2026-07-03 08:02:04 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-03 08:04:05 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **24156** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.67:36803)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 664.0MB · GL 33.4MB · Views 363 · pid=10002)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 5
  - [2026-07-03 08:00:00] DAILY_8AM_REPORT 2026-07-03 08:00:00 KST
  - [2026-07-03 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:02:04] DAILY_8AM_REPORT 2026-07-03 08:02:04 KST
  - [2026-07-03 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:04:05] DAILY_8AM_REPORT 2026-07-03 08:04:05 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-03 08:06:06 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **24156** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.67:36803)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 669.1MB · GL 33.4MB · Views 359 · pid=10002)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 7
  - [2026-07-03 08:00:00] DAILY_8AM_REPORT 2026-07-03 08:00:00 KST
  - [2026-07-03 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:02:04] DAILY_8AM_REPORT 2026-07-03 08:02:04 KST
  - [2026-07-03 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:04:05] DAILY_8AM_REPORT 2026-07-03 08:04:05 KST
  - [2026-07-03 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:06:06] DAILY_8AM_REPORT 2026-07-03 08:06:06 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-03 08:08:07 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **24156** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.67:36803)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 668.4MB · GL 33.4MB · Views 363 · pid=10002)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 9
  - [2026-07-03 08:00:00] DAILY_8AM_REPORT 2026-07-03 08:00:00 KST
  - [2026-07-03 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:02:04] DAILY_8AM_REPORT 2026-07-03 08:02:04 KST
  - [2026-07-03 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:04:05] DAILY_8AM_REPORT 2026-07-03 08:04:05 KST
  - [2026-07-03 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:06:06] DAILY_8AM_REPORT 2026-07-03 08:06:06 KST
  - [2026-07-03 08:06:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:08:07] DAILY_8AM_REPORT 2026-07-03 08:08:07 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-03 08:10:09 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **24156** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.67:36803)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 676.1MB · GL 34.4MB · Views 388 · pid=10002)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 11
  - [2026-07-03 08:00:00] DAILY_8AM_REPORT 2026-07-03 08:00:00 KST
  - [2026-07-03 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:02:04] DAILY_8AM_REPORT 2026-07-03 08:02:04 KST
  - [2026-07-03 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:04:05] DAILY_8AM_REPORT 2026-07-03 08:04:05 KST
  - [2026-07-03 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:06:06] DAILY_8AM_REPORT 2026-07-03 08:06:06 KST
  - [2026-07-03 08:06:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:08:07] DAILY_8AM_REPORT 2026-07-03 08:08:07 KST
  - [2026-07-03 08:08:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:10:09] DAILY_8AM_REPORT 2026-07-03 08:10:09 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-03 08:12:11 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **24156** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.67:36803)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 694.5MB · GL 35.0MB · Views 380 · pid=10002)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 13
  - [2026-07-03 08:00:00] DAILY_8AM_REPORT 2026-07-03 08:00:00 KST
  - [2026-07-03 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:02:04] DAILY_8AM_REPORT 2026-07-03 08:02:04 KST
  - [2026-07-03 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:04:05] DAILY_8AM_REPORT 2026-07-03 08:04:05 KST
  - [2026-07-03 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:06:06] DAILY_8AM_REPORT 2026-07-03 08:06:06 KST
  - [2026-07-03 08:06:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:08:07] DAILY_8AM_REPORT 2026-07-03 08:08:07 KST
  - [2026-07-03 08:08:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:10:09] DAILY_8AM_REPORT 2026-07-03 08:10:09 KST
  - [2026-07-03 08:10:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:12:11] DAILY_8AM_REPORT 2026-07-03 08:12:11 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-03 08:14:12 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **24156** · auto-fix=OFF(record-only)
- **adb**: OK (192.168.45.67:36803)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 694.3MB · GL 34.6MB · Views 384 · pid=10002)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 15
  - [2026-07-03 08:00:00] DAILY_8AM_REPORT 2026-07-03 08:00:00 KST
  - [2026-07-03 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:02:04] DAILY_8AM_REPORT 2026-07-03 08:02:04 KST
  - [2026-07-03 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:04:05] DAILY_8AM_REPORT 2026-07-03 08:04:05 KST
  - [2026-07-03 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:06:06] DAILY_8AM_REPORT 2026-07-03 08:06:06 KST
  - [2026-07-03 08:06:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:08:07] DAILY_8AM_REPORT 2026-07-03 08:08:07 KST
  - [2026-07-03 08:08:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:10:09] DAILY_8AM_REPORT 2026-07-03 08:10:09 KST
  - [2026-07-03 08:10:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:12:11] DAILY_8AM_REPORT 2026-07-03 08:12:11 KST
  - [2026-07-03 08:12:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:14:12] DAILY_8AM_REPORT 2026-07-03 08:14:12 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-04 08:00:00 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 692.9MB · GL 36.5MB · Views 374 · pid=10212)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 4
  - [2026-07-03 08:12:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-03 08:14:12] DAILY_8AM_REPORT 2026-07-03 08:14:12 KST
  - [2026-07-03 08:14:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-04 08:00:00] DAILY_8AM_REPORT 2026-07-04 08:00:00 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-04 08:02:08 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 815.1MB · GL 145.4MB · Views 558 · pid=10212)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 4
  - [2026-07-03 08:14:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260703-0800.md verdict=OK
  - [2026-07-04 08:00:00] DAILY_8AM_REPORT 2026-07-04 08:00:00 KST
  - [2026-07-04 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:02:08] DAILY_8AM_REPORT 2026-07-04 08:02:08 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-04 08:04:10 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 688.1MB · GL 35.2MB · Views 364 · pid=10212)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 5
  - [2026-07-04 08:00:00] DAILY_8AM_REPORT 2026-07-04 08:00:00 KST
  - [2026-07-04 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:02:08] DAILY_8AM_REPORT 2026-07-04 08:02:08 KST
  - [2026-07-04 08:02:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:04:10] DAILY_8AM_REPORT 2026-07-04 08:04:10 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-04 08:06:11 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 710.0MB · GL 33.9MB · Views 378 · pid=10212)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 7
  - [2026-07-04 08:00:00] DAILY_8AM_REPORT 2026-07-04 08:00:00 KST
  - [2026-07-04 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:02:08] DAILY_8AM_REPORT 2026-07-04 08:02:08 KST
  - [2026-07-04 08:02:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:04:10] DAILY_8AM_REPORT 2026-07-04 08:04:10 KST
  - [2026-07-04 08:04:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:06:11] DAILY_8AM_REPORT 2026-07-04 08:06:11 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-04 08:08:12 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 696.8MB · GL 33.4MB · Views 369 · pid=10212)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 9
  - [2026-07-04 08:00:00] DAILY_8AM_REPORT 2026-07-04 08:00:00 KST
  - [2026-07-04 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:02:08] DAILY_8AM_REPORT 2026-07-04 08:02:08 KST
  - [2026-07-04 08:02:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:04:10] DAILY_8AM_REPORT 2026-07-04 08:04:10 KST
  - [2026-07-04 08:04:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:06:11] DAILY_8AM_REPORT 2026-07-04 08:06:11 KST
  - [2026-07-04 08:06:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:08:12] DAILY_8AM_REPORT 2026-07-04 08:08:12 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-04 08:10:14 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 732.7MB · GL 33.2MB · Views 434 · pid=10212)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 11
  - [2026-07-04 08:00:00] DAILY_8AM_REPORT 2026-07-04 08:00:00 KST
  - [2026-07-04 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:02:08] DAILY_8AM_REPORT 2026-07-04 08:02:08 KST
  - [2026-07-04 08:02:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:04:10] DAILY_8AM_REPORT 2026-07-04 08:04:10 KST
  - [2026-07-04 08:04:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:06:11] DAILY_8AM_REPORT 2026-07-04 08:06:11 KST
  - [2026-07-04 08:06:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:08:12] DAILY_8AM_REPORT 2026-07-04 08:08:12 KST
  - [2026-07-04 08:08:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:10:14] DAILY_8AM_REPORT 2026-07-04 08:10:14 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-04 08:12:15 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 713.0MB · GL 15.3MB · Views 99 · pid=10212)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 13
  - [2026-07-04 08:00:00] DAILY_8AM_REPORT 2026-07-04 08:00:00 KST
  - [2026-07-04 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:02:08] DAILY_8AM_REPORT 2026-07-04 08:02:08 KST
  - [2026-07-04 08:02:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:04:10] DAILY_8AM_REPORT 2026-07-04 08:04:10 KST
  - [2026-07-04 08:04:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:06:11] DAILY_8AM_REPORT 2026-07-04 08:06:11 KST
  - [2026-07-04 08:06:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:08:12] DAILY_8AM_REPORT 2026-07-04 08:08:12 KST
  - [2026-07-04 08:08:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:10:14] DAILY_8AM_REPORT 2026-07-04 08:10:14 KST
  - [2026-07-04 08:10:14] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:12:15] DAILY_8AM_REPORT 2026-07-04 08:12:15 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-04 08:14:17 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 624.3MB · GL 15.3MB · Views 99 · pid=10212)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 15
  - [2026-07-04 08:00:00] DAILY_8AM_REPORT 2026-07-04 08:00:00 KST
  - [2026-07-04 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:02:08] DAILY_8AM_REPORT 2026-07-04 08:02:08 KST
  - [2026-07-04 08:02:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:04:10] DAILY_8AM_REPORT 2026-07-04 08:04:10 KST
  - [2026-07-04 08:04:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:06:11] DAILY_8AM_REPORT 2026-07-04 08:06:11 KST
  - [2026-07-04 08:06:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:08:12] DAILY_8AM_REPORT 2026-07-04 08:08:12 KST
  - [2026-07-04 08:08:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:10:14] DAILY_8AM_REPORT 2026-07-04 08:10:14 KST
  - [2026-07-04 08:10:14] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:12:15] DAILY_8AM_REPORT 2026-07-04 08:12:15 KST
  - [2026-07-04 08:12:15] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260704-0800.md verdict=OK
  - [2026-07-04 08:14:17] DAILY_8AM_REPORT 2026-07-04 08:14:17 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-05 08:00:00 KST — **데일리 08:00 상시 자동보고** (CRITICAL)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **CRITICAL** (PSS 963.3MB · GL 154.1MB · Views 384 · pid=29883)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md
- **verdict**: **CRITICAL**
- **incidents (actionable tail)**: 1
  - [2026-07-05 08:00:00] DAILY_8AM_REPORT 2026-07-05 08:00:00 KST
- **권장(김팀장 1안)**: PSS>=950 — hub exit / Skia dispose P0

> status: **ready-for-team-lead-action** · **08:00 보고체 유지**

## [관측] 2026-07-05 08:02:05 KST — **데일리 08:00 상시 자동보고** (CRITICAL)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **CRITICAL** (PSS 950.7MB · GL 153.8MB · Views 394 · pid=29883)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md
- **verdict**: **CRITICAL**
- **incidents (actionable tail)**: 3
  - [2026-07-05 08:00:00] DAILY_8AM_REPORT 2026-07-05 08:00:00 KST
  - [2026-07-05 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=CRITICAL
  - [2026-07-05 08:02:05] DAILY_8AM_REPORT 2026-07-05 08:02:05 KST
- **권장(김팀장 1안)**: PSS>=950 — hub exit / Skia dispose P0

> status: **ready-for-team-lead-action** · **08:00 보고체 유지**

## [관측] 2026-07-05 08:04:06 KST — **데일리 08:00 상시 자동보고** (WARN)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **WARN** (PSS 921.4MB · GL 149.5MB · Views 371 · pid=29883)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md
- **verdict**: **WARN**
- **incidents (actionable tail)**: 5
  - [2026-07-05 08:00:00] DAILY_8AM_REPORT 2026-07-05 08:00:00 KST
  - [2026-07-05 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=CRITICAL
  - [2026-07-05 08:02:05] DAILY_8AM_REPORT 2026-07-05 08:02:05 KST
  - [2026-07-05 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=CRITICAL
  - [2026-07-05 08:04:06] DAILY_8AM_REPORT 2026-07-05 08:04:06 KST
- **권장(김팀장 1안)**: PSS 850+ — floor watch

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-05 08:06:07 KST — **데일리 08:00 상시 자동보고** (WARN)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **WARN** (PSS 931.6MB · GL 149.5MB · Views 370 · pid=29883)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md
- **verdict**: **WARN**
- **incidents (actionable tail)**: 7
  - [2026-07-05 08:00:00] DAILY_8AM_REPORT 2026-07-05 08:00:00 KST
  - [2026-07-05 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=CRITICAL
  - [2026-07-05 08:02:05] DAILY_8AM_REPORT 2026-07-05 08:02:05 KST
  - [2026-07-05 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=CRITICAL
  - [2026-07-05 08:04:06] DAILY_8AM_REPORT 2026-07-05 08:04:06 KST
  - [2026-07-05 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=WARN
  - [2026-07-05 08:06:07] DAILY_8AM_REPORT 2026-07-05 08:06:07 KST
- **권장(김팀장 1안)**: PSS 850+ — floor watch

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-05 08:08:09 KST — **데일리 08:00 상시 자동보고** (WARN)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **WARN** (PSS 920.2MB · GL 149.5MB · Views 371 · pid=29883)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md
- **verdict**: **WARN**
- **incidents (actionable tail)**: 9
  - [2026-07-05 08:00:00] DAILY_8AM_REPORT 2026-07-05 08:00:00 KST
  - [2026-07-05 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=CRITICAL
  - [2026-07-05 08:02:05] DAILY_8AM_REPORT 2026-07-05 08:02:05 KST
  - [2026-07-05 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=CRITICAL
  - [2026-07-05 08:04:06] DAILY_8AM_REPORT 2026-07-05 08:04:06 KST
  - [2026-07-05 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=WARN
  - [2026-07-05 08:06:07] DAILY_8AM_REPORT 2026-07-05 08:06:07 KST
  - [2026-07-05 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=WARN
  - [2026-07-05 08:08:09] DAILY_8AM_REPORT 2026-07-05 08:08:09 KST
- **권장(김팀장 1안)**: PSS 850+ — floor watch

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-05 08:10:11 KST — **데일리 08:00 상시 자동보고** (WARN)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **WARN** (PSS 933.8MB · GL 149.5MB · Views 371 · pid=29883)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md
- **verdict**: **WARN**
- **incidents (actionable tail)**: 11
  - [2026-07-05 08:00:00] DAILY_8AM_REPORT 2026-07-05 08:00:00 KST
  - [2026-07-05 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=CRITICAL
  - [2026-07-05 08:02:05] DAILY_8AM_REPORT 2026-07-05 08:02:05 KST
  - [2026-07-05 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=CRITICAL
  - [2026-07-05 08:04:06] DAILY_8AM_REPORT 2026-07-05 08:04:06 KST
  - [2026-07-05 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=WARN
  - [2026-07-05 08:06:07] DAILY_8AM_REPORT 2026-07-05 08:06:07 KST
  - [2026-07-05 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=WARN
  - [2026-07-05 08:08:09] DAILY_8AM_REPORT 2026-07-05 08:08:09 KST
  - [2026-07-05 08:08:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=WARN
  - [2026-07-05 08:10:11] DAILY_8AM_REPORT 2026-07-05 08:10:11 KST
- **권장(김팀장 1안)**: PSS 850+ — floor watch

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-05 08:12:13 KST — **데일리 08:00 상시 자동보고** (CRITICAL)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **CRITICAL** (PSS 965.9MB · GL 154.1MB · Views 390 · pid=29883)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md
- **verdict**: **CRITICAL**
- **incidents (actionable tail)**: 13
  - [2026-07-05 08:00:00] DAILY_8AM_REPORT 2026-07-05 08:00:00 KST
  - [2026-07-05 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=CRITICAL
  - [2026-07-05 08:02:05] DAILY_8AM_REPORT 2026-07-05 08:02:05 KST
  - [2026-07-05 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=CRITICAL
  - [2026-07-05 08:04:06] DAILY_8AM_REPORT 2026-07-05 08:04:06 KST
  - [2026-07-05 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=WARN
  - [2026-07-05 08:06:07] DAILY_8AM_REPORT 2026-07-05 08:06:07 KST
  - [2026-07-05 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=WARN
  - [2026-07-05 08:08:09] DAILY_8AM_REPORT 2026-07-05 08:08:09 KST
  - [2026-07-05 08:08:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=WARN
  - [2026-07-05 08:10:11] DAILY_8AM_REPORT 2026-07-05 08:10:11 KST
  - [2026-07-05 08:10:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=WARN
  - [2026-07-05 08:12:13] DAILY_8AM_REPORT 2026-07-05 08:12:13 KST
- **권장(김팀장 1안)**: PSS>=950 — hub exit / Skia dispose P0

> status: **ready-for-team-lead-action** · **08:00 보고체 유지**

## [관측] 2026-07-05 08:14:14 KST — **데일리 08:00 상시 자동보고** (WARN)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **WARN** (PSS 948.7MB · GL 153.7MB · Views 380 · pid=29883)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md
- **verdict**: **WARN**
- **incidents (actionable tail)**: 14
  - [2026-07-05 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=CRITICAL
  - [2026-07-05 08:02:05] DAILY_8AM_REPORT 2026-07-05 08:02:05 KST
  - [2026-07-05 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=CRITICAL
  - [2026-07-05 08:04:06] DAILY_8AM_REPORT 2026-07-05 08:04:06 KST
  - [2026-07-05 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=WARN
  - [2026-07-05 08:06:07] DAILY_8AM_REPORT 2026-07-05 08:06:07 KST
  - [2026-07-05 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=WARN
  - [2026-07-05 08:08:09] DAILY_8AM_REPORT 2026-07-05 08:08:09 KST
  - [2026-07-05 08:08:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=WARN
  - [2026-07-05 08:10:11] DAILY_8AM_REPORT 2026-07-05 08:10:11 KST
  - [2026-07-05 08:10:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=WARN
  - [2026-07-05 08:12:13] DAILY_8AM_REPORT 2026-07-05 08:12:13 KST
  - [2026-07-05 08:12:13] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260705-0800.md verdict=CRITICAL
  - [2026-07-05 08:14:14] DAILY_8AM_REPORT 2026-07-05 08:14:14 KST
- **권장(김팀장 1안)**: PSS 850+ — floor watch

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-06 08:00:00 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 570.5MB · GL 31.9MB · Views 99 · pid=12334)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 2
  - [2026-07-06 03:24:51] GL_HARD_CEILING gl=218.4 pss=914.2 views=558
  - [2026-07-06 08:00:00] DAILY_8AM_REPORT 2026-07-06 08:00:00 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-06 08:02:04 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 562.7MB · GL 31.9MB · Views 99 · pid=12334)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 4
  - [2026-07-06 03:24:51] GL_HARD_CEILING gl=218.4 pss=914.2 views=558
  - [2026-07-06 08:00:00] DAILY_8AM_REPORT 2026-07-06 08:00:00 KST
  - [2026-07-06 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:02:04] DAILY_8AM_REPORT 2026-07-06 08:02:04 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-06 08:04:06 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 562.1MB · GL 31.9MB · Views 99 · pid=12334)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 6
  - [2026-07-06 03:24:51] GL_HARD_CEILING gl=218.4 pss=914.2 views=558
  - [2026-07-06 08:00:00] DAILY_8AM_REPORT 2026-07-06 08:00:00 KST
  - [2026-07-06 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:02:04] DAILY_8AM_REPORT 2026-07-06 08:02:04 KST
  - [2026-07-06 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:04:06] DAILY_8AM_REPORT 2026-07-06 08:04:06 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-06 08:06:07 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 559.0MB · GL 31.9MB · Views 99 · pid=12334)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 8
  - [2026-07-06 03:24:51] GL_HARD_CEILING gl=218.4 pss=914.2 views=558
  - [2026-07-06 08:00:00] DAILY_8AM_REPORT 2026-07-06 08:00:00 KST
  - [2026-07-06 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:02:04] DAILY_8AM_REPORT 2026-07-06 08:02:04 KST
  - [2026-07-06 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:04:06] DAILY_8AM_REPORT 2026-07-06 08:04:06 KST
  - [2026-07-06 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:06:07] DAILY_8AM_REPORT 2026-07-06 08:06:07 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-06 08:08:08 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 568.0MB · GL 31.9MB · Views 99 · pid=12334)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 10
  - [2026-07-06 03:24:51] GL_HARD_CEILING gl=218.4 pss=914.2 views=558
  - [2026-07-06 08:00:00] DAILY_8AM_REPORT 2026-07-06 08:00:00 KST
  - [2026-07-06 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:02:04] DAILY_8AM_REPORT 2026-07-06 08:02:04 KST
  - [2026-07-06 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:04:06] DAILY_8AM_REPORT 2026-07-06 08:04:06 KST
  - [2026-07-06 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:06:07] DAILY_8AM_REPORT 2026-07-06 08:06:07 KST
  - [2026-07-06 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:08:08] DAILY_8AM_REPORT 2026-07-06 08:08:08 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-06 08:10:10 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 561.6MB · GL 31.9MB · Views 99 · pid=12334)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 12
  - [2026-07-06 03:24:51] GL_HARD_CEILING gl=218.4 pss=914.2 views=558
  - [2026-07-06 08:00:00] DAILY_8AM_REPORT 2026-07-06 08:00:00 KST
  - [2026-07-06 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:02:04] DAILY_8AM_REPORT 2026-07-06 08:02:04 KST
  - [2026-07-06 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:04:06] DAILY_8AM_REPORT 2026-07-06 08:04:06 KST
  - [2026-07-06 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:06:07] DAILY_8AM_REPORT 2026-07-06 08:06:07 KST
  - [2026-07-06 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:08:08] DAILY_8AM_REPORT 2026-07-06 08:08:08 KST
  - [2026-07-06 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:10:10] DAILY_8AM_REPORT 2026-07-06 08:10:10 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-06 08:12:11 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 566.2MB · GL 31.9MB · Views 99 · pid=12334)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 13
  - [2026-07-06 08:00:00] DAILY_8AM_REPORT 2026-07-06 08:00:00 KST
  - [2026-07-06 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:02:04] DAILY_8AM_REPORT 2026-07-06 08:02:04 KST
  - [2026-07-06 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:04:06] DAILY_8AM_REPORT 2026-07-06 08:04:06 KST
  - [2026-07-06 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:06:07] DAILY_8AM_REPORT 2026-07-06 08:06:07 KST
  - [2026-07-06 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:08:08] DAILY_8AM_REPORT 2026-07-06 08:08:08 KST
  - [2026-07-06 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:10:10] DAILY_8AM_REPORT 2026-07-06 08:10:10 KST
  - [2026-07-06 08:10:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:12:11] DAILY_8AM_REPORT 2026-07-06 08:12:11 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-06 08:14:12 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 559.9MB · GL 31.9MB · Views 99 · pid=12334)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 15
  - [2026-07-06 08:00:00] DAILY_8AM_REPORT 2026-07-06 08:00:00 KST
  - [2026-07-06 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:02:04] DAILY_8AM_REPORT 2026-07-06 08:02:04 KST
  - [2026-07-06 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:04:06] DAILY_8AM_REPORT 2026-07-06 08:04:06 KST
  - [2026-07-06 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:06:07] DAILY_8AM_REPORT 2026-07-06 08:06:07 KST
  - [2026-07-06 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:08:08] DAILY_8AM_REPORT 2026-07-06 08:08:08 KST
  - [2026-07-06 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:10:10] DAILY_8AM_REPORT 2026-07-06 08:10:10 KST
  - [2026-07-06 08:10:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:12:11] DAILY_8AM_REPORT 2026-07-06 08:12:11 KST
  - [2026-07-06 08:12:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:14:12] DAILY_8AM_REPORT 2026-07-06 08:14:12 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-07 08:00:00 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 792.0MB · GL 66.1MB · Views 363 · pid=12334)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 12
  - [2026-07-06 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:06:07] DAILY_8AM_REPORT 2026-07-06 08:06:07 KST
  - [2026-07-06 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:08:08] DAILY_8AM_REPORT 2026-07-06 08:08:08 KST
  - [2026-07-06 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:10:10] DAILY_8AM_REPORT 2026-07-06 08:10:10 KST
  - [2026-07-06 08:10:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:12:11] DAILY_8AM_REPORT 2026-07-06 08:12:11 KST
  - [2026-07-06 08:12:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:14:12] DAILY_8AM_REPORT 2026-07-06 08:14:12 KST
  - [2026-07-06 08:14:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-07 08:00:00] DAILY_8AM_REPORT 2026-07-07 08:00:00 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-07 08:02:05 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 788.3MB · GL 66.1MB · Views 356 · pid=12334)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 12
  - [2026-07-06 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:08:08] DAILY_8AM_REPORT 2026-07-06 08:08:08 KST
  - [2026-07-06 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:10:10] DAILY_8AM_REPORT 2026-07-06 08:10:10 KST
  - [2026-07-06 08:10:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:12:11] DAILY_8AM_REPORT 2026-07-06 08:12:11 KST
  - [2026-07-06 08:12:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:14:12] DAILY_8AM_REPORT 2026-07-06 08:14:12 KST
  - [2026-07-06 08:14:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-07 08:00:00] DAILY_8AM_REPORT 2026-07-07 08:00:00 KST
  - [2026-07-07 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:02:05] DAILY_8AM_REPORT 2026-07-07 08:02:05 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-07 08:04:07 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 804.2MB · GL 66.1MB · Views 363 · pid=12334)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 12
  - [2026-07-06 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:10:10] DAILY_8AM_REPORT 2026-07-06 08:10:10 KST
  - [2026-07-06 08:10:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:12:11] DAILY_8AM_REPORT 2026-07-06 08:12:11 KST
  - [2026-07-06 08:12:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:14:12] DAILY_8AM_REPORT 2026-07-06 08:14:12 KST
  - [2026-07-06 08:14:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-07 08:00:00] DAILY_8AM_REPORT 2026-07-07 08:00:00 KST
  - [2026-07-07 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:02:05] DAILY_8AM_REPORT 2026-07-07 08:02:05 KST
  - [2026-07-07 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:04:07] DAILY_8AM_REPORT 2026-07-07 08:04:07 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-07 08:06:09 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 817.6MB · GL 70.7MB · Views 373 · pid=12334)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 12
  - [2026-07-06 08:10:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:12:11] DAILY_8AM_REPORT 2026-07-06 08:12:11 KST
  - [2026-07-06 08:12:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-06 08:14:12] DAILY_8AM_REPORT 2026-07-06 08:14:12 KST
  - [2026-07-06 08:14:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-07 08:00:00] DAILY_8AM_REPORT 2026-07-07 08:00:00 KST
  - [2026-07-07 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:02:05] DAILY_8AM_REPORT 2026-07-07 08:02:05 KST
  - [2026-07-07 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:04:07] DAILY_8AM_REPORT 2026-07-07 08:04:07 KST
  - [2026-07-07 08:04:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:06:09] DAILY_8AM_REPORT 2026-07-07 08:06:09 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-07 08:08:10 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 792.2MB · GL 66.1MB · Views 356 · pid=12334)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 11
  - [2026-07-06 08:14:12] DAILY_8AM_REPORT 2026-07-06 08:14:12 KST
  - [2026-07-06 08:14:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260706-0800.md verdict=OK
  - [2026-07-07 08:00:00] DAILY_8AM_REPORT 2026-07-07 08:00:00 KST
  - [2026-07-07 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:02:05] DAILY_8AM_REPORT 2026-07-07 08:02:05 KST
  - [2026-07-07 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:04:07] DAILY_8AM_REPORT 2026-07-07 08:04:07 KST
  - [2026-07-07 08:04:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:06:09] DAILY_8AM_REPORT 2026-07-07 08:06:09 KST
  - [2026-07-07 08:06:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:08:10] DAILY_8AM_REPORT 2026-07-07 08:08:10 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-07 08:10:12 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 787.7MB · GL 66.1MB · Views 368 · pid=12334)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 11
  - [2026-07-07 08:00:00] DAILY_8AM_REPORT 2026-07-07 08:00:00 KST
  - [2026-07-07 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:02:05] DAILY_8AM_REPORT 2026-07-07 08:02:05 KST
  - [2026-07-07 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:04:07] DAILY_8AM_REPORT 2026-07-07 08:04:07 KST
  - [2026-07-07 08:04:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:06:09] DAILY_8AM_REPORT 2026-07-07 08:06:09 KST
  - [2026-07-07 08:06:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:08:10] DAILY_8AM_REPORT 2026-07-07 08:08:10 KST
  - [2026-07-07 08:08:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:10:12] DAILY_8AM_REPORT 2026-07-07 08:10:12 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-07 08:12:13 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 800.9MB · GL 66.1MB · Views 360 · pid=12334)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 13
  - [2026-07-07 08:00:00] DAILY_8AM_REPORT 2026-07-07 08:00:00 KST
  - [2026-07-07 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:02:05] DAILY_8AM_REPORT 2026-07-07 08:02:05 KST
  - [2026-07-07 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:04:07] DAILY_8AM_REPORT 2026-07-07 08:04:07 KST
  - [2026-07-07 08:04:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:06:09] DAILY_8AM_REPORT 2026-07-07 08:06:09 KST
  - [2026-07-07 08:06:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:08:10] DAILY_8AM_REPORT 2026-07-07 08:08:10 KST
  - [2026-07-07 08:08:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:10:12] DAILY_8AM_REPORT 2026-07-07 08:10:12 KST
  - [2026-07-07 08:10:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:12:13] DAILY_8AM_REPORT 2026-07-07 08:12:13 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-07 08:14:14 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 795.1MB · GL 62.0MB · Views 356 · pid=12334)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 14
  - [2026-07-07 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:02:05] DAILY_8AM_REPORT 2026-07-07 08:02:05 KST
  - [2026-07-07 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:04:07] DAILY_8AM_REPORT 2026-07-07 08:04:07 KST
  - [2026-07-07 08:04:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:06:09] DAILY_8AM_REPORT 2026-07-07 08:06:09 KST
  - [2026-07-07 08:06:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:08:10] DAILY_8AM_REPORT 2026-07-07 08:08:10 KST
  - [2026-07-07 08:08:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:10:12] DAILY_8AM_REPORT 2026-07-07 08:10:12 KST
  - [2026-07-07 08:10:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:12:13] DAILY_8AM_REPORT 2026-07-07 08:12:13 KST
  - [2026-07-07 08:12:13] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260707-0800.md verdict=OK
  - [2026-07-07 08:14:14] DAILY_8AM_REPORT 2026-07-07 08:14:14 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-08 08:00:00 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 820.8MB · GL 35.2MB · Views 384 · pid=27487)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 1
  - [2026-07-08 08:00:00] DAILY_8AM_REPORT 2026-07-08 08:00:00 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-08 08:02:06 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 822.6MB · GL 37.2MB · Views 384 · pid=27487)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 3
  - [2026-07-08 08:00:00] DAILY_8AM_REPORT 2026-07-08 08:00:00 KST
  - [2026-07-08 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:02:06] DAILY_8AM_REPORT 2026-07-08 08:02:06 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-08 08:04:08 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 823.3MB · GL 39.4MB · Views 403 · pid=27487)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 5
  - [2026-07-08 08:00:00] DAILY_8AM_REPORT 2026-07-08 08:00:00 KST
  - [2026-07-08 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:02:06] DAILY_8AM_REPORT 2026-07-08 08:02:06 KST
  - [2026-07-08 08:02:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:04:08] DAILY_8AM_REPORT 2026-07-08 08:04:08 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-08 08:06:09 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 820.7MB · GL 35.2MB · Views 388 · pid=27487)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 7
  - [2026-07-08 08:00:00] DAILY_8AM_REPORT 2026-07-08 08:00:00 KST
  - [2026-07-08 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:02:06] DAILY_8AM_REPORT 2026-07-08 08:02:06 KST
  - [2026-07-08 08:02:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:04:08] DAILY_8AM_REPORT 2026-07-08 08:04:08 KST
  - [2026-07-08 08:04:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:06:09] DAILY_8AM_REPORT 2026-07-08 08:06:09 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-08 08:08:11 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 819.0MB · GL 33.1MB · Views 388 · pid=27487)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 9
  - [2026-07-08 08:00:00] DAILY_8AM_REPORT 2026-07-08 08:00:00 KST
  - [2026-07-08 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:02:06] DAILY_8AM_REPORT 2026-07-08 08:02:06 KST
  - [2026-07-08 08:02:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:04:08] DAILY_8AM_REPORT 2026-07-08 08:04:08 KST
  - [2026-07-08 08:04:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:06:09] DAILY_8AM_REPORT 2026-07-08 08:06:09 KST
  - [2026-07-08 08:06:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:08:11] DAILY_8AM_REPORT 2026-07-08 08:08:11 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-08 08:10:12 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 831.0MB · GL 35.4MB · Views 402 · pid=27487)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 11
  - [2026-07-08 08:00:00] DAILY_8AM_REPORT 2026-07-08 08:00:00 KST
  - [2026-07-08 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:02:06] DAILY_8AM_REPORT 2026-07-08 08:02:06 KST
  - [2026-07-08 08:02:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:04:08] DAILY_8AM_REPORT 2026-07-08 08:04:08 KST
  - [2026-07-08 08:04:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:06:09] DAILY_8AM_REPORT 2026-07-08 08:06:09 KST
  - [2026-07-08 08:06:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:08:11] DAILY_8AM_REPORT 2026-07-08 08:08:11 KST
  - [2026-07-08 08:08:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:10:12] DAILY_8AM_REPORT 2026-07-08 08:10:12 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-08 08:12:14 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 817.1MB · GL 33.1MB · Views 380 · pid=27487)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 13
  - [2026-07-08 08:00:00] DAILY_8AM_REPORT 2026-07-08 08:00:00 KST
  - [2026-07-08 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:02:06] DAILY_8AM_REPORT 2026-07-08 08:02:06 KST
  - [2026-07-08 08:02:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:04:08] DAILY_8AM_REPORT 2026-07-08 08:04:08 KST
  - [2026-07-08 08:04:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:06:09] DAILY_8AM_REPORT 2026-07-08 08:06:09 KST
  - [2026-07-08 08:06:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:08:11] DAILY_8AM_REPORT 2026-07-08 08:08:11 KST
  - [2026-07-08 08:08:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:10:12] DAILY_8AM_REPORT 2026-07-08 08:10:12 KST
  - [2026-07-08 08:10:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:12:14] DAILY_8AM_REPORT 2026-07-08 08:12:14 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-08 08:14:16 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 826.8MB · GL 33.1MB · Views 384 · pid=27487)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 14
  - [2026-07-08 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:02:06] DAILY_8AM_REPORT 2026-07-08 08:02:06 KST
  - [2026-07-08 08:02:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:04:08] DAILY_8AM_REPORT 2026-07-08 08:04:08 KST
  - [2026-07-08 08:04:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:06:09] DAILY_8AM_REPORT 2026-07-08 08:06:09 KST
  - [2026-07-08 08:06:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:08:11] DAILY_8AM_REPORT 2026-07-08 08:08:11 KST
  - [2026-07-08 08:08:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:10:12] DAILY_8AM_REPORT 2026-07-08 08:10:12 KST
  - [2026-07-08 08:10:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:12:14] DAILY_8AM_REPORT 2026-07-08 08:12:14 KST
  - [2026-07-08 08:12:14] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260708-0800.md verdict=OK
  - [2026-07-08 08:14:16] DAILY_8AM_REPORT 2026-07-08 08:14:16 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-09 08:00:00 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 691.7MB · GL 36.4MB · Views 353 · pid=26740)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 2
  - [2026-07-08 20:33:43] GL_HARD_CEILING gl=118.1 pss=962.9 views=559
  - [2026-07-09 08:00:00] DAILY_8AM_REPORT 2026-07-09 08:00:00 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-09 08:02:05 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 708.3MB · GL 39.1MB · Views 369 · pid=26740)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 4
  - [2026-07-08 20:33:43] GL_HARD_CEILING gl=118.1 pss=962.9 views=559
  - [2026-07-09 08:00:00] DAILY_8AM_REPORT 2026-07-09 08:00:00 KST
  - [2026-07-09 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:02:05] DAILY_8AM_REPORT 2026-07-09 08:02:05 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-09 08:04:06 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 686.9MB · GL 38.5MB · Views 346 · pid=26740)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 6
  - [2026-07-08 20:33:43] GL_HARD_CEILING gl=118.1 pss=962.9 views=559
  - [2026-07-09 08:00:00] DAILY_8AM_REPORT 2026-07-09 08:00:00 KST
  - [2026-07-09 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:02:05] DAILY_8AM_REPORT 2026-07-09 08:02:05 KST
  - [2026-07-09 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:04:06] DAILY_8AM_REPORT 2026-07-09 08:04:06 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-09 08:06:07 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 688.4MB · GL 38.5MB · Views 353 · pid=26740)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 8
  - [2026-07-08 20:33:43] GL_HARD_CEILING gl=118.1 pss=962.9 views=559
  - [2026-07-09 08:00:00] DAILY_8AM_REPORT 2026-07-09 08:00:00 KST
  - [2026-07-09 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:02:05] DAILY_8AM_REPORT 2026-07-09 08:02:05 KST
  - [2026-07-09 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:04:06] DAILY_8AM_REPORT 2026-07-09 08:04:06 KST
  - [2026-07-09 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:06:07] DAILY_8AM_REPORT 2026-07-09 08:06:07 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-09 08:08:08 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 692.2MB · GL 40.5MB · Views 353 · pid=26740)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 10
  - [2026-07-08 20:33:43] GL_HARD_CEILING gl=118.1 pss=962.9 views=559
  - [2026-07-09 08:00:00] DAILY_8AM_REPORT 2026-07-09 08:00:00 KST
  - [2026-07-09 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:02:05] DAILY_8AM_REPORT 2026-07-09 08:02:05 KST
  - [2026-07-09 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:04:06] DAILY_8AM_REPORT 2026-07-09 08:04:06 KST
  - [2026-07-09 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:06:07] DAILY_8AM_REPORT 2026-07-09 08:06:07 KST
  - [2026-07-09 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:08:08] DAILY_8AM_REPORT 2026-07-09 08:08:08 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-09 08:10:09 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 716.2MB · GL 39.1MB · Views 362 · pid=26740)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 11
  - [2026-07-09 08:00:00] DAILY_8AM_REPORT 2026-07-09 08:00:00 KST
  - [2026-07-09 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:02:05] DAILY_8AM_REPORT 2026-07-09 08:02:05 KST
  - [2026-07-09 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:04:06] DAILY_8AM_REPORT 2026-07-09 08:04:06 KST
  - [2026-07-09 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:06:07] DAILY_8AM_REPORT 2026-07-09 08:06:07 KST
  - [2026-07-09 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:08:08] DAILY_8AM_REPORT 2026-07-09 08:08:08 KST
  - [2026-07-09 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:10:09] DAILY_8AM_REPORT 2026-07-09 08:10:09 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-09 08:12:10 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 701.8MB · GL 38.7MB · Views 363 · pid=26740)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 13
  - [2026-07-09 08:00:00] DAILY_8AM_REPORT 2026-07-09 08:00:00 KST
  - [2026-07-09 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:02:05] DAILY_8AM_REPORT 2026-07-09 08:02:05 KST
  - [2026-07-09 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:04:06] DAILY_8AM_REPORT 2026-07-09 08:04:06 KST
  - [2026-07-09 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:06:07] DAILY_8AM_REPORT 2026-07-09 08:06:07 KST
  - [2026-07-09 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:08:08] DAILY_8AM_REPORT 2026-07-09 08:08:08 KST
  - [2026-07-09 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:10:09] DAILY_8AM_REPORT 2026-07-09 08:10:09 KST
  - [2026-07-09 08:10:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:12:10] DAILY_8AM_REPORT 2026-07-09 08:12:10 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-09 08:14:12 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 680.8MB · GL 34.1MB · Views 353 · pid=26740)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 15
  - [2026-07-09 08:00:00] DAILY_8AM_REPORT 2026-07-09 08:00:00 KST
  - [2026-07-09 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:02:05] DAILY_8AM_REPORT 2026-07-09 08:02:05 KST
  - [2026-07-09 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:04:06] DAILY_8AM_REPORT 2026-07-09 08:04:06 KST
  - [2026-07-09 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:06:07] DAILY_8AM_REPORT 2026-07-09 08:06:07 KST
  - [2026-07-09 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:08:08] DAILY_8AM_REPORT 2026-07-09 08:08:08 KST
  - [2026-07-09 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:10:09] DAILY_8AM_REPORT 2026-07-09 08:10:09 KST
  - [2026-07-09 08:10:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:12:10] DAILY_8AM_REPORT 2026-07-09 08:12:10 KST
  - [2026-07-09 08:12:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-09 08:14:12] DAILY_8AM_REPORT 2026-07-09 08:14:12 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-10 08:00:00 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 631.2MB · GL 39.0MB · Views 361 · pid=15478)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 3
  - [2026-07-09 08:14:12] DAILY_8AM_REPORT 2026-07-09 08:14:12 KST
  - [2026-07-09 08:14:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260709-0800.md verdict=OK
  - [2026-07-10 08:00:00] DAILY_8AM_REPORT 2026-07-10 08:00:00 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-10 08:02:04 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 630.1MB · GL 34.9MB · Views 359 · pid=15478)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 3
  - [2026-07-10 08:00:00] DAILY_8AM_REPORT 2026-07-10 08:00:00 KST
  - [2026-07-10 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:02:04] DAILY_8AM_REPORT 2026-07-10 08:02:04 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-10 08:04:05 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 639.0MB · GL 34.9MB · Views 361 · pid=15478)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 5
  - [2026-07-10 08:00:00] DAILY_8AM_REPORT 2026-07-10 08:00:00 KST
  - [2026-07-10 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:02:04] DAILY_8AM_REPORT 2026-07-10 08:02:04 KST
  - [2026-07-10 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:04:05] DAILY_8AM_REPORT 2026-07-10 08:04:05 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-10 08:06:06 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 667.5MB · GL 39.6MB · Views 391 · pid=15478)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 7
  - [2026-07-10 08:00:00] DAILY_8AM_REPORT 2026-07-10 08:00:00 KST
  - [2026-07-10 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:02:04] DAILY_8AM_REPORT 2026-07-10 08:02:04 KST
  - [2026-07-10 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:04:05] DAILY_8AM_REPORT 2026-07-10 08:04:05 KST
  - [2026-07-10 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:06:06] DAILY_8AM_REPORT 2026-07-10 08:06:06 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-10 08:08:08 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 634.9MB · GL 34.9MB · Views 368 · pid=15478)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 9
  - [2026-07-10 08:00:00] DAILY_8AM_REPORT 2026-07-10 08:00:00 KST
  - [2026-07-10 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:02:04] DAILY_8AM_REPORT 2026-07-10 08:02:04 KST
  - [2026-07-10 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:04:05] DAILY_8AM_REPORT 2026-07-10 08:04:05 KST
  - [2026-07-10 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:06:06] DAILY_8AM_REPORT 2026-07-10 08:06:06 KST
  - [2026-07-10 08:06:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:08:08] DAILY_8AM_REPORT 2026-07-10 08:08:08 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-10 08:10:10 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 638.2MB · GL 41.0MB · Views 361 · pid=15478)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 11
  - [2026-07-10 08:00:00] DAILY_8AM_REPORT 2026-07-10 08:00:00 KST
  - [2026-07-10 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:02:04] DAILY_8AM_REPORT 2026-07-10 08:02:04 KST
  - [2026-07-10 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:04:05] DAILY_8AM_REPORT 2026-07-10 08:04:05 KST
  - [2026-07-10 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:06:06] DAILY_8AM_REPORT 2026-07-10 08:06:06 KST
  - [2026-07-10 08:06:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:08:08] DAILY_8AM_REPORT 2026-07-10 08:08:08 KST
  - [2026-07-10 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:10:10] DAILY_8AM_REPORT 2026-07-10 08:10:10 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-10 08:12:11 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 639.9MB · GL 41.0MB · Views 368 · pid=15478)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 13
  - [2026-07-10 08:00:00] DAILY_8AM_REPORT 2026-07-10 08:00:00 KST
  - [2026-07-10 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:02:04] DAILY_8AM_REPORT 2026-07-10 08:02:04 KST
  - [2026-07-10 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:04:05] DAILY_8AM_REPORT 2026-07-10 08:04:05 KST
  - [2026-07-10 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:06:06] DAILY_8AM_REPORT 2026-07-10 08:06:06 KST
  - [2026-07-10 08:06:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:08:08] DAILY_8AM_REPORT 2026-07-10 08:08:08 KST
  - [2026-07-10 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:10:10] DAILY_8AM_REPORT 2026-07-10 08:10:10 KST
  - [2026-07-10 08:10:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:12:11] DAILY_8AM_REPORT 2026-07-10 08:12:11 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-10 08:14:12 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **25024** · auto-fix=ON
- **adb**: OK (192.168.45.67:33817)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 631.6MB · GL 35.0MB · Views 368 · pid=15478)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 15
  - [2026-07-10 08:00:00] DAILY_8AM_REPORT 2026-07-10 08:00:00 KST
  - [2026-07-10 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:02:04] DAILY_8AM_REPORT 2026-07-10 08:02:04 KST
  - [2026-07-10 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:04:05] DAILY_8AM_REPORT 2026-07-10 08:04:05 KST
  - [2026-07-10 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:06:06] DAILY_8AM_REPORT 2026-07-10 08:06:06 KST
  - [2026-07-10 08:06:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:08:08] DAILY_8AM_REPORT 2026-07-10 08:08:08 KST
  - [2026-07-10 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:10:10] DAILY_8AM_REPORT 2026-07-10 08:10:10 KST
  - [2026-07-10 08:10:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:12:11] DAILY_8AM_REPORT 2026-07-10 08:12:11 KST
  - [2026-07-10 08:12:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260710-0800.md verdict=OK
  - [2026-07-10 08:14:12] DAILY_8AM_REPORT 2026-07-10 08:14:12 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-11 08:00:00 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 689.2MB · GL 25.1MB · Views 378 · pid=18506)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 4
  - [2026-07-10 19:57:54] GL_HARD_CEILING gl=120.7 pss=971 views=568
  - [2026-07-10 20:44:58] GL_HARD_CEILING gl=130.3 pss=973.2 views=561
  - [2026-07-10 21:01:05] GL_HARD_CEILING gl=120.9 pss=1075.4 views=561
  - [2026-07-11 08:00:00] DAILY_8AM_REPORT 2026-07-11 08:00:00 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-11 08:02:05 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 689.0MB · GL 29.4MB · Views 380 · pid=18506)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 5
  - [2026-07-10 20:44:58] GL_HARD_CEILING gl=130.3 pss=973.2 views=561
  - [2026-07-10 21:01:05] GL_HARD_CEILING gl=120.9 pss=1075.4 views=561
  - [2026-07-11 08:00:00] DAILY_8AM_REPORT 2026-07-11 08:00:00 KST
  - [2026-07-11 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:02:05] DAILY_8AM_REPORT 2026-07-11 08:02:05 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-11 08:04:06 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 695.8MB · GL 29.4MB · Views 384 · pid=18506)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 7
  - [2026-07-10 20:44:58] GL_HARD_CEILING gl=130.3 pss=973.2 views=561
  - [2026-07-10 21:01:05] GL_HARD_CEILING gl=120.9 pss=1075.4 views=561
  - [2026-07-11 08:00:00] DAILY_8AM_REPORT 2026-07-11 08:00:00 KST
  - [2026-07-11 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:02:05] DAILY_8AM_REPORT 2026-07-11 08:02:05 KST
  - [2026-07-11 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:04:06] DAILY_8AM_REPORT 2026-07-11 08:04:06 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-11 08:06:09 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 717.1MB · GL 30.0MB · Views 405 · pid=18506)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 8
  - [2026-07-10 21:01:05] GL_HARD_CEILING gl=120.9 pss=1075.4 views=561
  - [2026-07-11 08:00:00] DAILY_8AM_REPORT 2026-07-11 08:00:00 KST
  - [2026-07-11 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:02:05] DAILY_8AM_REPORT 2026-07-11 08:02:05 KST
  - [2026-07-11 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:04:06] DAILY_8AM_REPORT 2026-07-11 08:04:06 KST
  - [2026-07-11 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:06:09] DAILY_8AM_REPORT 2026-07-11 08:06:09 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-11 08:08:12 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 693.9MB · GL 29.4MB · Views 378 · pid=18506)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 9
  - [2026-07-11 08:00:00] DAILY_8AM_REPORT 2026-07-11 08:00:00 KST
  - [2026-07-11 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:02:05] DAILY_8AM_REPORT 2026-07-11 08:02:05 KST
  - [2026-07-11 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:04:06] DAILY_8AM_REPORT 2026-07-11 08:04:06 KST
  - [2026-07-11 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:06:09] DAILY_8AM_REPORT 2026-07-11 08:06:09 KST
  - [2026-07-11 08:06:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:08:12] DAILY_8AM_REPORT 2026-07-11 08:08:12 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-11 08:10:13 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 697.0MB · GL 29.4MB · Views 380 · pid=18506)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 11
  - [2026-07-11 08:00:00] DAILY_8AM_REPORT 2026-07-11 08:00:00 KST
  - [2026-07-11 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:02:05] DAILY_8AM_REPORT 2026-07-11 08:02:05 KST
  - [2026-07-11 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:04:06] DAILY_8AM_REPORT 2026-07-11 08:04:06 KST
  - [2026-07-11 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:06:09] DAILY_8AM_REPORT 2026-07-11 08:06:09 KST
  - [2026-07-11 08:06:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:08:12] DAILY_8AM_REPORT 2026-07-11 08:08:12 KST
  - [2026-07-11 08:08:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:10:13] DAILY_8AM_REPORT 2026-07-11 08:10:13 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-11 08:12:16 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 702.9MB · GL 29.4MB · Views 384 · pid=18506)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 13
  - [2026-07-11 08:00:00] DAILY_8AM_REPORT 2026-07-11 08:00:00 KST
  - [2026-07-11 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:02:05] DAILY_8AM_REPORT 2026-07-11 08:02:05 KST
  - [2026-07-11 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:04:06] DAILY_8AM_REPORT 2026-07-11 08:04:06 KST
  - [2026-07-11 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:06:09] DAILY_8AM_REPORT 2026-07-11 08:06:09 KST
  - [2026-07-11 08:06:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:08:12] DAILY_8AM_REPORT 2026-07-11 08:08:12 KST
  - [2026-07-11 08:08:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:10:13] DAILY_8AM_REPORT 2026-07-11 08:10:13 KST
  - [2026-07-11 08:10:13] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:12:16] DAILY_8AM_REPORT 2026-07-11 08:12:16 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-11 08:14:17 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 713.9MB · GL 31.6MB · Views 389 · pid=18506)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 15
  - [2026-07-11 08:00:00] DAILY_8AM_REPORT 2026-07-11 08:00:00 KST
  - [2026-07-11 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:02:05] DAILY_8AM_REPORT 2026-07-11 08:02:05 KST
  - [2026-07-11 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:04:06] DAILY_8AM_REPORT 2026-07-11 08:04:06 KST
  - [2026-07-11 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:06:09] DAILY_8AM_REPORT 2026-07-11 08:06:09 KST
  - [2026-07-11 08:06:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:08:12] DAILY_8AM_REPORT 2026-07-11 08:08:12 KST
  - [2026-07-11 08:08:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:10:13] DAILY_8AM_REPORT 2026-07-11 08:10:13 KST
  - [2026-07-11 08:10:13] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:12:16] DAILY_8AM_REPORT 2026-07-11 08:12:16 KST
  - [2026-07-11 08:12:16] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:14:17] DAILY_8AM_REPORT 2026-07-11 08:14:17 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-12 08:00:00 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 741.1MB · GL 42.1MB · Views 373 · pid=14204)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 12
  - [2026-07-11 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:06:09] DAILY_8AM_REPORT 2026-07-11 08:06:09 KST
  - [2026-07-11 08:06:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:08:12] DAILY_8AM_REPORT 2026-07-11 08:08:12 KST
  - [2026-07-11 08:08:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:10:13] DAILY_8AM_REPORT 2026-07-11 08:10:13 KST
  - [2026-07-11 08:10:13] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:12:16] DAILY_8AM_REPORT 2026-07-11 08:12:16 KST
  - [2026-07-11 08:12:16] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:14:17] DAILY_8AM_REPORT 2026-07-11 08:14:17 KST
  - [2026-07-11 08:14:17] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-12 08:00:00] DAILY_8AM_REPORT 2026-07-12 08:00:00 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-12 08:02:04 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 746.6MB · GL 46.1MB · Views 373 · pid=14204)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 12
  - [2026-07-11 08:06:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:08:12] DAILY_8AM_REPORT 2026-07-11 08:08:12 KST
  - [2026-07-11 08:08:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:10:13] DAILY_8AM_REPORT 2026-07-11 08:10:13 KST
  - [2026-07-11 08:10:13] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:12:16] DAILY_8AM_REPORT 2026-07-11 08:12:16 KST
  - [2026-07-11 08:12:16] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:14:17] DAILY_8AM_REPORT 2026-07-11 08:14:17 KST
  - [2026-07-11 08:14:17] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-12 08:00:00] DAILY_8AM_REPORT 2026-07-12 08:00:00 KST
  - [2026-07-12 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:02:04] DAILY_8AM_REPORT 2026-07-12 08:02:04 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-12 08:04:06 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 760.8MB · GL 46.1MB · Views 373 · pid=14204)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 12
  - [2026-07-11 08:08:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:10:13] DAILY_8AM_REPORT 2026-07-11 08:10:13 KST
  - [2026-07-11 08:10:13] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:12:16] DAILY_8AM_REPORT 2026-07-11 08:12:16 KST
  - [2026-07-11 08:12:16] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:14:17] DAILY_8AM_REPORT 2026-07-11 08:14:17 KST
  - [2026-07-11 08:14:17] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-12 08:00:00] DAILY_8AM_REPORT 2026-07-12 08:00:00 KST
  - [2026-07-12 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:02:04] DAILY_8AM_REPORT 2026-07-12 08:02:04 KST
  - [2026-07-12 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:04:06] DAILY_8AM_REPORT 2026-07-12 08:04:06 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-12 08:06:07 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 783.2MB · GL 48.8MB · Views 415 · pid=14204)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 12
  - [2026-07-11 08:10:13] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:12:16] DAILY_8AM_REPORT 2026-07-11 08:12:16 KST
  - [2026-07-11 08:12:16] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:14:17] DAILY_8AM_REPORT 2026-07-11 08:14:17 KST
  - [2026-07-11 08:14:17] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-12 08:00:00] DAILY_8AM_REPORT 2026-07-12 08:00:00 KST
  - [2026-07-12 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:02:04] DAILY_8AM_REPORT 2026-07-12 08:02:04 KST
  - [2026-07-12 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:04:06] DAILY_8AM_REPORT 2026-07-12 08:04:06 KST
  - [2026-07-12 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:06:07] DAILY_8AM_REPORT 2026-07-12 08:06:07 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-12 08:08:08 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 739.4MB · GL 42.1MB · Views 377 · pid=14204)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 12
  - [2026-07-11 08:12:16] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-11 08:14:17] DAILY_8AM_REPORT 2026-07-11 08:14:17 KST
  - [2026-07-11 08:14:17] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-12 08:00:00] DAILY_8AM_REPORT 2026-07-12 08:00:00 KST
  - [2026-07-12 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:02:04] DAILY_8AM_REPORT 2026-07-12 08:02:04 KST
  - [2026-07-12 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:04:06] DAILY_8AM_REPORT 2026-07-12 08:04:06 KST
  - [2026-07-12 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:06:07] DAILY_8AM_REPORT 2026-07-12 08:06:07 KST
  - [2026-07-12 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:08:08] DAILY_8AM_REPORT 2026-07-12 08:08:08 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-12 08:10:10 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 752.7MB · GL 46.1MB · Views 377 · pid=14204)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 12
  - [2026-07-11 08:14:17] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260711-0800.md verdict=OK
  - [2026-07-12 08:00:00] DAILY_8AM_REPORT 2026-07-12 08:00:00 KST
  - [2026-07-12 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:02:04] DAILY_8AM_REPORT 2026-07-12 08:02:04 KST
  - [2026-07-12 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:04:06] DAILY_8AM_REPORT 2026-07-12 08:04:06 KST
  - [2026-07-12 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:06:07] DAILY_8AM_REPORT 2026-07-12 08:06:07 KST
  - [2026-07-12 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:08:08] DAILY_8AM_REPORT 2026-07-12 08:08:08 KST
  - [2026-07-12 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:10:10] DAILY_8AM_REPORT 2026-07-12 08:10:10 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-12 08:12:11 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 754.3MB · GL 42.1MB · Views 377 · pid=14204)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 13
  - [2026-07-12 08:00:00] DAILY_8AM_REPORT 2026-07-12 08:00:00 KST
  - [2026-07-12 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:02:04] DAILY_8AM_REPORT 2026-07-12 08:02:04 KST
  - [2026-07-12 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:04:06] DAILY_8AM_REPORT 2026-07-12 08:04:06 KST
  - [2026-07-12 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:06:07] DAILY_8AM_REPORT 2026-07-12 08:06:07 KST
  - [2026-07-12 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:08:08] DAILY_8AM_REPORT 2026-07-12 08:08:08 KST
  - [2026-07-12 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:10:10] DAILY_8AM_REPORT 2026-07-12 08:10:10 KST
  - [2026-07-12 08:10:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:12:11] DAILY_8AM_REPORT 2026-07-12 08:12:11 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-12 08:14:14 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 773.1MB · GL 48.8MB · Views 398 · pid=14204)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 15
  - [2026-07-12 08:00:00] DAILY_8AM_REPORT 2026-07-12 08:00:00 KST
  - [2026-07-12 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:02:04] DAILY_8AM_REPORT 2026-07-12 08:02:04 KST
  - [2026-07-12 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:04:06] DAILY_8AM_REPORT 2026-07-12 08:04:06 KST
  - [2026-07-12 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:06:07] DAILY_8AM_REPORT 2026-07-12 08:06:07 KST
  - [2026-07-12 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:08:08] DAILY_8AM_REPORT 2026-07-12 08:08:08 KST
  - [2026-07-12 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:10:10] DAILY_8AM_REPORT 2026-07-12 08:10:10 KST
  - [2026-07-12 08:10:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:12:11] DAILY_8AM_REPORT 2026-07-12 08:12:11 KST
  - [2026-07-12 08:12:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260712-0800.md verdict=OK
  - [2026-07-12 08:14:14] DAILY_8AM_REPORT 2026-07-12 08:14:14 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-13 08:00:00 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 722.6MB · GL 16.3MB · Views 99 · pid=3031)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 1
  - [2026-07-13 08:00:00] DAILY_8AM_REPORT 2026-07-13 08:00:00 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-13 08:02:04 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 709.6MB · GL 16.3MB · Views 99 · pid=3031)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 3
  - [2026-07-13 08:00:00] DAILY_8AM_REPORT 2026-07-13 08:00:00 KST
  - [2026-07-13 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:02:04] DAILY_8AM_REPORT 2026-07-13 08:02:04 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-13 08:04:05 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 709.7MB · GL 16.3MB · Views 99 · pid=3031)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 5
  - [2026-07-13 08:00:00] DAILY_8AM_REPORT 2026-07-13 08:00:00 KST
  - [2026-07-13 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:02:04] DAILY_8AM_REPORT 2026-07-13 08:02:04 KST
  - [2026-07-13 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:04:05] DAILY_8AM_REPORT 2026-07-13 08:04:05 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-13 08:06:06 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 707.7MB · GL 16.3MB · Views 99 · pid=3031)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 7
  - [2026-07-13 08:00:00] DAILY_8AM_REPORT 2026-07-13 08:00:00 KST
  - [2026-07-13 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:02:04] DAILY_8AM_REPORT 2026-07-13 08:02:04 KST
  - [2026-07-13 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:04:05] DAILY_8AM_REPORT 2026-07-13 08:04:05 KST
  - [2026-07-13 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:06:06] DAILY_8AM_REPORT 2026-07-13 08:06:06 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-13 08:08:07 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 699.3MB · GL 16.3MB · Views 99 · pid=3031)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 9
  - [2026-07-13 08:00:00] DAILY_8AM_REPORT 2026-07-13 08:00:00 KST
  - [2026-07-13 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:02:04] DAILY_8AM_REPORT 2026-07-13 08:02:04 KST
  - [2026-07-13 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:04:05] DAILY_8AM_REPORT 2026-07-13 08:04:05 KST
  - [2026-07-13 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:06:06] DAILY_8AM_REPORT 2026-07-13 08:06:06 KST
  - [2026-07-13 08:06:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:08:07] DAILY_8AM_REPORT 2026-07-13 08:08:07 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-13 08:10:11 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 708.7MB · GL 16.3MB · Views 99 · pid=3031)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 11
  - [2026-07-13 08:00:00] DAILY_8AM_REPORT 2026-07-13 08:00:00 KST
  - [2026-07-13 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:02:04] DAILY_8AM_REPORT 2026-07-13 08:02:04 KST
  - [2026-07-13 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:04:05] DAILY_8AM_REPORT 2026-07-13 08:04:05 KST
  - [2026-07-13 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:06:06] DAILY_8AM_REPORT 2026-07-13 08:06:06 KST
  - [2026-07-13 08:06:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:08:07] DAILY_8AM_REPORT 2026-07-13 08:08:07 KST
  - [2026-07-13 08:08:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:10:11] DAILY_8AM_REPORT 2026-07-13 08:10:11 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-13 08:12:13 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 696.2MB · GL 16.3MB · Views 99 · pid=3031)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 13
  - [2026-07-13 08:00:00] DAILY_8AM_REPORT 2026-07-13 08:00:00 KST
  - [2026-07-13 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:02:04] DAILY_8AM_REPORT 2026-07-13 08:02:04 KST
  - [2026-07-13 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:04:05] DAILY_8AM_REPORT 2026-07-13 08:04:05 KST
  - [2026-07-13 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:06:06] DAILY_8AM_REPORT 2026-07-13 08:06:06 KST
  - [2026-07-13 08:06:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:08:07] DAILY_8AM_REPORT 2026-07-13 08:08:07 KST
  - [2026-07-13 08:08:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:10:11] DAILY_8AM_REPORT 2026-07-13 08:10:11 KST
  - [2026-07-13 08:10:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:12:13] DAILY_8AM_REPORT 2026-07-13 08:12:13 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-13 08:14:15 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **26948** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 700.4MB · GL 16.3MB · Views 99 · pid=3031)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 15
  - [2026-07-13 08:00:00] DAILY_8AM_REPORT 2026-07-13 08:00:00 KST
  - [2026-07-13 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:02:04] DAILY_8AM_REPORT 2026-07-13 08:02:04 KST
  - [2026-07-13 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:04:05] DAILY_8AM_REPORT 2026-07-13 08:04:05 KST
  - [2026-07-13 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:06:06] DAILY_8AM_REPORT 2026-07-13 08:06:06 KST
  - [2026-07-13 08:06:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:08:07] DAILY_8AM_REPORT 2026-07-13 08:08:07 KST
  - [2026-07-13 08:08:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:10:11] DAILY_8AM_REPORT 2026-07-13 08:10:11 KST
  - [2026-07-13 08:10:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:12:13] DAILY_8AM_REPORT 2026-07-13 08:12:13 KST
  - [2026-07-13 08:12:13] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-13 08:14:15] DAILY_8AM_REPORT 2026-07-13 08:14:15 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-17 11:31:15 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 408.8MB · GL 135.2MB · Views 556 · pid=6307)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260717-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 3
  - [2026-07-13 08:14:15] DAILY_8AM_REPORT 2026-07-13 08:14:15 KST
  - [2026-07-13 08:14:15] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260713-0800.md verdict=OK
  - [2026-07-17 11:31:15] DAILY_8AM_REPORT 2026-07-17 11:31:15 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-18 08:00:00 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 685.0MB · GL 40.6MB · Views 374 · pid=8697)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 3
  - [2026-07-17 11:31:15] DAILY_8AM_REPORT 2026-07-17 11:31:15 KST
  - [2026-07-17 11:31:15] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260717-0800.md verdict=OK
  - [2026-07-18 08:00:00] DAILY_8AM_REPORT 2026-07-18 08:00:00 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-18 08:02:04 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 705.4MB · GL 45.3MB · Views 400 · pid=8697)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 5
  - [2026-07-17 11:31:15] DAILY_8AM_REPORT 2026-07-17 11:31:15 KST
  - [2026-07-17 11:31:15] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260717-0800.md verdict=OK
  - [2026-07-18 08:00:00] DAILY_8AM_REPORT 2026-07-18 08:00:00 KST
  - [2026-07-18 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:02:04] DAILY_8AM_REPORT 2026-07-18 08:02:04 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-18 08:04:05 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 671.8MB · GL 38.6MB · Views 375 · pid=8697)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 7
  - [2026-07-17 11:31:15] DAILY_8AM_REPORT 2026-07-17 11:31:15 KST
  - [2026-07-17 11:31:15] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260717-0800.md verdict=OK
  - [2026-07-18 08:00:00] DAILY_8AM_REPORT 2026-07-18 08:00:00 KST
  - [2026-07-18 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:02:04] DAILY_8AM_REPORT 2026-07-18 08:02:04 KST
  - [2026-07-18 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:04:05] DAILY_8AM_REPORT 2026-07-18 08:04:05 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-18 08:06:06 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 663.0MB · GL 38.6MB · Views 375 · pid=8697)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 9
  - [2026-07-17 11:31:15] DAILY_8AM_REPORT 2026-07-17 11:31:15 KST
  - [2026-07-17 11:31:15] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260717-0800.md verdict=OK
  - [2026-07-18 08:00:00] DAILY_8AM_REPORT 2026-07-18 08:00:00 KST
  - [2026-07-18 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:02:04] DAILY_8AM_REPORT 2026-07-18 08:02:04 KST
  - [2026-07-18 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:04:05] DAILY_8AM_REPORT 2026-07-18 08:04:05 KST
  - [2026-07-18 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:06:06] DAILY_8AM_REPORT 2026-07-18 08:06:06 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-18 08:08:07 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 666.1MB · GL 38.6MB · Views 375 · pid=8697)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 11
  - [2026-07-17 11:31:15] DAILY_8AM_REPORT 2026-07-17 11:31:15 KST
  - [2026-07-17 11:31:15] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260717-0800.md verdict=OK
  - [2026-07-18 08:00:00] DAILY_8AM_REPORT 2026-07-18 08:00:00 KST
  - [2026-07-18 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:02:04] DAILY_8AM_REPORT 2026-07-18 08:02:04 KST
  - [2026-07-18 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:04:05] DAILY_8AM_REPORT 2026-07-18 08:04:05 KST
  - [2026-07-18 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:06:06] DAILY_8AM_REPORT 2026-07-18 08:06:06 KST
  - [2026-07-18 08:06:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:08:07] DAILY_8AM_REPORT 2026-07-18 08:08:07 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-18 08:10:08 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 697.5MB · GL 39.2MB · Views 392 · pid=8697)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 12
  - [2026-07-17 11:31:15] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260717-0800.md verdict=OK
  - [2026-07-18 08:00:00] DAILY_8AM_REPORT 2026-07-18 08:00:00 KST
  - [2026-07-18 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:02:04] DAILY_8AM_REPORT 2026-07-18 08:02:04 KST
  - [2026-07-18 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:04:05] DAILY_8AM_REPORT 2026-07-18 08:04:05 KST
  - [2026-07-18 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:06:06] DAILY_8AM_REPORT 2026-07-18 08:06:06 KST
  - [2026-07-18 08:06:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:08:07] DAILY_8AM_REPORT 2026-07-18 08:08:07 KST
  - [2026-07-18 08:08:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:10:08] DAILY_8AM_REPORT 2026-07-18 08:10:08 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-18 08:12:10 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 658.1MB · GL 38.6MB · Views 375 · pid=8697)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 13
  - [2026-07-18 08:00:00] DAILY_8AM_REPORT 2026-07-18 08:00:00 KST
  - [2026-07-18 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:02:04] DAILY_8AM_REPORT 2026-07-18 08:02:04 KST
  - [2026-07-18 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:04:05] DAILY_8AM_REPORT 2026-07-18 08:04:05 KST
  - [2026-07-18 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:06:06] DAILY_8AM_REPORT 2026-07-18 08:06:06 KST
  - [2026-07-18 08:06:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:08:07] DAILY_8AM_REPORT 2026-07-18 08:08:07 KST
  - [2026-07-18 08:08:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:10:08] DAILY_8AM_REPORT 2026-07-18 08:10:08 KST
  - [2026-07-18 08:10:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:12:10] DAILY_8AM_REPORT 2026-07-18 08:12:10 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-18 08:14:10 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 660.1MB · GL 38.6MB · Views 375 · pid=8697)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 15
  - [2026-07-18 08:00:00] DAILY_8AM_REPORT 2026-07-18 08:00:00 KST
  - [2026-07-18 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:02:04] DAILY_8AM_REPORT 2026-07-18 08:02:04 KST
  - [2026-07-18 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:04:05] DAILY_8AM_REPORT 2026-07-18 08:04:05 KST
  - [2026-07-18 08:04:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:06:06] DAILY_8AM_REPORT 2026-07-18 08:06:06 KST
  - [2026-07-18 08:06:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:08:07] DAILY_8AM_REPORT 2026-07-18 08:08:07 KST
  - [2026-07-18 08:08:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:10:08] DAILY_8AM_REPORT 2026-07-18 08:10:08 KST
  - [2026-07-18 08:10:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:12:10] DAILY_8AM_REPORT 2026-07-18 08:12:10 KST
  - [2026-07-18 08:12:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260718-0800.md verdict=OK
  - [2026-07-18 08:14:10] DAILY_8AM_REPORT 2026-07-18 08:14:10 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-19 08:00:00 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 790.3MB · GL 115.2MB · Views 550 · pid=8697)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 1
  - [2026-07-19 08:00:00] DAILY_8AM_REPORT 2026-07-19 08:00:00 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-19 08:02:05 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 789.0MB · GL 115.2MB · Views 550 · pid=8697)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 3
  - [2026-07-19 08:00:00] DAILY_8AM_REPORT 2026-07-19 08:00:00 KST
  - [2026-07-19 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:02:05] DAILY_8AM_REPORT 2026-07-19 08:02:05 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-19 08:04:06 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 792.4MB · GL 115.2MB · Views 550 · pid=8697)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 5
  - [2026-07-19 08:00:00] DAILY_8AM_REPORT 2026-07-19 08:00:00 KST
  - [2026-07-19 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:02:05] DAILY_8AM_REPORT 2026-07-19 08:02:05 KST
  - [2026-07-19 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:04:06] DAILY_8AM_REPORT 2026-07-19 08:04:06 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-19 08:06:07 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 782.1MB · GL 115.2MB · Views 550 · pid=8697)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 7
  - [2026-07-19 08:00:00] DAILY_8AM_REPORT 2026-07-19 08:00:00 KST
  - [2026-07-19 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:02:05] DAILY_8AM_REPORT 2026-07-19 08:02:05 KST
  - [2026-07-19 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:04:06] DAILY_8AM_REPORT 2026-07-19 08:04:06 KST
  - [2026-07-19 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:06:07] DAILY_8AM_REPORT 2026-07-19 08:06:07 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-19 08:08:08 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 783.2MB · GL 115.2MB · Views 550 · pid=8697)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 9
  - [2026-07-19 08:00:00] DAILY_8AM_REPORT 2026-07-19 08:00:00 KST
  - [2026-07-19 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:02:05] DAILY_8AM_REPORT 2026-07-19 08:02:05 KST
  - [2026-07-19 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:04:06] DAILY_8AM_REPORT 2026-07-19 08:04:06 KST
  - [2026-07-19 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:06:07] DAILY_8AM_REPORT 2026-07-19 08:06:07 KST
  - [2026-07-19 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:08:08] DAILY_8AM_REPORT 2026-07-19 08:08:08 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-19 08:10:09 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 782.8MB · GL 117.3MB · Views 550 · pid=8697)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 11
  - [2026-07-19 08:00:00] DAILY_8AM_REPORT 2026-07-19 08:00:00 KST
  - [2026-07-19 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:02:05] DAILY_8AM_REPORT 2026-07-19 08:02:05 KST
  - [2026-07-19 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:04:06] DAILY_8AM_REPORT 2026-07-19 08:04:06 KST
  - [2026-07-19 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:06:07] DAILY_8AM_REPORT 2026-07-19 08:06:07 KST
  - [2026-07-19 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:08:08] DAILY_8AM_REPORT 2026-07-19 08:08:08 KST
  - [2026-07-19 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:10:09] DAILY_8AM_REPORT 2026-07-19 08:10:09 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-19 08:12:11 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 780.7MB · GL 115.2MB · Views 550 · pid=8697)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 13
  - [2026-07-19 08:00:00] DAILY_8AM_REPORT 2026-07-19 08:00:00 KST
  - [2026-07-19 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:02:05] DAILY_8AM_REPORT 2026-07-19 08:02:05 KST
  - [2026-07-19 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:04:06] DAILY_8AM_REPORT 2026-07-19 08:04:06 KST
  - [2026-07-19 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:06:07] DAILY_8AM_REPORT 2026-07-19 08:06:07 KST
  - [2026-07-19 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:08:08] DAILY_8AM_REPORT 2026-07-19 08:08:08 KST
  - [2026-07-19 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:10:09] DAILY_8AM_REPORT 2026-07-19 08:10:09 KST
  - [2026-07-19 08:10:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:12:11] DAILY_8AM_REPORT 2026-07-19 08:12:11 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-19 08:14:12 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 777.0MB · GL 115.2MB · Views 550 · pid=8697)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 14
  - [2026-07-19 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:02:05] DAILY_8AM_REPORT 2026-07-19 08:02:05 KST
  - [2026-07-19 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:04:06] DAILY_8AM_REPORT 2026-07-19 08:04:06 KST
  - [2026-07-19 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:06:07] DAILY_8AM_REPORT 2026-07-19 08:06:07 KST
  - [2026-07-19 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:08:08] DAILY_8AM_REPORT 2026-07-19 08:08:08 KST
  - [2026-07-19 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:10:09] DAILY_8AM_REPORT 2026-07-19 08:10:09 KST
  - [2026-07-19 08:10:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:12:11] DAILY_8AM_REPORT 2026-07-19 08:12:11 KST
  - [2026-07-19 08:12:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-19 08:14:12] DAILY_8AM_REPORT 2026-07-19 08:14:12 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-20 08:00:00 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 725.8MB · GL 35.7MB · Views 394 · pid=25277)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 3
  - [2026-07-19 08:14:12] DAILY_8AM_REPORT 2026-07-19 08:14:12 KST
  - [2026-07-19 08:14:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260719-0800.md verdict=OK
  - [2026-07-20 08:00:00] DAILY_8AM_REPORT 2026-07-20 08:00:00 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-20 08:02:05 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 717.5MB · GL 35.1MB · Views 373 · pid=25277)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 3
  - [2026-07-20 08:00:00] DAILY_8AM_REPORT 2026-07-20 08:00:00 KST
  - [2026-07-20 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:02:05] DAILY_8AM_REPORT 2026-07-20 08:02:05 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-20 08:04:06 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 710.3MB · GL 37.1MB · Views 373 · pid=25277)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 5
  - [2026-07-20 08:00:00] DAILY_8AM_REPORT 2026-07-20 08:00:00 KST
  - [2026-07-20 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:02:05] DAILY_8AM_REPORT 2026-07-20 08:02:05 KST
  - [2026-07-20 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:04:06] DAILY_8AM_REPORT 2026-07-20 08:04:06 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-20 08:06:07 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 700.2MB · GL 35.1MB · Views 373 · pid=25277)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 7
  - [2026-07-20 08:00:00] DAILY_8AM_REPORT 2026-07-20 08:00:00 KST
  - [2026-07-20 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:02:05] DAILY_8AM_REPORT 2026-07-20 08:02:05 KST
  - [2026-07-20 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:04:06] DAILY_8AM_REPORT 2026-07-20 08:04:06 KST
  - [2026-07-20 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:06:07] DAILY_8AM_REPORT 2026-07-20 08:06:07 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-20 08:08:08 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 699.2MB · GL 35.1MB · Views 374 · pid=25277)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 9
  - [2026-07-20 08:00:00] DAILY_8AM_REPORT 2026-07-20 08:00:00 KST
  - [2026-07-20 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:02:05] DAILY_8AM_REPORT 2026-07-20 08:02:05 KST
  - [2026-07-20 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:04:06] DAILY_8AM_REPORT 2026-07-20 08:04:06 KST
  - [2026-07-20 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:06:07] DAILY_8AM_REPORT 2026-07-20 08:06:07 KST
  - [2026-07-20 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:08:08] DAILY_8AM_REPORT 2026-07-20 08:08:08 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-20 08:10:09 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 707.6MB · GL 37.1MB · Views 373 · pid=25277)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 11
  - [2026-07-20 08:00:00] DAILY_8AM_REPORT 2026-07-20 08:00:00 KST
  - [2026-07-20 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:02:05] DAILY_8AM_REPORT 2026-07-20 08:02:05 KST
  - [2026-07-20 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:04:06] DAILY_8AM_REPORT 2026-07-20 08:04:06 KST
  - [2026-07-20 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:06:07] DAILY_8AM_REPORT 2026-07-20 08:06:07 KST
  - [2026-07-20 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:08:08] DAILY_8AM_REPORT 2026-07-20 08:08:08 KST
  - [2026-07-20 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:10:09] DAILY_8AM_REPORT 2026-07-20 08:10:09 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-20 08:12:10 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 702.7MB · GL 37.1MB · Views 373 · pid=25277)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 13
  - [2026-07-20 08:00:00] DAILY_8AM_REPORT 2026-07-20 08:00:00 KST
  - [2026-07-20 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:02:05] DAILY_8AM_REPORT 2026-07-20 08:02:05 KST
  - [2026-07-20 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:04:06] DAILY_8AM_REPORT 2026-07-20 08:04:06 KST
  - [2026-07-20 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:06:07] DAILY_8AM_REPORT 2026-07-20 08:06:07 KST
  - [2026-07-20 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:08:08] DAILY_8AM_REPORT 2026-07-20 08:08:08 KST
  - [2026-07-20 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:10:09] DAILY_8AM_REPORT 2026-07-20 08:10:09 KST
  - [2026-07-20 08:10:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:12:10] DAILY_8AM_REPORT 2026-07-20 08:12:10 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-20 08:14:11 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 732.2MB · GL 35.7MB · Views 394 · pid=25277)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 15
  - [2026-07-20 08:00:00] DAILY_8AM_REPORT 2026-07-20 08:00:00 KST
  - [2026-07-20 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:02:05] DAILY_8AM_REPORT 2026-07-20 08:02:05 KST
  - [2026-07-20 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:04:06] DAILY_8AM_REPORT 2026-07-20 08:04:06 KST
  - [2026-07-20 08:04:06] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:06:07] DAILY_8AM_REPORT 2026-07-20 08:06:07 KST
  - [2026-07-20 08:06:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:08:08] DAILY_8AM_REPORT 2026-07-20 08:08:08 KST
  - [2026-07-20 08:08:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:10:09] DAILY_8AM_REPORT 2026-07-20 08:10:09 KST
  - [2026-07-20 08:10:09] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:12:10] DAILY_8AM_REPORT 2026-07-20 08:12:10 KST
  - [2026-07-20 08:12:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260720-0800.md verdict=OK
  - [2026-07-20 08:14:11] DAILY_8AM_REPORT 2026-07-20 08:14:11 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-21 08:00:00 KST — **데일리 08:00 상시 자동보고** (WARN)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **WARN** (PSS 936.4MB · GL 152.9MB · Views 559 · pid=29524)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md
- **verdict**: **WARN**
- **incidents (actionable tail)**: 2
  - [2026-07-21 00:30:19] GL_HARD_CEILING gl=132.4 pss=953.6 views=567
  - [2026-07-21 08:00:00] DAILY_8AM_REPORT 2026-07-21 08:00:00 KST
- **권장(김팀장 1안)**: PSS 850+ — floor watch

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-21 08:02:05 KST — **데일리 08:00 상시 자동보고** (WARN)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **WARN** (PSS 943.8MB · GL 156.9MB · Views 559 · pid=29524)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md
- **verdict**: **WARN**
- **incidents (actionable tail)**: 4
  - [2026-07-21 00:30:19] GL_HARD_CEILING gl=132.4 pss=953.6 views=567
  - [2026-07-21 08:00:00] DAILY_8AM_REPORT 2026-07-21 08:00:00 KST
  - [2026-07-21 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:02:05] DAILY_8AM_REPORT 2026-07-21 08:02:05 KST
- **권장(김팀장 1안)**: PSS 850+ — floor watch

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-21 08:04:08 KST — **데일리 08:00 상시 자동보고** (WARN)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **WARN** (PSS 949.2MB · GL 152.9MB · Views 559 · pid=29524)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md
- **verdict**: **WARN**
- **incidents (actionable tail)**: 6
  - [2026-07-21 00:30:19] GL_HARD_CEILING gl=132.4 pss=953.6 views=567
  - [2026-07-21 08:00:00] DAILY_8AM_REPORT 2026-07-21 08:00:00 KST
  - [2026-07-21 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:02:05] DAILY_8AM_REPORT 2026-07-21 08:02:05 KST
  - [2026-07-21 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:04:08] DAILY_8AM_REPORT 2026-07-21 08:04:08 KST
- **권장(김팀장 1안)**: PSS 850+ — floor watch

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-21 08:06:10 KST — **데일리 08:00 상시 자동보고** (WARN)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **WARN** (PSS 945.8MB · GL 152.9MB · Views 559 · pid=29524)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md
- **verdict**: **WARN**
- **incidents (actionable tail)**: 8
  - [2026-07-21 00:30:19] GL_HARD_CEILING gl=132.4 pss=953.6 views=567
  - [2026-07-21 08:00:00] DAILY_8AM_REPORT 2026-07-21 08:00:00 KST
  - [2026-07-21 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:02:05] DAILY_8AM_REPORT 2026-07-21 08:02:05 KST
  - [2026-07-21 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:04:08] DAILY_8AM_REPORT 2026-07-21 08:04:08 KST
  - [2026-07-21 08:04:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:06:10] DAILY_8AM_REPORT 2026-07-21 08:06:10 KST
- **권장(김팀장 1안)**: PSS 850+ — floor watch

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-21 08:08:11 KST — **데일리 08:00 상시 자동보고** (WARN)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **WARN** (PSS 932.7MB · GL 152.9MB · Views 559 · pid=29524)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md
- **verdict**: **WARN**
- **incidents (actionable tail)**: 10
  - [2026-07-21 00:30:19] GL_HARD_CEILING gl=132.4 pss=953.6 views=567
  - [2026-07-21 08:00:00] DAILY_8AM_REPORT 2026-07-21 08:00:00 KST
  - [2026-07-21 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:02:05] DAILY_8AM_REPORT 2026-07-21 08:02:05 KST
  - [2026-07-21 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:04:08] DAILY_8AM_REPORT 2026-07-21 08:04:08 KST
  - [2026-07-21 08:04:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:06:10] DAILY_8AM_REPORT 2026-07-21 08:06:10 KST
  - [2026-07-21 08:06:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:08:11] DAILY_8AM_REPORT 2026-07-21 08:08:11 KST
- **권장(김팀장 1안)**: PSS 850+ — floor watch

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-21 08:10:13 KST — **데일리 08:00 상시 자동보고** (CRITICAL)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **CRITICAL** (PSS 953.2MB · GL 152.9MB · Views 559 · pid=29524)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md
- **verdict**: **CRITICAL**
- **incidents (actionable tail)**: 11
  - [2026-07-21 08:00:00] DAILY_8AM_REPORT 2026-07-21 08:00:00 KST
  - [2026-07-21 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:02:05] DAILY_8AM_REPORT 2026-07-21 08:02:05 KST
  - [2026-07-21 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:04:08] DAILY_8AM_REPORT 2026-07-21 08:04:08 KST
  - [2026-07-21 08:04:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:06:10] DAILY_8AM_REPORT 2026-07-21 08:06:10 KST
  - [2026-07-21 08:06:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:08:11] DAILY_8AM_REPORT 2026-07-21 08:08:11 KST
  - [2026-07-21 08:08:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:10:13] DAILY_8AM_REPORT 2026-07-21 08:10:13 KST
- **권장(김팀장 1안)**: PSS>=950 — hub exit / Skia dispose P0

> status: **ready-for-team-lead-action** · **08:00 보고체 유지**

## [관측] 2026-07-21 08:12:14 KST — **데일리 08:00 상시 자동보고** (WARN)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **WARN** (PSS 929.9MB · GL 154.9MB · Views 559 · pid=29524)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md
- **verdict**: **WARN**
- **incidents (actionable tail)**: 13
  - [2026-07-21 08:00:00] DAILY_8AM_REPORT 2026-07-21 08:00:00 KST
  - [2026-07-21 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:02:05] DAILY_8AM_REPORT 2026-07-21 08:02:05 KST
  - [2026-07-21 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:04:08] DAILY_8AM_REPORT 2026-07-21 08:04:08 KST
  - [2026-07-21 08:04:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:06:10] DAILY_8AM_REPORT 2026-07-21 08:06:10 KST
  - [2026-07-21 08:06:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:08:11] DAILY_8AM_REPORT 2026-07-21 08:08:11 KST
  - [2026-07-21 08:08:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:10:13] DAILY_8AM_REPORT 2026-07-21 08:10:13 KST
  - [2026-07-21 08:10:13] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=CRITICAL
  - [2026-07-21 08:12:14] DAILY_8AM_REPORT 2026-07-21 08:12:14 KST
- **권장(김팀장 1안)**: PSS 850+ — floor watch

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-21 08:14:15 KST — **데일리 08:00 상시 자동보고** (WARN)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **WARN** (PSS 938.4MB · GL 152.9MB · Views 559 · pid=29524)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md
- **verdict**: **WARN**
- **incidents (actionable tail)**: 14
  - [2026-07-21 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:02:05] DAILY_8AM_REPORT 2026-07-21 08:02:05 KST
  - [2026-07-21 08:02:05] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:04:08] DAILY_8AM_REPORT 2026-07-21 08:04:08 KST
  - [2026-07-21 08:04:08] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:06:10] DAILY_8AM_REPORT 2026-07-21 08:06:10 KST
  - [2026-07-21 08:06:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:08:11] DAILY_8AM_REPORT 2026-07-21 08:08:11 KST
  - [2026-07-21 08:08:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:10:13] DAILY_8AM_REPORT 2026-07-21 08:10:13 KST
  - [2026-07-21 08:10:13] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=CRITICAL
  - [2026-07-21 08:12:14] DAILY_8AM_REPORT 2026-07-21 08:12:14 KST
  - [2026-07-21 08:12:14] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260721-0800.md verdict=WARN
  - [2026-07-21 08:14:15] DAILY_8AM_REPORT 2026-07-21 08:14:15 KST
- **권장(김팀장 1안)**: PSS 850+ — floor watch

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-22 08:00:00 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 626.7MB · GL 108.4MB · Views 553 · pid=20407)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 1
  - [2026-07-22 08:00:00] DAILY_8AM_REPORT 2026-07-22 08:00:00 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-22 08:02:04 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 623.8MB · GL 108.3MB · Views 553 · pid=20407)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 3
  - [2026-07-22 08:00:00] DAILY_8AM_REPORT 2026-07-22 08:00:00 KST
  - [2026-07-22 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:02:04] DAILY_8AM_REPORT 2026-07-22 08:02:04 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-22 08:04:07 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 622.3MB · GL 108.4MB · Views 553 · pid=20407)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 5
  - [2026-07-22 08:00:00] DAILY_8AM_REPORT 2026-07-22 08:00:00 KST
  - [2026-07-22 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:02:04] DAILY_8AM_REPORT 2026-07-22 08:02:04 KST
  - [2026-07-22 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:04:07] DAILY_8AM_REPORT 2026-07-22 08:04:07 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-22 08:06:10 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 621.8MB · GL 108.4MB · Views 553 · pid=20407)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 7
  - [2026-07-22 08:00:00] DAILY_8AM_REPORT 2026-07-22 08:00:00 KST
  - [2026-07-22 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:02:04] DAILY_8AM_REPORT 2026-07-22 08:02:04 KST
  - [2026-07-22 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:04:07] DAILY_8AM_REPORT 2026-07-22 08:04:07 KST
  - [2026-07-22 08:04:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:06:10] DAILY_8AM_REPORT 2026-07-22 08:06:10 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-22 08:08:11 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 627.4MB · GL 108.4MB · Views 553 · pid=20407)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 9
  - [2026-07-22 08:00:00] DAILY_8AM_REPORT 2026-07-22 08:00:00 KST
  - [2026-07-22 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:02:04] DAILY_8AM_REPORT 2026-07-22 08:02:04 KST
  - [2026-07-22 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:04:07] DAILY_8AM_REPORT 2026-07-22 08:04:07 KST
  - [2026-07-22 08:04:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:06:10] DAILY_8AM_REPORT 2026-07-22 08:06:10 KST
  - [2026-07-22 08:06:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:08:11] DAILY_8AM_REPORT 2026-07-22 08:08:11 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-22 08:10:12 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 618.7MB · GL 108.4MB · Views 553 · pid=20407)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 11
  - [2026-07-22 08:00:00] DAILY_8AM_REPORT 2026-07-22 08:00:00 KST
  - [2026-07-22 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:02:04] DAILY_8AM_REPORT 2026-07-22 08:02:04 KST
  - [2026-07-22 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:04:07] DAILY_8AM_REPORT 2026-07-22 08:04:07 KST
  - [2026-07-22 08:04:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:06:10] DAILY_8AM_REPORT 2026-07-22 08:06:10 KST
  - [2026-07-22 08:06:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:08:11] DAILY_8AM_REPORT 2026-07-22 08:08:11 KST
  - [2026-07-22 08:08:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:10:12] DAILY_8AM_REPORT 2026-07-22 08:10:12 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-22 08:12:12 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 623.4MB · GL 108.4MB · Views 553 · pid=20407)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 13
  - [2026-07-22 08:00:00] DAILY_8AM_REPORT 2026-07-22 08:00:00 KST
  - [2026-07-22 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:02:04] DAILY_8AM_REPORT 2026-07-22 08:02:04 KST
  - [2026-07-22 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:04:07] DAILY_8AM_REPORT 2026-07-22 08:04:07 KST
  - [2026-07-22 08:04:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:06:10] DAILY_8AM_REPORT 2026-07-22 08:06:10 KST
  - [2026-07-22 08:06:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:08:11] DAILY_8AM_REPORT 2026-07-22 08:08:11 KST
  - [2026-07-22 08:08:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:10:12] DAILY_8AM_REPORT 2026-07-22 08:10:12 KST
  - [2026-07-22 08:10:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:12:12] DAILY_8AM_REPORT 2026-07-22 08:12:12 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## [관측] 2026-07-22 08:14:13 KST — **데일리 08:00 상시 자동보고** (OK)

- **정책**: 상시 무조건 보고 · 중단은 `schedule-8am-report-DISABLED.flag` 명시 시에만
- **김경제 감시**: watch-30m PID **12884** · auto-fix=ON
- **adb**: OK (adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp)
- **앱**: RUNNING
- **mem-monitor**: **OK** (PSS 627.4MB · GL 112.4MB · Views 553 · pid=20407)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md
- **verdict**: **OK**
- **incidents (actionable tail)**: 14
  - [2026-07-22 08:00:00] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:02:04] DAILY_8AM_REPORT 2026-07-22 08:02:04 KST
  - [2026-07-22 08:02:04] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:04:07] DAILY_8AM_REPORT 2026-07-22 08:04:07 KST
  - [2026-07-22 08:04:07] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:06:10] DAILY_8AM_REPORT 2026-07-22 08:06:10 KST
  - [2026-07-22 08:06:10] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:08:11] DAILY_8AM_REPORT 2026-07-22 08:08:11 KST
  - [2026-07-22 08:08:11] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:10:12] DAILY_8AM_REPORT 2026-07-22 08:10:12 KST
  - [2026-07-22 08:10:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:12:12] DAILY_8AM_REPORT 2026-07-22 08:12:12 KST
  - [2026-07-22 08:12:12] DAILY_8AM_REPORT_READY D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260722-0800.md verdict=OK
  - [2026-07-22 08:14:13] DAILY_8AM_REPORT 2026-07-22 08:14:13 KST
- **권장(김팀장 1안)**: daily 08:00 soak OK — review report

> status: monitor-ok · **08:00 보고체 유지**

## 작업 요약

- **일자 (KST)**: 2026-06-18
- **범위**: ① 전함 풀강 스펙·가치 추산 데이터화 · ② 행성 유지비 개발도 비례화(기반작업)
- **상태**: ready-for-review

---

## 작업 ② 행성 유지비 개발도 비례화 (기반작업 — 적용 가능한 부분 선작업)

### 요구 → 현황 검증

- 모든 행성 유지비 일일 계산: **기존 구현됨**(`runArcCorePlanetUpkeepDailyPass`, 일 1회). 단 **정액 800cr·개발도 무시**였음 → 이번에 개발도 비례 가산.
- 홈/플레이어 소유 행성 → 플레이어 가상금고 수익 입금: **기존 구현됨**(`takePlayerWalletPendingForPlanets` → `addCredits`, 거래수수료 player wallet share). 변경 없음·기반 확인.
- 유지비 ∝ 개발도, 수익에서 차감: **방위위성(유일한 구현 완료 개발 엔티티)** 레벨별 1일 유지비를 산술 정의해 반영.

### 변경 파일

- `tables/balance/planet_defense_satellite_level_policy.csv` — `dailyUpkeepCredits` 컬럼 추가. 곡선 `round(100·lv·(1+0.12·(lv-1)))` → L1=100 … L10=2080.
- `tables/balance/arc_core_planet_upkeep_policy.csv` — `upkeep_development_scaling_enabled=true` 추가, version 2→3.
- `src/arcCore/balance/planetDefenseSatelliteLevelPolicy.ts` — row 타입·파서에 `dailyUpkeepCredits`, 접근자 `resolveDefenseSatelliteDailyUpkeepCredits(level)`.
- `src/arcCore/economy/planetDevelopmentUpkeep.ts` (신규) — 행성 개발 엔티티 유지비 집계(현재 방위위성, 확장 슬롯). 일일 배치·스냅샷 전용.
- `src/arcCore/economy/planetUpkeepPolicy.ts` — `developmentScalingEnabled` 정책, `computePlanetDailyUpkeepCredits(devUpkeep, policy)` = 베이스+개발 가산.
- `src/arcCore/economy/runArcCorePlanetUpkeepDailyPass.ts` — 행성별 dev 유지비 합산 후 차감(배치 내부, 부트경로 미접촉).
- `src/game/planetHub/planetEconomyInfoSnapshot.ts` — 표시 유지비도 개발도 반영(호출처 1줄).

### 산식·차감 흐름

- 행성 1일 유지비 = `upkeep_fixed_credits_per_planet(800)` + Σ(개발 엔티티 레벨 유지비).
- 예: 방위위성 L10 행성 = 800 + 2080 = **2880cr/일**. 플레이어 소유는 플레이어 지갑, 팩션 점령은 해당 금고에서 차감(`spendUpToBalance` 0캡).
- 수익(거래수수료) → 일부 player wallet/금고 입금은 기존 경로 유지 → 유지비는 동일 배치에서 차감되어 **순수익 = 수익 − 유지비** 구조 성립.

### 한계·후속 (정직 고지)

- `dev_energy_plant` 등 나머지 개발 엔티티는 **미구현(catalog enabled=false)** → 유지비 0. `planetDevelopmentUpkeep.ts`에 슬롯만 추가하면 즉시 합산(기반 완료).
- 방위위성 비용(install/upgrade)은 여전히 TEST 1cr — 적정가 재설정은 별도 작업.
- dailyUpkeep 곡선·800 베이스는 **1차 산술값**. 실제 행성 수익 데이터와 대조한 튜닝은 후속(최종 행성 수익 계산 기능 구현 후).

### 추가/변경 파일

- `tools/ship-upgrade-value/run-ship-upgrade-value.ts` (신규) — 풀강 스펙·가치 추산 도구. RN 자산(`*.png`) headless 스텁 후 레지스트리·가격 정본 동적 import.
- `tables/balance/capital_ship_max_upgrade_value.csv` (신규·GENERATED) — 정본 산출 테이블 (223척, ownable 플래그 포함).
- `tools/ship-upgrade-value/reports/latest.md` (신규) — 사람이 읽는 요약.
- `package.json` — `"sim:ship-upgrade-value"` 스크립트 추가.
- `src/arcCore/balance/capitalShipPerformancePricing.ts` — `scoreCapitalCombatStats(combat)` export 추가(가격 정본 점수 재사용, combatPerformanceScore가 이를 호출하도록 리팩터). 동작 불변.

### 산식 (정본 재사용)

- 풀강 적용: `ShipPerformanceCalculator.applyMineralUpgradeToShipPerformance` (HP/실드 가산·무기 데미지 damageDice.bonus·쿨다운 배수·선회 배수).
- 성능지수 가치: 무역소 가격 정본 `scoreCapitalCombatStats` (HP·실드·armor·DPR·attackBonus 가중).
- 전투력 지수: `EHP×DPS/1000` (쿨다운·실드 반영, 가격모델 미반영분 보완 — 전투밸런스 주축).
- 광물 투자 환산: 풀강 총 ore = `qty×N(N+1)/2` → `mining_sell_price_policy.csv` 환산 = **204,720 cr** (전함 무관 동일).
- 최종 추산 가치 = 무역소 기준가 + 광물 투자 크레딧.

## 김경제 완료 게이트

- [x] `npm run audit:balance-ops` PASS (Overall: PASS)
- [x] `npm run audit:balance` PASS (12/12)
- [x] `npx tsc --noEmit -p tsconfig.client.json` (exit 0)
- [x] 산출물 생성 확인 (`sim:ship-upgrade-value` exit 0 · 223척)

## KPI·감사 스냅샷

- balance-ops: **PASS**
- 풀강 평균(보유 23척): 성능지수 **+142.1%**, 전투력(EHP×DPS) **+1344.6%**
- 풀강 전투력 상위: 팬텀 레전드/슈퍼캐피털/드레드노트(ranger 계열 상위) · 강화 수혜율 최고: 생존포드·기본 정찰함(저베이스).
- 권장 조치 1안: 광물 투자비가 전함 무관 정액(204,720cr)이라 **저티어 전함의 투자 대비 가치 상승폭이 과대** → 경제 밸런스에서 **티어별 광물 sink 차등**(고티어 비용 가중) 검토. 단, 본 작업은 데이터화까지이며 수치 조정은 별도 합의 후 진행.

## 김팀장 연동 대기

> 김팀장이 **코드 연동·정리**할 항목만 `- [ ]` 로 적는다. 없으면 「_(연동 대기 없음)_」. 완료 시 `[x]`.

- [ ] (검토) `capitalShipPerformancePricing.ts`의 `scoreCapitalCombatStats` export 1건 — 가격 정본 모듈 최소 변경. 동작 불변이나 비경제 코드 정리/네이밍 컨벤션 확인 요망.
- [ ] (선택) `capital_ship_max_upgrade_value.csv`를 build/generated 파이프라인에 연동할지(현재는 도구 산출 정적 CSV·런타임 미참조) 정책 결정.
- [ ] (정보) 전투밸런스 적용 시: 본 표의 `fullCombatPower`/`combatPowerGainPct`를 적 NPC(웨이브) 난이도·HP 배율과 대조. 선회/사거리 강화는 본 지수 미반영(별도 시뮬 필요).
- [ ] (검토·②) `planetEconomyInfoSnapshot.ts`(planetHub UI 스냅샷) 호출처 1줄 수정 — 표시 유지비 개발도 반영. UI 영향 경미하나 김팀장 확인 요망.
- [ ] (정보·②) 유지비 부족분(shortfall)은 현재 로그만(행성 패널티 미구현) — 개발도 비례로 부족분 빈도↑ 가능. 패널티 정책은 후속 합의.
- [ ] (정보·②) `[econ-boot-audit]` 부트경로 격리 OK — 신규 dev 유지비 집계는 `runArcCorePlanetUpkeepDailyPass`(배치)·info 스냅샷에서만 호출, onBoot 동기경로 미접촉. tsc·balance-ops·balance PASS.

## 비고

- 사거리(`weapon_range_flat`) 강화는 calculator v1에서 미적용 상태 → 전투력 지수에도 미반영. 후속 보완 시 표 재생성 필요.
- 데이터 재생성: `npm run sim:ship-upgrade-value`.

_(김팀장 검수 코멘트·반려 사유는 아래에 기록)_

---

## [김팀장 지시 · 2026-06-18] 행성개발 v2.0 × 무역소·경제 구조 검토 요청

> **원칙**: 행성개발 적용으로 SKU·배치·수수료 등 **세분화**는 가능하나, **zone 17/21 무역소·교역 SKU 분배·일일 배치(AABS/convoy) 큰 골격은 변경 금지**.

### 김경제 검토 과제 (우선)

1. **이중 기준 맵** — `planets.csv hasTradePort` vs `dev_trade_port` 설치 vs `listPlanetIdsWithTradePort()` (김팀장: CSV∪dev로 통합 연동 완료, SIM 재검증 요망)
2. **무역소 SKU “사라짐” 회귀** — Lv1 `unlockSkuCount=5` + `applyTradePortDevCatalogGate`가 zone 정본(교역·무기·장비·전함) 대비 과도 축소였음 → **parity Lv**(카탈로그 규모 커버 최소 Lv) 도입. **Kim: zone별 parity Lv·수수료율이 SIM KPI(F2P/Dolphin/Whale) 내인지 확인**
3. **배치 항목** — `syncTradePortCatalogFromBalance`·`trade_route_planet_supply_assignments.csv`·`runMarketPricePass`가 dev-only 행성을 누락하지 않는지 전 행성 diff
4. **Arcadia (`arcadia_prime`)** — CSV 3시설 true; 시드 후 무역 탭 SKU 수 = 행성개발 전 zone 정본과 동일한지 스냅샷 비교
5. **미연동(P1)** — `stockLimit`/`supplyStockScale`(facility Lv) ↔ `planetEconomyFabric`/`planetTradeMarketStore` — 큰 구조 변경 없이 게이트만 추가할 설계안

### 김팀장 1차 조치 (코드 · 2026-06-18)

- `planetFacilityCsvLegacySeed.ts` — CSV `hasTradePort|hasShipyard|hasTavern` → dev 모듈 1회 시드
- `planetTradePortParity.ts` — CSV 무역 행성 SKU 하한(parity Lv)
- `planetTradePortRuntimeBridge` — 실효 Lv = max(설치 Lv, parity)
- `listPlanetIdsWithTradePort()` — CSV ∪ dev 설치

### 김경제 산출물 요청

- [ ] `npm run audit:balance-ops` + arcadia_prime SKU diff 리포트 (before/after parity)
- [ ] `sim:economy` KPI 변동 ±5% 이내 여부 (Whale/F2P ratio critical 유지)
- [ ] `facility_trade_port_level_policy.csv` Lv1 TEST 값(5 SKU) — **신규 개척 행성 전용**으로 명시할지, zone band별 Lv1 floor 제안
- [ ] handoff 본 섹션에 **PASS/FAIL** 및 CSV 수정안만 제출 (코드는 김팀장 연동)

---

## [2026-06-19] 행성개발 집계 허브 v2.3 — 5대 지표·비용 효율

**상태**: `ready-for-review` · `audit:balance-ops` PASS · `tsc` PASS

### 큰 방향 (2층)

| 층 | 역할 |
|---|---|
| **1층 모듈** | 무역소 수수료·고급무기 가중, 조선소 티어/광물캡, 방위전투, 연구소 RD, 선술집 현상금 등 **시설 고유 보상** |
| **2층 집계** | `planetDevelopmentLevelBenefits.ts` — 레벨업 **5대 지표 즉시 상승** + **T·집계레벨 비용/유지비 효율** + **TDI→PGP** |

### 정본 CSV

- `planet_development_aggregate_policy.csv` — 비용·유지비 효율 상한, 레벨업 nudge 비율, TDI→PGP 계수
- `facility_upgrade_levels.csv` — 일일 nudge + `tdi_contribution_formula` (이제 코드 소비)

### 밸런스 스냅샷 (정책 기본값)

| 항목 | 중반 (T30·시설합15Lv) | 맥스 (T100·전시설Lv10) |
|---|---|---|
| 업그레이드 비용 할인 | ~14% | **25%** (cap) |
| 개발 유지비 절감 | ~12% | **15%** (cap) |
| TDI 점수 | ~40 | **~135** |
| TDI PGP 가산 | ~3,200 BMU | **~10,800 BMU** |

### 김경제 후속 튜닝 제안

- [ ] `facility_*_level_policy.csv` TEST 1cr → 실제 곡선 (비용 효율과 역학 검증)
- [ ] `sim:economy` — TDI PGP 가산이 Whale/F2P ratio critical(≥8) 유발 여부
- [ ] `level_up_stat_nudge_daily_fraction` 1.0 → 일일+즉시 이중 상승 속도 SIM

---

---

## [관측] 2026-06-24 21:17 KST — 메모리 우선순위 · 감시 재개

- **mem-monitor**: WARN (PSS ~670–850MB · Native Heap **~336–470MB** 주 원인)
- **조치(김팀장)**: `runPlanetHubSoftNativeReclaimPass` — 허브 **5분** soft reclaim (worldmap 대칭) · 15분 deep 유지
- **감시**: watch-30m PID **15280** OK · snapshot `mem_priority_watch_2115`
- **다음 샘플**: ~21:39 (30m) · soft reclaim 첫 tick ~5분 후(앱 리로드 후)
- **권장**: 아르카디아 체류 soak — PSS 850+ 재발 시 알림

## [관측] 2026-06-24 20:41 KST — 아르카디아 체류 · **WARN→CRITICAL**

- **mem-monitor**: **CRITICAL** (PSS 1GB 육박 반복)
- **mem-profile / retention**: NO_DATA (스냅샷만 · arcadia_hub 20:40)
- **profile 구간**: `2026-06-24 20:36` heartbeat · `20:39` mem-timeline · STAGE **planet_hub (arcadia)**
- **실측 (PID 20679)**:
  - **20:36** PSS **971.4MB** / GL **139.9MB** / views 296 ← **하드실링(950MB) 근접**
  - **20:39** PSS 847.3MB / GL 23.6MB / views 321 (`PSS_SOFT_CEILING`)
  - **20:40** PSS **~819MB** / GL 25MB / views 298 / **Native Heap ~470MB** (주 원인)
- **당일 피크**: 19:15 PSS **1078.7MB** · 19:38 **1009.4MB** (hard-ceiling incident)
- **감시**: watch-30m PID **15280** 가동 중 · 마일스톤 `arcadia_idle_watch_until_11am_20260625`
- **권장(김팀장 1안)**: Native Heap ~470MB 누적 — 허브 체류 floor 상승. `ingress reclaim`·`planetHubIngressReclaim`·고빈도 persist/틱 할당 재점검. PSS≥950 재발 시 **은하맵 왕복 1회**로 blur reclaim 유도(플레이 중단 최소).

> status: **ready-for-team-lead-action** · 감시 **2026-06-25 11:00 KST**까지 유지

## [관측] 2026-06-26 12:30 KST — 오후 감시 **재가동** (17:00 자동보고 예약)

- **김경제 감시**: `restart-afternoon-watch.ps1` 실행 · watch-30m + report-watch **재기동**
- **monitor-paused**: **ON** (기록만 · 플레이 중 force-stop 없음)
- **adb**: 192.168.45.197:37573 · 앱 PID **30549** (12:23 기준)
- **mem-monitor**: **WARN** (최근 PSS **588–928MB** · GL spike 141MB @11:53 · 12:01 PROCESS_NOT_RUNNING 후 재기동)
- **ArcCore learning**: `arc-core:learning:verify` PASS · RTDB policy `2026-06-26-1782444492960` 배포
- **17:00 KST**: `schedule-5pm-kim-auto-report.ps1` 백그라운드 예약 → `kim-economy-handoff.md` + `afternoon-watch-report-*.md`
- **권장(김팀장 1안)**: 오전 PSS 900+ soft-ceiling 반복 — 오후 soak에서 floor 추이만 관측(record-only). CRITICAL(PSS≥950) 시 P0.

## [관측] 2026-06-26 03:34 KST — 오후 감시 · 17:00 자동보고

- **김경제 감시**: watch-30m PID **30408** · report-watch PID **13748** · auto-fix=OFF(record-only)
- **mem-monitor**: **OK** (PSS 590.1MB · GL 23.0MB · Views 311 · pid=30549)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\afternoon-watch-report-20260626-1700.md
- **timeline marker**: AFTERNOON_WATCH_START
- **incidents (actionable tail)**: 1
  - [2026-06-26 12:31:05] AFTERNOON_WATCH_START 2026-06-26 12:31:05 KST
- **ArcCore learning**: arc-core:learning:verify PASS · RTDB policy 2026-06-26
- **권장(김팀장 1안)**: afternoon soak OK — check RTDB dailyKpi

> status: monitor-ok · 감시 유지

## [관측] 2026-06-26 08:00 KST — 오후 감시 · 17:00 자동보고

- **김경제 감시**: watch-30m PID **30408** · report-watch PID **26380** · auto-fix=OFF(record-only)
- **mem-monitor**: **OK** (PSS 594.7MB · GL 25.9MB · Views 287 · pid=30549)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\afternoon-watch-report-20260626-1700.md
- **timeline marker**: AFTERNOON_WATCH_START
- **incidents (actionable tail)**: 0
  - (none)
- **ArcCore learning**: arc-core:learning:verify PASS · RTDB policy 2026-06-26
- **권장(김팀장 1안)**: afternoon soak OK — check RTDB dailyKpi

> status: monitor-ok · 감시 유지

## [관측] 2026-06-27 08:00 KST — 오후 감시 · 17:00 자동보고

- **김경제 감시**: watch-30m PID **30408** · report-watch PID **26380** · auto-fix=OFF(record-only)
- **mem-monitor**: **OK** (PSS 789.7MB · GL 36.2MB · Views 368 · pid=20481)
- **report**: D:\arcfire20260607\tools\long-run-monitor\logs\afternoon-watch-report-20260627-1700.md
- **timeline marker**: AFTERNOON_WATCH_START
- **incidents (actionable tail)**: 0
  - (none)
- **ArcCore learning**: arc-core:learning:verify PASS · RTDB policy 2026-06-26
- **권장(김팀장 1안)**: afternoon soak OK — check RTDB dailyKpi

> status: monitor-ok · 감시 유지

## [관측] _(김경제 갱신 템플릿 — 최신 항목을 위에 추가)_

- **일자**:
- **mem-monitor**: OK|WARN|CRITICAL
- **mem-profile / retention**: PASS|FAIL|NO_DATA (verdict · failures · flags)
- **profile 구간**: (profile-timeline 타임스탬프 · STAGE)
- **권장(김팀장 1안)**:

> retention **FAIL** → `status: ready-for-team-lead-action` · 김팀장 본 세션 P1 수정 · 수정 후 `[mem-profile-fix]` 기록


## [watch] 2026-06-28 08:00:03 KST - overnight until 08:00 auto report

- Kim-economy watch: watch PID **1632** / report PID **10296** / auto-fix=OFF record-only
- mem-monitor: **OK** (PSS 837.3MB GL 36.6MB Views 377 pid=4624)
- report: D:\arcfire20260607\tools\long-run-monitor\logs\overnight-final-report-20260628-0800.md
- timeline marker: OVERNIGHT_WATCH_UNTIL_8AM
- incidents actionable tail: 0
  - (none)
- Kim team lead: overnight soak OK - review final report

> status: monitor-ok

## [관측] 2026-07-04 11:45 KST — mem-post-dev-recheck (오늘 개발 배치 · 프로세스 재점검)

- **mem-post-dev-recheck**: **PENDING** (김경제 retention/PSS floor 실측 대기)
- **변경 축** (2026-07-04 세션):
  - ArcCore RED 행성개발 다양성 할당 (`pickArcCorePlanetDevCandidatesForTick` · portfolio CSV · 60s tick scratch)
  - 행성개발 완료 팝업 30s auto-dismiss (`ArcOverlayHost` · `showPlanetFacilityLevelUpNotification`)
  - worldmap 이동중 전투 복귀 검은화면 (`GalaxyMapSystemsSvg` Hermes import · transit scroll re-arm · `transit_combat_nav`)
- **1차 검수 소급 ([pss-pre-dev])**:
  - 행성개발 tick: hot_path=60s · alloc=scratch 재사용(신규 Map/tick 없음) · cache=기존 runtime store — **risk=P1,P6** · **verdict=PASS**
  - worldmap 복귀: hot_path=focus·replace · alloc=인라인 batch(모듈 import 제거) · stage=transit_combat_nav heavyUi 유지 — **risk=P1,P5** · **verdict=PASS**
  - overlay 30s: hot_path=alert 1회 · alloc=timer 1개 · dispose=ArcOverlayHost dismiss — **risk=P6** · **verdict=PASS**
- **정적 게이트 (2026-07-04 11:42 KST)**:
  - `npx tsc --noEmit -p tsconfig.client.json` — **PASS**
  - `npm run audit:memory:all` — **PASS** (memory·skia·worklet·native-reclaim·resident-set·hot-path)
  - `npm run audit:transit-combat-flow` — **PASS**
  - `npm run audit:skia-memory` — **미실행** (SVG RN only · Skia Canvas 변경 없음 · GL mtrack 실측 미기록)
  - PSS floor 30m+ / retention diff — **NO_DATA** (완료 선언에 floor 실측 미포함 → 규칙상 soak 권장)
- **프로세스 갭(보강 완료)**:
  - `[pss-pre-dev]` 턴 출력 누락 다수 → `.cursor/hooks/on-before-submit-prompt-pss-pre-dev-gate.cjs` 신규
  - `buildAgentContext` 메모리 1순위 미주입 → teamlead/fable 라인 추가
  - incident-auto-fix hook 게이트 불완전 → audit:memory:all · mem-post-dev-recheck 단계 추가
- **김경제 액션**: 동일 pid **worldmap→transit combat→worldmap** 1회 후 mem-timeline floor Δ · Views · retention 스냅샷 → 본 섹션 `mem-post-dev-recheck: OK|WARN|CRITICAL` 갱신

> status: mem-post-dev-recheck **PENDING** · 정적 audit PASS · PSS floor 실측·김경제 handoff 마감 대기


## [관측] 2026-07-04 11:49:13 KST — mem-post-dev-recheck (자동)

- **mem-post-dev-recheck**: **OK**
- **retention**: PASS (`latest-retention-audit.md`)
- tsc: **PASS**
- audit:memory:all: **PASS**
- **dirty dev paths**: 105 — app/(game)/planet.tsx, app/(game)/trade.tsx, app/(game)/worldmap.tsx, app/_layout.tsx, src/account/localAccountReset.ts, src/arcCore/aabs/deploymentExecutor.ts, src/arcCore/balance/planetOwnershipDeedCatalog.test.ts, src/arcCore/balance/planetOwnershipDeedCatalog.ts…
- **mem-timeline tail**:
```
2026-07-04 10:39:30,10212,853.6,982.9,145.4,19.8,165.2,427.2,48,,557,103.2,111,GL_SPIKE suspect=hub_skia_orbit_nebula_combat
2026-07-04 10:54:49,10212,849,977.5,145.4,19.8,165.2,427.1,45.2,,557,-4.6,0,
2026-07-04 11:10:09,10212,864,996.7,137,19.8,156.9,451.3,36.9,,565,15,-8.4,GL_RECOVERED idle_ok
2026-07-04 11:25:33,7457,704.3,841.9,38.5,34.3,72.8,349.9,58.4,,396,,,
2026-07-04 11:40:51,9145,772.4,915.9,134.2,19.8,154,369,30.8,,566,,,
```
- **next**: soak·floor 실측은 김경제 주기 감시

> status: mem-post-dev-recheck **OK**

## [관측] 2026-07-04 20:27:03 KST — mem-post-dev-recheck (자동)

- **mem-post-dev-recheck**: **OK**
- **retention**: PASS (`latest-retention-audit.md`)
- tsc: **PASS**
- audit:memory:all: **PASS**
- **dirty dev paths**: 116 — app/(game)/planet.tsx, app/(game)/trade.tsx, app/(game)/worldmap.tsx, app/_layout.tsx, src/account/localAccountReset.ts, src/arcCore/aabs/deploymentExecutor.ts, src/arcCore/balance/planetOwnershipDeedCatalog.test.ts, src/arcCore/balance/planetOwnershipDeedCatalog.ts…
- **mem-timeline tail**:
```
2026-07-04 19:21:00,29883,697.1,824.1,48.3,40.7,88.9,323,51.4,,382,,,
2026-07-04 19:36:22,29883,672.3,803,41.6,19.8,61.5,328.3,41.5,,363,,,
2026-07-04 19:51:40,29883,693.8,824,41.6,19.8,61.5,334,48.1,,355,21.5,0,
2026-07-04 20:07:12,29883,681.6,811.3,41.6,19.8,61.5,327.6,35.9,,363,-12.2,0,
2026-07-04 20:22:35,29883,688.1,817.9,43.7,19.8,63.6,331.6,36.2,,359,6.5,2.1,
```
- **next**: soak·floor 실측은 김경제 주기 감시

> status: mem-post-dev-recheck **OK**
