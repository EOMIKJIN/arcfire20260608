# Daily release automation (정오 KST)

매일 **12:00 KST**에 **안정화 검증 → commit → push**까지 한 번에 끝나도록 구성합니다.

## 정오 파이프라인 (기본)

```bash
npm run daily:release
```

순서:

1. `npm run audit:daily` — 실패 시 commit·push **중단**
2. 변경 있으면 `chore(daily): snapshot YYYY-MM-DD (KST)` commit (같은 KST 날 중복 snapshot 방지)
3. upstream 대비 미 push 커밋이 있으면 `git push` (commit을 skip해도 push는 수행)

## 수동 — commit만

```bash
npm run daily:commit
```

| 환경 변수 | 의미 |
|-----------|------|
| `DAILY_COMMIT_PUSH=1` | commit 후 push (미 push 커밋만 있어도 push) |
| `DAILY_COMMIT_RUN_AUDIT=1` | commit 전 `audit:daily` |

PowerShell 래퍼 (`settings.ps1` 기본값: audit+push ON):

```powershell
.\tools\daily-commit\daily-commit.ps1
.\tools\daily-commit\daily-commit.ps1 -NoPush          # audit + commit만
.\tools\daily-commit\daily-commit.ps1 -NoAudit -Push   # commit + push만
```

로그: `tools/daily-commit/logs/YYYY-MM-DD.log`

## Windows — 매일 12:00 자동화 (권장)

PC **시스템 시간대를 KST**로 두면 `/ST 12:00` = 정오 KST.

```powershell
Set-Location D:\arcfire20260607
.\tools\daily-commit\register-windows-task.ps1
```

- 작업 이름: `ArcfireOnline_DailyRelease`
- 기본: `audit:daily` + commit + push (`settings.ps1`)
- 이전 자정 작업(`ArcfireOnline_DailyCommit`)이 있으면 제거:

```powershell
schtasks /Delete /TN "ArcfireOnline_DailyCommit" /F
```

확인: `taskschd.msc` → `ArcfireOnline_DailyRelease`  
즉시 테스트: `npm run daily:release`

## 커밋 메시지

```
chore(daily): snapshot 2026-06-19 (KST)
```

## 제외

`.env*`·`google-services.json` 등은 stage 후 **unstage** (`.gitignore`와 이중 방어).

## GitHub Actions (선택)

`.github/workflows/daily-commit-audit.yml` — 원격 audit 보고서만 (로컬 전체 스냅샷 대체 아님).

로컬 **정오 release**는 Windows 작업 스케줄러가 담당합니다.
