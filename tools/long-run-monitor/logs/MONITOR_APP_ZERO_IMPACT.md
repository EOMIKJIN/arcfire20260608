# 감시 체계 — 앱 무영향 헌법 (2026-06-28)

> **절대 원칙**: long-run-monitor·memory-profiler는 **PC 호스트(adb) 전용**이다.  
> 앱 메모리·FPS·STAGE 동작에 **부담·누수·틱 루프를 유발하면 안 된다.**

## 1. 앱 안에 넣지 않는 것

| 금지 | 이유 |
|------|------|
| 앱 내부 `setInterval`/rAF 감시 루프 | v4.0 §14 · STAGE 메모리 예산 |
| Firestore/onSnapshot 감시 | 실시간 통신 금지 |
| release 빌드 상시 `[MEM_PROFILE]` | `devMemoryProfileBridge` — **__DEV__ 또는 env=1만** |
| 감시 실패 시 앱 force-stop (기본) | `monitor-paused.flag` — handoff만 |

## 2. adb 부하 상한 (`monitor-host-budget.ps1`)

| 항목 | 상한 |
|------|------|
| `dumpsys meminfo` | **≥15분** 1회 (canonical: `run-monitor.ps1`) |
| `report-watch` heartbeat | **timeline 재사용** — dumpsys **금지**(정상 경로) |
| incident 조사 meminfo | budget 통과 시만 · crash는 예외 |
| logcat adb 프로세스 | **1개** (crash+log 통합) |
| retention audit | **60분** · PC node · 앱 코드 없음 |
| watchdog ensure | **5분** · PC 프로세스 점검만 · adb 없음 |

## 3. 탐지 → 김팀장 (앱 무관)

- `poll-realtime-incident-handoff` — **로그 파일 tail만** (adb 없음)
- `check-and-remediate` — timeline 기반 · handoff
- Cursor 훅 — PC IDE · 앱 미포함

## 4. 위반 시 조치

1. `MONITOR_MIN_MEMINFO_INTERVAL_MIN` 미만 설정 **거부**(ensure 스크립트 floor)
2. report-watch dumpsys 호출 **제거**(timeline fallback)
3. profiler 별도 logcat **폐지** → watch logcat에 `ReactNativeJS:I` 통합

## 5. 검증

```powershell
# 1시간 내 meminfo 호출 ≤ 4회 목표 (15m 주기)
Get-Content tools/long-run-monitor/logs/mem-timeline.csv -Tail 5
```

앱 측: release APK에 `EXPO_PUBLIC_ARCFIRE_MEM_PROFILE` 없으면 마커 **no-op**.
