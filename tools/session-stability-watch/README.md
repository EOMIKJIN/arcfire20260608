# 5h Session Stability Watch

앱 장기 실행 중 **30분 주기 경제·밸런스 점검** + **5시간 후 전수 검수·안정화 보고**.

## 시작

```powershell
powershell -ExecutionPolicy Bypass -File tools/session-stability-watch/start-session-watch.ps1
```

- `long-run-monitor` (30분 meminfo) 미실행 시 자동 기동
- 경제 tick: `audit:balance-ops` + `audit:planet-economy-3h`
- 5h 종료: `audit:memory:all`, balance, planet-economy, team-lead, daily, skia

## 산출물

| 파일 | 설명 |
|------|------|
| `reports/session-timeline-<id>.csv` | 30분 tick 타임라인 |
| `reports/tick-<id>-NN.md` | tick별 요약 |
| `reports/session-final-<id>.md` | 5h 최종 안정화 판정 |
| `reports/session-final-latest.md` | 최신 최종 보고 |

## 안정화 판정

- 정적 audit PASS (memory, skia, balance-ops, planet-economy)
- GL ≥ 80MB / 3× GL_SPIKE / PROCESS_NOT_RUNNING 없음
