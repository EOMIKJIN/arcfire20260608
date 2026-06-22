# 접전/행성점유 ReactNativeJS 로그 캡처 (3h 감시 보조)
param(
  [string]$Package = 'com.arcfire.online'
)

$logDir = Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$outLog = Join-Path $logDir "territorial-pass-$ts.log"
$pidFile = Join-Path $logDir 'territorial-logcat.pid'

$proc = Start-Process -WindowStyle Hidden -PassThru -FilePath 'powershell' -ArgumentList @(
  '-NoProfile', '-Command',
  @"
`$ErrorActionPreference='SilentlyContinue'
adb logcat -v threadtime ReactNativeJS:I ReactNativeJS:W ReactNativeJS:E *:S |
  ForEach-Object { if (`$_ -match 'territorial|Territorial|점유|occupier|applyArcCoreTerritorial') { Add-Content -Path '$outLog' -Value `$_ -Encoding utf8 } }
"@
)

Set-Content -Path $pidFile -Value $proc.Id -Encoding ascii
Write-Output "territorial_logcat_pid=$($proc.Id)"
Write-Output "territorial_log=$outLog"
