# Arcfire long-run monitor — baseline

**Started:** 2026-06-14 (session)
**Package:** com.arcfire.online
**Device:** 192.168.45.197:38841
**PID at baseline:** 23799

## Baseline memory (hub/active — strike 연출 직후 가능)

| Metric | Value |
|--------|-------|
| **TOTAL PSS** | 727,828 KB (~710 MB) |
| **TOTAL RSS** | 842,091 KB (~822 MB) |
| **Swap PSS** | 161 KB |
| **Graphics PSS** | 193,287 KB (~189 MB) |
| **GL mtrack** | 135,536 KB (~132 MB) |
| **EGL mtrack** | 57,751 KB (~56 MB) |
| **Native Heap PSS** | 332,276 KB (~324 MB) |
| **Java Heap PSS** | 34,336 KB |
| **Threads** | 104 |
| **Views** | 401 |

## Monitoring active

- **Crash logcat:** `tools/long-run-monitor/logs/crash-*.log` (AndroidRuntime, ReactNativeJS, libc, DEBUG, FATAL)
- **Meminfo every 15 min:** `tools/long-run-monitor/logs/meminfo-*.log`
- **Monitor meta:** `tools/long-run-monitor/logs/monitor-*.log`

## Abnormal termination signals to watch

- `FATAL EXCEPTION` / `AndroidRuntime`
- `signal 11 (SIGSEGV)` / `signal 6 (SIGABRT)`
- `librnskia` / `libskia` native crash
- `ReactNativeJS` redbox / OOM
- Process gone: meminfo log shows `PROCESS NOT RUNNING`
- PSS stair-step without recovery after strike idle (GL leak regression)

## User action

앱을 평소처럼 수시간 켜 두세요. 비정상 종료·튕김 후 **「했어」** 한 줄만 알려주시면 crash log + meminfo 타임라인을 분석합니다.
