# 숨김 워치 — 가시 콘솔 프로세스가 죽으면 하니스·기록을 즉시 끊는다.
param(
  [int]$ConsolePid,
  [int]$PollMs = 800
)

$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'playbot-process.ps1')

if ($ConsolePid -le 0) { exit 0 }

while (Test-PlaybotProcAlive $ConsolePid) {
  Start-Sleep -Milliseconds ([Math]::Max(400, $PollMs))
}

Stop-PlaybotRecordingSession
exit 0
