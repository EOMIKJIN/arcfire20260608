#Requires -Version 5.1
<#
  Windows 작업 스케줄러 — 매일 자정(KST) 데일리 커밋 등록.

  관리자 PowerShell:
    Set-ExecutionPolicy -Scope CurrentUser RemoteSigned   # 최초 1회
    .\tools\daily-commit\register-windows-task.ps1

  제거:
    schtasks /Delete /TN "ArcfireOnline_DailyCommit" /F
#>
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
  [string]$TaskName = 'ArcfireOnline_DailyCommit',
  [string]$TimeLocal = '00:00',
  [string]$StartDate = '',  # MM/dd/yyyy — 비우면 내일(KST) 자정부터
  [switch]$Push,
  [switch]$RunAudit
)

$scriptPath = Join-Path $RepoRoot 'tools\daily-commit\daily-commit.ps1'
if (-not (Test-Path $scriptPath)) {
  Write-Error "Missing $scriptPath"
  exit 1
}

$pushFlag = ''
$auditFlag = if ($RunAudit) { ' -RunAudit' } else { '' }
$tr = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -RepoRoot `"$RepoRoot`"$pushFlag$auditFlag"

if (-not $StartDate) {
  $tomorrowKst = [System.TimeZoneInfo]::ConvertTimeBySystemTimeZoneId((Get-Date).AddDays(1), 'Korea Standard Time')
  $StartDate = $tomorrowKst.ToString('MM/dd/yyyy')
}

schtasks /Create `
  /TN $TaskName `
  /TR $tr `
  /SC DAILY `
  /ST $TimeLocal `
  /SD $StartDate `
  /F | Out-Null

if ($LASTEXITCODE -ne 0) {
  Write-Error 'schtasks /Create failed'
  exit $LASTEXITCODE
}

Write-Host "OK — task '$TaskName' daily at $TimeLocal, first run on $StartDate (PC local timezone)."
Write-Host "TR: $tr"
Write-Host ""
Write-Host "Note: Windows uses PC local time. Set system timezone to Korea Standard Time for KST midnight."
Write-Host "Test now: powershell -File `"$scriptPath`"$pushFlag$auditFlag"
