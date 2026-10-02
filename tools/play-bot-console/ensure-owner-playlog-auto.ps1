# 대표님 실기 자동 수집 데몬 — 멱등. start/stop 명령 불필요.
param([switch]$ForceRestart)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$disableFlag = Join-Path $logDir 'owner-playlog-auto-DISABLED.flag'
$pidFile = Join-Path $logDir 'playbot-owner-auto.pid'
$watcher = Join-Path $ScriptRoot 'watch-owner-playlog-auto.ts'
$scheduleLog = Join-Path $logDir 'owner-playlog-auto.log'

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
  Log 'OWNER_AUTO_SKIP DISABLED flag'
  exit 0
}

$existing = 0
if (Test-Path $pidFile) {
  $raw = (Get-Content $pidFile -Raw -ErrorAction SilentlyContinue).Trim()
  [void][int]::TryParse($raw, [ref]$existing)
}

if ((Test-ProcAlive $existing) -and -not $ForceRestart) {
  Log "OWNER_AUTO_OK pid=$existing"
  exit 0
}

if ($ForceRestart -and (Test-ProcAlive $existing)) {
  Stop-Process -Id $existing -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 1
}

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
  Log 'OWNER_AUTO_FAIL node not found'
  exit 1
}

$repo = (Resolve-Path (Join-Path $ScriptRoot '..\..')).Path
$cmd = Join-Path $env:SystemRoot 'System32\cmd.exe'
$proc = Start-Process -WindowStyle Hidden -PassThru -FilePath $cmd -WorkingDirectory $repo -ArgumentList @(
  '/d', '/c', "npx --yes tsx `"$watcher`""
)
Start-Sleep -Seconds 3
$filePid = 0
if (Test-Path $pidFile) {
  [void][int]::TryParse((Get-Content $pidFile -Raw -ErrorAction SilentlyContinue).Trim(), [ref]$filePid)
}
if (Test-ProcAlive $filePid) {
  Log "OWNER_AUTO_STARTED pid=$filePid"
  exit 0
}
if ($proc -and (Test-ProcAlive $proc.Id)) {
  Set-Content -Path $pidFile -Value $proc.Id -Encoding ascii
  Log "OWNER_AUTO_STARTED pid=$($proc.Id)"
  exit 0
}
Log 'OWNER_AUTO_FAIL process died'
exit 1
