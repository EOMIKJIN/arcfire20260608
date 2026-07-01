# 영구 실시간 탐지 워치독 — PC/게임/Cursor 재시작과 무관하게 스택 유지 + 김팀장 handoff
param(
  [string]$Package = 'com.arcfire.online',
  [int]$EnsureEveryMin = 5,
  [int]$MemIntervalMin = 15,
  [int]$ReportWatchMin = 15,
  [int]$RetentionAuditEveryMin = 60
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$disableFlag = Join-Path $logDir 'perpetual-detection-DISABLED.flag'
$overnightFlag = Join-Path $logDir 'overnight-exception-shutdown.flag'
$watchdogLog = Join-Path $logDir 'perpetual-watchdog.log'
$pidFile = Join-Path $logDir 'perpetual-watchdog.pid'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Set-Content -Path $pidFile -Value $PID -Encoding ascii

function Log([string]$msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [watchdog pid=$PID] $msg"
  Write-Output $line
  try { Add-Content -Path $watchdogLog -Value $line -Encoding utf8 } catch {}
}

if (Test-Path $disableFlag) {
  Log 'DISABLED flag — exiting'
  exit 0
}

if (Test-Path $overnightFlag) {
  Log 'OVERNIGHT exception shutdown — exiting (resume ~08:00 KST)'
  exit 0
}

Log "START ensure_every=${EnsureEveryMin}m mem=${MemIntervalMin}m report=${ReportWatchMin}m"

$ensureStack = Join-Path $ScriptRoot 'ensure-always-on-watch-stack.ps1'
$ensureReport = Join-Path $ScriptRoot 'ensure-report-watch-realtime.ps1'
$pollHandoff = Join-Path $ScriptRoot 'poll-realtime-incident-handoff.ps1'
$statusScript = Join-Path $ScriptRoot 'monitor-operational-status.ps1'
$dashboardScript = Join-Path $ScriptRoot 'generate-monitor-dashboard.cjs'
$dailyBalanceOps = Join-Path $ScriptRoot 'ensure-daily-balance-ops.ps1'
$invokeNodeHidden = Join-Path $ScriptRoot 'invoke-node-hidden.ps1'

while ($true) {
  . $invokeNodeHidden
  if (Test-Path $disableFlag) {
    Log 'DISABLED flag detected — stop'
    break
  }
  if (Test-Path $overnightFlag) {
    Log 'OVERNIGHT exception shutdown — stop'
    break
  }
  try {
    & $ensureStack -Package $Package -IntervalMin $MemIntervalMin -RetentionAuditEveryMin $RetentionAuditEveryMin |
      ForEach-Object { Log "stack $_" }
    & $ensureReport -Package $Package -IntervalMin $ReportWatchMin |
      ForEach-Object { Log "report $_" }
    & $pollHandoff -Package $Package | ForEach-Object { Log "poll $_" }
    & $statusScript -WriteJson | ForEach-Object { Log "status $_" }
    Invoke-NodeHidden -ScriptPath $dashboardScript | Out-Null
    Log "dash ok path=$dashboardScript"
    & $dailyBalanceOps 2>&1 | ForEach-Object { Log "econ $_" }
  } catch {
    Log "ERROR $($_.Exception.Message)"
  }
  Start-Sleep -Seconds ($EnsureEveryMin * 60)
}
