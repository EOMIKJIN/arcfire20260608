# Keep watch alive until KST deadline, then auto final report + handoff.
# LEGACY one-shot: 신규 상시 08:00 보고는 schedule-8am-kim-daily-auto-report.cjs + ensure-daily-8am-report.ps1 사용.
# 정책: tools/long-run-monitor/logs/DAILY_8AM_REPORT_POLICY.md
param(
  [string]$UntilLocal = '',
  [string]$TimelineMarker = 'OVERNIGHT_WATCH_UNTIL_8AM',
  [string]$Package = 'com.arcfire.online',
  [switch]$EnableAutoRemediation
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$Root = Split-Path $ScriptRoot -Parent | Split-Path -Parent
$handoff = Join-Path $Root 'tools\kim-team-lead\reports\kim-economy-handoff.md'
$sessionLog = Join-Path $logDir 'watch-session.log'
$scheduleLog = Join-Path $logDir 'schedule-8am-report.log'
$watchPidFile = Join-Path $logDir 'watch-30m.pid'
$reportPidFile = Join-Path $logDir 'report-watch.pid'
$pauseFlag = Join-Path $logDir 'monitor-paused.flag'
$schedulerPidFile = Join-Path $logDir 'schedule-8am-report.pid'
$dateFmt = 'yyyy-MM-dd HH:mm:ss'

function Get-KstNow {
  return (Get-Date).ToUniversalTime().AddHours(9)
}

function Log([string]$msg) {
  $line = '[' + (Get-Date -Format $dateFmt) + '] ' + $msg
  try { Add-Content -Path $scheduleLog -Value $line -Encoding utf8 } catch {}
  try { Add-Content -Path $sessionLog -Value $line -Encoding utf8 } catch {}
}

function Test-ProcessAlive([int]$procId) {
  if ($procId -le 0) { return $false }
  try { return $null -ne (Get-Process -Id $procId -ErrorAction SilentlyContinue) } catch { return $false }
}

function Read-PidFile([string]$path) {
  if (-not (Test-Path $path)) { return 0 }
  $raw = (Get-Content $path -Raw -ErrorAction SilentlyContinue).Trim()
  $id = 0
  [void][int]::TryParse($raw, [ref]$id)
  return $id
}

function Ensure-WatchStack {
  $watchPid = Read-PidFile $watchPidFile
  $reportPid = Read-PidFile $reportPidFile
  if ((Test-ProcessAlive $watchPid) -and (Test-ProcessAlive $reportPid)) {
    Log "WATCH_OK watch=$watchPid report=$reportPid"
    return
  }
  Log "WATCH_RESTART watch_alive=$(Test-ProcessAlive $watchPid) report_alive=$(Test-ProcessAlive $reportPid)"
  $psArgs = @(
    '-NoProfile', '-ExecutionPolicy', 'Bypass',
    '-File', (Join-Path $ScriptRoot 'restart-afternoon-watch.ps1'),
    '-Package', $Package,
    '-WatchIntervalMin', '30',
    '-ReportIntervalMin', '10'
  )
  if ($EnableAutoRemediation) { $psArgs += '-EnableAutoRemediation' }
  & powershell @psArgs 2>&1 | ForEach-Object { Log "restart $_" }
}

function Stop-WatchStack {
  foreach ($pair in @(
    @($watchPidFile, 'watch-30m'),
    @($reportPidFile, 'report-watch')
  )) {
    $id = Read-PidFile $pair[0]
    if (Test-ProcessAlive $id) {
      Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
      Log "STOP $($pair[1]) pid=$id"
    }
    Remove-Item $pair[0] -Force -ErrorAction SilentlyContinue
  }
}

function Update-Handoff([string]$reportFile, [string]$memLine, [string]$memStatus, [int]$actionCount, [string]$actionLines) {
  if (-not (Test-Path $handoff)) { return }
  $kst = Get-KstNow
  $watchPid = Read-PidFile $watchPidFile
  $reportPid = Read-PidFile $reportPidFile
  $paused = Test-Path $pauseFlag
  $autoFix = if ($paused) { 'OFF record-only' } else { 'ON' }
  $statusLine = if ($memStatus -eq 'CRITICAL') { 'ready-for-team-lead-action' } else { 'monitor-ok' }
  if ($memStatus -eq 'CRITICAL') {
    $rec = 'PSS>=950 hub exit / Skia dispose P0'
  } elseif ($memStatus -eq 'WARN') {
    $rec = 'PSS 850+ floor watch / worldmap SVG footprint'
  } else {
    $rec = 'overnight soak OK - review final report'
  }

  $block = "`n## [watch] $($kst.ToString($dateFmt)) KST - overnight until 08:00 auto report`n`n" +
    "- Kim-economy watch: watch PID **$watchPid** / report PID **$reportPid** / auto-fix=$autoFix`n" +
    "- mem-monitor: **$memStatus** ($memLine)`n" +
    "- report: $reportFile`n" +
    "- timeline marker: $TimelineMarker`n" +
    "- incidents actionable tail: $actionCount`n" +
    "$actionLines`n" +
    "- Kim team lead: $rec`n`n" +
    "> status: $statusLine`n"

  $content = Get-Content $handoff -Raw -Encoding utf8
  $template = '## [watch-template]'
  if ($content -match [regex]::Escape($template)) {
    $content = $content -replace [regex]::Escape($template), ($block.TrimEnd() + "`n`n" + $template)
  } else {
    $content += $block
  }
  Set-Content -Path $handoff -Value $content -Encoding utf8
  Log "HANDOFF updated -> $handoff"
}

Set-Content -Path $schedulerPidFile -Value $PID -Encoding ascii

if ($EnableAutoRemediation) {
  Remove-Item $pauseFlag -Force -ErrorAction SilentlyContinue
  Log 'monitor-paused=OFF'
} elseif (-not (Test-Path $pauseFlag)) {
  New-Item -ItemType File -Force -Path $pauseFlag | Out-Null
  Log 'monitor-paused=ON record-only'
}

if (-not $UntilLocal.Trim()) {
  $kst = Get-KstNow
  $UntilLocal = $kst.Date.AddDays(1).AddHours(8).ToString($dateFmt)
}

try {
  $until = [datetime]::ParseExact($UntilLocal.Trim(), $dateFmt, $null)
} catch {
  Log "SCHEDULE_FAIL invalid UntilLocal=$UntilLocal"
  exit 1
}

$kstStart = Get-KstNow
$marker = "$TimelineMarker $($kstStart.ToString($dateFmt)) KST until=$UntilLocal"
Add-Content -Path (Join-Path $logDir 'incidents.log') -Value ('[' + (Get-Date -Format $dateFmt) + '] ' + $marker)

$brief = "# Overnight watch until 08:00 KST`n`n" +
  "Start KST: $($kstStart.ToString($dateFmt))`n" +
  "End KST: $UntilLocal`n" +
  "Marker: $TimelineMarker`n" +
  "Auto-fix: $(if ($EnableAutoRemediation) { 'ON' } else { 'OFF record-only' })`n`n" +
  "Outputs at 08:00:`n" +
  "- logs/overnight-final-report-*.md`n" +
  "- tools/kim-team-lead/reports/kim-economy-handoff.md`n" +
  "- logs/heartbeat.log / mem-timeline.csv`n"
Set-Content -Path (Join-Path $logDir 'OVERNIGHT_WATCH_8AM_BRIEF.md') -Value $brief -Encoding utf8

Ensure-WatchStack
Log "SCHEDULE_START until=$UntilLocal marker=$TimelineMarker scheduler_pid=$PID"

while ((Get-KstNow) -lt $until) {
  $remainMin = ($until - (Get-KstNow)).TotalMinutes
  if ($remainMin -gt 30) {
    Start-Sleep -Seconds 1800
  } else {
    Start-Sleep -Seconds ([Math]::Max(30, [int]($remainMin * 60)))
  }
  Ensure-WatchStack
}

$kst = Get-KstNow
$reportTag = $kst.ToString('yyyyMMdd-HHmm')
$reportFile = Join-Path $logDir ("overnight-final-report-$reportTag.md")
Log "GENERATING report -> $reportFile"

& (Join-Path $ScriptRoot 'run-overnight-final-report.ps1') `
  -Package $Package `
  -ReportPath $reportFile `
  -TimelineMarker $TimelineMarker `
  -ReportTitle 'Arcfire overnight watch report (08:00 KST auto)'

# Legacy one-shot: watch stack 유지 (상시 08:00 정책). 구버전 Stop-WatchStack 제거됨.

$pidApp = (adb shell "pidof $Package" 2>$null).ToString().Trim()
$pssMb = '?'
$glMb = '?'
$views = '?'
$memLine = 'APP_NOT_RUNNING'
if ($pidApp) {
  $raw = adb shell dumpsys meminfo $Package 2>&1 | Out-String
  if ($raw -match 'TOTAL PSS:\s+(\d+)') { $pssMb = [math]::Round([int]$Matches[1] / 1024, 1) }
  if ($raw -match '(?m)^\s*GL mtrack\s+(\d+)') { $glMb = [math]::Round([int]$Matches[1] / 1024, 1) }
  if ($raw -match 'Views:\s+(\d+)') { $views = $Matches[1] }
  $memLine = "PSS ${pssMb}MB GL ${glMb}MB Views $views pid=$pidApp"
}

$memStatus = 'OK'
if ($pssMb -ne '?' -and [double]$pssMb -ge 950) { $memStatus = 'CRITICAL' }
elseif ($pssMb -ne '?' -and [double]$pssMb -ge 850) { $memStatus = 'WARN' }

$incidentTail = @()
$incidentsPath = Join-Path $logDir 'incidents.log'
if (Test-Path $incidentsPath) {
  $incidentTail = @(Get-Content $incidentsPath -Tail 20 -ErrorAction SilentlyContinue)
}
$actionable = @($incidentTail | Where-Object { $_ -match 'GL_SPIKE|PROCESS_DEATH|HARD|baseline_gl|ABNORMAL|FATAL|OVERNIGHT_WATCH' })
if ($actionable.Count -gt 0) {
  $actionLines = ($actionable | ForEach-Object { '  - ' + $_ }) -join "`n"
} else {
  $actionLines = '  - (none)'
}

Update-Handoff $reportFile $memLine $memStatus $actionable.Count $actionLines
$readyLine = '[' + (Get-Date -Format $dateFmt) + '] OVERNIGHT_WATCH_8AM_REPORT_READY ' + $reportFile
Add-Content -Path $incidentsPath -Value $readyLine

# Legacy: watch stack 유지 (상시 08:00 정책 — Stop-WatchStack 제거)
Log "SCHEDULE_DONE until=$UntilLocal report=$reportFile"
Remove-Item $schedulerPidFile -Force -ErrorAction SilentlyContinue

# Re-ensure perpetual daily 8am scheduler + 채팅·LATEST·ledger (레거시 md만 생성 회귀 방지)
& (Join-Path $ScriptRoot 'ensure-daily-8am-report.ps1') 2>&1 | ForEach-Object { Log "ensure-8am $_" }
try {
  $node = (Get-Command node -ErrorAction SilentlyContinue).Source
  if ($node) {
    Log 'PUBLISH spawn schedule-8am --publish-only'
    Start-Process -WindowStyle Hidden -FilePath $node -ArgumentList @(
      (Join-Path $ScriptRoot 'schedule-8am-kim-daily-auto-report.cjs'),
      '--publish-only'
    ) | Out-Null
  }
} catch {
  Log "WARN publish-only spawn failed: $_"
}
