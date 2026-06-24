# 상시 메모리 프로파일링 — 30m watch + MEM_PROFILE logcat + retention audit 주기
param(
  [string]$Package = 'com.arcfire.online',
  [int]$MonitorIntervalMin = 30,
  [int]$RetentionAuditEveryMin = 60
)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$longRun = Join-Path $root 'long-run-monitor'
$logDir = Join-Path $longRun 'logs'
$pidFile = Join-Path $logDir 'memory-profiler-watch.pid'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot 'reports') | Out-Null

# 기존 김경제 30m watch (mem-timeline + crash logcat)
& (Join-Path $longRun 'start-watch-30m.ps1') -Package $Package -IntervalMin $MonitorIntervalMin

$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$profileLogcat = Join-Path $logDir "mem-profile-$ts.log"

# ReactNativeJS I — [MEM_PROFILE] 전용 logcat (Hermes heap 마커)
Start-Process -WindowStyle Hidden -FilePath 'adb' -ArgumentList @(
  'logcat', '-v', 'threadtime',
  'ReactNativeJS:I', '*:S'
) -RedirectStandardOutput $profileLogcat

# retention audit loop
$auditScript = Join-Path $PSScriptRoot 'run-retention-audit-loop.ps1'
$audit = Start-Process -WindowStyle Hidden -PassThru -FilePath 'powershell' -ArgumentList @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', $auditScript,
  '-RetentionAuditEveryMin', "$RetentionAuditEveryMin",
  '-ProfileLogcat', $profileLogcat
)

$state = @{
  startedAt = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
  profileLogcat = $profileLogcat
  auditPid = $audit.Id
  package = $Package
}
$state | ConvertTo-Json | Set-Content -Path $pidFile -Encoding utf8

Write-Output "memory_profiler_watch=started"
Write-Output "profile_logcat=$profileLogcat"
Write-Output "audit_loop_pid=$($audit.Id)"
Write-Output "retention_report=$(Join-Path $PSScriptRoot 'reports\latest-retention-audit.md')"
Write-Output "kim_economy: npm run profile:mem:retention (수동) · audit every ${RetentionAuditEveryMin}m"
