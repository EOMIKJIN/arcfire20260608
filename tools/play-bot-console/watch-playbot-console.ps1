# 숨김 감독 — 하니스·가시창이 죽으면 다시 띄운다. 창이 죽어도 기록은 끊지 않는다.
param(
  [int]$ConsolePid = 0,
  [int]$PollMs = 1500
)

$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'playbot-process.ps1')

$lastHarnessSpawn = 0
$lastConsoleSpawn = 0

while (-not (Test-PlaybotExplicitStop)) {
  $now = [Environment]::TickCount
  $hid = Read-PlaybotPid 'playbot-harness.pid'
  if (-not (Test-PlaybotProcAlive $hid)) {
    if (($now - $lastHarnessSpawn) -gt 4000 -or $lastHarnessSpawn -eq 0) {
      [void](Resume-PlaybotHarnessFromSavedArgs)
      $lastHarnessSpawn = $now
    }
  }
  $cid = Read-PlaybotPid 'playbot-console.pid'
  if ($ConsolePid -gt 0 -and (Test-PlaybotProcAlive $ConsolePid)) {
    $cid = $ConsolePid
    Write-PlaybotPid 'playbot-console.pid' $cid
  }
  if (-not (Test-PlaybotProcAlive $cid) -and -not (Test-Path (Get-PlaybotConsoleRestartLockPath))) {
    if (($now - $lastConsoleSpawn) -gt 6000 -or $lastConsoleSpawn -eq 0) {
      $a = Read-PlaybotHarnessArgs
      $fast = [bool]($a.fast)
      [void](Start-PlaybotConsoleWindow -Persona ([string]$a.persona) -Days ([int]$a.days) -Stage ([int]$a.stage) -LiveMs ([int]$a.liveMs) -Seed ([int]$a.seed) -UntilWall ([string]$a.untilWall) -Fast:$fast)
      $lastConsoleSpawn = $now
    }
  }
  Start-Sleep -Milliseconds ([Math]::Max(800, $PollMs))
}

exit 0
