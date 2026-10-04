# 장기 상주 감시 프로세스 자동 리플래시 — 워치독 루프가 매 회(5분) dot-source 후 호출
# 규칙 (2026-10-04 대표님 지시 「자동 재시작 탑재 · 유사 문제 모두 자동 리플래시」):
#   1) 전용 메모리 상한 초과 → 즉시 재기동 (비상용 · 기동 직후 기준선: 워치독 ~150MB · run-monitor ~310MB)
#   2) 기동 20h↑ → 조용한 시간(04~05시 KST)에만 재기동 (08:00·18:00 보고 · 00:00 커밋 · 12:00 배치와 겹치지 않음)
#   3) 죽은 부속(크래시 logcat) → 기기 연결 상태면 즉시 감시 재기동
#   4) Metro(8081) 꺼짐 + 개발 빌드 연결 → 자동 기동 (Metro 자체는 앱 연결 끊김 때문에 재기동 대상 아님)
# 재기동 = 프로세스 트리 종료 → 같은 루프의 ensure-* 가 pid 사망을 보고 새로 띄움
# 끄기: logs/process-refresh-DISABLED.flag · Metro만 끄기: logs/metro-autostart-DISABLED.flag

$script:RefreshRoot = $PSScriptRoot
$script:RefreshRepo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$script:RefreshLogDir = Join-Path $PSScriptRoot 'logs'
$script:RefreshPlaybotLogDir = Join-Path $script:RefreshRepo 'tools\play-bot-console\logs'
$script:REFRESH_QUIET_HOURS = @(4, 5)
$script:REFRESH_MAX_UPTIME_H = 20
$script:WATCHDOG_MAX_MB = 450

# uptime=$false → 메모리 상한만 (실기 세션 중 끊으면 수집 유실)
$script:REFRESH_TARGETS = @(
  @{ name = 'watch-30m'; pidFile = (Join-Path $script:RefreshLogDir 'watch-30m.pid'); maxMB = 700; uptime = $true; crashLogcat = $true },
  @{ name = 'retention-audit'; pidJson = (Join-Path $script:RefreshLogDir 'memory-profiler-watch.json'); maxMB = 250; uptime = $true },
  @{ name = 'schedule-8am'; pidFile = (Join-Path $script:RefreshLogDir 'schedule-8am-perpetual.pid'); maxMB = 200; uptime = $true },
  @{ name = 'schedule-6pm-playbot'; pidFile = (Join-Path $script:RefreshPlaybotLogDir 'schedule-6pm-playbot.pid'); maxMB = 200; uptime = $true;
     ensure = (Join-Path $script:RefreshRepo 'tools\play-bot-console\ensure-daily-6pm-playbot-report.ps1') },
  @{ name = 'owner-playlog-auto'; pidFile = (Join-Path $script:RefreshPlaybotLogDir 'playbot-owner-auto.pid'); maxMB = 400; uptime = $false }
)

function Read-RefreshPid([hashtable]$t) {
  $id = 0
  try {
    if ($t.pidFile -and (Test-Path $t.pidFile)) {
      [void][int]::TryParse((Get-Content $t.pidFile -Raw).Trim(), [ref]$id)
    } elseif ($t.pidJson -and (Test-Path $t.pidJson)) {
      $j = Get-Content $t.pidJson -Raw | ConvertFrom-Json
      if ($j.auditPid) { $id = [int]$j.auditPid }
    }
  } catch { }
  return $id
}

function Test-RefreshQuietHour {
  return $script:REFRESH_QUIET_HOURS -contains (Get-Date).Hour
}

function Get-RefreshReason([System.Diagnostics.Process]$p, [int]$maxMB, [bool]$useUptime) {
  $mb = [math]::Round($p.PrivateMemorySize64 / 1MB)  # 전용 메모리(워킹셋은 Windows 트림으로 출렁임)
  if ($mb -ge $maxMB) { return "mem=${mb}MB>=${maxMB}MB" }
  if ($useUptime -and (Test-RefreshQuietHour)) {
    $h = ((Get-Date) - $p.StartTime).TotalHours
    if ($h -ge $script:REFRESH_MAX_UPTIME_H) { return ('uptime={0:N1}h quiet-hour' -f $h) }
  }
  return $null
}

