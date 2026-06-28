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

function Get-TimelineHeartbeatMetrics {
  param(
    [string]$LogDir = '',
    [int]$MaxAgeMin = 20
  )
  $dir = Get-MonitorBudgetLogDir $LogDir
  $csv = Join-Path $dir 'mem-timeline.csv'
  if (-not (Test-Path $csv)) { return $null }
  try {
    $rows = @(Get-Content $csv -ErrorAction SilentlyContinue | Select-Object -Skip 1 | Where-Object { $_.Trim() })
    if ($rows.Count -lt 1) { return $null }
    $last = ($rows[-1] -split ',')
    if ($last.Count -lt 11) { return $null }
    $iso = $last[0]
    $ts = [datetime]::Parse($iso)
    $ageMin = ((Get-Date) - $ts).TotalMinutes
    if ($ageMin -gt $MaxAgeMin) { return $null }
    return @{
      pid = $last[1]
      pssMb = $last[2]
      glMb = $last[4]
      views = $last[10]
      ageMin = [math]::Round($ageMin, 1)
      source = 'mem-timeline'
    }
  } catch {
    return $null
  }
}
