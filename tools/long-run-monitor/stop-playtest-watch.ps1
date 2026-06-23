# 플레이테스트 감시 종료 + 세션 종료 시각 기록
param(
  [string]$LogDir = (Join-Path $PSScriptRoot 'logs')
)

function Stop-PidFile([string]$pidPath) {
  if (-not (Test-Path $pidPath)) { return }
  $id = [int](Get-Content $pidPath -Raw).Trim()
  try { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue } catch {}
  Remove-Item $pidPath -Force -ErrorAction SilentlyContinue
}

Stop-PidFile (Join-Path $LogDir 'watch-30m.pid')
Stop-PidFile (Join-Path $LogDir 'precision-logcat.pid')
Stop-PidFile (Join-Path $LogDir 'playtest-scan.pid')
Stop-PidFile (Join-Path $LogDir 'report-watch.pid')

$sessionFile = Join-Path $LogDir 'playtest-session-active.json'
$ended = (Get-Date).ToUniversalTime().AddHours(9).ToString('yyyy-MM-dd HH:mm:ss')
if (Test-Path $sessionFile) {
  try {
    $sess = Get-Content $sessionFile -Raw | ConvertFrom-Json
    $sess | Add-Member -NotePropertyName endedAtKst -NotePropertyValue $ended -Force
    $sess | ConvertTo-Json -Depth 6 | Set-Content -Path $sessionFile -Encoding utf8
    Copy-Item -Path $sessionFile -Destination (Join-Path $LogDir "$($sess.sessionId)-ended.json") -Force
  } catch {}
}
Add-Content -Path (Join-Path $LogDir 'playtest-alerts.log') -Value "[$ended] SESSION_END"
Add-Content -Path (Join-Path $LogDir 'incidents.log') -Value "[$ended] PLAYTEST_END"
Write-Output "playtest_watch_stopped ended_kst=$ended"
