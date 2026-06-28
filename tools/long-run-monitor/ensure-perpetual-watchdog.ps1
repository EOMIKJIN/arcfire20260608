# 영구 워치독 멱등 기동 — Cursor 세션·Windows 로그온·5분 백업 스케줄 공통
param(
  [switch]$ForceRestart
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$disableFlag = Join-Path $logDir 'perpetual-detection-DISABLED.flag'
$pidFile = Join-Path $logDir 'perpetual-watchdog.pid'
$runner = Join-Path $ScriptRoot 'run-perpetual-detection-watchdog.ps1'
$ensureLog = Join-Path $logDir 'perpetual-watchdog-ensure.log'

function Log([string]$msg) {
  $line = '[' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '] ' + $msg
  Write-Output $line
  try { Add-Content -Path $ensureLog -Value $line -Encoding utf8 } catch {}
}

function Test-ProcAlive([int]$id) {
  if ($id -le 0) { return $false }
  try { return $null -ne (Get-Process -Id $id -ErrorAction SilentlyContinue) } catch { return $false }
}

if (Test-Path $disableFlag) {
  Log 'ENSURE_SKIP perpetual-detection-DISABLED.flag'
  exit 0
}

$existing = 0
if (Test-Path $pidFile) {
  [void][int]::TryParse((Get-Content $pidFile -Raw).Trim(), [ref]$existing)
}

if ((Test-ProcAlive $existing) -and -not $ForceRestart) {
  Log "ENSURE_OK watchdog pid=$existing"
  exit 0
}

if ($ForceRestart -and (Test-ProcAlive $existing)) {
  Stop-Process -Id $existing -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 1
}

$proc = Start-Process -WindowStyle Hidden -PassThru -FilePath 'powershell.exe' -ArgumentList @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden',
  '-File', $runner
)
Start-Sleep -Seconds 2
if (Test-ProcAlive $proc.Id) {
  Set-Content -Path $pidFile -Value $proc.Id -Encoding ascii
  Log "ENSURE_STARTED watchdog pid=$($proc.Id)"
} else {
  Log 'ENSURE_FAIL watchdog died immediately'
  exit 1
}
