# 오후 감시 재가동 — watch-30m + report-watch (김경제 · record-only 기본)
param(
  [string]$Package = 'com.arcfire.online',
  [int]$WatchIntervalMin = 30,
  [int]$ReportIntervalMin = 10,
  [switch]$EnableAutoRemediation
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$pauseFlag = Join-Path $logDir 'monitor-paused.flag'

function Test-ProcessAlive([int]$procId) {
  if ($procId -le 0) { return $false }
  try { return $null -ne (Get-Process -Id $procId -ErrorAction SilentlyContinue) } catch { return $false }
}

function Stop-PidFile([string]$pidPath, [string]$label) {
  if (-not (Test-Path $pidPath)) { return }
  $raw = (Get-Content $pidPath -Raw -ErrorAction SilentlyContinue).Trim()
  $old = 0
  [void][int]::TryParse($raw, [ref]$old)
  if (Test-ProcessAlive $old) {
    Write-Output "stop $label pid=$old"
    Stop-Process -Id $old -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
  }
  Remove-Item $pidPath -Force -ErrorAction SilentlyContinue
}

$dev = (adb devices 2>&1 | Select-String 'device$' | Select-Object -First 1)
if (-not $dev) {
  Write-Error 'No adb device — connect device and retry.'
  exit 1
}

Stop-PidFile (Join-Path $logDir 'watch-30m.pid') 'watch-30m'
Stop-PidFile (Join-Path $logDir 'report-watch.pid') 'report-watch'

if ($EnableAutoRemediation) {
  Remove-Item $pauseFlag -Force -ErrorAction SilentlyContinue
  Write-Output 'monitor-paused=OFF (auto-remediation enabled)'
} else {
  New-Item -ItemType File -Force -Path $pauseFlag | Out-Null
  Write-Output 'monitor-paused=ON (record-only · no force-stop)'
}

$kst = (Get-Date).ToUniversalTime().AddHours(9)
$marker = "AFTERNOON_WATCH_START $($kst.ToString('yyyy-MM-dd HH:mm:ss')) KST"
Add-Content -Path (Join-Path $logDir 'incidents.log') -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $marker"

& (Join-Path $ScriptRoot 'start-watch-30m.ps1') -Package $Package -IntervalMin $WatchIntervalMin

$report = Start-Process -WindowStyle Hidden -PassThru -FilePath 'powershell' -ArgumentList @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', (Join-Path $ScriptRoot 'report-watch.ps1'),
  '-Package', $Package,
  '-IntervalMin', "$ReportIntervalMin"
)
Set-Content -Path (Join-Path $logDir 'report-watch.pid') -Value $report.Id -Encoding ascii

Write-Output "report-watch_pid=$($report.Id)"
Write-Output "marker=$marker"
Write-Output "adb=$($dev.Line.Trim())"
