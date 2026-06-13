# Daily commit automation

KST 날짜 기준으로 **하루 1회** 작업 트리 스냅샷을 commit합니다. 변경이 없으면 skip.

## 수동 실행

```bash
npm run daily:commit
```

| 환경 변수 | 의미 |
|-----------|------|
| `DAILY_COMMIT_PUSH=1` | commit 후 `git push` |
| `DAILY_COMMIT_RUN_AUDIT=1` | commit 전 `npm run audit:daily` (실패 시 commit 안 함) |

PowerShell 래퍼:

```powershell
.\tools\daily-commit\daily-commit.ps1
.\tools\daily-commit\daily-commit.ps1 -Push
.\tools\daily-commit\daily-commit.ps1 -RunAudit -Push
```

로그: `tools/daily-commit/logs/YYYY-MM-DD.log`

## Windows — 매일 자정 자동화 (권장)

PC **시스템 시간대를 KST** 로 두면 `/ST 00:00` = 자정 KST.  
**기본 첫 실행일 = 내일(KST)** — 오늘 밤에는 돌지 않음.

```powershell
Set-Location D:\arcfire20260607
.\tools\daily-commit\register-windows-task.ps1 -Push
# 특정 시작일: -StartDate "06/14/2026"
```

- `-Push`: 자정 commit 후 GitHub push (자격 증명·`git credential` 필요)
- `-RunAudit`: commit 전 일일 audit 실행

작업 확인: `taskschd.msc` → `ArcfireOnline_DailyCommit`

## 커밋 메시지

```
chore(daily): snapshot 2026-06-13 (KST)
```

같은 KST 날짜에 이미 daily snapshot 커밋이 HEAD에 있으면 **중복 commit 하지 않음**.

## 제외

`.env*`·`google-services.json` 등은 stage 후 **unstage** (`.gitignore`와 이중 방어).

## GitHub Actions (선택)

`.github/workflows/daily-commit-audit.yml` — 원격에서 **audit 보고서만** commit/push (로컬 작업 스냅샷 대체 아님).

로컬 전체 스냅샷은 **Windows 작업 스케줄러**가 담당합니다.
