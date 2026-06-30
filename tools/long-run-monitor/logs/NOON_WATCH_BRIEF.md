# 정오(12:00 KST) 감시 · 자동보고

Start (KST): 2026-06-30 ~09:37
End (KST): 2026-06-30 12:00
Timeline marker: `NOON_WATCH_START`

## 스택

| 구성 | 간격 | 비고 |
|------|------|------|
| watch-30m | 15m | mem-timeline · mem-alerts |
| report-watch | 10m | crash · incident |
| auto-fix | OFF | monitor-paused (record-only) |

## 12:00 KST 자동 산출

- `tools/long-run-monitor/logs/evening-watch-report-20260630-1200.md`
- `tools/long-run-monitor/logs/DAILY_5PM_REPORT_LATEST.md` (정오 스냅샷)
- `tools/long-run-monitor/logs/CHAT_REPORT_PENDING.md` → Cursor 세션 훅 게시
- `tools/kim-team-lead/reports/kim-economy-handoff.md` `[관측]` 갱신

## P0 집중 (mem-profile-fix 반영 후)

- native_heap floor 계단 (GL ~30MB 유지 중 PSS≥950)
- deep reclaim trim→remount 순서 패치 soak 검증

## 수동 확인

```powershell
npm run monitor:status
Get-Content tools/long-run-monitor/logs/mem-timeline.csv -Tail 5
```
