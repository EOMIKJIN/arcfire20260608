# 숨김 감독 — 콘솔이 살아 있을 때만 하니스 크래시를 복구한다.
# 창을 닫으면(pid 소멸) 사용자 중지로 보고 콘솔·워치·하니스·기록을 끊는다. 창을 다시 띄우지 않는다.
param(
  [int]$ConsolePid = 0,
  [int]$PollMs = 1500
)

$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'playbot-process.ps1')

$lastHarnessSpawn = 0

while (-not (Test-PlaybotExplicitStop)) {
  $now = [Environment]::TickCount
  $cid = Read-PlaybotPid 'playbot-console.pid'
  if ($ConsolePid -gt 0 -and (Test-PlaybotProcAlive $ConsolePid)) {
    $cid = $ConsolePid
    Write-PlaybotPid 'playbot-console.pid' $cid
  }
  $consoleAlive = Test-PlaybotProcAlive $cid
  if ($cid -gt 0 -and -not $consoleAlive -and -not (Test-Path (Get-PlaybotConsoleRestartLockPath))) {
    Stop-PlaybotAll
    break
  }
  $hid = Read-PlaybotPid 'playbot-harness.pid'
  if ($consoleAlive -and -not (Test-PlaybotProcAlive $hid)) {
    if (($now - $lastHarnessSpawn) -gt 4000 -or $lastHarnessSpawn -eq 0) {
      [void](Resume-PlaybotHarnessFromSavedArgs)
      $lastHarnessSpawn = $now
    }
  }
  if ($consoleAlive -and -not (Test-PlaybotExplicitStop)) {
    [void](Start-PlaybotFqaReviewDetached)
  }
  Start-Sleep -Milliseconds ([Math]::Max(800, $PollMs))
}

exit 0
