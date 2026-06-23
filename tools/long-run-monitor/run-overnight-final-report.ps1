# Watch session final report (read-only + markdown output)
param(
  [string]$Package = 'com.arcfire.online',
  [string]$ReportPath = '',
  [string]$TimelineMarker = 'OVERNIGHT_WATCH_START',
  [string]$ReportTitle = 'Arcfire watch — final report (KST)'
)

$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
if (-not $ReportPath) {
  $ReportPath = Join-Path $logDir 'overnight-final-report-2026-06-23.md'
}

function Get-KstNow {
  return (Get-Date).ToUniversalTime().AddHours(9)
}

function Get-LinesAfter([string]$path, [string]$marker) {
  if (-not (Test-Path $path)) { return @() }
  $all = Get-Content $path -ErrorAction SilentlyContinue
  $idx = -1
  for ($i = 0; $i -lt $all.Count; $i++) {
    if ($all[$i] -match [regex]::Escape($marker)) { $idx = $i; break }
  }
  if ($idx -lt 0) { return @($all | Select-Object -Last 40) }
  return @($all[$idx..($all.Count - 1)])
}

$kst = Get-KstNow
$lines = @()
$lines += "# $ReportTitle"
$lines += ""
$lines += "Generated (KST): $($kst.ToString('yyyy-MM-dd HH:mm:ss'))"
$lines += "Package: $Package"
$lines += ""

# App alive + mem
$pidApp = (adb shell "pidof $Package" 2>$null).ToString().Trim()
$lines += "## Runtime"
$lines += ""
if ($pidApp) {
  $raw = adb shell dumpsys meminfo $Package 2>&1 | Out-String
  $pss = if ($raw -match 'TOTAL PSS:\s+(\d+)') { [math]::Round([int]$Matches[1] / 1024, 1) } else { '?' }
  $gl = if ($raw -match '(?m)^\s*GL mtrack\s+(\d+)') { [math]::Round([int]$Matches[1] / 1024, 1) } else { '?' }
  $views = if ($raw -match 'Views:\s+(\d+)') { $Matches[1] } else { '?' }
  $lines += "| pid | PSS (MB) | GL (MB) | Views |"
  $lines += "|-----|----------|---------|-------|"
  $lines += "| $pidApp | $pss | $gl | $views |"
} else {
  $lines += "**APP_NOT_RUNNING** at report time."
}
$lines += ""

# Timeline since overnight start
$timeline = Join-Path $logDir 'mem-timeline.csv'
$tlRows = Get-LinesAfter $timeline $TimelineMarker
$lines += "## mem-timeline (since $TimelineMarker)"
$lines += ""
$lines += '```csv'
$lines += ($tlRows | Select-Object -Last 30) -join "`n"
$lines += '```'
$lines += ""

# Incidents / remediation / alerts
foreach ($pair in @(
  @('incidents.log', '## incidents.log (tail)'),
  @('remediation.log', '## remediation.log (tail)'),
  @('mem-alerts.log', '## mem-alerts.log (tail)')
)) {
  $p = Join-Path $logDir $pair[0]
  $lines += $pair[1]
  $lines += ""
  $lines += '```'
  $tail = Get-Content $p -Tail 25 -ErrorAction SilentlyContinue
  if ($tail) { $lines += ($tail -join "`n") } else { $lines += '(empty)' }
  $lines += '```'
  $lines += ""
}

# KPI summary
$hard = @(Get-Content (Join-Path $logDir 'incidents.log') -ErrorAction SilentlyContinue | Where-Object { $_ -match 'GL_HARD_CEILING' })
$crash = @(Get-Content (Join-Path $logDir 'incidents.log') -ErrorAction SilentlyContinue | Where-Object { $_ -match 'CRASH|SIGSEGV|PROCESS_DEATH' })
$refix = @(Get-Content (Join-Path $logDir 'remediation.log') -ErrorAction SilentlyContinue | Where-Object { $_ -match 'AUTO_FIX app relaunch' })
$lines += "## KPI (overnight window)"
$lines += ""
$lines += "| Metric | Count |"
$lines += "|--------|-------|"
$lines += "| GL_HARD_CEILING incidents | $($hard.Count) |"
$lines += "| Crash / PROCESS_DEATH | $($crash.Count) |"
$lines += "| Auto app relaunch | $($refix.Count) |"
$lines += ""
$lines += "## Action items for Kim Team Lead"
$lines += ""
$lines += "1. GL_HARD_CEILING or 3x GL_SPIKE → P0 hub Skia audit (see overnight-watch handoff)."
$lines += "2. SIGSEGV/FATAL → arcfire-bug-debug-workflow + logcat tail in latest crash-*.log."
$lines += "3. Stair-step floor rise without crash → today's dev P0 list in overnight-watch handoff."
$lines += ""

$text = $lines -join "`n"
Set-Content -Path $ReportPath -Value $text -Encoding utf8
Write-Output "WROTE $ReportPath"
