# Windows 작업 스케줄러 — PC 로그온 시 워치독 1회 부트 (5분 주기는 워치독 내부 루프가 담당)
# 콘솔 깜빡임 방지: wscript + run-node-hidden.vbs
param(
  [switch]$Unregister
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent | Split-Path -Parent
$ensureScript = Join-Path $PSScriptRoot 'ensure-perpetual-watchdog.cjs'
$hiddenRunner = Join-Path $PSScriptRoot 'run-node-hidden.vbs'
$taskName = 'ArcfirePerpetualDetection'
$logFile = Join-Path $PSScriptRoot 'logs\perpetual-task-register.log'

function Log([string]$msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Write-Output $line
  try { Add-Content -Path $logFile -Value $line -Encoding utf8 } catch {}
}

function Invoke-HiddenNode([string]$nodeExe, [string]$scriptPath) {
  & wscript.exe //B $hiddenRunner $nodeExe $scriptPath
}

if ($Unregister) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
  Log "UNREGISTERED $taskName"
  exit 0
}

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
  Log 'REGISTER_FAIL node not in PATH'
  exit 1
}

if (-not (Test-Path $hiddenRunner)) {
  Log "REGISTER_FAIL missing $hiddenRunner"
  exit 1
}

$wscriptArgs = "//B `"$hiddenRunner`" `"$node`" `"$ensureScript`""
$action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument $wscriptArgs -WorkingDirectory $Root

# 로그온 1회만 — 5분 ensure는 run-perpetual-detection-watchdog.ps1 내부 루프 (중복 node 깜빡임 제거)
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -RestartCount 5 `
  -RestartInterval (New-TimeSpan -Minutes 2) `
  -ExecutionTimeLimit ([TimeSpan]::Zero)

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger @($triggerLogon) `
  -Settings $settings `
  -Description 'Arcfire watchdog bootstrap at logon (hidden). Periodic ensure = perpetual watchdog loop.' `
  -RunLevel Limited | Out-Null

Log "REGISTERED $taskName logon-only hidden -> $ensureScript"
Invoke-HiddenNode $node $ensureScript
Log 'ENSURE immediate after register (hidden)'
