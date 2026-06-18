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
npm run $npmScript 2>&1 | Tee-Object -FilePath $logFile -Append
exit $LASTEXITCODE
