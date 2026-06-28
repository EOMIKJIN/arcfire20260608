# 김경제 에이전트 — 사용자용 모니터링 콘솔 (report-watch visible 단일 인스턴스)
param(
  [string]$Package = 'com.arcfire.online',
  [int]$WatchIntervalMin = 15,
  [int]$ReportIntervalMin = 10,
  [switch]$RestartExisting,
  [switch]$SkipBackendEnsure
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$consolePidFile = Join-Path $logDir 'kim-economy-console.pid'
$reportPidFile = Join-Path $logDir 'report-watch.pid'
$modeFile = Join-Path $logDir 'report-watch-mode.txt'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Test-ProcAlive([int]$id) {
  if ($id -le 0) { return $false }
  try { return $null -ne (Get-Process -Id $id -ErrorAction SilentlyContinue) } catch { return $false }
}

function Read-PidFile([string]$path) {
  if (-not (Test-Path $path)) { return 0 }
  $id = 0
  [void][int]::TryParse((Get-Content $path -Raw -ErrorAction SilentlyContinue).Trim(), [ref]$id)
  return $id
}

function Stop-PidIfAlive([int]$id) {
  if (-not (Test-ProcAlive $id)) { return }
  Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 1
}

$existingConsole = Read-PidFile $consolePidFile
if ((Test-ProcAlive $existingConsole) -and -not $RestartExisting) {
  Write-Output "kim_economy_console=already pid=$existingConsole"
  exit 0
}

if (-not $SkipBackendEnsure) {
  $node = (Get-Command node -ErrorAction SilentlyContinue).Source
  if ($node) {
    $ensureCjs = Join-Path $ScriptRoot 'ensure-perpetual-watchdog.cjs'
    if (Test-Path $ensureCjs) {
      & $node $ensureCjs 2>&1 | Out-Null
    }
  }
  & (Join-Path $ScriptRoot 'ensure-always-on-watch-stack.ps1') `
    -Package $Package `
    -IntervalMin $WatchIntervalMin `
    -ReportWatchMin $ReportIntervalMin `
    -SkipReportWatch | ForEach-Object { Write-Output $_ }
}

# hidden report-watch 종료 (visible로 대체)
$hiddenId = Read-PidFile $reportPidFile
if ($hiddenId -gt 0 -and $hiddenId -ne $existingConsole) {
  Stop-PidIfAlive $hiddenId
}
Stop-PidIfAlive $existingConsole
Remove-Item $reportPidFile -Force -ErrorAction SilentlyContinue
Remove-Item $consolePidFile -Force -ErrorAction SilentlyContinue

$reportScript = (Join-Path $ScriptRoot 'report-watch.ps1').Replace("'", "''")
$console = Start-Process -WindowStyle Normal -PassThru -FilePath 'powershell.exe' -ArgumentList @(
  '-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-Command',
  @"
`$Host.UI.RawUI.WindowTitle = 'Arcfire Kim Economy Monitor'
Write-Host '=== Arcfire Kim Economy Monitor ===' -ForegroundColor Cyan
Write-Host 'pkg=$Package · report=${ReportIntervalMin}m · watch=${WatchIntervalMin}m (hidden backend)' -ForegroundColor DarkGray
Write-Host 'Close this window to stop heartbeat (hidden resumes on next watchdog cycle).' -ForegroundColor DarkGray
Write-Host ''
& '$reportScript' -Package '$Package' -IntervalMin $ReportIntervalMin
"@
)

Set-Content -Path $consolePidFile -Value $console.Id -Encoding ascii
Set-Content -Path $reportPidFile -Value $console.Id -Encoding ascii
Set-Content -Path $modeFile -Value 'visible' -Encoding ascii
Write-Output "kim_economy_console_pid=$($console.Id)"
Write-Output "report-watch=visible-console pid=$($console.Id)"
Write-Output "report_interval_min=$ReportIntervalMin"
Write-Output "watch_interval_min=$WatchIntervalMin (hidden)"
