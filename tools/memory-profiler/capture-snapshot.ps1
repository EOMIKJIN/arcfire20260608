# Heap-style snapshot — dumpsys meminfo + optional stage/event tag → JSON + profile-timeline.csv
param(
  [string]$Package = 'com.arcfire.online',
  [string]$Stage = 'unknown',
  [string]$Event = 'manual',
  [string]$Detail = '',
  [string]$OutDir = (Join-Path $PSScriptRoot 'reports\snapshots')
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lib\meminfo-metrics.ps1')

$logDir = Join-Path (Split-Path $PSScriptRoot -Parent) 'long-run-monitor\logs'
$profileCsv = Join-Path $PSScriptRoot 'reports\profile-timeline.csv'
$iso = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$snapshotId = Get-Date -Format 'yyyyMMdd-HHmmss-fff'

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot 'reports') | Out-Null

$appPid = (adb shell "pidof $Package" 2>$null).ToString().Trim()
if (-not $appPid) {
  Write-Host 'APP_NOT_RUNNING'
  exit 1
}

$raw = (adb shell dumpsys meminfo $Package 2>&1 | Out-String)
$met = Convert-ArcfireMemMetricsToMb (Parse-ArcfireMeminfoMetrics $raw)

$jsonPath = Join-Path $OutDir "$snapshotId.json"
$payload = [ordered]@{
  snapshotId = $snapshotId
  isoTime    = $iso
  pid        = $appPid
  package    = $Package
  stage      = $Stage
  event      = $Event
  detail     = $Detail
  metrics    = $met
}
$payload | ConvertTo-Json -Depth 5 | Set-Content -Path $jsonPath -Encoding utf8

$header = 'iso_time,snapshot_id,pid,stage,event,pss_mb,gl_mb,native_mb,java_mb,views,detail'
if (-not (Test-Path $profileCsv)) {
  Set-Content -Path $profileCsv -Value $header -Encoding utf8
}

$detailEsc = ($Detail -replace ',', ';')
$line = "$iso,$snapshotId,$appPid,$Stage,$Event,$($met.PssMb),$($met.GlMb),$($met.NativeMb),$($met.JavaMb),$($met.Views),$detailEsc"
Add-Content -Path $profileCsv -Value $line -Encoding utf8

# long-run mem-timeline 연동 (기존 김경제 30m watch)
$note = "PROFILE_SNAP stage=$Stage event=$Event id=$snapshotId"
& (Join-Path (Split-Path $PSScriptRoot -Parent) 'long-run-monitor\manual-mem-snapshot.ps1') -Package $Package -Note $note | Out-Null

Write-Output "snapshot=$jsonPath"
Write-Output $line
