# [17:00 KST] Arcfire 메모리 감시 자동보고 — 2026-06-27

**판정**: **OK** (PSS soft ceiling 다수 · GL 회수 양호)

| 항목 | 값 |
|------|-----|
| 시각 | 2026-06-27 17:04 KST |
| adb | 연결됨 |
| watch-30m | PID 30408 |
| 런타임 | PSS **788MB** · GL **34MB** · Views 368 |
| 상세 | `tools/long-run-monitor/logs/afternoon-watch-report-20260627-1700.md` |

## 요약
- 13:00~17:00 GL **34~90MB** 구간 — 허브 Skia footprint 정상 회수(`GL_RECOVERED`)
- PSS **850MB+** soft ceiling 알림 다수(10:34~13:21) — native advisory, 크래시 없음
- 11:58 `INVESTIGATION_TRIGGERED arcfire_crash_playtest` — 별도 logcat 조사 기록

## 권장
- 오후 soak **OK** — floor 추이만 지속 관찰
- PSS 930MB+ 구간 재발 시 허브 이탈 후 GL mtrack 실측

---

# [08:00 KST] 보고 — 2026-06-27 (자동 스케줄러 **누락** · 수동 보충본)

**판정**: **WARN** (PSS **1038MB** · GL **143MB** — hard ceiling 조사 다발)

| 항목 | 값 |
|------|-----|
| 시각 | 2026-06-27 08:42 KST (수동 생성) |
| 런타임 | PSS **1038MB** · GL **143MB** · Views 545 |
| 상세 | `tools/long-run-monitor/logs/overnight-final-report-20260627-084200.md` |

## 원인 (수정 완료)
- 08:00 스케줄러 **2분 창** + sleep 지연 → 08:00 보고 **하루 건너뜀** 버그
- **내일 08:00부터**: 15분 창 + 12시까지 catch-up + **대화창 CHAT_REPORT_PENDING** 게시

## 08:00 요약
- 04:54~08:41 PSS **957~1050MB** 고정 — `mem_hard_ceiling_playtest` 조사 **20회+**
- 08:41 GL spike **142MB** (허브 Skia 활성 footprint)

## 권장
- 08:00대 PSS 1GB+ — **김팀장 P1** hub exit · Skia dispose · soak floor 확인

---
**P0**: 이후 자동보고는 **이 대화창에 게시** — 파일만 쓰고 채팅 생략 금지.
