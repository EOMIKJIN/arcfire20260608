# Release soak watch until target local time — 10min samples + final report
param(
  [string]$EndLocal = '2026-06-25 18:00:00',
  [string]$TimelineMarker = 'RELEASE_SOAK_UNTIL_18H_20260625',
  [string]$Package = 'com.arcfire.online'
)

$ErrorActionPreference = 'Continue'

$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$endAt = Get-Date $EndLocal
$endTag = $endAt.ToString('yyyy-MM-dd-HHmm')
$reportPath = Join-Path $logDir "release-soak-final-report-$endTag.md"
$samplerPath = Join-Path $logDir 'release-soak-until-18h-samples.csv'

if (-not (Test-Path $samplerPath)) {
  'ts_local,pid,pss_mb,gl_mb,views,note' | Set-Content -Path $samplerPath -Encoding utf8
}

$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
Add-Content -Path (Join-Path $logDir 'incidents.log') -Value "[$stamp] PLAYTEST_MILESTONE release_soak_watch_until marker=$TimelineMarker end=$EndLocal"
Add-Content -Path (Join-Path $logDir 'mem-timeline.csv') -Value "$stamp,,,,,,,,,,,,$TimelineMarker" -Encoding utf8

Write-Output "release-soak-watch: sample every 10m until $EndLocal"

while ((Get-Date) -lt $endAt) {
  $pidApp = (adb shell "pidof $Package" 2>$null).ToString().Trim()
  $pss = ''
  $gl = ''
  $views = ''
  if ($pidApp) {
    $raw = adb shell dumpsys meminfo $Package 2>&1 | Out-String
    if ($raw -match 'TOTAL PSS:\s+(\d+)') { $pss = [math]::Round([int]$Matches[1] / 1024, 1) }
    if ($raw -match '(?m)^\s*GL mtrack\s+(\d+)') { $gl = [math]::Round([int]$Matches[1] / 1024, 1) }
    if ($raw -match 'Views:\s+(\d+)') { $views = $Matches[1] }
  }
  $now = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  Add-Content -Path $samplerPath -Value "$now,$pidApp,$pss,$gl,$views,sample" -Encoding utf8
  $remain = [math]::Round(($endAt - (Get-Date)).TotalMinutes, 0)
  Write-Output "[$(Get-Date -Format 'HH:mm:ss')] remain=${remain}m pid=$pidApp pss=$pss gl=$gl views=$views"

  if ((Get-Date).AddMinutes(10) -ge $endAt) { break }
  Start-Sleep -Seconds 600
}

& (Join-Path $ScriptRoot 'audit-idle-hub-floor.ps1') -LogDir $logDir | Out-Null
& (Join-Path $ScriptRoot 'run-overnight-final-report.ps1') `
  -ReportPath $reportPath `
  -TimelineMarker $TimelineMarker `
  -ReportTitle "Arcfire release soak final report until $EndLocal"

Write-Output "DONE report=$reportPath samples=$samplerPath"
