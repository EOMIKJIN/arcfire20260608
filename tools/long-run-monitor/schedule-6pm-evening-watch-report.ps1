# 18:00 KST evening watch report scheduler
param(
  [string]$Package = 'com.arcfire.online',
  [string]$TargetTime = '18:00',
  [string]$TimelineMarker = 'EVENING_WATCH_6PM_START'
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$Root = Split-Path $ScriptRoot -Parent | Split-Path -Parent
$handoff = Join-Path $Root 'tools\kim-team-lead\reports\kim-economy-handoff.md'
$scheduleLog = Join-Path $logDir 'schedule-6pm-report.log'
$latestSummary = Join-Path $logDir 'DAILY_6PM_REPORT_LATEST.md'
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
$tlMarkerLine = (Get-KstNow).ToString($dateFmt) + ',,,,,,,,,,,,EVENING_WATCH_6PM_START'
try { Add-Content -Path (Join-Path $logDir 'mem-timeline.csv') -Value $tlMarkerLine -Encoding utf8 } catch {}
Wait-UntilKstTime $TargetTime

$kst = Get-KstNow
$reportFile = Join-Path $logDir ('evening-watch-report-' + $kst.ToString($dateFile) + '.md')

Log ('generating comprehensive report -> ' + $reportFile)
$reportFile = & (Join-Path $ScriptRoot 'run-evening-6pm-comprehensive-report.ps1') `
  -Package $Package `
  -ReportPath $reportFile `
  -TimelineMarker $TimelineMarker `
  -ReportTitle 'Arcfire evening watch 18:00 KST comprehensive report'

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
  $incidentTail = @(Get-Content $incidentsPath -Tail 15 -ErrorAction SilentlyContinue)
}
$actionable = @($incidentTail | Where-Object {
  $_ -match 'GL_SPIKE|PROCESS_DEATH|HARD|PSS_SOFT|baseline_gl|ABNORMAL|FATAL|EVENING_WATCH|PID_CHANGE'
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
  'CRITICAL' { $rec = 'PSS>=950 hub exit Skia dispose P0' }
  'WARN' { $rec = 'PSS 850+ native floor soft reclaim watch' }
  'WARN_VIEWS' { $rec = 'Views 450+ cold restart SUB-STAGE soak' }
  default { $rec = 'evening soak OK retention snapshot + release soak' }
}

$autoFix = if ($paused) { 'OFF(record-only)' } else { 'ON' }
$statusLine = if ($memStatus -eq 'CRITICAL') { 'ready-for-team-lead-action' } else { 'monitor-ok' }

$kstLabel = $kst.ToString($dateShort)
$handoffBlock = @(
  '## [obs] ' + $kstLabel + ' KST evening watch 18:00 report'
  ''
  '- watch-30m PID **' + $watchPid + '** report-watch **' + $reportPid + '** auto-fix=' + $autoFix
  '- mem-monitor: **' + $memStatus + '** (' + $memLine + ')'
  '- report: ' + $reportFile
  '- latest: tools/long-run-monitor/logs/DAILY_6PM_REPORT_LATEST.md'
  '- timeline marker: ' + $TimelineMarker
  '- incidents actionable: ' + $actionable.Count
  $actionLines
  '- rec: ' + $rec
  '- future dev: see report section 7'
  ''
  ('> status: ' + $statusLine + ' 18:00 KST report done')
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
$chatHeader = '# CHAT_REPORT_PENDING - 18:00 KST evening watch' + $nl + $nl +
  'Generated: ' + $genTime + ' KST' + $nl +
  'Report: ' + $reportFile + $nl + $nl + '---' + $nl + $nl
Set-Content -Path $chatPending -Value ($chatHeader + $reportBody) -Encoding utf8

$stamp = Get-Date -Format $dateFmt
Add-Content -Path $incidentsPath -Value ('[' + $stamp + '] EVENING_WATCH_6PM_REPORT_READY ' + $reportFile)
Log ('DONE report=' + $reportFile + ' chat_pending=updated')
