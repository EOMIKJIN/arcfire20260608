# 22:00 KST intensive watch report scheduler (16:00–22:00 window)
param(
  [string]$Package = 'com.arcfire.online',
  [string]$TargetTime = '22:00',
  [string]$TimelineMarker = 'INTENSIVE_WATCH_1600_START'
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$Root = Split-Path $ScriptRoot -Parent | Split-Path -Parent
$handoff = Join-Path $Root 'tools\kim-team-lead\reports\kim-economy-handoff.md'
$scheduleLog = Join-Path $logDir 'schedule-10pm-report.log'
$latestSummary = Join-Path $logDir 'DAILY_10PM_REPORT_LATEST.md'
$chatPending = Join-Path $logDir 'CHAT_REPORT_PENDING.md'
$dateFmt = 'yyyy-MM-dd HH:mm:ss'
$dateShort = 'yyyy-MM-dd HH:mm'
$dateFile = 'yyyyMMdd-HHmm'

function Log([string]$msg) {
  $line = '[' + (Get-Date -Format $dateFmt) + '] ' + $msg
  Write-Host $line
  try { Add-Content -Path $scheduleLog -Value $line -Encoding utf8 } catch {}
}

function Get-KstNow { (Get-Date).ToUniversalTime().AddHours(9) }

function Wait-UntilKstTime([string]$hhmm) {
  $parts = $hhmm.Split(':')
  $h = [int]$parts[0]
  $m = if ($parts.Length -gt 1) { [int]$parts[1] } else { 0 }
  while ($true) {
    $now = Get-KstNow
    $day = $now.ToString('yyyy-MM-dd')
    $target = Get-Date ($day + ' ' + $h.ToString('00') + ':' + $m.ToString('00') + ':00')
    if ($now -ge $target) { return $now }
    $sec = [math]::Min(300, ($target - $now).TotalSeconds)
    if ($sec -lt 5) { Start-Sleep -Seconds 5; continue }
    Log ('wait until ' + $hhmm + ' KST (~' + [math]::Round($sec) + 's)')
    Start-Sleep -Seconds $sec
  }
}

Log ('scheduler start target=' + $TargetTime + ' KST marker=' + $TimelineMarker)
Wait-UntilKstTime $TargetTime

$kst = Get-KstNow
$reportFile = Join-Path $logDir ('evening-watch-report-' + $kst.ToString($dateFile) + '.md')

Log ('generating intensive report -> ' + $reportFile)
$reportFile = & (Join-Path $ScriptRoot 'run-evening-10pm-intensive-report.ps1') `
  -Package $Package `
  -ReportPath $reportFile `
  -TimelineMarker $TimelineMarker `
  -ReportTitle 'Arcfire intensive watch 16:00–22:00 KST — 22:00 comprehensive report'

Copy-Item -Path $reportFile -Destination $latestSummary -Force

$pidApp = (adb shell ('pidof ' + $Package) 2>$null).ToString().Trim()
$memLine = 'APP_NOT_RUNNING'
$pssMb = '?'
$glMb = '?'
$views = '?'
if ($pidApp) {
  $raw = adb shell dumpsys meminfo $Package 2>&1 | Out-String
  if ($raw -match 'TOTAL PSS:\s+(\d+)') { $pssMb = [math]::Round([int]$Matches[1] / 1024, 1) }
  if ($raw -match '(?m)^\s*GL mtrack\s+(\d+)') { $glMb = [math]::Round([int]$Matches[1] / 1024, 1) }
  if ($raw -match 'Views:\s+(\d+)') { $views = $Matches[1] }
  $memLine = 'PSS ' + $pssMb + 'MB GL ' + $glMb + 'MB Views ' + $views + ' pid=' + $pidApp
}

$watchPid = '?'
$watchPidPath = Join-Path $logDir 'watch-30m.pid'
if (Test-Path $watchPidPath) { $watchPid = (Get-Content $watchPidPath -Raw).Trim() }
$reportPid = '?'
$reportPidPath = Join-Path $logDir 'report-watch.pid'
if (Test-Path $reportPidPath) { $reportPid = (Get-Content $reportPidPath -Raw).Trim() }
$paused = Test-Path (Join-Path $logDir 'monitor-paused.flag')

$incidentTail = @()
$incidentsPath = Join-Path $logDir 'incidents.log'
if (Test-Path $incidentsPath) {
  $incidentTail = @(Get-Content $incidentsPath -Tail 20 -ErrorAction SilentlyContinue)
}
$actionable = @($incidentTail | Where-Object {
  $_ -match 'GL_SPIKE|PROCESS_DEATH|HARD|PSS_SOFT|baseline_gl|ABNORMAL|FATAL|INTENSIVE_WATCH|PID_CHANGE|CRITICAL'
})

$memStatus = 'OK'
if ($pssMb -ne '?' -and [double]$pssMb -ge 950) { $memStatus = 'CRITICAL' }
elseif ($pssMb -ne '?' -and [double]$pssMb -ge 850) { $memStatus = 'WARN' }
elseif ($views -ne '?' -and [int]$views -ge 450) { $memStatus = 'WARN_VIEWS' }

if ($actionable.Count) {
  $actionLines = ($actionable | ForEach-Object { '  - ' + $_ }) -join [Environment]::NewLine
} else {
  $actionLines = '  - (none in tail)'
}

switch ($memStatus) {
  'CRITICAL' { $rec = 'PSS>=950 — P0 auto-remediation + Skia dispose audit' }
  'WARN' { $rec = 'PSS 850+ — native floor soft reclaim watch' }
  'WARN_VIEWS' { $rec = 'Views 450+ — SUB-STAGE soak + cold restart' }
  default { $rec = 'intensive window stable — review sections 9–12 in report' }
}

$autoFix = if ($paused) { 'OFF(record-only)' } else { 'ON' }
$statusLine = if ($memStatus -eq 'CRITICAL') { 'ready-for-team-lead-action' } else { 'monitor-ok' }

$kstLabel = $kst.ToString($dateShort)
$handoffBlock = @(
  '## [관측] ' + $kstLabel + ' KST — 집중 감시 16:00–22:00 · 22:00 자동보고'
  ''
  '- **focus**: ArcCore economy · RED planet dev automation · memory leak / abnormal occupation'
  '- watch-30m PID **' + $watchPid + '** report-watch **' + $reportPid + '** auto-fix=' + $autoFix
  '- mem-monitor: **' + $memStatus + '** (' + $memLine + ')'
  '- report: ' + $reportFile
  '- latest: tools/long-run-monitor/logs/DAILY_10PM_REPORT_LATEST.md'
  '- timeline marker: ' + $TimelineMarker
  '- incidents actionable: ' + $actionable.Count
  $actionLines
  '- rec: ' + $rec
  ''
  ('> status: ' + $statusLine + ' · 22:00 KST intensive report done')
  ''
) -join [Environment]::NewLine

if (Test-Path $handoff) {
  $content = Get-Content $handoff -Raw -Encoding utf8
  $content = $handoffBlock + $content
  Set-Content -Path $handoff -Value $content -Encoding utf8
  Log 'handoff updated'
}

$reportBody = Get-Content $reportFile -Raw -Encoding utf8
$genTime = $kst.ToString($dateFmt)
$nl = [Environment]::NewLine
$chatHeader = '# CHAT_REPORT_PENDING - 22:00 KST intensive watch (16:00–22:00)' + $nl + $nl +
  'Generated: ' + $genTime + ' KST' + $nl +
  'Report: ' + $reportFile + $nl + $nl + '---' + $nl + $nl
Set-Content -Path $chatPending -Value ($chatHeader + $reportBody) -Encoding utf8

$stamp = Get-Date -Format $dateFmt
Add-Content -Path $incidentsPath -Value ('[' + $stamp + '] EVENING_WATCH_10PM_INTENSIVE_REPORT_READY ' + $reportFile)
Log ('DONE report=' + $reportFile + ' chat_pending=updated')
