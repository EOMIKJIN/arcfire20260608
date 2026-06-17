# Arcfire long-run watch — 30분 간격 meminfo + crash (앱 재시작: 사용자 수동)
param(
  [string]$Package = 'com.arcfire.online',
  [int]$IntervalMin = 30
)

$logDir = Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$crashLog = Join-Path $logDir "crash-$ts.log"
$pidFile = Join-Path $logDir 'watch-30m.pid'

adb logcat -c 2>$null | Out-Null

Start-Process -WindowStyle Hidden -FilePath 'adb' -ArgumentList @(
  'logcat', '-v', 'threadtime',
  'AndroidRuntime:E', 'ReactNativeJS:E', 'ReactNativeJS:W',
  'libc:E', 'DEBUG:E', 'ActivityManager:I',
  '*:S'
) -RedirectStandardOutput $crashLog

$mon = Start-Process -WindowStyle Hidden -PassThru -FilePath 'powershell' -ArgumentList @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', (Join-Path $PSScriptRoot 'run-monitor.ps1'),
  '-Package', $Package,
  '-IntervalMin', "$IntervalMin"
)

Set-Content -Path $pidFile -Value $mon.Id -Encoding ascii

Write-Output "monitor_pid=$($mon.Id)"
Write-Output "interval_min=$IntervalMin"
Write-Output "crash=$crashLog"
Write-Output "timeline=$logDir\mem-timeline.csv"
Write-Output "alerts=$logDir\mem-alerts.log"
Write-Output "incidents=$logDir\incidents.log"
Write-Output "refix_flag=$logDir\gl-leak-refix-requested.flag"
Write-Output "remediation=$logDir\remediation.log"
Write-Output "auto_fix=apply-auto-remediation.ps1 (leak signature / crash -> audit + app relaunch)"
Write-Output "app_restart=auto on real leak(3x spike·baseline drift) or hard-ceiling(GL>=200MB·PSS>=950MB); stable combat footprint held (v2.1)"
