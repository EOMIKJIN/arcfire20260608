# 플레이봇콘솔 — 창이 켜지면 봇 자동 시작. 창을 닫으면 기록 종료.
param(
  [string]$Persona = 'mixed_ref',
  [int]$Days = 0,
  [int]$Stage = 1,
  [int]$LiveMs = 120,
  [int]$Seed = 0,
  [string]$UntilWall = '',
  [switch]$RestartExisting,
  [switch]$Fast
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
. (Join-Path $ScriptRoot 'playbot-process.ps1')

$existing = Read-PlaybotPid 'playbot-console.pid'
if ((Test-PlaybotProcAlive $existing) -and -not $RestartExisting) {
  Write-Output "playbot_console=already pid=$existing"
  exit 0
}

Stop-PlaybotAll

if (-not $UntilWall) { $UntilWall = Get-PlaybotNextUntilWall }

$hostPs1 = Join-Path $ScriptRoot 'host-playbot-console.ps1'
$watchPs1 = Join-Path $ScriptRoot 'watch-playbot-console.ps1'
$psExe = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$conhost = Join-Path $env:SystemRoot 'System32\conhost.exe'
$hostArgs = @(
  '-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', $hostPs1,
  '-Persona', $Persona,
  '-Days', "$Days",
  '-Stage', "$Stage",
  '-LiveMs', "$LiveMs",
  '-Seed', "$Seed",
  '-UntilWall', $UntilWall
)
if ($Fast) { $hostArgs += '-Fast' }

# Win11 기본 터미널(Cascadia)은 한글이 다른 글꼴로 섞인다. conhost+굴림체 고정.
if (Test-Path $conhost) {
  $console = Start-Process -WindowStyle Normal -PassThru -FilePath $conhost -ArgumentList (@('--', $psExe) + $hostArgs)
} else {
  $console = Start-Process -WindowStyle Normal -PassThru -FilePath $psExe -ArgumentList $hostArgs
}

if (-not $console -or -not $console.Id) {
  Write-Output 'playbot_console=failed'
  exit 1
}

Write-PlaybotPid 'playbot-console.pid' $console.Id

$watch = Start-Process -WindowStyle Hidden -PassThru -FilePath 'powershell.exe' -ArgumentList @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', $watchPs1,
  '-ConsolePid', $console.Id
)
if ($watch -and $watch.Id) {
  Write-PlaybotPid 'playbot-watch.pid' $watch.Id
}

$span = if ($Days -le 0) { 'until-close' } else { "days=$Days" }
Write-Output "playbot_console=started pid=$($console.Id) persona=$Persona $span stage=$Stage until_wall=$UntilWall auto_start=1 stop_on_close=1"
try {
  $ensure18 = Join-Path $ScriptRoot 'ensure-daily-6pm-playbot-report.ps1'
  if (Test-Path $ensure18) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File $ensure18 | Out-Null
  }
} catch {}
