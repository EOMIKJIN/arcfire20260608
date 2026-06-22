# 3시간 감시 브리프 (2026-06-22 19:10 ~ 22:10 KST)

## 감시 목표
1. **행성 점유** — RED / BLUE / NEUTRAL 전환·유지 알림 정상
2. **접전지역 패스** — `ArcCoreTerritorialCombatSubCore` 60s probe + passInterval
3. **비정상** — 크래시, GL 누수, PROCESS_DEATH, ABNORMAL_RESTART

## 로그 위치 (22:10 보고 시 읽을 파일)
| 파일 | 용도 |
|------|------|
| `mem-timeline.csv` | 30분 GL/PSS 추이 |
| `incidents.log` | incident 이벤트 |
| `remediation.log` | 자동조치·VERIFY |
| `crash-*.log` (최신) | FATAL/SIGSEGV |
| `territorial-pass-*.log` | territorial 키워드 logcat |
| `heartbeat.log` | report-watch (가동 시) |

## 보고 체크리스트 (에이전트)
- [ ] `territorial-pass-*.log` — battle/neutral_declare/maintained 이벤트 건수
- [ ] `incidents.log` 신규 라인 (감시 시작 이후)
- [ ] `mem-timeline.csv` floor/peak (누수 vs GC 톱니)
- [ ] 앱 PID 생존 (adb pidof)
- [ ] 점유 변경 **없음**이 정상인 구간 vs **변경 있음** 시 prev→new side 기록

## 사용자 재현 권장 (점유 확인)
앱 **포그라운드** 유지 · 행성 허브/월드맵 체류 — territorial pass는 백그라운드에서도 tick되나 알림은 UI 포커스 시 확인.

보고 요청: 채팅에 **「보고해」** 입력.