function Stop-RefreshTree([int]$rootId) {
  $all = @(Get-CimInstance Win32_Process -Property ProcessId, ParentProcessId -ErrorAction SilentlyContinue)
  $ids = New-Object System.Collections.Generic.List[int]
  $ids.Add($rootId)
  for ($i = 0; $i -lt $ids.Count; $i++) {
    foreach ($c in $all) { if ($c.ParentProcessId -eq $ids[$i] -and -not $ids.Contains([int]$c.ProcessId)) { $ids.Add([int]$c.ProcessId) } }
  }
  # 자식부터 종료
  for ($i = $ids.Count - 1; $i -ge 0; $i--) { Stop-Process -Id $ids[$i] -Force -ErrorAction SilentlyContinue }
  return $ids.Count
}

function Test-RefreshDeviceOnline {
  try { return ((& adb get-state 2>$null) -join '').Trim() -eq 'device' } catch { return $false }
}

function Get-CrashLogcatProcs {
  return @(Get-CimInstance Win32_Process -Filter "Name='adb.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'logcat' -and $_.CommandLine -match 'AndroidRuntime:E' })
}

function Invoke-MetroEnsure([bool]$deviceOnline) {
  if (Test-Path (Join-Path $script:RefreshLogDir 'metro-autostart-DISABLED.flag')) { return 'metro=skip(disabled)' }
  if (-not $deviceOnline) { return 'metro=skip(no-device)' }
  if (Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue) { return 'metro=ok' }
  # 빌드 중(expo run:android · gradlew)엔 빌드가 끝나며 직접 8081을 연다 — 먼저 잡으면 「Port 8081 became busy」로 설치 실패(2026-10-04 실측)
  $building = @(Get-CimInstance Win32_Process -Filter "Name='node.exe' OR Name='cmd.exe' OR Name='java.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'run:android|run:ios|gradlew|GradleWrapperMain|eas build' })
  if ($building.Count -gt 0) { return 'metro=skip(build-running)' }
  $flags = (& adb shell dumpsys package com.arcfire.online 2>$null | Select-String -Pattern 'pkgFlags' | Select-Object -First 1) -as [string]
  if ($flags -notmatch 'DEBUGGABLE') { return 'metro=skip(release-build)' }
  $log = Join-Path $script:RefreshLogDir ('metro-' + (Get-Date -Format 'yyyyMMdd-HHmm') + '.log')
  $p = Start-Process -WindowStyle Hidden -PassThru -FilePath (Join-Path $env:SystemRoot 'System32\cmd.exe') -WorkingDirectory $script:RefreshRepo `
    -ArgumentList @('/c', "npx expo start --dev-client --port 8081 > `"$log`" 2>&1")
  return "metro=STARTED pid=$($p.Id) log=$log"
}

function Invoke-MonitorProcessRefresh {
  if (Test-Path (Join-Path $script:RefreshLogDir 'process-refresh-DISABLED.flag')) { Write-Output 'refresh=skip(disabled)'; return }
  $deviceOnline = Test-RefreshDeviceOnline
  foreach ($t in $script:REFRESH_TARGETS) {
    $id = Read-RefreshPid $t
    $p = if ($id -gt 0) { Get-Process -Id $id -ErrorAction SilentlyContinue } else { $null }
    if (-not $p) { continue }
    $reason = Get-RefreshReason $p $t.maxMB ([bool]$t.uptime)
    if (-not $reason -and $t.crashLogcat -and $deviceOnline -and @(Get-CrashLogcatProcs).Count -eq 0) {
      $reason = 'crash-logcat-dead'
    }
    if (-not $reason) { continue }
    $n = Stop-RefreshTree $id
    if ($t.crashLogcat) { Get-CrashLogcatProcs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } }
    Write-Output "REFRESH $($t.name) pid=$id procs=$n reason=$reason"
    if ($t.ensure -and (Test-Path $t.ensure)) {
      & $t.ensure | ForEach-Object { Write-Output "REFRESH $($t.name) $_" }
    }
  }
  Write-Output (Invoke-MetroEnsure $deviceOnline)
}

# 워치독 자신 — 교체 프로세스를 WMI로 띄우고(Cursor 훅 Job 종속 회피) 현재 루프 종료
function Test-WatchdogSelfRefresh {
  if (Test-Path (Join-Path $script:RefreshLogDir 'process-refresh-DISABLED.flag')) { return $null }
  $me = Get-Process -Id $PID
  return Get-RefreshReason $me $script:WATCHDOG_MAX_MB $true
}

function Start-WatchdogReplacement([string]$runnerPath) {
  $cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$runnerPath`""
  $si = New-CimInstance -ClassName Win32_ProcessStartup -ClientOnly -Property @{ ShowWindow = [uint16]0 }
  $r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine = $cmd; CurrentDirectory = $script:RefreshRepo; ProcessStartupInformation = $si
  }
  return $r
}
