# 5-hour state watch — baseline + incident poll + scheduled markdown report (KST)
# Phase 1: record-only soak · Phase 2 (after report): user movement/worldmap crash playtest
param(
  [string]$Package = 'com.arcfire.online',
  [int]$DurationHours = 5,
  [int]$PollMin = 5
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

. (Join-Path $ScriptRoot 'watch-alert-filters.ps1')

$startKst = (Get-Date).ToUniversalTime().AddHours(9)
$endKst = $startKst.AddHours($DurationHours)
$marker = "STATE_WATCH_5H_START $($startKst.ToString('yyyy-MM-dd HH:mm:ss')) KST"
$markerFile = Join-Path $logDir 'state-watch-5h-start.json'
$briefFile = Join-Path $logDir 'STATE_WATCH_5H_BRIEF.md'
$reportFile = Join-Path $logDir "state-watch-5h-report-$($startKst.ToString('yyyyMMdd-HHmm')).md"
$watchLog = Join-Path $logDir 'state-watch-5h.log'
$incidentsLog = Join-Path $logDir 'incidents.log'

function Log([string]$msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Write-Host $line
  try { Add-Content -Path $watchLog -Value $line -Encoding utf8 } catch {}
}

function Get-LineCount([string]$path) {
  if (-not (Test-Path $path)) { return 0 }
  try { return @(Get-Content -Path $path -ErrorAction SilentlyContinue).Count } catch { return 0 }
}

function Get-NewIncidentLines([int]$prevCount) {
  if (-not (Test-Path $incidentsLog)) { return @() }
  try {
    $all = @(Get-Content -Path $incidentsLog -ErrorAction SilentlyContinue)
    if ($all.Count -le $prevCount) { return @() }
    return @($all[$prevCount..($all.Count - 1)] | Where-Object { $_ -and $_.Trim().Length -gt 0 })
  } catch { return @() }
}

$appPid = (adb shell "pidof $Package" 2>$null | Out-String).Trim()
$timelineLines = Get-LineCount (Join-Path $logDir 'mem-timeline.csv')
$incidentLines = Get-LineCount $incidentsLog

$baseline = @{
  marker = $marker
  startKst = $startKst.ToString('yyyy-MM-dd HH:mm:ss')
  endKst = $endKst.ToString('yyyy-MM-dd HH:mm:ss')
  package = $Package
  appPid = $appPid
  timelineLineCount = $timelineLines
  incidentLineCount = $incidentLines
  phase2Focus = @(
    'planet_hub_departure_worldmap',
    'worldmap_transit_combat',
    'worldmap_landing_planet',
    'rapid_nav_tap_race'
  )
} | ConvertTo-Json -Depth 4
Set-Content -Path $markerFile -Value $baseline -Encoding utf8
Add-Content -Path $incidentsLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $marker"

$briefText = @"
# 5-hour state watch — movement crash prep (KST)

Start: $($startKst.ToString('yyyy-MM-dd HH:mm:ss'))
**Status report (auto):** $($endKst.ToString('yyyy-MM-dd HH:mm:ss'))
Phase 2: user playtest — worldmap / transit / landing crash scenarios **after** report

## Phase 1 (0–5h) — record-only soak
- ``monitor-paused.flag`` ON — 앱 강제 재시작 없음
- 10m meminfo → ``mem-timeline.csv``
- precision logcat + ``playtest-alerts.log``

## Phase 2 (5h+) — 이동 크래시 집중 테스트
1. 채팅에 **「테스트 시작」** 또는 milestone 태그
2. 권장 시나리오: 허브 출발→은하 이동→착륙·전투 조우→복귀 (연타 포함)
3. 마일스톤:
   ``powershell -File tools/long-run-monitor/tag-playtest-milestone.ps1 -Label worldmap_movement_crash_test``
4. 크래시 직후 logcat:
   ``adb logcat -d -t 3000 | findstr /i "FATAL SIGSEGV ShareableWorklet librnskia ReactNativeJS"``

## Report files
- ``state-watch-5h-report-*.md`` (auto ~5h)
- ``tools/long-run-monitor/logs/mem-timeline.csv``
- ``incidents.log`` / ``playtest-alerts.log``

## Chat
After ~5h say **「상태 보고」** or read ``state-watch-5h-report-*.md``
"@
Set-Content -Path $briefFile -Value $briefText -Encoding utf8

Log "START marker=$marker pid=$appPid report=$reportFile"

$prevIncidents = $incidentLines
$pollSec = [math]::Max(60, $PollMin * 60)
$deadline = (Get-Date).AddHours($DurationHours)

while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds $pollSec

  $newLines = @(Get-NewIncidentLines $prevIncidents)
  $prevIncidents = Get-LineCount $incidentsLog
  $actionable = @($newLines | Where-Object { Test-WatchActionableIncident $_ })

  if ($actionable.Count -gt 0) {
    Log "ACTIONABLE incidents=$($actionable.Count) (record-only; monitor-paused expected)"
    foreach ($ln in $actionable) { Log "  $ln" }
    if (-not (Test-Path (Join-Path $logDir 'monitor-paused.flag'))) {
      try {
        & (Join-Path $ScriptRoot 'check-and-remediate.ps1') -LogDir $logDir -Package $Package 2>&1 | Out-Null
      } catch {
        Log "WARN check-and-remediate: $($_.Exception.Message)"
      }
    }
  }

  $curPid = (adb shell "pidof $Package" 2>$null | Out-String).Trim()
  if (-not $curPid -and $appPid) {
    Log "WARN app not running (was pid=$appPid)"
  }
}

Log "GENERATING report -> $reportFile"
& (Join-Path $ScriptRoot 'run-overnight-final-report.ps1') `
  -Package $Package `
  -ReportPath $reportFile `
  -TimelineMarker 'STATE_WATCH_5H_START' `
  -ReportTitle "Arcfire 5h state watch report (KST) — pre movement-crash test"

Add-Content -Path $incidentsLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] STATE_WATCH_5H_REPORT_READY $reportFile"
Log "DONE endKst=$($endKst.ToString('yyyy-MM-dd HH:mm:ss')) report=$reportFile"
