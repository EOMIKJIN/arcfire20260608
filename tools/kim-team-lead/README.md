# 김팀장 · 김경제 팀 운영

**2026-06-19 단일 지휘**

- **김팀장** — **유일한 사용자 지시** · **모든 코드**(경제·UI·Skia 포함)
- **김경제** — **김팀장 배정만** · 실시간 감시 · `audit:balance-ops` **점검·리포트** · **코드 수정 없음**

워크플로: `docs/KIM_TEAM_ECONOMY_WORKFLOW.md`

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

## Handoff (관측)

김경제 **관측** 리포트: `reports/kim-economy-handoff.md` → 김팀장 **본 세션에서** 코드 조치
