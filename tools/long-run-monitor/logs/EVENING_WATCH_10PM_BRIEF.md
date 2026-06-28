# 저녁 감시 체제 — 22:00 KST 보고 예약

**가동 시각 (KST)**: 2026-06-28 ~17:46  
**보고 예정**: **22:00 KST** (저녁 10시)  
**종료**: 22:00 보고 생성 후 감시 유지(record-only)

## 프로세스

| 역할 | PID / 상태 |
|------|------------|
| watch-30m (30분 meminfo) | PID 33096 · alive |
| report-watch (10분 콘솔) | PID 3976 · alive |
| 22:00 스케줄러 | `schedule-5pm-kim-auto-report.cjs --target 22:00` |

## 산출물 (22:00)

- `evening-watch-report-YYYYMMDD-2200.md`
- `DAILY_5PM_REPORT_LATEST.md` (최신 요약)
- `CHAT_REPORT_PENDING.md` → Cursor 채팅 게시용
- `kim-economy-handoff.md` [관측] 갱신

## 정책

- **auto-fix**: OFF (`monitor-paused.flag` — 기록만, force-stop 없음)
- **adb**: 192.168.45.197:37573 연결됨

> **22:00에 이 세션 또는 김경제 세션에서 CHAT_REPORT_PENDING 내용을 사용자에게 게시.**
