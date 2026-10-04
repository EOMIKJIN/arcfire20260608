# 플레이봇콘솔 — 하니스는 숨김 분리. 창을 닫거나 stop-playbot-console 하면 기록도 중지.
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
$harness = Read-PlaybotPid 'playbot-harness.pid'
$watchId = Read-PlaybotPid 'playbot-watch.pid'
if ((Test-PlaybotProcAlive $existing) -and (Test-PlaybotProcAlive $harness) -and -not $RestartExisting) {
  if (-not (Test-PlaybotProcAlive $watchId)) {
    $watch = Start-Process -WindowStyle Hidden -PassThru -FilePath 'powershell.exe' -ArgumentList @(
      '-NoProfile', '-ExecutionPolicy', 'Bypass',
      '-File', (Join-Path $ScriptRoot 'watch-playbot-console.ps1')
    )
    if ($watch -and $watch.Id) { Write-PlaybotPid 'playbot-watch.pid' $watch.Id }
  }
  Write-Output "playbot_console=already pid=$existing harness=$harness"
  exit 0
}

if ($RestartExisting) {
  Stop-PlaybotAll
}

Clear-PlaybotExplicitStop

if (-not $UntilWall) { $UntilWall = Get-PlaybotNextUntilWall }
Save-PlaybotHarnessArgs -Persona $Persona -Days $Days -Stage $Stage -LiveMs $LiveMs -Seed $Seed -UntilWall $UntilWall -Fast:$Fast

$hid = Start-PlaybotHarnessDetached -Persona $Persona -Days $Days -Stage $Stage -LiveMs $LiveMs -Seed $Seed -UntilWall $UntilWall -Fast:$Fast
if ($hid -le 0) {
  Write-Output 'playbot_console=failed harness'
  exit 1
}

$consoleId = Start-PlaybotConsoleWindow -Persona $Persona -Days $Days -Stage $Stage -LiveMs $LiveMs -Seed $Seed -UntilWall $UntilWall -Fast:$Fast
if ($consoleId -le 0) {
  Write-Output "playbot_console=harness_only pid=$hid"
} else {
  Write-PlaybotPid 'playbot-console.pid' $consoleId
}

$watchAlive = Read-PlaybotPid 'playbot-watch.pid'
if (-not (Test-PlaybotProcAlive $watchAlive)) {
  $watch = Start-Process -WindowStyle Hidden -PassThru -FilePath 'powershell.exe' -ArgumentList @(
    '-NoProfile', '-ExecutionPolicy', 'Bypass',
    '-File', (Join-Path $ScriptRoot 'watch-playbot-console.ps1')
  )
  if ($watch -and $watch.Id) {
    Write-PlaybotPid 'playbot-watch.pid' $watch.Id
  }
}

$span = if ($Days -le 0) { 'until-stop' } else { "days=$Days" }
Write-Output "playbot_console=started pid=$consoleId harness=$hid persona=$Persona $span stage=$Stage until_wall=$UntilWall auto_start=1 stop_on_close=1"
try {
  $ensure18 = Join-Path $ScriptRoot 'ensure-daily-6pm-playbot-report.ps1'
  if (Test-Path $ensure18) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File $ensure18 | Out-Null
  }
} catch {}
try {
  $ensureOwner = Join-Path $ScriptRoot 'ensure-owner-playlog-auto.ps1'
  if (Test-Path $ensureOwner) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File $ensureOwner | Out-Null
  }
} catch {}
