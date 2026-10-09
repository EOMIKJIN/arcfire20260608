# Arcfire long-run watch — 사용자용 간단 보고 콘솔 (heartbeat)
# v2.8 — 신선한 arcfire 크래시·실제 incident만 적색/황색 (구 log 오탐·paused GL 스팸 제거)
#         PID 생존 시 동일 pid 타임라인 stale 재사용 — 08:00 dumpsys 폭주와 겹쳐 「측정 실패」 오탐 금지
param(
  [string]$Package = 'com.arcfire.online',
  [int]$IntervalMin = 30
)

$ErrorActionPreference = 'Continue'

. (Join-Path $PSScriptRoot 'mem-gl-leak-rules.ps1')
. (Join-Path $PSScriptRoot 'watch-alert-filters.ps1')
. (Join-Path $PSScriptRoot 'monitor-host-budget.ps1')

$IntervalMin = Enforce-MonitorIntervalFloor -IntervalMin $IntervalMin -FloorMin $script:MONITOR_MIN_REPORT_INTERVAL_MIN

$logDir       = Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$heartbeatLog = Join-Path $logDir 'heartbeat.log'
$incidentsLog = Join-Path $logDir 'incidents.log'
$alertsLog    = Join-Path $logDir 'mem-alerts.log'
$playtestAlerts = Join-Path $logDir 'playtest-alerts.log'
$pauseFlag    = Join-Path $logDir 'monitor-paused.flag'
$crashOffsetFile = Join-Path $logDir '.crash-byte-offset-heartbeat'
$crashMaxAgeMin = [math]::Max(20, ($IntervalMin * 2) + 5)

function Get-LineCount([string]$path) {
  if (-not (Test-Path $path)) { return 0 }
  try { return @(Get-Content -Path $path -ErrorAction SilentlyContinue).Count } catch { return 0 }
}

function Get-NewLines([string]$path, [int]$prevCount) {
  if (-not (Test-Path $path)) { return @() }
  try {
    $all = @(Get-Content -Path $path -ErrorAction SilentlyContinue)
    if ($all.Count -le $prevCount) { return @() }
    return @($all[$prevCount..($all.Count - 1)] | Where-Object { $_ -and $_.Trim().Length -gt 0 })
  } catch { return @() }
}

function Get-LatestCrashLog() {
  Get-ChildItem -Path $logDir -Filter 'crash-*.log' -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
}

function Parse-Meminfo([string]$raw) {
  $m = @{ PssKb = $null; GlKb = $null; Views = $null }
  if ($raw -match 'TOTAL PSS:\s+(\d+)')       { $m.PssKb = [int]$Matches[1] }
  if ($raw -match '(?m)^\s*GL mtrack\s+(\d+)') { $m.GlKb  = [int]$Matches[1] }
  if ($raw -match 'Views:\s+(\d+)')            { $m.Views = [int]$Matches[1] }
  return $m
}

# PID 변경 사유 — Android exit-info(이전 pid) 기준. 강제종료·스와이프를 크래시로 오표시하지 않는다(2026-10-09).
function Get-PidChangeVerdict([string]$Pkg, [string]$OldPid) {
  $v = @{ Label = '사유 미확인 · 크래시·재시작 의심'; Color = 'Red'; Tag = '!! PID_CHANGE' }
  $raw = ''
  try { $raw = (adb shell dumpsys activity exit-info $Pkg 2>$null | Out-String) } catch { return $v }
  $pattern = "timestamp=(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\S* pid=$OldPid\b[\s\S]*?reason=(\d+) \((.+?)\)\s+(?:subreason=\d+ \((.+?)\)\s+)?status="
  if ($raw -notmatch $pattern) { return $v }
  $exitAt = [datetime]$Matches[1]
  # 기기·OS 마다 'EXIT SELF' / 'EXIT_SELF' 처럼 공백·밑줄이 섞인다 — 공백으로 통일해 비교한다.
  $reason = $Matches[3] -replace '_', ' '
  $sub = if ($Matches[4]) { $Matches[4] -replace '_', ' ' } else { '' }

  if ($reason -eq 'USER REQUESTED') {
    $v.Color = 'Yellow'
    $v.Tag = '-- RESTART'
    if ($sub -eq 'REMOVE TASK') {
      $v.Label = '사용자 스와이프(최근 앱 제거)'
    } elseif ($sub -eq 'FORCE STOP') {
      $v.Label = '외부 강제종료(수동·측정)'
      $remLog = Join-Path $logDir 'remediation.log'
      if (Test-Path $remLog) {
        # 종료 시각 ±60초 안의 모니터 relaunch 만 인정 — 수동 재시작을 모니터 탓으로 돌리지 않는다
        $hit = Get-Content $remLog -Tail 200 -ErrorAction SilentlyContinue |
          Where-Object {
            $_ -match '^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] AUTO_FIX app relaunch reason=(\S+)' -and
            [math]::Abs((([datetime]$Matches[1]) - $exitAt).TotalSeconds) -le 60
          } |
          Select-Object -Last 1
        if ($hit -and $hit -match 'reason=(\S+)') { $v.Label = "모니터 자동복구 force-stop · $($Matches[1])" }
      }
    } else {
      $v.Label = "사용자 요청 종료 · $sub"
    }
    return $v
  }
  # 앱이 스스로 끝내고 다시 켬 — dev 전체 리로드 대체(devMetroReloadGuard restartAppAsync · exitProcess(0)) 등. 크래시 아님.
  if ($reason -eq 'EXIT SELF') {
    $v.Color = 'Yellow'
    $v.Tag = '-- RESTART'
    $v.Label = '앱 자체 재시작(dev 리로드 대체 등)'
    return $v
  }
  # CRASH · CRASH NATIVE · ANR · LOW MEMORY · SIGNALED 등 — 실제 이상
  $v.Label = if ($sub -and $sub -ne 'UNKNOWN') { "$reason · $sub" } else { $reason }
  $v.Tag = '!! PID_CHANGE'
  return $v
}

