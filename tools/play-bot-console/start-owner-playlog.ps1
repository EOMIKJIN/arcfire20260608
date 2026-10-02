# 비상용 수동 시작. 기본 수집은 watch-owner-playlog-auto (ensure-owner-playlog-auto).
# 앱 코드 변경 없음. 기기(USB/무선 adb)에서 읽기만 한다.
#   1) 플레이 전 게임 저장 DB(RKStorage) 복사  → before.sqlite
#   2) 플레이 동안 JS 로그(ReactNativeJS) 기록 → session.log  ([MEM_PROFILE] 화면·이동·전투 마커)
# 종료: stop-owner-playlog.ps1
# 저장: tools/play-bot-console/logs/learned/human-raw/<세션ID>/  (git 제외 · 1GB 정리 대상 아님)
param([string]$Note = '')

$ErrorActionPreference = 'Stop'
$pkg = 'com.arcfire.online'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$base = Join-Path $root 'logs\learned\human-raw'

$devices = @(adb devices | Select-String '\tdevice$')
if ($devices.Count -eq 0) { Write-Host '기기 연결 없음 (adb devices)'; exit 1 }

$open = Get-ChildItem $base -Directory -ErrorAction SilentlyContinue | Where-Object {
  Test-Path (Join-Path $_.FullName 'capture.pid')
}
if ($open) { Write-Host "이미 수집 중: $($open[0].Name) — 먼저 stop-owner-playlog.ps1"; exit 1 }

$sid = 'owner-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
$dir = Join-Path $base $sid
New-Item -ItemType Directory -Force $dir | Out-Null

# 1) 플레이 전 저장 DB (cmd 리다이렉트 = 바이너리 안전)
cmd /c "adb exec-out run-as $pkg cat databases/RKStorage > `"$dir\before.sqlite`""

# 2) 로그 기록 — 버퍼 지우지 않음(다른 모니터 보호). 시작 시각 이후만.
$since = ((adb shell "date '+%m-%d %H:%M:%S'") | Out-String).Trim() + '.000'
$log = Join-Path $dir 'session.log'
$proc = Start-Process -FilePath 'cmd.exe' -WindowStyle Hidden -PassThru -ArgumentList @(
  '/c', "adb logcat -v threadtime -T `"$since`" ReactNativeJS:V *:S > `"$log`""
)
Set-Content -Encoding ascii -Path (Join-Path $dir 'capture.pid') -Value $proc.Id

$appPid = (adb shell pidof $pkg).Trim()
$manifest = [ordered]@{
  schema       = 'owner-playlog-v1'
  sessionId    = $sid
  player       = 'owner'
  sessionKind  = 'human'
  startedAt    = (Get-Date).ToString('o')
  deviceSince  = $since
  appPid       = $appPid
  note         = $Note
}
$manifest | ConvertTo-Json | Set-Content -Encoding utf8 (Join-Path $dir 'manifest.json')

Write-Host "수집 시작: $sid"
Write-Host "  저장 DB(전) $([math]::Round((Get-Item "$dir\before.sqlite").Length/1KB)) KB · 로그 기록 중"
Write-Host '  플레이가 끝나면: powershell -File tools\play-bot-console\stop-owner-playlog.ps1'
