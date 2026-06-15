# ArcCore 경제·밸런스 3시간 주기 감사 루프
param(
  [int]$IntervalHours = 3
)

$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$logDir = Join-Path $PSScriptRoot 'reports'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$pidFile = Join-Path $logDir 'watch-3h.pid'
$logFile = Join-Path $logDir 'watch-3h.log'

$intervalSec = $IntervalHours * 3600

function Write-Log([string]$msg) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
  Add-Content -Path $logFile -Value $line -Encoding utf8
  Write-Output $line
}

Write-Log "balance-ops watch start interval=${IntervalHours}h"

while ($true) {
  Write-Log 'audit:start npm run audit:balance-ops (balance + planet economy 3h)'
  $proc = Start-Process -FilePath 'npm' -ArgumentList @('run', 'audit:balance-ops') `
    -WorkingDirectory $root -NoNewWindow -Wait -PassThru -RedirectStandardOutput "$logDir\audit-last.stdout" `
    -RedirectStandardError "$logDir\audit-last.stderr"
  $exit = $proc.ExitCode
  Write-Log "audit:done exit=$exit report=reports/latest.md"
  Start-Sleep -Seconds $intervalSec
}
