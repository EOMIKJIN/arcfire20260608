# Arcfire long-run watch — meminfo + crash + incident log (앱 재실행/Metro reload: 사용자 수동)
$logDir = Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$crashLog = Join-Path $logDir "crash-$ts.log"

adb logcat -c 2>$null | Out-Null

Start-Process -WindowStyle Hidden -FilePath 'adb' -ArgumentList @(
  'logcat', '-v', 'threadtime',
  'AndroidRuntime:E', 'ReactNativeJS:E', 'ReactNativeJS:W',
  'libc:E', 'DEBUG:E', 'ActivityManager:I',
  '*:S'
) -RedirectStandardOutput $crashLog

Start-Process -WindowStyle Hidden -FilePath 'powershell' -ArgumentList @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', (Join-Path $PSScriptRoot 'run-monitor.ps1'),
  '-IntervalMin', '10'
)

Write-Output "crash=$crashLog"
Write-Output "timeline=$logDir\mem-timeline.csv"
Write-Output "alerts=$logDir\mem-alerts.log"
Write-Output "incidents=$logDir\incidents.log"
Write-Output "remediation=$logDir\remediation.log"
Write-Output "app_restart=manual"
