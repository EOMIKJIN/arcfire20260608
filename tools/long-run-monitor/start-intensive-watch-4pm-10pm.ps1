# PM 16:00–22:00 KST 집중 감시 — 경제·행성개발·메모리 · 22:00 자동보고 · 심각 이상 즉시 auto-fix
param(
  [string]$Package = 'com.arcfire.online',
  [int]$WatchIntervalMin = 15,
  [int]$ReportIntervalMin = 10,
  [switch]$RecordOnly
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$Root = Split-Path $ScriptRoot -Parent | Split-Path -Parent
$Marker = 'INTENSIVE_WATCH_1600_START'
$briefPath = Join-Path $logDir 'EVENING_WATCH_10PM_BRIEF.md'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Get-KstNow { (Get-Date).ToUniversalTime().AddHours(9) }
$kst = Get-KstNow
$kstLabel = $kst.ToString('yyyy-MM-dd HH:mm:ss')

# Timeline marker
$tlLine = $kstLabel + ',,,,,,,,,,,,' + $Marker
Add-Content -Path (Join-Path $logDir 'mem-timeline.csv') -Value $tlLine -Encoding utf8
Add-Content -Path (Join-Path $logDir 'incidents.log') -Value ("[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Marker KST intensive watch 16:00-22:00") -Encoding utf8

# Watch stack — default auto-remediation ON for serious issues
$restartArgs = @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', (Join-Path $ScriptRoot 'restart-afternoon-watch.ps1'),
  '-Package', $Package,
  '-WatchIntervalMin', $WatchIntervalMin,
  '-ReportIntervalMin', $ReportIntervalMin
)
if (-not $RecordOnly) {
  $restartArgs += '-EnableAutoRemediation'
}
& powershell @restartArgs

# Ensure perpetual watchdog
try {
  Set-Location $Root
  npm run monitor:ensure-perpetual 2>&1 | ForEach-Object { Write-Output $_ }
} catch {
  Write-Output "WARN ensure-perpetual: $_"
}

# Baseline economy audit (non-blocking background)
$auditJob = Start-Job -ScriptBlock {
  param($root)
  Set-Location $root
  npm run audit:balance-ops 2>&1
} -ArgumentList $Root

# Schedule 22:00 report (detached)
$schedPidPath = Join-Path $logDir 'schedule-10pm-report.pid'
if (Test-Path $schedPidPath) {
  $old = (Get-Content $schedPidPath -Raw -ErrorAction SilentlyContinue).Trim()
  if ($old -match '^\d+$') {
    Stop-Process -Id ([int]$old) -Force -ErrorAction SilentlyContinue
  }
}
$p = Start-Process -WindowStyle Hidden -PassThru -FilePath 'powershell' -ArgumentList @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', (Join-Path $ScriptRoot 'schedule-10pm-evening-watch-report.ps1'),
  '-TimelineMarker', $Marker
) -WorkingDirectory $ScriptRoot
Set-Content -Path $schedPidPath -Value $p.Id -Encoding utf8

# Runtime snapshot
$pidApp = (adb shell "pidof $Package" 2>$null).ToString().Trim()
$memSnap = 'APP_NOT_RUNNING'
if ($pidApp) {
  $raw = adb shell dumpsys meminfo $Package 2>&1 | Out-String
  $pss = '?'; $gl = '?'; $v = '?'
  if ($raw -match 'TOTAL PSS:\s+(\d+)') { $pss = [math]::Round([int]$Matches[1] / 1024, 1) }
  if ($raw -match '(?m)^\s*GL mtrack\s+(\d+)') { $gl = [math]::Round([int]$Matches[1] / 1024, 1) }
  if ($raw -match 'Views:\s+(\d+)') { $v = $Matches[1] }
  $memSnap = "pid=$pidApp PSS=${pss}MB GL=${gl}MB Views=$v"
}

$watchPid = if (Test-Path (Join-Path $logDir 'watch-30m.pid')) { (Get-Content (Join-Path $logDir 'watch-30m.pid') -Raw).Trim() } else { '?' }
$autoFix = if ($RecordOnly) { 'OFF' } else { 'ON' }

$brief = @"
# Arcfire intensive watch — $kstLabel KST → 22:00 report

Request: 16:00-22:00 focus — ArcCore economy, RED planet dev automation, memory leak/abnormal occupation. Auto report 22:00. Serious issues: auto-fix ON.

## Stack

| Item | Value |
|------|-------|
| marker | $Marker @ $kstLabel |
| watch-30m | ${WatchIntervalMin}m PID $watchPid |
| auto-fix | $autoFix |
| 22:00 scheduler | PID $($p.Id) |
| runtime | $memSnap |

## 22:00 outputs

- evening-watch-report-YYYYMMDD-2200.md
- DAILY_10PM_REPORT_LATEST.md
- CHAT_REPORT_PENDING.md
- kim-economy-handoff.md [obs]

## KPI

| Area | Target |
|------|--------|
| PSS idle floor | le 750MB, drift under +40MB |
| GL after GL_RECOVERED | le 55MB |
| GL 3x SPIKE | 0 |
| PROCESS_DEATH+crash | 0 |
| ArcCore batch | 12:00 only |
| RED planet dev | 60s tick, vault spend |

> status: intensive-watch-ACTIVE · 22:00 auto-report scheduled · auto-fix=$autoFix

"@
Set-Content -Path $briefPath -Value $brief -Encoding utf8

Write-Output "INTENSIVE_WATCH_STARTED marker=$Marker scheduler_pid=$($p.Id) brief=$briefPath auto_fix=$autoFix"
Write-Output $memSnap

# Wait briefly for audit job (max 90s) then note
Wait-Job $auditJob -Timeout 90 | Out-Null
if ($auditJob.State -eq 'Running') {
  Write-Output 'audit:balance-ops still running in background'
} else {
  Receive-Job $auditJob | Select-Object -Last 5 | ForEach-Object { Write-Output $_ }
  Remove-Job $auditJob -Force -ErrorAction SilentlyContinue
}
