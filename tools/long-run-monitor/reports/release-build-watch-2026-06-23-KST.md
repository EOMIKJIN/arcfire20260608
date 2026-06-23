# Release build watch — 2026-06-23 KST

> **시작 (KST)**: 2026-06-23 ~10:42 · **4h 보고 목표**: **~14:42 KST**
> **빌드**: release · package `com.arcfire.online`
> **adb**: `192.168.45.197:37573`

## 감시

- `start-watch-30m.ps1` — 30분 mem-timeline + logcat
- `monitor-paused.flag` 없음 → 자동조치(relaunch) **활성**
- 타임라인 마커: `RELEASE_BUILD_WATCH_START_2026-06-23`

## 4h 산출물

- `tools/long-run-monitor/logs/release-build-watch-report-2026-06-23.md`

## Incident 대응

- SIGSEGV/FATAL → logcat + `arcfire-bug-debug-workflow`
- PSS≥950 / GL 계단 누적 → release vs dev 비교, Skia audit
