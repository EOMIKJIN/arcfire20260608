#Requires -Version 5.1
<#
  데일리 커밋 — Windows 작업 스케줄러 / 수동 실행용 래퍼.
#>
param(
  [switch]$Push,
  [switch]$RunAudit,
  [switch]$NoPush,
  [switch]$NoAudit,
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
)

$settingsPath = Join-Path $PSScriptRoot 'settings.ps1'
if (Test-Path $settingsPath) { . $settingsPath }

Set-Location $RepoRoot

$doPush = if ($NoPush) { $false } elseif ($Push) { $true } else { [bool]$DailyCommitPush }
$doAudit = if ($NoAudit) { $false } elseif ($RunAudit) { $true } else { [bool]$DailyCommitRunAudit }

if ($doPush) { $env:DAILY_COMMIT_PUSH = '1' } else { Remove-Item Env:DAILY_COMMIT_PUSH -ErrorAction SilentlyContinue }
if ($doAudit) { $env:DAILY_COMMIT_RUN_AUDIT = '1' } else { Remove-Item Env:DAILY_COMMIT_RUN_AUDIT -ErrorAction SilentlyContinue }

$logDir = Join-Path $RepoRoot 'tools\daily-commit\logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$kst = [System.TimeZoneInfo]::ConvertTimeBySystemTimeZoneId((Get-Date), 'Korea Standard Time')
$logFile = Join-Path $logDir ($kst.ToString('yyyy-MM-dd') + '.log')

Write-Host "[daily-commit] repo=$RepoRoot push=$doPush audit=$doAudit"

$npmScript = if ($doPush -and $doAudit) { 'daily:release' } else { 'daily:commit' }
# Tee-Object 파이프는 PS 5.1에서 npm LASTEXITCODE를 덮어쓴다. cmd /c 로 exit 보존.
cmd /c "npm run $npmScript >> `"$logFile`" 2>&1"
$exitCode = $LASTEXITCODE

# ── 완료 검증 — 종료코드만 믿지 않는다 ─────────────────────────────────────
# 2026-09-25: daily:release 가 main() 을 호출하지 않아 «아무 일도 안 하고 exit 0» 했다.
# 스케줄러 LastResult=0 이라 실패를 아무도 몰랐다. 실제 결과를 직접 확인한다.
function Write-DailyLog([string]$Message) {
  $line = '[{0}] {1}' -f (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ'), $Message
  Write-Host $line
  Add-Content -Path $logFile -Value $line -Encoding utf8
}

if ($exitCode -eq 0) {
  $verifyFail = $null

  # (1) 파이프라인이 실제로 돌았는가 — 자체 로그가 한 줄도 없으면 no-op 이다
  $logLines = @()
  if (Test-Path $logFile) {
    $logLines = @(Get-Content $logFile -Encoding utf8 -ErrorAction SilentlyContinue | Where-Object { $_ -match '^\[\d{4}-' })
  }
  if ($logLines.Count -eq 0) {
    $verifyFail = '파이프라인 자체 로그가 없다 — main() 미실행(no-op) 의심'
  }

  # (2) 커밋됐거나, 정당한 skip 사유가 있거나 — 둘 중 하나여야 한다
  if (-not $verifyFail) {
    $kstDay = $kst.ToString('yyyy-MM-dd')
    $headSubject = (git log -1 --format=%s 2>$null)
    $committedToday = $headSubject -match [regex]::Escape("snapshot $kstDay")
    $skipped = ($logLines -join "`n") -match 'no working tree changes|already exists on HEAD|nothing staged'
    if (-not $committedToday -and -not $skipped) {
      $verifyFail = "오늘($kstDay) 스냅샷 커밋이 없고 정당한 skip 사유도 없다 — HEAD='$headSubject'"
    }
  }

  # (3) 푸시까지 끝났는가
  if (-not $verifyFail -and $doPush) {
    $ahead = (git rev-list --count '@{u}..HEAD' 2>$null)
    if ($LASTEXITCODE -eq 0 -and $ahead -and ([int]$ahead) -gt 0) {
      $verifyFail = "미푸시 커밋 $ahead 건이 남아 있다"
    }
  }

  if ($verifyFail) {
    Write-DailyLog "VERIFY FAIL — $verifyFail"
    $exitCode = 2
  } else {
    Write-DailyLog 'VERIFY OK — 커밋·푸시 완료 확인.'
  }
}

if ($exitCode -ne 0) {
  Write-Host "[daily-commit] FAILED exit=$exitCode — writing CHAT_REPORT_PENDING"
  node (Join-Path $PSScriptRoot 'write-daily-commit-failure-pending.cjs') "$exitCode"
}
exit $exitCode
