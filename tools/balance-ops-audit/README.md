# ArcCore 경제·밸런스 운영 감사

v4.0 **일 1회 배치**(12:00 KST) 계약 준수 여부·SIM KPI·레벨 밴드 드리프트를 점검하고, 스냅샷을 누적해 **학습 인사이트**를 생성한다.

## 한 번 실행

```bash
npm run audit:balance-ops
```

## 3시간 주기 로컬 감시 (개발 PC)

```powershell
.\tools\balance-ops-audit\start-watch-3h.ps1
```

- 로그: `tools/balance-ops-audit/reports/watch-3h.log`
- 타임라인: `reports/timeline.csv`
- 학습 상태: `reports/learning-state.json`

## GitHub Actions (2026-06-24 정책)

| 항목 | 내용 |
|------|------|
| **3h cron** | **폐지** — RN headless(`planet-economy-3h`) CI 불가 + 실패 메일 8회/일 노이즈 |
| **워크플로** | `.github/workflows/balance-ops-audit.yml` — **일 1회 KST 09:00** contract-only + `workflow_dispatch` |
| **CI 모드** | `ARC_BALANCE_OPS_CI=1` — CSV·고빈호·`audit:balance`만; 행성 전수는 **로컬** |
| **알림** | GitHub repo 구독 메일 — Actions 실패 시. 불필요하면 repo **Watch → Custom → Actions 끄기** |

정본 경제 감시: 김경제 `long-run-monitor` · 김팀장 `npm run audit:team-lead:daily`.

## 산출물

| 경로 | 용도 |
|------|------|
| `reports/latest.md` | 최신 감사 요약 |
| `reports/timeline.csv` | 3h 스냅샷 시계열 |
| `reports/learning-state.json` | KPI·드리프트 트렌드 + 권장 조치 |
| `reports/YYYY-MM-DD/` | 일별 아카이브 |

## 자기 최적화 핸드오프

`npm run audit:arc-self-optimize:pack` 실행 시 본 감사·경제 SIM·balance audit 결과가 `cursor-handoff.md`에 자동 병합된다.

## 스케줄

- GitHub: `.github/workflows/balance-ops-audit.yml` (일 1회 KST 09:00 contract-only · 3h cron **폐지** 2026-06-24)
- 일일 SIM: `.github/workflows/daily-economy-sim.yml` (KST 15:00)
