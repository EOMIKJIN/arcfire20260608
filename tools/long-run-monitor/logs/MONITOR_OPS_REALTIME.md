# 실시간 운영체제 (2026-06-28)

PC 호스트 전용 감시 스택. **앱 프로세스·메모리·Firestore에 영향 없음** — `MONITOR_APP_ZERO_IMPACT.md` 준수.

## 구성

| 계층 | 역할 | 기동 |
|------|------|------|
| **Windows 작업** `ArcfirePerpetualDetection` | 로그온 + 5분 백업 ensure | `npm run monitor:register-perpetual` |
| **perpetual watchdog** | 5분마다 스택·handoff·상태·대시보드 | `npm run monitor:ensure-perpetual` |
| **watch-30m** | mem-timeline 15m (budget) | watchdog 내 ensure |
| **report-watch** | 08:00·incident 리포트 | watchdog 내 ensure |
| **retention audit** | 60m 정적 retention (adb 1회) | profiler extras |
| **PR gate (CI)** | tsc · skia · worklet · memory 정적 | `.github/workflows/memory-monitor-pr-gate.yml` |

## 운영 명령

```powershell
npm run monitor:status              # PID · handoff · 최근 mem 한 줄
npm run monitor:dashboard           # HTML 갱신
npm run monitor:ensure-always-on    # mem-watch + retention만
npm run monitor:ensure-perpetual    # 워치독 멱등 기동
npm run monitor:ensure-perpetual:restart  # 15m interval 등 파라미터 반영 시
npm run monitor:register-perpetual  # Windows 스케줄 등록
```

## 산출물

| 파일 | 설명 |
|------|------|
| `logs/MONITOR_STATUS_LATEST.json` | 프로세스·handoff 스냅샷 |
| `logs/MONITOR_DASHBOARD_LATEST.html` | 로컬 대시보드 (브라우저 열기) |
| `outbox/cursor-incident-handoff.md` | 김팀장 P0 코드 조치 |
| `logs/CHAT_REPORT_PENDING.md` | Cursor 세션 채팅 알림 |

## 외부 알림 (선택)

1. `monitor-webhook.local.env.example` → `monitor-webhook.local.env` 복사
2. `ARCFIRE_MONITOR_WEBHOOK_URL` 설정 (Slack/Discord incoming webhook)
3. incident handoff 시 30분 throttle로 1회 POST — Cursor 꺼져 있어도 PC만 켜져 있으면 동작

## CI vs 로컬 soak

- **CI**: 정적 계약만 (adb 불필요)
- **로컬 PC**: `audit:memory:retention` · GL mtrack · 5h+ soak — 김경제 handoff

## 중단

- 전체: `logs/perpetual-detection-DISABLED.flag` 생성
- 코드 handoff만: `logs/monitor-paused.flag` (앱 force-stop 없음)
