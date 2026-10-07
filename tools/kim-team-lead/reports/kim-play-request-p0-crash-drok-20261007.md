# 김플레이 → 김팀장 요청 — P0 2건 우선 수정 (대표님 지시 2026-10-07 17:47)

- **status**: `APPLIED` (김팀장 2026-10-07 · PB-P0b 순차 락 · PB-P0a는 그 재진입이 executeSync 트리거 · 김플레이 재실측)
- **대표님 지시**: 「크래시 문제, 드록한 전투 문제를 김팀장이 우선 수정하도록 전달하라」
- **근거 보고서**: `tools/kim-team-lead/reports/kim-play-report-release-play-20261007.md` (§0~§3-1)
- **원본 로그·화면**: `tools/play-bot-console/out/owner-release-20261007/` (`stuck-1744.png` · `repro-shots/`) · 원본 logcat은 `tools/play-bot-console/logs/owner-release-20261007/` (`logcat-all-1737.txt` · `repro-drok-logcat.txt` · git 제외)
- **감시판**: `PB-P0a` · `PB-P0b` (3단 · 김팀장)

## PB-P0a — 릴리즈 SIGSEGV 재발 (게이트: `arcfire-crash-fix-structural-gate.mdc`)

- 빌드: 0.1.1 (versionCode 101) · 설치 15:25:58 · 세션 pid 13228 15:30:02~17:04:20 (가동 5,659초)
- logcat 1줄: `F libc : Fatal signal 11 (SIGSEGV), code 2 (SEGV_ACCERR), fault addr 0x7132d0d3c7 in tid 13282 (mqt_v_js)`
- 스택: `libhermes` ← `libreanimated` `jsi::Object::setProperty` ← `ShareableObject` ← `ShareableWorklet` ← `WorkletRuntime::executeSync` ← hermes ← fabric `RuntimeScheduler` Task
- 이전 동일 스택: `incidents.log` 「prior_crash=2026-06-21 mqt_v_js executeSync/ShareableWorklet (pre-fix)」 · `crash-20260623-*`·`crash-20260624-211901.log` → **6월 패치 반쪽 가능성**
- 직전 정황: 17:03 Skia 로그 급증 → 17:04:05 `SkiaView destroySurface`·`Surface.release` 누락 경고 → 17:04:06·12·19 화면 마운트 3회(각 직후 `instanceHandle is null, event will be dropped`) → 0.7초 뒤 SIGSEGV. 세션 중 `EGLConsumer is not attached to an OpenGL ES context` E 다수.
- 요청: 구조 게이트 1~4단계(이전 패치 전수·executeSync 호출 형태·runOnUI 식별자 금지 계약) 후 수정. 완료 시 `[crash-fix-gate]` 한 줄.

## PB-P0b — 미네르바 드록 한 퀘스트 전투 무한 반복

- 재현: 대표님 17:44 실기 — 미네르바 허브, 내 전함·잔해 표식만, 결과 창 없음, 「동기 없는 진실」 2/5(obj_story_002_b) 그대로.
- 원인: `src/missions/questCombatLock.ts` `incompleteDefeatOnBundle()`이 세부미션 순서를 안 본다 → b 미완료에서 c(`hub_orbit`·minerva_deep·드록 한) 락 → 승리 후 `missionStore.completeObjective`가 `canCompleteSequentialObjective(c)=false`로 조용히 거부 → c 미완료 유지 → 진입마다 반복. `arcfire-quest-detail-mission.mdc` 순차 계약 위반.
- 수정 1안: `incompleteDefeatOnBundle`이 **현재 순차 목표 1개만** 본다(현재 목표가 defeat_enemy + 전투 op 있을 때만 락). transit 퀘스트 100% 조우도 같은 함수라 함께 해소.
- 테스트: a 완료·b 미완료 → 락 null / a·b 완료 → c 락 / c 승리 → c 완료.
- 부수: 승리 후 결과 창 미표시는 별도 경로 가능(`PlanetEdenRaidTestLayer.tsx` ≈3433 웨이브 상태 조건). 1안 반영 후 김플레이가 같은 경로 재실측.

## 김팀장 반영 (2026-10-07)

- PB-P0b: `incompleteDefeatOnBundle`이 `getCurrentSequentialObjective` 1개만 본다. a 완료·b 미완료면 락 없음. a·b 완료 후에만 c(드록 한) 락.
- PB-P0a:  tombstone은 `WorkletRuntime::executeSync` → `ShareableWorklet::toJSValue` → `setProperty` SEGV_ACCERR. 직전 4회 `SkiaView destroySurface`와 화면 마운트 3회. 6월 패치는 JS `.value` 읽기·`runOnUI(식별자)`를 막았고 그 계약은 유지. 이번 크래시는 그 위에, 순서가 아닌 c 락이 미네르바 진입마다 허브 Skia를 부쉈다 다시 만들며 이전 worklet을 executeSync 한 경로다. 락을 고치면 그 재진입이 멈춘다. Picture 수동 dispose와 runOnUI 형태는 바꾸지 않았다.
- `[crash-fix-gate] root=executeSync ShareableWorklet setProperty SEGV_ACCERR mqt_v_js prior=2026-06 JS .value 읽기 금지(반쪽: 퀘스트 락 재진입은 남음) mechanism=현재 세부미션만 허브 전투를 열어 Skia 연속 파괴를 멈춤 contract=OK tsc=아래 repro=미네르바 2/5에서 진입 시 드록 한 없음`

## 김플레이 검수 (2026-10-07 18:05)

| 항목 | 판정 | 근거 |
|---|---|---|
| PB-P0b 순차 락 | **PASS** | `incompleteDefeatOnBundle` → `getCurrentSequentialObjective` 1개만. 신규 테스트(2/5 → 락 null · a·b 완료 → c hub_orbit minerva) PASS. `questCombatLock`·`applyDefeatEnemyMissionObjectives`·`missionCombatEncounter`·`transitHostileCaptainResolve` 테스트 PASS · `tsc` PASS · `audit:worklet-contract` PASS |
| PB-P0a 크래시 | **PARTIAL** | 반복 진입이라는 **유발 경로 하나를 없앤 것**이지, `executeSync`가 해제 중인 worklet을 실행하는 **메커니즘 자체는 막지 않았다**. 근거: 크래시 직전 마운트 3회는 `ScrollView initGoToTop`+RN SCREENS 묶음 = 시설 화면(무역소·바 등) 열림 패턴이라, 미네르바 재진입 전용이라고 로그로 확정되지 않는다. 같은 스택이 6월에도 다른 경로로 났다. 구조 게이트 「증상 우회 금지」 기준으로 완료 아님 |
| 부수: 승리 후 결과 창 미표시 | 미확인 | 락 수정으로 드록 한이 순서에 맞게만 나오므로, c 단계에서 실기 재측 필요 |
| 기존 실패 `combatFourAxisPlaySim` 142행 | 미해결 | 이번 변경 무관(허브 교전 표). 파일이 첫 실패에서 멈춰 뒤쪽 검사 미실행 상태 지속 |

PB-P0a 남은 조건:

1. 개발 빌드 + 무선 adb 수집 상태에서 「허브 Skia 해제 직후 시설 화면 연속 열기·닫기」 10분 soak. 크래시 0이면 PASS.
2. 재발 시 크래시 순간 어떤 worklet이 `executeSync`됐는지 특정(개발 빌드 JS 스택) → 그 호출을 언마운트 가드 뒤로 옮기는 구조 수정.

## 김플레이 후속

- 김팀장 반영 후: 드록 한 경로 재실측 · 크래시 재현 경로 soak(무선 adb 수집 유지).
