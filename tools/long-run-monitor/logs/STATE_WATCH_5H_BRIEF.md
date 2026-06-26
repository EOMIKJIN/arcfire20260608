# 5-hour state watch - movement crash prep (KST)

Start: 2026-06-26 01:44:16
Status report (auto): 2026-06-26 06:44:16
Phase 2: user playtest - worldmap / transit / landing crash scenarios AFTER report

## Phase 1 (0-5h) - record-only soak
- monitor-paused.flag ON - no forced app restart
- 10m meminfo -> mem-timeline.csv
- precision logcat + playtest-alerts.log

## Phase 2 (5h+) - movement crash focus test
1. Chat: "테스트 시작" or tag milestone
2. Scenarios: hub departure -> galaxy move -> landing / transit combat -> return (include rapid taps)
3. Milestone:
   powershell -File tools/long-run-monitor/tag-playtest-milestone.ps1 -Label worldmap_movement_crash_test
4. After crash:
   adb logcat -d -t 3000 | findstr /i "FATAL SIGSEGV ShareableWorklet librnskia ReactNativeJS"

## Report files
- state-watch-5h-report-*.md (auto ~5h)
- tools/long-run-monitor/logs/mem-timeline.csv
- incidents.log / playtest-alerts.log

## Chat
After ~5h say "상태 보고" or read state-watch-5h-report-*.md
