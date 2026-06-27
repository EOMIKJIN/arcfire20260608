# 데일리 08:00 KST 상시 보고 스케줄러 — 멱등 가동 (Cursor 세션·김경제 공통)
param(
  [switch]$ForceRestart
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$disableFlag = Join-Path $logDir 'schedule-8am-report-DISABLED.flag'
$pidFile = Join-Path $logDir 'schedule-8am-perpetual.pid'
$scheduler = Join-Path $ScriptRoot 'schedule-8am-kim-daily-auto-report.cjs'
$scheduleLog = Join-Path $logDir 'schedule-8am-report.log'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Log([string]$msg) {
  $line = '[' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '] ' + $msg
  Write-Output $line
  try { Add-Content -Path $scheduleLog -Value $line -Encoding utf8 } catch {}
}

function Test-ProcAlive([int]$id) {
  if ($id -le 0) { return $false }
  try { return $null -ne (Get-Process -Id $id -ErrorAction SilentlyContinue) } catch { return $false }
}

if (Test-Path $disableFlag) {
  Log 'ENSURE_SKIP DISABLED flag present — daily 8am report explicitly stopped'
  exit 0
}

$existing = 0
if (Test-Path $pidFile) {
  $raw = (Get-Content $pidFile -Raw -ErrorAction SilentlyContinue).Trim()
  [void][int]::TryParse($raw, [ref]$existing)
}

if ((Test-ProcAlive $existing) -and -not $ForceRestart) {
  Log "ENSURE_OK pid=$existing (already running)"
  exit 0
}

if ($ForceRestart -and (Test-ProcAlive $existing)) {
  Stop-Process -Id $existing -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 1
}

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
  Log 'ENSURE_FAIL node not found in PATH'
  exit 1
}

$proc = Start-Process -WindowStyle Hidden -PassThru -FilePath $node -ArgumentList @($scheduler)
Start-Sleep -Seconds 2
if (Test-ProcAlive $proc.Id) {
  Set-Content -Path $pidFile -Value $proc.Id -Encoding ascii
  Log "ENSURE_STARTED pid=$($proc.Id) script=$scheduler"
} else {
  Log 'ENSURE_FAIL scheduler process died immediately'
  exit 1
}
