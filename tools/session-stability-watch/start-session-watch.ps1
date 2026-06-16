# Arcfire 5h session watch - economy 30m + final audit
param(
  [int]$IntervalMin = 30,
  [int]$DurationHours = 5,
  [string]$Package = 'com.arcfire.online'
)

$ErrorActionPreference = 'Continue'
$logDir = Join-Path $PSScriptRoot 'reports'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$sessionId = Get-Date -Format 'yyyyMMdd-HHmmss'
$sessionStartIso = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
$pidFile = Join-Path $logDir 'session-watch.pid'
$metaLog = Join-Path $logDir "session-watch-$sessionId.log"
$endAt = (Get-Date).AddHours($DurationHours)

function Write-Meta([string]$msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Add-Content -Path $metaLog -Value $line
  Write-Output $line
}

$watchPidFile = Join-Path (Split-Path $PSScriptRoot) 'long-run-monitor/logs/watch-30m.pid'
if (Test-Path $watchPidFile) {
  $watchPid = (Get-Content $watchPidFile -Raw).Trim()
  Write-Meta "long-run-monitor pid=$watchPid (existing)"
} else {
  Write-Meta "WARN: long-run-monitor not running - starting watch-30m"
  $watchScript = Join-Path (Split-Path $PSScriptRoot) 'long-run-monitor/start-watch-30m.ps1'
  & powershell -NoProfile -ExecutionPolicy Bypass -File $watchScript -IntervalMin 30 | Out-Null
}

Set-Content -Path $pidFile -Value $PID -Encoding ascii
$tick = 0
Write-Meta "session_start id=$sessionId duration=${DurationHours}h interval=${IntervalMin}m end_at=$($endAt.ToString('yyyy-MM-dd HH:mm:ss'))"

while ((Get-Date) -lt $endAt) {
  $tick += 1
  Write-Meta "economy_tick start tick=$tick"
  $tickJson = & node (Join-Path $PSScriptRoot 'run-economy-balance-tick.cjs') --session $sessionId --tick $tick --start $sessionStartIso 2>&1
  Write-Meta "economy_tick done tick=$tick exit=$LASTEXITCODE"
  if ($tickJson) { Write-Meta $tickJson }

  $remainingMin = ($endAt - (Get-Date)).TotalMinutes
  if ($remainingMin -le 0) { break }
  $sleepMin = [Math]::Min($IntervalMin, [Math]::Ceiling($remainingMin))
  Write-Meta "sleep ${sleepMin}m (remaining $([Math]::Round($remainingMin,1))m)"
  Start-Sleep -Seconds ([int]($sleepMin * 60))
}

Write-Meta "final_5h_audit start"
$finalJson = & node (Join-Path $PSScriptRoot 'run-final-5h-audit.cjs') --session $sessionId --start $sessionStartIso --hours $DurationHours 2>&1
Write-Meta "final_5h_audit done exit=$LASTEXITCODE"
if ($finalJson) { Write-Meta $finalJson }

$reportRel = "tools/session-stability-watch/reports/session-final-$sessionId.md"
$latestRel = "tools/session-stability-watch/reports/session-final-latest.md"
Write-Output "AGENT_SESSION_FINAL_5H {`"sessionId`":`"$sessionId`",`"reportPath`":`"$reportRel`",`"latestPath`":`"$latestRel`",`"exit`":$LASTEXITCODE}"
