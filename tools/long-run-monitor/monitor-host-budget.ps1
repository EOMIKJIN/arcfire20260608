# 감시 = PC(adb) 전용 · 앱 번들/런타임 루프 주입 금지 · adb 부하 상한
# 정본: tools/long-run-monitor/logs/MONITOR_APP_ZERO_IMPACT.md

$script:MONITOR_MIN_MEMINFO_INTERVAL_MIN = 15
$script:MONITOR_MIN_REPORT_INTERVAL_MIN = 15
$script:MONITOR_MIN_RETENTION_INTERVAL_MIN = 60
$script:MONITOR_MAX_MEMINFO_PER_HOUR = 4
$script:MONITOR_WATCHDOG_ENSURE_MIN = 5

function Get-MonitorBudgetLogDir {
  param([string]$LogDir = '')
  if ($LogDir) { return $LogDir }
  return Join-Path $PSScriptRoot 'logs'
}

function Get-LastMeminfoStampPath([string]$LogDir) {
  Join-Path (Get-MonitorBudgetLogDir $LogDir) '.last-adb-meminfo.utc'
}

function Test-CanInvokeAdbMeminfo {
  param(
    [string]$LogDir = '',
    [switch]$Force
  )
  if ($Force) { return $true }
  $stampPath = Get-LastMeminfoStampPath $LogDir
  if (-not (Test-Path $stampPath)) { return $true }
  try {
    $prev = [datetime]::Parse((Get-Content $stampPath -Raw).Trim())
    $elapsedMin = ((Get-Date).ToUniversalTime() - $prev.ToUniversalTime()).TotalMinutes
    return $elapsedMin -ge $script:MONITOR_MIN_MEMINFO_INTERVAL_MIN
  } catch {
    return $true
  }
}

function Register-AdbMeminfoInvocation {
  param([string]$LogDir = '')
  $stampPath = Get-LastMeminfoStampPath $LogDir
  (Get-Date).ToUniversalTime().ToString('o') | Set-Content -Path $stampPath -Encoding ascii
}

function Enforce-MonitorIntervalFloor {
  param([int]$IntervalMin, [int]$FloorMin)
  if ($IntervalMin -lt $FloorMin) { return $FloorMin }
  return $IntervalMin
}

function Parse-TimelineHeartbeatRow {
  param([string]$Line)
  if ([string]::IsNullOrWhiteSpace($Line)) { return $null }
  $cols = @($Line -split ',')
  if ($cols.Count -lt 11) { return $null }
  if ($cols[1] -notmatch '^\d+$') { return $null }
  if ($cols[2] -notmatch '^\d') { return $null }
  try {
    $ts = [datetime]::Parse($cols[0].Trim())
  } catch {
    return $null
  }
  return @{
    pid = $cols[1].Trim()
    pssMb = $cols[2].Trim()
    glMb = $cols[4].Trim()
    views = $cols[10].Trim()
    ts = $ts
  }
}

function Get-TimelineHeartbeatMetrics {
  param(
    [string]$LogDir = '',
    [int]$MaxAgeMin = 20,
    [int]$StaleFallbackMaxAgeMin = 90,
    [string]$MatchPid = ''
  )
  $dir = Get-MonitorBudgetLogDir $LogDir
  $csv = Join-Path $dir 'mem-timeline.csv'
  if (-not (Test-Path $csv)) { return $null }
  try {
    $rows = @(Get-Content $csv -ErrorAction SilentlyContinue | Select-Object -Skip 1 | Where-Object { $_.Trim() })
    if ($rows.Count -lt 1) { return $null }
    $parsed = $null
    for ($i = $rows.Count - 1; $i -ge 0; $i--) {
      $cand = Parse-TimelineHeartbeatRow -Line $rows[$i]
      if (-not $cand) { continue }
      if ($MatchPid -and $cand.pid -ne $MatchPid) { continue }
      $parsed = $cand
      break
    }
    if (-not $parsed) { return $null }
    $ageMin = ((Get-Date) - $parsed.ts).TotalMinutes
    if ($ageMin -gt $StaleFallbackMaxAgeMin) { return $null }
    return @{
      pid = $parsed.pid
      pssMb = $parsed.pssMb
      glMb = $parsed.glMb
      views = $parsed.views
      ageMin = [math]::Round($ageMin, 1)
      stale = ($ageMin -gt $MaxAgeMin)
      source = 'mem-timeline'
    }
  } catch {
    return $null
  }
}
