# 5h 감시체제 — playtest record-only + 5h 상태보고 스케줄 (이동 크래시 테스트 전 soak)
param(
  [string]$Package = 'com.arcfire.online',
  [switch]$RestartExisting
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$kst = (Get-Date).ToUniversalTime().AddHours(9)
$reportAt = $kst.AddHours(5)

Write-Host "=== 5h movement-crash watch regime ==="
Write-Host "KST now: $($kst.ToString('yyyy-MM-dd HH:mm:ss'))"
Write-Host "Auto status report: $($reportAt.ToString('yyyy-MM-dd HH:mm:ss'))"
Write-Host ""

# Playtest stack (monitor-paused = record only)
$playArgs = @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', (Join-Path $ScriptRoot 'start-playtest-watch.ps1'),
  '-BuildNote', '5h soak + post-report worldmap/transit movement crash test 2026-06-26'
)
if ($RestartExisting) { $playArgs += '-RestartExisting' }
& powershell @playArgs
if ($LASTEXITCODE -ne 0 -and $null -ne $LASTEXITCODE) { exit $LASTEXITCODE }

# 5h state watch (background)
$statePidFile = Join-Path $logDir 'state-watch-5h.pid'
if (Test-Path $statePidFile) {
  $old = [int](Get-Content $statePidFile -Raw).Trim()
  if ($old -gt 0) {
    Stop-Process -Id $old -Force -ErrorAction SilentlyContinue
  }
}
$stateJob = Start-Process -WindowStyle Hidden -PassThru -FilePath 'powershell' -ArgumentList @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', (Join-Path $ScriptRoot 'run-5h-state-watch-report.ps1')
)
Set-Content -Path $statePidFile -Value $stateJob.Id -Encoding ascii

Write-Host ""
Write-Host "state_watch_pid=$($stateJob.Id)"
Write-Host "brief=$logDir\STATE_WATCH_5H_BRIEF.md"
Write-Host "report_at_kst=$($reportAt.ToString('yyyy-MM-dd HH:mm:ss'))"
Write-Host ""
Write-Host "After 5h: read state-watch-5h-report-*.md then run movement crash tests."
Write-Host "Milestone: powershell -File tools/long-run-monitor/tag-playtest-milestone.ps1 -Label worldmap_movement_crash_test"
