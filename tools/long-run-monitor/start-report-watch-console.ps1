# Arcfire report-watch — 사용자용 모니터링 콘솔 (별도 창)
param(
  [string]$Package = 'com.arcfire.online',
  [int]$IntervalMin = 10,
  [switch]$RestartExisting
)

$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$pidFile = Join-Path $logDir 'report-watch.pid'

if (Test-Path $pidFile) {
  $old = [int](Get-Content $pidFile -Raw).Trim()
  try {
    if ($null -ne (Get-Process -Id $old -ErrorAction SilentlyContinue)) {
      if (-not $RestartExisting) {
        Write-Warning "report-watch already running (pid=$old). Use -RestartExisting to replace."
        exit 0
      }
      Stop-Process -Id $old -Force -ErrorAction SilentlyContinue
    }
  } catch {}
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

$report = Start-Process -WindowStyle Normal -PassThru -FilePath 'powershell.exe' -ArgumentList @(
  '-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', (Join-Path $ScriptRoot 'report-watch.ps1'),
  '-Package', $Package,
  '-IntervalMin', "$IntervalMin"
)
Set-Content -Path $pidFile -Value $report.Id -Encoding ascii
Write-Output "report_watch_console_pid=$($report.Id) interval_min=$IntervalMin"
