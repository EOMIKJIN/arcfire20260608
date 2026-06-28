# report-watch 단일 인스턴스 — visible(김경제 콘솔) vs hidden 상호 배타
param(
  [string]$Package = 'com.arcfire.online',
  [int]$IntervalMin = 10,
  [switch]$ForceHidden
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$reportPidFile = Join-Path $logDir 'report-watch.pid'
$consolePidFile = Join-Path $logDir 'kim-economy-console.pid'
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

function Set-Mode([string]$mode, [int]$procId) {
  Set-Content -Path $modeFile -Value $mode -Encoding ascii
  Set-Content -Path $reportPidFile -Value $procId -Encoding ascii
}

function Clear-StalePidFile([string]$path) {
  $id = Read-PidFile $path
  if ($id -le 0) {
    Remove-Item $path -Force -ErrorAction SilentlyContinue
    return
  }
  if (-not (Test-ProcAlive $id)) {
    Remove-Item $path -Force -ErrorAction SilentlyContinue
  }
}

Clear-StalePidFile $reportPidFile
Clear-StalePidFile $consolePidFile

if (-not $ForceHidden) {
  $consoleId = Read-PidFile $consolePidFile
  if ((Test-ProcAlive $consoleId)) {
    Set-Mode 'visible' $consoleId
    Write-Output "report-watch=visible-console pid=$consoleId interval=${IntervalMin}m"
    exit 0
  }
  Remove-Item $consolePidFile -Force -ErrorAction SilentlyContinue
}

$existing = Read-PidFile $reportPidFile
if ((Test-ProcAlive $existing)) {
  $mode = 'hidden'
  if (Test-Path $modeFile) {
    $raw = (Get-Content $modeFile -Raw -ErrorAction SilentlyContinue).Trim()
    if ($raw) { $mode = $raw }
  }
  Write-Output "report-watch=already pid=$existing mode=$mode interval=${IntervalMin}m"
  exit 0
}

Remove-Item $reportPidFile -Force -ErrorAction SilentlyContinue

$proc = Start-Process -WindowStyle Hidden -PassThru -FilePath 'powershell.exe' -ArgumentList @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden',
  '-File', (Join-Path $ScriptRoot 'report-watch.ps1'),
  '-Package', $Package,
  '-IntervalMin', "$IntervalMin"
)
Set-Mode 'hidden' $proc.Id
Write-Output "report-watch=started pid=$($proc.Id) mode=hidden interval=${IntervalMin}m"
