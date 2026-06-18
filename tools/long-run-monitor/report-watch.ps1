# Arcfire long-run watch — 사용자용 간단 보고 콘솔 (30분 1줄 heartbeat)
# 「감시만」 — 읽기/관측/보고 전용. 앱/Skia/허브 코드 수정 없음.
# run-monitor.ps1(상세 샘플링) 위에 얹는 가벼운 사용자 보고창.
param(
  [string]$Package = 'com.arcfire.online',
  [int]$IntervalMin = 30
)

$ErrorActionPreference = 'Continue'

$logDir       = Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$heartbeatLog = Join-Path $logDir 'heartbeat.log'
$incidentsLog = Join-Path $logDir 'incidents.log'
$alertsLog    = Join-Path $logDir 'mem-alerts.log'

function Get-LineCount([string]$path) {
  if (-not (Test-Path $path)) { return 0 }
  try {
    return @(Get-Content -Path $path -ErrorAction SilentlyContinue).Count
  } catch { return 0 }
}

function Get-NewLines([string]$path, [int]$prevCount) {
  if (-not (Test-Path $path)) { return @() }
  try {
    $all = @(Get-Content -Path $path -ErrorAction SilentlyContinue)
    if ($all.Count -le $prevCount) { return @() }
    $slice = $all[$prevCount..($all.Count - 1)]
    return @($slice | Where-Object { $_ -and $_.Trim().Length -gt 0 })
  } catch { return @() }
}

function Get-LatestCrashLog() {
  try {
    return Get-ChildItem -Path $logDir -Filter 'crash-*.log' -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending | Select-Object -First 1
  } catch { return $null }
}

function Parse-Meminfo([string]$raw) {
  $m = @{ PssKb = $null; GlKb = $null; Views = $null }
  if ($raw -match 'TOTAL PSS:\s+(\d+)')            { $m.PssKb = [int]$Matches[1] }
  if ($raw -match '(?m)^\s*GL mtrack\s+(\d+)')      { $m.GlKb  = [int]$Matches[1] }
  if ($raw -match 'Views:\s+(\d+)')                 { $m.Views = [int]$Matches[1] }
  return $m
}

function Emit([string]$line, [string]$color) {
  if ($color) { Write-Host $line -ForegroundColor $color } else { Write-Host $line }
  try { Add-Content -Path $heartbeatLog -Value $line -Encoding utf8 } catch {}
}

# 직전 상태(파일 길이) 기억 — 첫 틱은 "기동 시점 이후 신규"만 이상으로 판정
$prevIncidents = Get-LineCount $incidentsLog
$prevAlerts    = Get-LineCount $alertsLog
$crash         = Get-LatestCrashLog
$prevCrashName = if ($crash) { $crash.Name } else { '' }
$prevCrashLines = if ($crash) { Get-LineCount $crash.FullName } else { 0 }

$startStamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
Emit "[$startStamp] === report-watch 시작 (pkg=$Package · ${IntervalMin}m 간격 · 감시만) ===" 'Cyan'

while ($true) {
  $hhmm = Get-Date -Format 'HH:mm'
  $crashPattern = 'FATAL|signal|SIGSEGV|librnskia'

  # 1) 앱 실행 여부
  $appPid = ''
  try { $appPid = (adb shell "pidof $Package" 2>$null | Out-String).Trim() } catch { $appPid = '' }

  # 2) 새 alert/incident 라인
  $newIncidents = @(Get-NewLines $incidentsLog $prevIncidents)
  $newAlerts    = @(Get-NewLines $alertsLog $prevAlerts)
  $prevIncidents = Get-LineCount $incidentsLog
  $prevAlerts    = Get-LineCount $alertsLog

  # 3) 새 crash 흔적
  $crash = Get-LatestCrashLog
  $newCrashHits = @()
  if ($crash) {
    if ($crash.Name -ne $prevCrashName) { $prevCrashName = $crash.Name; $prevCrashLines = 0 }
    $newCrashLines = @(Get-NewLines $crash.FullName $prevCrashLines)
    $prevCrashLines = Get-LineCount $crash.FullName
    $newCrashHits = @($newCrashLines | Where-Object { $_ -match $crashPattern })
  }

  $crashSeen = ($newCrashHits.Count -gt 0)
  # alert/incident 중 "진짜" 비정상종료만(크래시 시그니처·하드실링). 단순 프로세스 미발견은
  # 클린 종료(앱 닫기·재설치·검증)일 수 있어 적색 오탐을 막기 위해 제외한다.
  # PROCESS_DEATH(크래시 동반)는 incidents.log 에 기록되며 crashSeen 으로도 잡힌다.
  $abnormalAlert = @(@($newAlerts) + @($newIncidents) | Where-Object { $_ -match 'PROCESS_DEATH|FATAL|SIGSEGV|GL_HARD_CEILING|GL_LEAK_SUSPECT' })

  if ($appPid) {
    # 실행 중 — meminfo 1회
    $pss = ''; $gl = ''; $views = ''
    $measOk = $false
    try {
      $raw = (adb shell dumpsys meminfo $Package 2>&1 | Out-String)
      $met = Parse-Meminfo $raw
      if ($met.PssKb) { $pss = [math]::Round($met.PssKb / 1024, 1) }
      if ($null -ne $met.GlKb) { $gl = [math]::Round($met.GlKb / 1024, 1) }
      if ($null -ne $met.Views) { $views = [int]$met.Views }
      if ($pss -ne '') { $measOk = $true }
    } catch { $measOk = $false }

    if ($crashSeen) {
      $sample = ($newCrashHits | Select-Object -First 1)
      Emit "[$hhmm] !! 비정상종료/크래시 흔적 감지 — $sample (상세 $($crash.Name))" 'Red'
    } elseif ($newAlerts.Count -gt 0 -or $newIncidents.Count -gt 0) {
      $summary = if ($newIncidents.Count -gt 0) { ($newIncidents | Select-Object -Last 1) } else { ($newAlerts | Select-Object -Last 1) }
      Emit "[$hhmm] !! 이상감지: $summary (상세 logs/incidents.log)" 'Yellow'
    } elseif (-not $measOk) {
      Emit "[$hhmm] ?? 측정 실패 (dumpsys/파싱) — 앱 PID=$appPid, 다음 틱 재시도" 'Magenta'
    } else {
      Emit "[$hhmm] OK 이상없음 · PSS ${pss}MB / GL ${gl}MB / views ${views}" 'Green'
    }
  } else {
    # 앱 미실행
    if ($crashSeen -or $abnormalAlert.Count -gt 0) {
      $sample = if ($crashSeen) { ($newCrashHits | Select-Object -First 1) } else { ($abnormalAlert | Select-Object -Last 1) }
      Emit "[$hhmm] !! 비정상종료 감지 — crash 로그 확인 ($sample)" 'Red'
    } else {
      Emit "[$hhmm] .. 앱 미실행(대기중)" 'DarkGray'
    }
  }

  Start-Sleep -Seconds ($IntervalMin * 60)
}


