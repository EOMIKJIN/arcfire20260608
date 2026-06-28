# retention audit loop only — 별도 adb logcat 금지(앱 부하·중복 방지). MEM_PROFILE은 watch crash logcat 통합.
param(
  [int]$RetentionAuditEveryMin = 60
)

$ErrorActionPreference = 'Continue'
. (Join-Path (Split-Path $PSScriptRoot -Parent) 'long-run-monitor\monitor-host-budget.ps1')

$RetentionAuditEveryMin = Enforce-MonitorIntervalFloor -IntervalMin $RetentionAuditEveryMin -FloorMin $script:MONITOR_MIN_RETENTION_INTERVAL_MIN

$longRun = Join-Path (Split-Path $PSScriptRoot -Parent) 'long-run-monitor'
$logDir = Join-Path $longRun 'logs'
$stateFile = Join-Path $logDir 'memory-profiler-watch.json'
$legacyPidFile = Join-Path $logDir 'memory-profiler-watch.pid'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot 'reports') | Out-Null

function Test-ProcAlive([int]$id) {
  if ($id -le 0) { return $false }
  try { return $null -ne (Get-Process -Id $id -ErrorAction SilentlyContinue) } catch { return $false }
}

function Read-State {
  foreach ($path in @($stateFile, $legacyPidFile)) {
    if (-not (Test-Path $path)) { continue }
    try {
      $raw = Get-Content $path -Raw | ConvertFrom-Json
      if ($raw.auditPid) { return $raw }
    } catch { }
  }
  return $null
}

$state = Read-State
if ($state -and (Test-ProcAlive ([int]$state.auditPid))) {
  Write-Output "profiler_extras=already audit_pid=$($state.auditPid) logcat=shared_crash_log"
  exit 0
}

$latestCrash = Get-ChildItem -Path $logDir -Filter 'crash-*.log' -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
$profileLogcat = if ($latestCrash) { $latestCrash.FullName } else { '' }

$auditScript = Join-Path $PSScriptRoot 'run-retention-audit-loop.ps1'
$audit = Start-Process -WindowStyle Hidden -PassThru -FilePath 'powershell' -ArgumentList @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', $auditScript,
  '-RetentionAuditEveryMin', "$RetentionAuditEveryMin",
  '-ProfileLogcat', $profileLogcat
)

$newState = @{
  startedAt = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
  profileLogcat = $profileLogcat
  logcatPid = 0
  auditPid = $audit.Id
  retentionEveryMin = $RetentionAuditEveryMin
  role = 'retention-audit-only-no-extra-logcat'
}
$newState | ConvertTo-Json | Set-Content -Path $stateFile -Encoding utf8
$newState | ConvertTo-Json | Set-Content -Path $legacyPidFile -Encoding utf8

Write-Output 'profiler_extras=started'
Write-Output "mem_profile_source=$profileLogcat"
Write-Output "audit_loop_pid=$($audit.Id)"
