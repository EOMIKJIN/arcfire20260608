# Release build soak — wait N hours (KST wall clock) then write final report
param(
  [int]$DurationHours = 4,
  [string]$TimelineMarker = 'RELEASE_BUILD_WATCH_START_2026-06-23',
  [string]$ReportPath = ''
)

function Get-KstNow {
  return (Get-Date).ToUniversalTime().AddHours(9)
}

$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
if (-not $ReportPath) {
  $dateTag = (Get-KstNow).ToString('yyyy-MM-dd')
  $ReportPath = Join-Path $logDir "release-build-watch-report-$dateTag.md"
}

$targetKst = (Get-KstNow).AddHours($DurationHours)
$waitSec = [int](($targetKst - (Get-KstNow)).TotalSeconds)
if ($waitSec -gt 0) {
  Write-Output "Waiting ${waitSec}s until KST $($targetKst.ToString('yyyy-MM-dd HH:mm:ss')) ..."
  Start-Sleep -Seconds $waitSec
}

& (Join-Path $ScriptRoot 'run-overnight-final-report.ps1') `
  -ReportPath $ReportPath `
  -TimelineMarker $TimelineMarker `
  -ReportTitle 'Arcfire release build watch — 4h report (KST)'

Write-Output "Release build watch report complete (KST $(Get-KstNow -Format 'yyyy-MM-dd HH:mm:ss'))"