function Emit([string]$line, [string]$color) {
  if ($color) { Write-Host $line -ForegroundColor $color } else { Write-Host $line }
  try { Add-Content -Path $heartbeatLog -Value $line -Encoding utf8 } catch {}
}

$prevIncidents = Get-LineCount $incidentsLog
$prevAlerts    = Get-LineCount $alertsLog
$prevPlaytest  = Get-LineCount $playtestAlerts
$sessionPid    = ''
$startStamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$pausedNote = if (Test-Path $pauseFlag) { ' · auto-fix=OFF' } else { '' }
Emit "[$startStamp] === report-watch v2.8 (pkg=$Package · ${IntervalMin}m · 신선 크래시만)$pausedNote ===" 'Cyan'

while ($true) {
  $hhmm = Get-Date -Format 'HH:mm'

  $appPid = ''
  try { $appPid = (adb shell "pidof $Package" 2>$null | Out-String).Trim() } catch { $appPid = '' }

  if ($appPid -and -not $sessionPid) { $sessionPid = $appPid }
  $pidChanged = ($sessionPid -and $appPid -and $appPid -ne $sessionPid)

  # 신규 incident — actionable만
  $newIncidents = @(Get-NewLines $incidentsLog $prevIncidents)
  $prevIncidents = Get-LineCount $incidentsLog
  $actionIncidents = @($newIncidents | Where-Object { Test-WatchActionableIncident $_ })

  # playtest-alerts 실시간 (정밀 스캐너)
  $newPlaytest = @(Get-NewLines $playtestAlerts $prevPlaytest)
  $prevPlaytest = Get-LineCount $playtestAlerts
  $realtimeCrash = @($newPlaytest | Where-Object { $_ -match '\[ARCFIRE_CRASH\]|\[PATTERN\].*Fatal signal' })

  # crash log — 바이트 tail + 신선도 (구 PID 오탐 차단)
  $freshCrashEvents = @()
  $crash = Get-LatestCrashLog
  if ($crash) {
    $tail = Read-CrashLogTailBytes -CrashPath $crash.FullName -OffsetFile $crashOffsetFile -MaxAgeMin $crashMaxAgeMin
    $freshCrashEvents = @($tail.Events)
  }

  $hasCrash = ($freshCrashEvents.Count -gt 0) -or ($realtimeCrash.Count -gt 0)
  $crashSample = ''
  if ($freshCrashEvents.Count -gt 0) {
    $crashSample = ($freshCrashEvents | Select-Object -Last 1).Line
  } elseif ($realtimeCrash.Count -gt 0) {
    $crashSample = ($realtimeCrash | Select-Object -Last 1)
  }

  if ($appPid) {
    $pss = ''; $gl = ''; $views = ''
    $measOk = $false
    $measNote = ''
    $failReason = ''
    # watch-30m 주기(15~30m)보다 heartbeat가 짧으면 MaxAge=Interval+5만으로는 중간 틱이 만료됨
    $freshMaxAge = [math]::Max(($IntervalMin + 5), 35)
    $timelineSnap = Get-TimelineHeartbeatMetrics -LogDir $logDir -MaxAgeMin $freshMaxAge -StaleFallbackMaxAgeMin 90 -MatchPid $appPid
    $useTimeline = $timelineSnap -and $timelineSnap.pid -eq $appPid
    $timelineFresh = $useTimeline -and -not $timelineSnap.stale

    if ($pidChanged -or $hasCrash -or $actionIncidents.Count -gt 0) {
      # 이상 시에만 adb meminfo (budget gate)
      if (Test-CanInvokeAdbMeminfo -LogDir $logDir -Force:$hasCrash) {
        try {
          $raw = (adb shell dumpsys meminfo $Package 2>&1 | Out-String)
          Register-AdbMeminfoInvocation -LogDir $logDir
          $met = Parse-Meminfo $raw
          if ($met.PssKb) { $pss = [math]::Round($met.PssKb / 1024, 1) }
          if ($null -ne $met.GlKb) { $gl = [math]::Round($met.GlKb / 1024, 1) }
          if ($null -ne $met.Views) { $views = [int]$met.Views }
          if ($pss -ne '') { $measOk = $true }
        } catch {
          $measOk = $false
          $failReason = 'adb_busy_or_parse'
        }
      } elseif ($useTimeline) {
        $pss = $timelineSnap.pssMb
        $gl = $timelineSnap.glMb
        $views = $timelineSnap.views
        $measOk = $true
        $measNote = "stale $($timelineSnap.ageMin)m · adb_budget"
      } else {
        $failReason = 'adb_budget'
      }
    } elseif ($timelineFresh) {
      $pss = $timelineSnap.pssMb
      $gl = $timelineSnap.glMb
      $views = $timelineSnap.views
      $measOk = $true
    } else {
      $canDump = Test-CanInvokeAdbMeminfo -LogDir $logDir
      if ($canDump) {
        try {
          $raw = (adb shell dumpsys meminfo $Package 2>&1 | Out-String)
          Register-AdbMeminfoInvocation -LogDir $logDir
          $met = Parse-Meminfo $raw
          if ($met.PssKb) { $pss = [math]::Round($met.PssKb / 1024, 1) }
          if ($null -ne $met.GlKb) { $gl = [math]::Round($met.GlKb / 1024, 1) }
          if ($null -ne $met.Views) { $views = [int]$met.Views }
          if ($pss -ne '') { $measOk = $true } else { $failReason = 'parse_empty' }
        } catch {
          $measOk = $false
          $failReason = 'adb_busy_or_parse'
        }
      } else {
        $failReason = 'adb_budget'
      }
      if (-not $measOk -and $useTimeline) {
        $pss = $timelineSnap.pssMb
        $gl = $timelineSnap.glMb
        $views = $timelineSnap.views
        $measOk = $true
        $measNote = "stale $($timelineSnap.ageMin)m · $failReason"
        $failReason = ''
      } elseif (-not $measOk -and -not $failReason) {
        $failReason = 'timeline_none'
      }
    }

    if ($pidChanged) {
      $pv = Get-PidChangeVerdict -Pkg $Package -OldPid $sessionPid
      Emit "[$hhmm] $($pv.Tag) session=$sessionPid -> $appPid ($($pv.Label))" $pv.Color
      $sessionPid = $appPid
    } elseif ($hasCrash) {
      Emit "[$hhmm] !! 실시간 크래시 — $crashSample" 'Red'
    } elseif ($actionIncidents.Count -gt 0) {
      $summary = ($actionIncidents | Select-Object -Last 1)
      Emit "[$hhmm] !! 이상감지: $summary" 'Yellow'
    } elseif (-not $measOk) {
      if (-not $failReason) { $failReason = 'timeline_none' }
      Emit "[$hhmm] ?? 측정 실패 — PID=$appPid · $failReason" 'Magenta'
    } else {
      $glNote = ''
      if ((Test-Path $pauseFlag) -and $gl -ne '' -and [double]$gl -ge 200) {
        $glNote = " · GL ${gl}MB (기록만·조치OFF)"
      }
      if ($measNote) { $glNote = " · $measNote$glNote" }
      Emit "[$hhmm] OK · PID $appPid · PSS ${pss}MB / GL ${gl}MB / views ${views}$glNote" 'Green'
    }
  } else {
    if ($hasCrash -or $actionIncidents.Count -gt 0 -or $pidChanged) {
      $sample = if ($crashSample) { $crashSample } else { ($actionIncidents | Select-Object -Last 1) }
      Emit "[$hhmm] !! 앱 미실행 + 이상 — $sample" 'Red'
    } else {
      Emit "[$hhmm] .. 앱 미실행(대기중)" 'DarkGray'
    }
    $sessionPid = ''
  }

  Start-Sleep -Seconds ($IntervalMin * 60)
}
