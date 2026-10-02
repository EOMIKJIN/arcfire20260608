# 콘솔 창만 복구. 하니스는 죽이지 않음.
$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'playbot-process.ps1')
$h = Get-PlaybotLiveHarnessPid
Write-Output "harness=$h"
$a = Read-PlaybotHarnessArgs
$fast = [bool]($a.fast)
$nid = Restart-PlaybotConsoleWindowOnly -Persona ([string]$a.persona) -Days ([int]$a.days) -Stage ([int]$a.stage) -LiveMs ([int]$a.liveMs) -Seed ([int]$a.seed) -UntilWall ([string]$a.untilWall) -Fast:$fast
Write-Output "console_restarted=$nid"
if ($nid -gt 0) {
  Start-Sleep -Milliseconds 800
  Show-PlaybotWindowByPid $nid
  $p = Get-Process -Id $nid -ErrorAction SilentlyContinue
  Write-Output ("console_title=" + $(if ($p) { $p.MainWindowTitle } else { '' }))
  Write-Output ("console_hwnd=" + $(if ($p) { $p.MainWindowHandle } else { 0 }))
}
