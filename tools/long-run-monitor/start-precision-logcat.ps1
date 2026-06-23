# 정밀 크래시·worklet·Reanimated logcat (플레이테스트 전용)
# 표준 crash-*.log 보다 넓은 ReactNativeJS:W + DEBUG backtrace 포함
param(
  [string]$Package = 'com.arcfire.online',
  [switch]$ClearLogcat
)

$logDir = Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$outLog = Join-Path $logDir "precision-playtest-$ts.log"
$pidFile = Join-Path $logDir 'precision-logcat.pid'

if ($ClearLogcat) {
  adb logcat -c 2>$null | Out-Null
}

$proc = Start-Process -WindowStyle Hidden -PassThru -FilePath 'adb' -ArgumentList @(
  'logcat', '-v', 'threadtime',
  'AndroidRuntime:E', 'ReactNativeJS:E', 'ReactNativeJS:W',
  'libc:E', 'DEBUG:E', 'DEBUG:F',
  'ActivityManager:I', 'ActivityManager:W',
  '*:S'
) -RedirectStandardOutput $outLog

Set-Content -Path $pidFile -Value $proc.Id -Encoding ascii
Write-Output "precision_logcat_pid=$($proc.Id)"
Write-Output "precision_log=$outLog"
Write-Output "package=$Package"
