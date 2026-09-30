# 가시 콘솔 본체 — 창이 켜지는 즉시 봇 시작. 창을 닫으면 워치가 기록 프로세스를 끊는다.
param(
  [string]$Persona = 'mixed_ref',
  [int]$Days = 0,
  [int]$Stage = 1,
  [int]$LiveMs = 120,
  [int]$Seed = 0,
  [string]$UntilWall = '',
  [switch]$Fast
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
. (Join-Path $ScriptRoot 'playbot-process.ps1')
. (Join-Path $ScriptRoot 'playbot-console-ui.ps1')
Initialize-PlaybotConsoleUi

$RepoRoot = (Resolve-Path (Join-Path $ScriptRoot '..\..')).Path
$harness = Join-Path $ScriptRoot 'run-harness.ts'

Write-Host '=== Arcfire 플레이봇콘솔 ===' -ForegroundColor Cyan
Write-Host "창 활성 → 봇 시작 · 닫을 때까지 지속 · 08:00 마감 시 정지 · 학습결과는 logs/learned" -ForegroundColor DarkGray
Write-Host "persona=$Persona  $(if ($Days -le 0) { 'until-close' } else { "days=$Days" })  stage=$Stage  (앱 미포함 · 세이브 미기록)" -ForegroundColor DarkGray
Write-Host ''

$liveArg = if ($Fast) { '' } else { ' --live' }
$seedArg = if ($Seed -gt 0) { " --seed $Seed" } else { '' }
$daysArg = if ($Days -le 0) { ' --until-close' } else { " --days $Days" }
if (-not $UntilWall) {
  $UntilWall = Get-PlaybotNextUntilWall
}
$wallArg = " --until-wall $UntilWall"
$cmdLine = "chcp 65001>nul & npx tsx `"$harness`" --persona $Persona$daysArg --stage $Stage --live-ms $LiveMs$liveArg$seedArg$wallArg --console-session"

$exiting = $false
function Stop-HostSession {
  if ($exiting) { return }
  $script:exiting = $true
  Write-Host ''
  Write-Host '콘솔 종료 — 기록 중지' -ForegroundColor Yellow
  Stop-PlaybotRecordingSession
}

$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
  . (Join-Path $Event.MessageData 'playbot-process.ps1')
  Stop-PlaybotRecordingSession
} -MessageData $ScriptRoot

try {
  $p = Start-Process -FilePath 'cmd.exe' -WorkingDirectory $RepoRoot -PassThru -NoNewWindow -ArgumentList @(
    '/d', '/c', $cmdLine
  )
  if (-not $p) { throw 'harness spawn failed' }
  Write-PlaybotPid 'playbot-harness.pid' $p.Id
  Write-Host "봇 가동 중  pid=$($p.Id)" -ForegroundColor Green
  Write-Host ''
  Wait-Process -Id $p.Id
} catch {
  Write-Host $_ -ForegroundColor Red
} finally {
  Stop-HostSession
  Write-Host '기록 종료. 창을 닫아도 추가 기록은 없습니다.' -ForegroundColor DarkGray
}
