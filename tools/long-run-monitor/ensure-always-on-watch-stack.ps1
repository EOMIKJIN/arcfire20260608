# Arcfire 상시 감시 스택 — 멱등
#   1) watch (mem-timeline + crash + check-and-remediate → 김팀장 handoff)
#   2) profiler extras — retention audit
#   3) report-watch 15m — heartbeat·크래시 tail (dumpsys 금지·timeline 재사용)
#   4) daily 08:00 report
# 영구 재가동: ensure-perpetual-watchdog.ps1 + Windows ArcfirePerpetualDetection 작업
param(
  [string]$Package = 'com.arcfire.online',
  [int]$IntervalMin = 15,
  [int]$ReportWatchMin = 15,
  [int]$RetentionAuditEveryMin = 60,
  [switch]$SkipDaily8am,
  [switch]$SkipReportWatch
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
. (Join-Path $ScriptRoot 'monitor-host-budget.ps1')
$IntervalMin = Enforce-MonitorIntervalFloor -IntervalMin $IntervalMin -FloorMin $script:MONITOR_MIN_MEMINFO_INTERVAL_MIN
$ReportWatchMin = Enforce-MonitorIntervalFloor -IntervalMin $ReportWatchMin -FloorMin $script:MONITOR_MIN_REPORT_INTERVAL_MIN
$RetentionAuditEveryMin = Enforce-MonitorIntervalFloor -IntervalMin $RetentionAuditEveryMin -FloorMin $script:MONITOR_MIN_RETENTION_INTERVAL_MIN
$logDir = Join-Path $ScriptRoot 'logs'
$watchPidFile = Join-Path $logDir 'watch-30m.pid'
$profilerRoot = Join-Path (Split-Path $ScriptRoot -Parent) 'memory-profiler'
$ensure8am = Join-Path $ScriptRoot 'ensure-daily-8am-report.ps1'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Test-ProcAlive([int]$id) {
  if ($id -le 0) { return $false }
  try { return $null -ne (Get-Process -Id $id -ErrorAction SilentlyContinue) } catch { return $false }
}

function Read-WatchPid {
  if (-not (Test-Path $watchPidFile)) { return 0 }
  $id = 0
  [void][int]::TryParse((Get-Content $watchPidFile -Raw).Trim(), [ref]$id)
  return $id
}

$watchPid = Read-WatchPid
if (Test-ProcAlive $watchPid) {
  Write-Output "watch-30m=already pid=$watchPid"
} else {
  & (Join-Path $ScriptRoot 'start-watch-30m.ps1') -Package $Package -IntervalMin $IntervalMin | ForEach-Object { Write-Output $_ }
}

& (Join-Path $profilerRoot 'ensure-profiler-extras.ps1') -RetentionAuditEveryMin $RetentionAuditEveryMin | ForEach-Object { Write-Output $_ }

if (-not $SkipReportWatch) {
  & (Join-Path $ScriptRoot 'ensure-report-watch-realtime.ps1') -Package $Package -IntervalMin $ReportWatchMin |
    ForEach-Object { Write-Output $_ }
}

if (-not $SkipDaily8am -and (Test-Path $ensure8am)) {
  & $ensure8am | ForEach-Object { Write-Output $_ }
}

$paused = Test-Path (Join-Path $logDir 'monitor-paused.flag')
Write-Output "code_auto_fix=handoff+retention+incident-triage (app_relaunch=$(if ($paused) { 'OFF(monitor-paused)' } else { 'ON(throttled)' }))"
