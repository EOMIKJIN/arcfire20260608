# 3-hour state watch — baseline + incident poll + scheduled markdown report (KST)
param(
  [string]$Package = 'com.arcfire.online',
  [int]$DurationHours = 3,
  [int]$PollMin = 5
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

. (Join-Path $ScriptRoot 'watch-alert-filters.ps1')

$startKst = (Get-Date).ToUniversalTime().AddHours(9)
$endKst = $startKst.AddHours($DurationHours)
$marker = "STATE_WATCH_3H_START $($startKst.ToString('yyyy-MM-dd HH:mm:ss')) KST"
$markerFile = Join-Path $logDir 'state-watch-3h-start.json'
$briefFile = Join-Path $logDir 'STATE_WATCH_3H_BRIEF.md'
$reportFile = Join-Path $logDir "state-watch-3h-report-$($startKst.ToString('yyyyMMdd-HHmm')).md"
$watchLog = Join-Path $logDir 'state-watch-3h.log'
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

# Baseline
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
} | ConvertTo-Json -Depth 3
Set-Content -Path $markerFile -Value $baseline -Encoding utf8
Add-Content -Path $incidentsLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $marker"

$briefText = @"
# 3-hour state watch brief

Start (KST): $($startKst.ToString('yyyy-MM-dd HH:mm:ss'))
End (KST): $($endKst.ToString('yyyy-MM-dd HH:mm:ss'))
App PID at start: $(if ($appPid) { $appPid } else { 'NOT_RUNNING' })

## Report inputs
- mem-timeline.csv
- incidents.log (lines after STATE_WATCH_3H_START)
- remediation.log / mem-alerts.log
- state-watch-3h-report-*.md (auto-generated)

## User
Say "report" in chat after ~3h or read state-watch-3h-report-*.md
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
    Log "ACTIONABLE incidents=$($actionable.Count) -> check-and-remediate"
    foreach ($ln in $actionable) { Log "  $ln" }
    try {
      & (Join-Path $ScriptRoot 'check-and-remediate.ps1') -LogDir $logDir -Package $Package 2>&1 | Out-Null
    } catch {
      Log "WARN check-and-remediate: $($_.Exception.Message)"
    }
  }

  $curPid = (adb shell "pidof $Package" 2>$null | Out-String).Trim()
  if (-not $curPid -and $appPid) {
    Log "WARN app not running (was pid=$appPid) -> remediate"
    try {
      & (Join-Path $ScriptRoot 'check-and-remediate.ps1') -LogDir $logDir -Package $Package 2>&1 | Out-Null
    } catch { }
  }
}

Log "GENERATING report -> $reportFile"
& (Join-Path $ScriptRoot 'run-overnight-final-report.ps1') `
  -Package $Package `
  -ReportPath $reportFile `
  -TimelineMarker 'STATE_WATCH_3H_START' `
  -ReportTitle "Arcfire 3h state watch report (KST)"

Log "DONE endKst=$($endKst.ToString('yyyy-MM-dd HH:mm:ss'))"
