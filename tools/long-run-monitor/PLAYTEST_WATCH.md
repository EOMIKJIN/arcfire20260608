# Release 빌드 후 장기 플레이테스트 — 감시·정밀 탐지 가이드

## 빠른 시작 (빌드 완료 후)

```powershell
# 1) 감시 가동 (앱 실행까지 최대 60분 대기 · 자동 재시작 OFF)
powershell -ExecutionPolicy Bypass -File tools/long-run-monitor/start-playtest-watch.ps1

# 2) 플레이 중 마일스톤 기록 (권장)
powershell -ExecutionPolicy Bypass -File tools/long-run-monitor/tag-playtest-milestone.ps1 -Label "worldmap_cycle_10"
powershell -ExecutionPolicy Bypass -File tools/long-run-monitor/tag-playtest-milestone.ps1 -Label "wave_combat_5"
powershell -ExecutionPolicy Bypass -File tools/long-run-monitor/tag-playtest-milestone.ps1 -Label "long_idle_30m"

# 3) 종료 + 리포트
powershell -ExecutionPolicy Bypass -File tools/long-run-monitor/stop-playtest-watch.ps1
powershell -ExecutionPolicy Bypass -File tools/long-run-monitor/analyze-playtest-session.ps1
```

npm: `npm run watch:playtest` · `npm run watch:playtest:analyze`

## 이번 빌드 집중 검증 (비정상 오류)

### P0 · 장기 soak(5h+) 후 은하계 지도 크래시 (2026-06-23~ · 상시)

> **관측:** release 빌드 5시간+ 플레이 · GL/PSS **계단식 누적**(전투 footprint·GC 톱니 — peak 회수는 되나 **floor**가 서서히 상승할 수 있음) 상태에서 **은하계 지도(STAGE 2) 진입·체류·전투 복귀** 시 크래시가 **주로** 발생.

| 검사 | 방법 | 합격/의심 |
|------|------|-----------|
| **worldmap 진입 직후** | 전투 승/패/도주 → `replace` worldmap · 허브→출발→은하맵 | SIGSEGV 없음 |
| **장기 floor** | `mem-timeline.csv` — peak 제외 **floor** 추이 | baseline+25MB 미만 유지 |
| **Reanimated 제스처** | logcat `ShareableWorklet` · `ReanimatedEventDispatcher` · `GestureHandler` | 0건 |
| **스크롤 lifecycle** | blur 시 `scrollAliveSv=0` · focus 후 `InteractionManager` 지연 재활성 | audit:worklet-contract PASS |

**디버그 빌드 재현 절차 (권장):**

```powershell
# monitor-paused ON — 기록만, 자동 재시작 OFF
powershell -ExecutionPolicy Bypass -File tools/long-run-monitor/start-playtest-watch.ps1

# 5h+ 또는 floor 상승 후 — 은하맵 반복·이동중 전투 복귀 집중
powershell -File tools/long-run-monitor/tag-playtest-milestone.ps1 -Label "worldmap_after_5h_soak"

# 크래시 직후
adb logcat -d -t 3000 | findstr /i "FATAL SIGSEGV ShareableWorklet librnskia ReactNativeJS"
```

**에이전트 필수:** `arcfire-bug-debug-workflow` + `arcfire-crash-fix-structural-gate` · worldmap `galaxyMapScrollLifecycle` · `transitCombatPostFlow` 지연 경로 전수검사.

---

| 시나리오 | 재현 | 정밀 탐지 신호 |
|----------|------|----------------|
| **출발 → 은하맵** | 허브 출발 직후 | `mqt_v_js` SIGSEGV · `executeSync` · `ShareableWorklet` |
| **은하맵 ↔ 행성 반복** | 이동·착륙 20회+ · **5h+ soak 후 worldmap** | `playtest-alerts.log` · `ShareableWorklet` · GL_SPIKE 3연속 · **floor drift** |
| **은하 이동 중 이탈** | 이동 중 뒤로/착륙 · **이동중 전투→은하 복귀** | `isMoving` 잠금 · **transit post-flow** · 크래시 없이 멈춤/연출 순서 |
| **웨이브 전투** | 전투 진입·종료 반복 | GL peak ~110–140MB 정상 · **이탈 후 floor +25MB** = 누수 |
| **장기 체류** | 30분+ 허브 방치 | `mem-timeline.csv` floor drift · FinalizerDaemon SIGSEGV |

## 감시 스택

| 프로세스 | 역할 | 로그 |
|----------|------|------|
| `run-monitor.ps1` | 10분 meminfo·GL/PSS | `mem-timeline.csv`, `mem-alerts.log` |
| `start-precision-logcat.ps1` | DEBUG 백트레이스 포함 logcat | `precision-playtest-*.log` |
| `scan-playtest-alerts.ps1` | 실시간 패턴 스캔 | `playtest-alerts.log` |
| `report-watch.ps1` | 10분 heartbeat 콘솔 | `heartbeat.log` |

**기본:** `monitor-paused.flag` ON → 기록만, **앱 강제 재시작 없음** (플레이 중단 방지).

자동조치 테스트 시: `start-playtest-watch.ps1 -AllowAutoRemediation`

## 정밀 탐지 — 수동 1회 스냅샷

시나리오 직후:

```powershell
powershell -File tools/long-run-monitor/manual-mem-snapshot.ps1 -Note "AFTER_wave_combat"
adb shell dumpsys meminfo com.arcfire.online | findstr "TOTAL PSS GL mtrack Views"
```

## 크래시 발생 시

1. **즉시** `playtest-alerts.log` · `precision-playtest-*.log` 확인
2. Cursor에 **「했어」** + 직전 행동 한 줄
3. 에이전트: `arcfire-bug-debug-workflow` + `arcfire-crash-fix-structural-gate` (코드 전)

## 합격 기준 (이번 세션)

- `fatalSignalAfterStart = 0`
- `worklet_executeSync` 분류 0건
- GL floor가 baseline 대비 **+25MB 미만** (전투 peak 제외)
- `ABNORMAL_RESTART` / `PROCESS_DEATH` 없음

## npm scripts

```json
"watch:playtest": "powershell ... start-playtest-watch.ps1",
"watch:playtest:stop": "powershell ... stop-playtest-watch.ps1",
"watch:playtest:analyze": "powershell ... analyze-playtest-session.ps1",
"watch:playtest:milestone": "powershell ... tag-playtest-milestone.ps1"
```
