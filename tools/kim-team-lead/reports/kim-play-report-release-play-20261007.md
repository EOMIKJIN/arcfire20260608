# 김플레이 → 김팀장 보고 — 릴리즈 0.1.1 실기(대표님 1시간+) 로그 분석

- **작성**: 김플레이 2026-10-07 17:45 KST
- **status**: `PENDING` (김팀장 P0 판단)
- **원본 로그**: `tools/play-bot-console/logs/owner-release-20261007/logcat-all-1737.txt` (기기 버퍼 덤프 · 287,150줄 · 78MB라 git 제외 폴더) · `logcat-crash-1737.txt`

## 0. 결론

1. **P0 크래시 재발**: 17:04:20 JS 스레드(`mqt_v_js`) SIGSEGV. `reanimated::WorkletRuntime::executeSync` → `ShareableWorklet` → `ShareableObject` → `jsi::Object::setProperty` → hermes. 2026-06-21~24에 수정했다고 기록된 스택(`incidents.log` 「pre-fix」, `crash-20260623-*`·`crash-20260624-*`)과 같다. `arcfire-crash-fix-structural-gate.mdc` 대상 — 이전 패치가 반쪽이었을 가능성.
2. **대표님 보고 1순위 버그(미네르바 드록 한 전투 정체)**: 릴리즈라 JS 로그가 없어 로그 근거 확정 불가. 정적 분석 결과만 §3에 둔다. 개발 빌드 재현 필요.
3. **실기 → 플레이봇 학습**: 현재 구조로는 불가. 릴리즈는 `transform-remove-console`로 콘솔 전부 제거, `[PLAY_VERB]`도 `__DEV__` 전용. 수집기는 15:29 기기 연결이 끊겨 이후 0건.

## 1. 세션 타임라인 (기기 logcat · ActivityManager)

| 시각 | 사건 |
|---|---|
| 14:57:11 | 기존 앱 삭제(재설치) |
| 15:25:58 | 릴리즈 0.1.1 (versionCode 101) 설치 |
| 15:27:21–15:27:37 | 1차 실행 → 작업 제거로 종료 |
| 15:29 | PC adb 연결 끊김 (수집기 `device_gone`) |
| 15:30:02 | pid 13228 실행 — 대표님 플레이 세션 |
| 16:47 | 이 시각 이전 앱 로그는 버퍼에서 밀려 없음 |
| 17:04:20 | **SIGSEGV** (프로세스 가동 5,659초) |
| 17:06:00 | pid 19534 재실행 (현재 실행 중) |

## 2. 크래시 직전 (pid 13228)

- 17:03: Skia 로그 급증(RNSkia 101건 / 1분) → 17:04:05 `SkiaView destroySurface` · `Surface.release` 누락 경고 2건.
- 17:04:06·12·19: 화면 마운트 3회(RN SCREENS 경고 묶음) · 각 직후 `ReactNativeJNI: instanceHandle is null, event will be dropped`.
- 17:04:20: 마지막 화면 마운트 0.7초 뒤 SIGSEGV.
- 세션 중 `[SurfaceTexture] updateAndRelease: EGLConsumer is not attached to an OpenGL ES context` E 로그 다수(16:47~).
- 해석(추정): Skia 화면 해제 직후 연속 화면 전환 중 worklet 생성/공유 객체 직렬화에서 해제된 메모리 접근. 확정은 김팀장 구조 게이트 절차로.

## 3. 미네르바 드록 한 전투 정체 (정적 분석 · 로그 미확정)

- 전투 정체: 본편 `story_002` 세부미션 c `obj_story_002_c` 「미네르바 궤도 호위 해적 1척 격파」 — `mission_quest_combat_ops.csv` `hub_orbit` · `mission_combat_captains.csv` `mcap_pf_minerva` → `npc_cpt_enemy_minerva_01` 드록 한(Lv3, 영구사망 대상 아님, 함선 정상).
- 목표 미완료면 미네르바 진입마다 같은 퀘스트 시드가 다시 걸린다(`buildQuestHubOrbitSeedSlots`) → 「반복」과 일치.
- 의심 지점 (`PlanetEdenRaidTestLayer.tsx`):
  - A. 승리 후 결과 창은 `useWaveDefenseStore`의 `pendingOutcome==null && outcome==null && phase!=='ended'`일 때만(≈3433). 이전 웨이브 상태가 남으면 결과 창이 안 뜨고 허브에 내 전함만 남는다.
  - B. 목표 완료 `applyDefeatEnemyMissionObjectives`(≈3405)는 `resolveQuestCombatLock`이 이 목표를 가리킬 때만. 다른 퀘스트가 핀이고 그 퀘스트에 미완료 defeat_enemy가 있으면 락이 그쪽이 되어 완료가 빠진다.
- 재현: 개발 빌드 + USB/무선 adb 연결 상태에서 미네르바 진입 1회.

## 3-1. 드록 한 정체 — 원인 확정 (대표님 실기 재현 17:44 · 코드 근거)

- 재현 화면: `out/owner-release-20261007/stuck-1744.png` — 미네르바 허브, 내 전함·잔해 표식만, 결과 창 없음, 「동기 없는 진실」 **2/5 (obj_story_002_b 술집 단서)** 그대로.
- **원인**: `src/missions/questCombatLock.ts` `incompleteDefeatOnBundle()`이 세부미션 순서를 보지 않는다. a 완료·b 미완료여도 「완료 안 된 첫 defeat_enemy」인 **c(미네르바 hub_orbit)를 락으로 고른다**.
  - → `buildQuestHubOrbitSeedSlots`가 미네르바 진입마다 드록 한 퀘스트 전투를 건다.
  - → 승리 후 `applyDefeatEnemyMissionObjectives` → `missionStore.completeObjective`가 `canCompleteSequentialObjective(c)`=false(b 미완료)로 **조용히 거부**.
  - → c 미완료 유지 → 재진입마다 같은 전투 반복. 대표님 증상과 일치.
- 규칙 위반: `.cursor/rules/arcfire-quest-detail-mission.mdc` 「세부미션은 getCurrentSequentialObjective 순차 진행」.
- **수정 1안 (김팀장)**: `incompleteDefeatOnBundle`이 **현재 순차 목표 1개만** 본다 — 현재 목표가 defeat_enemy이고 전투 op가 있을 때만 락, 아니면 null. 같은 함수가 transit 락(`shouldGuaranteeQuestTransitEncounter`)도 정하므로 이동중 퀘스트 100% 조우의 순서 어긋남도 함께 해소된다. 테스트: a 완료·b 미완료 → 락 null, b 완료 → c 락.
- 부수 확인 필요: 승리 후 허브 결과 창이 안 뜬 것은 목표 거부와 별개 경로(§3 A, 웨이브 상태 잔존)일 수 있다. 1안 반영 후 같은 경로 재실측.

## 4. 학습 경로 제안 (김플레이 범위 · 대표님 승인 전 미구현)

- 릴리즈에서도 남는 최소 학습 로그: `devPlayVerbLog`에 릴리즈용 링버퍼(AsyncStorage 상한) + 설정 화면 내보내기 1버튼. 매 동사 persist 금지(코얼레싱).
- 그 전까지 실기 학습은 개발 빌드 플레이만 유효.
