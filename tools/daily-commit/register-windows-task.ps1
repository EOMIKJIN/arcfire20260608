#Requires -Version 5.1
<#
  Windows 작업 스케줄러 — 매일 12:00(KST) 정오 안정화·커밋·푸시.

  관리자 PowerShell:
    Set-ExecutionPolicy -Scope CurrentUser RemoteSigned   # 최초 1회
    Set-Location D:\arcfire20260607
    .\tools\daily-commit\register-windows-task.ps1

  제거:
    schtasks /Delete /TN "ArcfireOnline_DailyRelease" /F
#>
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
  [string]$TaskName = 'ArcfireOnline_DailyRelease',
  [string]$TimeLocal = '12:00',
  [string]$StartDate = '',  # MM/dd/yyyy — 비우면 오늘 또는 내일(KST) 12:00
  [switch]$Push,
  [switch]$RunAudit,
  [switch]$NoPush,
  [switch]$NoAudit
)

$settingsPath = Join-Path $PSScriptRoot 'settings.ps1'
if (Test-Path $settingsPath) { . $settingsPath }

$scriptPath = Join-Path $RepoRoot 'tools\daily-commit\daily-commit.ps1'
if (-not (Test-Path $scriptPath)) {
  Write-Error "Missing $scriptPath"
  exit 1
}

$doPush = if ($NoPush) { $false } elseif ($Push) { $true } else { [bool]$DailyCommitPush }
$doAudit = if ($NoAudit) { $false } elseif ($RunAudit) { $true } else { [bool]$DailyCommitRunAudit }

$flagParts = @()
if ($doPush) { $flagParts += '-Push' }
if ($doAudit) { $flagParts += '-RunAudit' }
$flagStr = if ($flagParts.Count -gt 0) { ' ' + ($flagParts -join ' ') } else { '' }

$tr = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -RepoRoot `"$RepoRoot`"$flagStr"

if (-not $StartDate) {
  $nowKst = [System.TimeZoneInfo]::ConvertTimeBySystemTimeZoneId((Get-Date), 'Korea Standard Time')
  $target = $nowKst.Date.AddHours(12)
  if ($nowKst -ge $target) { $target = $target.AddDays(1) }
  $StartDate = $target.ToString('MM/dd/yyyy')
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

Write-Host "OK — task '$TaskName' daily at $TimeLocal (PC local time), first run on $StartDate."
Write-Host "Pipeline: audit=$doAudit push=$doPush"
Write-Host "TR: $tr"
Write-Host ""
Write-Host "Note: Set Windows timezone to Korea Standard Time so 12:00 = KST noon."
Write-Host "Test now: powershell -File `"$scriptPath`"$flagStr"
Write-Host "Or: npm run daily:release"
