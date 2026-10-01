# 가시 콘솔 뷰어 — 하니스는 숨김 분리. 창을 닫아도 기록은 유지된다.
# mud.log 를 Get-Content 로 읽으면 Windows 잠금에 창이 멈춘다. 공유 읽기만 쓴다.
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

function Show-PlaybotLiveFrame {
  param([string]$Body)
  $stamp = Get-Date -Format 'HH:mm:ss'
  $hid = Read-PlaybotPid 'playbot-harness.pid'
  Clear-Host
  Write-Host "=== Arcfire 플레이봇콘솔 LIVE $stamp ===" -ForegroundColor Cyan
  Write-Host "창 닫아도 기록 유지 · 중지= npm run playbot:stop · harness=$hid" -ForegroundColor DarkGray
  Write-Host "persona=$Persona  $(if ($Days -le 0) { 'until-stop' } else { "days=$Days" })  stage=$Stage  (앱 미포함 · 세이브 미기록)" -ForegroundColor DarkGray
  Write-Host ''
  if ($Body) {
    Write-Host $Body
  } else {
    Write-Host '기록 대기 중… (하니스가 살아 있으면 곧 줄이 붙습니다)' -ForegroundColor Yellow
  }
}

function Read-PlaybotLiveBody {
  $latest = Get-PlaybotMudLatestPath
  $mud = Get-PlaybotCurrentMudLog
  $latestInfo = $null
  $mudInfo = $null
  if ($latest -and (Test-Path $latest)) { $latestInfo = Get-Item -LiteralPath $latest }
  if ($mud -and (Test-Path $mud)) { $mudInfo = Get-Item -LiteralPath $mud }
  $useSnapshot = $false
  if ($latestInfo -and $mudInfo) {
    $useSnapshot = $latestInfo.LastWriteTimeUtc -ge $mudInfo.LastWriteTimeUtc.AddSeconds(-2)
  } elseif ($latestInfo) {
    $useSnapshot = $true
  }
  if ($useSnapshot) {
    $text = Read-PlaybotSharedText $latest
    if ($text) { return $text.TrimEnd() }
  }
  $raw = Read-PlaybotSharedText $mud
  if (-not $raw) { return '' }
  $arr = $raw -split "`r?`n", 0, 'RegexMatch'
  if ($arr.Count -le 0) { return '' }
  $n = [Math]::Min(40, $arr.Count)
  return (($arr[($arr.Count - $n)..($arr.Count - 1)]) -join "`n")
}

Write-Host '=== Arcfire 플레이봇콘솔 ===' -ForegroundColor Cyan
Write-Host '창은 보기 전용 · 닫아도 기록 유지 · 중지= npm run playbot:stop' -ForegroundColor DarkGray
Write-Host ''

if (-not $UntilWall) { $UntilWall = Get-PlaybotNextUntilWall }
$hid = Start-PlaybotHarnessDetached -Persona $Persona -Days $Days -Stage $Stage -LiveMs $LiveMs -Seed $Seed -UntilWall $UntilWall -Fast:$Fast
if ($hid -le 0) {
  Write-Host '하니스 시작 실패' -ForegroundColor Red
  exit 1
}
Write-Host "기록 가동 중  harness-pid=$hid  (창과 분리)" -ForegroundColor Green
Start-Sleep -Milliseconds 300
Show-PlaybotLiveFrame -Body (Read-PlaybotLiveBody)

$lastPaint = [Environment]::TickCount
try {
  while (-not (Test-PlaybotExplicitStop)) {
    $hid = Read-PlaybotPid 'playbot-harness.pid'
    if (-not (Test-PlaybotProcAlive $hid)) {
      $hid = Resume-PlaybotHarnessFromSavedArgs
    }
    $now = [Environment]::TickCount
    if (($now - $lastPaint) -ge 700) {
      Show-PlaybotLiveFrame -Body (Read-PlaybotLiveBody)
      $lastPaint = $now
    }
    Start-Sleep -Milliseconds 400
  }
} finally {
  Write-Host ''
  Write-Host '창만 닫힘 · 기록은 계속됩니다. 중지는 npm run playbot:stop' -ForegroundColor DarkGray
}
