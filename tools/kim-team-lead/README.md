# 김팀장 · 김경제 팀 운영 (일일 검수)

**김경제** — 경제·밸런스·아크코어 운영 **구축·테스트**  
**김팀장** — 산출물 **1일 1회 자동 검수** · **최종 코드 연동·정리** 책임

워크플로 정본: `docs/KIM_TEAM_ECONOMY_WORKFLOW.md`

## 일 1회 총괄 검수

```bash
npm run audit:team-lead:daily
```

- `audit:balance-ops` 실행 (또는 `--skip-audit`로 생략)
- `tsc --noEmit` · handoff · git 경제 축 dirty 스캔
- 보고서: `reports/daily-review-latest.md`
- 상태: `reports/daily-review-state.json`
- 당일 KST **PASS** 이미 있으면 스킵 (`--force` 재실행)

## Windows 스케줄 (권장 09:00 KST)

```powershell
.\tools\kim-team-lead\start-daily-review.ps1
```

작업 스케줄러에 위 스크립트 등록 · 로그: `reports/daily-review-scheduler.log`

## Handoff

김경제 작업 완료 시: `reports/kim-economy-handoff.md` 갱신 → 김팀장 `@김팀장 일일 검수` 또는 자동 스케줄
