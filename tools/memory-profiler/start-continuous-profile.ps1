# 상시 메모리 프로파일링 — ensure-always-on-watch-stack 멱등 위임 (watch 중복 기동 방지)
param(
  [string]$Package = 'com.arcfire.online',
  [int]$MonitorIntervalMin = 30,
  [int]$RetentionAuditEveryMin = 60
)

$ErrorActionPreference = 'Continue'
$longRun = Join-Path (Split-Path $PSScriptRoot -Parent) 'long-run-monitor'
& (Join-Path $longRun 'ensure-always-on-watch-stack.ps1') `
  -Package $Package `
  -IntervalMin $MonitorIntervalMin `
  -RetentionAuditEveryMin $RetentionAuditEveryMin
Write-Output "memory_profiler_watch=ensure-always-on-watch-stack"
Write-Output "retention_report=$(Join-Path $PSScriptRoot 'reports\latest-retention-audit.md')"
