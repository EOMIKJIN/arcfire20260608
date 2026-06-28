# Arcfire report-watch — visible 콘솔 (김경제 모니터와 동일 경로)
param(
  [string]$Package = 'com.arcfire.online',
  [int]$IntervalMin = 10,
  [switch]$RestartExisting
)

$args = @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', (Join-Path $PSScriptRoot 'start-kim-economy-monitor-console.ps1'),
  '-Package', $Package,
  '-ReportIntervalMin', "$IntervalMin"
)
if ($RestartExisting) { $args += '-RestartExisting' }

& powershell.exe @args
