# Windows Scheduled Task — daily 18:00 playbot 1-day learning report ensure
param(
  [switch]$Unregister
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent | Split-Path -Parent
$ensure = Join-Path $PSScriptRoot 'ensure-daily-6pm-playbot-report.ps1'
$taskName = 'ArcfirePlaybotDaily18Learning'
$logFile = Join-Path $PSScriptRoot 'logs\schedule-6pm-playbot.log'

New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot 'logs') | Out-Null

function Log([string]$msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Write-Output $line
  try { Add-Content -Path $logFile -Value $line -Encoding utf8 } catch {}
}

if ($Unregister) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
  Log "UNREGISTERED $taskName"
  exit 0
}

if (-not (Test-Path $ensure)) {
  Log "REGISTER_FAIL missing $ensure"
  exit 1
}

$ps = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$arg = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ensure`""
$action = New-ScheduledTaskAction -Execute $ps -Argument $arg -WorkingDirectory $Root
$triggerDaily = New-ScheduledTaskTrigger -Daily -At 18:00
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 2) `
  -ExecutionTimeLimit (New-TimeSpan -Hours 1)

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger @($triggerDaily, $triggerLogon) `
  -Settings $settings `
  -Description 'Arcfire playbot 1-day learning report. Daily 18:00 + logon ensure (hidden).' `
  -RunLevel Limited | Out-Null

Log "REGISTERED $taskName daily 18:00 + logon -> $ensure"
& $ps -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File $ensure
Log 'ENSURE immediate after register'
