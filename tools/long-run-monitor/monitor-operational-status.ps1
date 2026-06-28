# 실시간 운영체제 상태 — PID · timeline · handoff (앱 adb 호출 없음)
param(
  [switch]$JsonOnly,
  [switch]$WriteJson
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$outJson = Join-Path $logDir 'MONITOR_STATUS_LATEST.json'

function Test-ProcAlive([int]$id) {
  if ($id -le 0) { return $false }
  try { return $null -ne (Get-Process -Id $id -ErrorAction SilentlyContinue) } catch { return $false }
}

function Read-PidFile([string]$name) {
  $f = Join-Path $logDir "$name.pid"
  if (-not (Test-Path $f)) { return @{ id = 0; alive = $false } }
  $id = 0
  [void][int]::TryParse((Get-Content $f -Raw).Trim(), [ref]$id)
  return @{ id = $id; alive = (Test-ProcAlive $id) }
}

function Get-LastTimeline {
  $csv = Join-Path $logDir 'mem-timeline.csv'
  if (-not (Test-Path $csv)) { return $null }
  try {
    $rows = @(Get-Content $csv | Select-Object -Skip 1 | Where-Object { $_.Trim() })
    if ($rows.Count -lt 1) { return $null }
    $c = ($rows[-1] -split ',')
    return @{
      iso_time = $c[0]; pid = $c[1]; pss_mb = $c[2]; gl_mb = $c[4]; views = $c[10]; note = $c[13]
    }
  } catch { return $null }
}

$watchdog = Read-PidFile 'perpetual-watchdog'
$watch30 = Read-PidFile 'watch-30m'
$report = Read-PidFile 'report-watch'
$sched8 = Read-PidFile 'schedule-8am-perpetual'

$reportMode = ''
$modeFile = Join-Path $logDir 'report-watch-mode.txt'
if (Test-Path $modeFile) {
  $reportMode = (Get-Content $modeFile -Raw -ErrorAction SilentlyContinue).Trim()
}

$payload = @{
  updatedAtKst = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
  watchdog = $watchdog
  watch30m = $watch30
  reportWatch = $report
  reportWatchMode = $reportMode
  schedule8am = $sched8
  handoffPending = Test-Path (Join-Path $ScriptRoot 'outbox\cursor-incident-handoff.md')
  chatPending = Test-Path (Join-Path $logDir 'CHAT_REPORT_PENDING.md')
  monitorPaused = Test-Path (Join-Path $logDir 'monitor-paused.flag')
  perpetualDisabled = Test-Path (Join-Path $logDir 'perpetual-detection-DISABLED.flag')
  lastTimeline = Get-LastTimeline
  processes = @{
    watchdog = $watchdog
    watch30m = $watch30
    reportWatch = $report
    schedule8am = $sched8
  }
}

if ($WriteJson -or -not $JsonOnly) {
  $payload | ConvertTo-Json -Depth 5 | Set-Content -Path $outJson -Encoding utf8
}

if ($JsonOnly) {
  $payload | ConvertTo-Json -Depth 5
  exit 0
}

Write-Output "status_kst=$($payload.updatedAtKst)"
Write-Output "watchdog=$($watchdog.alive) pid=$($watchdog.id)"
Write-Output "watch-30m=$($watch30.alive) pid=$($watch30.id)"
Write-Output "report-watch=$($report.alive) pid=$($report.id) mode=$($reportMode)"
Write-Output "handoff_pending=$($payload.handoffPending) chat_pending=$($payload.chatPending)"
if ($payload.lastTimeline) {
  $t = $payload.lastTimeline
  Write-Output "mem pss=$($t.pss_mb) gl=$($t.gl_mb) views=$($t.views) @ $($t.iso_time)"
}
Write-Output "json=$outJson"
