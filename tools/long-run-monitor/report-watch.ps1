# Arcfire long-run watch — 사용자용 간단 보고 콘솔 (heartbeat)
# v2.7 — 신선한 arcfire 크래시·실제 incident만 적색/황색 (구 log 오탐·paused GL 스팸 제거)
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
Emit "[$startStamp] === report-watch v2.7 (pkg=$Package · ${IntervalMin}m · 신선 크래시만)$pausedNote ===" 'Cyan'

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
    $timelineSnap = Get-TimelineHeartbeatMetrics -LogDir $logDir -MaxAgeMin ($IntervalMin + 5)
    $useTimeline = $timelineSnap -and $timelineSnap.pid -eq $appPid

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
        } catch { $measOk = $false }
      }
    } elseif ($useTimeline) {
      $pss = $timelineSnap.pssMb
      $gl = $timelineSnap.glMb
      $views = $timelineSnap.views
      $measOk = $true
    } else {
      # timeline stale — budget 허용 시에만 1회 meminfo
      if (Test-CanInvokeAdbMeminfo -LogDir $logDir) {
        try {
          $raw = (adb shell dumpsys meminfo $Package 2>&1 | Out-String)
          Register-AdbMeminfoInvocation -LogDir $logDir
          $met = Parse-Meminfo $raw
          if ($met.PssKb) { $pss = [math]::Round($met.PssKb / 1024, 1) }
          if ($null -ne $met.GlKb) { $gl = [math]::Round($met.GlKb / 1024, 1) }
          if ($null -ne $met.Views) { $views = [int]$met.Views }
          if ($pss -ne '') { $measOk = $true }
        } catch { $measOk = $false }
      }
    }

    if ($pidChanged) {
      Emit "[$hhmm] !! PID_CHANGE session=$sessionPid -> $appPid (크래시·재시작 의심)" 'Red'
      $sessionPid = $appPid
    } elseif ($hasCrash) {
      Emit "[$hhmm] !! 실시간 크래시 — $crashSample" 'Red'
    } elseif ($actionIncidents.Count -gt 0) {
      $summary = ($actionIncidents | Select-Object -Last 1)
      Emit "[$hhmm] !! 이상감지: $summary" 'Yellow'
    } elseif (-not $measOk -and $useTimeline) {
      $pss = $timelineSnap.pssMb
      $gl = $timelineSnap.glMb
      $views = $timelineSnap.views
      $measOk = $true
    } elseif (-not $measOk) {
      Emit "[$hhmm] ?? 측정 실패 — PID=$appPid" 'Magenta'
    } else {
      $glNote = ''
      if ((Test-Path $pauseFlag) -and $gl -ne '' -and [double]$gl -ge 200) {
        $glNote = " · GL ${gl}MB (기록만·조치OFF)"
      }
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
