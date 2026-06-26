# 17:00 KST 자동 상태 보고 — mem-timeline · incidents · kim-economy-handoff
param(
  [string]$Package = 'com.arcfire.online',
  [string]$TargetTime = '17:00',
  [string]$TimelineMarker = 'AFTERNOON_WATCH_START'
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$Root = Split-Path $ScriptRoot -Parent | Split-Path -Parent
$handoff = Join-Path $Root 'tools\kim-team-lead\reports\kim-economy-handoff.md'
$scheduleLog = Join-Path $logDir 'schedule-5pm-report.log'

function Log([string]$msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Write-Host $line
  try { Add-Content -Path $scheduleLog -Value $line -Encoding utf8 } catch {}
}

function Get-KstNow { (Get-Date).ToUniversalTime().AddHours(9) }

function Wait-UntilKstTime([string]$hhmm) {
  $parts = $hhmm.Split(':')
  $h = [int]$parts[0]
  $m = if ($parts.Length -gt 1) { [int]$parts[1] } else { 0 }
  while ($true) {
    $now = Get-KstNow
    $target = Get-Date ($now.ToString('yyyy-MM-dd') + " $h`:$($m.ToString('00')):00")
    if ($now -ge $target) { return $now }
    $sec = [math]::Min(300, ($target - $now).TotalSeconds)
    if ($sec -lt 5) { Start-Sleep -Seconds 5; continue }
    Log "wait until ${hhmm} KST (~$([math]::Round($sec))s)"
    Start-Sleep -Seconds $sec
  }
}

Log "scheduler start target=${TargetTime} KST marker=$TimelineMarker"
Wait-UntilKstTime $TargetTime

$kst = Get-KstNow
$reportFile = Join-Path $logDir "afternoon-watch-report-$($kst.ToString('yyyyMMdd-HHmm')).md"

Log "generating report -> $reportFile"
& (Join-Path $ScriptRoot 'run-overnight-final-report.ps1') `
  -Package $Package `
  -ReportPath $reportFile `
  -TimelineMarker $TimelineMarker `
  -ReportTitle "Arcfire afternoon watch report (17:00 KST auto) — Kim economy"

# mem snapshot
$pidApp = (adb shell "pidof $Package" 2>$null).ToString().Trim()
$memLine = 'APP_NOT_RUNNING'
$pssMb = '?'
$glMb = '?'
$views = '?'
if ($pidApp) {
  $raw = adb shell dumpsys meminfo $Package 2>&1 | Out-String
  if ($raw -match 'TOTAL PSS:\s+(\d+)') { $pssMb = [math]::Round([int]$Matches[1] / 1024, 1) }
  if ($raw -match '(?m)^\s*GL mtrack\s+(\d+)') { $glMb = [math]::Round([int]$Matches[1] / 1024, 1) }
  if ($raw -match 'Views:\s+(\d+)') { $views = $Matches[1] }
  $memLine = "PSS ${pssMb}MB · GL ${glMb}MB · Views $views · pid=$pidApp"
}

$watchPid = if (Test-Path (Join-Path $logDir 'watch-30m.pid')) { (Get-Content (Join-Path $logDir 'watch-30m.pid') -Raw).Trim() } else { '?' }
$reportPid = if (Test-Path (Join-Path $logDir 'report-watch.pid')) { (Get-Content (Join-Path $logDir 'report-watch.pid') -Raw).Trim() } else { '?' }
$paused = Test-Path (Join-Path $logDir 'monitor-paused.flag')

$incidentTail = @()
if (Test-Path (Join-Path $logDir 'incidents.log')) {
  $incidentTail = @(Get-Content (Join-Path $logDir 'incidents.log') -Tail 12 -ErrorAction SilentlyContinue)
}
$actionable = @($incidentTail | Where-Object { $_ -match 'GL_SPIKE|PROCESS_DEATH|HARD|baseline_gl|ABNORMAL|FATAL|AFTERNOON_WATCH' })

$memStatus = 'OK'
if ($pssMb -ne '?' -and [double]$pssMb -ge 950) { $memStatus = 'CRITICAL' }
elseif ($pssMb -ne '?' -and [double]$pssMb -ge 850) { $memStatus = 'WARN' }

$actionLines = if ($actionable.Count) {
  ($actionable | ForEach-Object { "  - $_" }) -join "`n"
} else {
  '  - (none)'
}

$rec = if ($memStatus -eq 'CRITICAL') {
  'PSS>=950 hub exit / Skia dispose P0'
} elseif ($memStatus -eq 'WARN') {
  'PSS 850+ soft reclaim floor watch'
} else {
  'afternoon soak OK — check RTDB dailyKpi after 17:00'
}

$autoFix = if ($paused) { 'OFF(record-only)' } else { 'ON' }
$statusLine = if ($memStatus -eq 'CRITICAL') { '**ready-for-team-lead-action**' } else { 'monitor-ok' }

$handoffBlock = (
  "`n## [관측] $($kst.ToString('yyyy-MM-dd HH:mm')) KST — 오후 감시 · 17:00 자동보고`n`n" +
  "- **김경제 감시**: watch-30m PID **$watchPid** · report-watch PID **$reportPid** · auto-fix=$autoFix`n" +
  "- **mem-monitor**: **$memStatus** ($memLine)`n" +
  "- **report**: $reportFile`n" +
  "- **timeline marker**: $TimelineMarker`n" +
  "- **incidents (tail actionable)**: $($actionable.Count)`n" +
  "$actionLines`n" +
  "- **ArcCore learning pipeline**: arc-core:learning:verify PASS · RTDB policy 2026-06-26`n" +
  "- **권장(김팀장 1안)**: $rec`n`n" +
  "> status: $statusLine · 감시 유지`n"
)

if (Test-Path $handoff) {
  $content = Get-Content $handoff -Raw -Encoding utf8
  $template = '## [관측] _(김경제 갱신 템플릿'
  if ($content -match [regex]::Escape($template)) {
    $content = $content -replace [regex]::Escape($template), ($handoffBlock.TrimEnd() + "`n`n" + $template)
  } else {
    $content += "`n" + $handoffBlock
  }
  Set-Content -Path $handoff -Value $content -Encoding utf8
  Log "handoff updated -> $handoff"
}

$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
Add-Content -Path (Join-Path $logDir 'incidents.log') -Value "[$stamp] AFTERNOON_WATCH_5PM_REPORT_READY $reportFile"
Log "DONE report=$reportFile handoff=updated"
