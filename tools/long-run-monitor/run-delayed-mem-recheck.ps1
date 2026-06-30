# 2h delayed memory recheck — adb snapshot + baseline compare + report
param(
  [double]$DelayHours = 2,
  [string]$Package = 'com.arcfire.online',
  [string]$BaselineTag = '2026-06-30_1943'
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$reportPath = Join-Path $logDir ("mem-recheck-delayed-{0}.md" -f (Get-Date -Format 'yyyyMMdd-HHmm'))
$pendingChat = Join-Path $logDir 'CHAT_REPORT_PENDING.md'

$baseline = @{
  pss_mb = 706.2
  gl_mb = 35.2
  native_mb = 257.8
  views = 392
}

$thresholds = @{
  pss_soft = 800
  pss_hard = 950
  gl_idle = 55
  gl_spike = 120
  views_dup = 450
  native_warn = 400
}

function Write-ReportLine([string]$Line) {
  Add-Content -Path $reportPath -Value $Line -Encoding utf8
}

$scheduledAt = Get-Date
$targetAt = $scheduledAt.AddHours($DelayHours)
$delaySec = [math]::Max(1, [int]($DelayHours * 3600))

Write-Host "[mem-recheck] scheduled=$($scheduledAt.ToString('yyyy-MM-dd HH:mm:ss K')) target=$($targetAt.ToString('yyyy-MM-dd HH:mm:ss K'))"

Write-ReportLine '# Delayed Memory Recheck Report'
Write-ReportLine ''
Write-ReportLine "- Scheduled: $($scheduledAt.ToString('yyyy-MM-dd HH:mm:ss K'))"
Write-ReportLine "- Target: $($targetAt.ToString('yyyy-MM-dd HH:mm:ss K'))"
Write-ReportLine "- Baseline: $BaselineTag PSS $($baseline.pss_mb) GL $($baseline.gl_mb) Views $($baseline.views)"
Write-ReportLine ''

Start-Sleep -Seconds $delaySec

$checkedAt = Get-Date
$adbOk = $false
$appPid = ''
$issues = New-Object System.Collections.Generic.List[string]
$verdict = 'OK'

$devices = (adb devices 2>&1 | Out-String)
if ($devices -notmatch "`tdevice") {
  $verdict = 'FAIL'
  [void]$issues.Add('adb not connected')
} else {
  $adbOk = $true
  $appPid = (adb shell "pidof $Package" 2>$null).ToString().Trim()
  if (-not $appPid) {
    $verdict = 'WARN'
    [void]$issues.Add('app not running')
  }
}

if ($adbOk -and $appPid) {
  $raw = (adb shell dumpsys meminfo $Package 2>&1 | Out-String)
  $pssKb = 0; $glKb = 0; $natKb = 0; $views = 0
  if ($raw -match 'TOTAL PSS:\s+(\d+)') { $pssKb = [int]$Matches[1] }
  if ($raw -match '(?m)^\s*GL mtrack\s+(\d+)') { $glKb = [int]$Matches[1] }
  if ($raw -match '(?m)^\s*Native Heap:\s+(\d+)') { $natKb = [int]$Matches[1] }
  if ($raw -match 'Views:\s+(\d+)') { $views = [int]$Matches[1] }

  $pssMb = [math]::Round($pssKb / 1024, 1)
  $glMb = [math]::Round($glKb / 1024, 1)
  $natMb = [math]::Round($natKb / 1024, 1)

  $dPss = [math]::Round($pssMb - $baseline.pss_mb, 1)
  $dGl = [math]::Round($glMb - $baseline.gl_mb, 1)
  $dNat = [math]::Round($natMb - $baseline.native_mb, 1)
  $dViews = $views - $baseline.views

  if ($pssMb -ge $thresholds.pss_hard) { $verdict = 'FAIL'; [void]$issues.Add("PSS HARD >= $($thresholds.pss_hard)MB ($pssMb MB)") }
  elseif ($pssMb -ge $thresholds.pss_soft) { if ($verdict -eq 'OK') { $verdict = 'WARN' }; [void]$issues.Add("PSS soft >= $($thresholds.pss_soft)MB") }
  if ($glMb -ge $thresholds.gl_spike) { $verdict = 'FAIL'; [void]$issues.Add("GL spike >= $($thresholds.gl_spike)MB ($glMb MB)") }
  elseif ($glMb -ge $thresholds.gl_idle) { if ($verdict -eq 'OK') { $verdict = 'WARN' }; [void]$issues.Add("GL idle high >= $($thresholds.gl_idle)MB") }
  if ($views -ge $thresholds.views_dup) { $verdict = 'FAIL'; [void]$issues.Add("Views duplicate >= $($thresholds.views_dup) ($views)") }
  if ($natMb -ge $thresholds.native_warn) { if ($verdict -eq 'OK') { $verdict = 'WARN' }; [void]$issues.Add("Native floor >= $($thresholds.native_warn)MB") }
  if ($dPss -ge 150) { if ($verdict -eq 'OK') { $verdict = 'WARN' }; [void]$issues.Add("PSS delta vs 19:43 +$dPss MB") }

  $timelineCsv = Join-Path $logDir 'mem-timeline.csv'
  $recentLines = @()
  if (Test-Path $timelineCsv) {
    $recentLines = Get-Content $timelineCsv -Tail 12 -ErrorAction SilentlyContinue
  }

  Write-ReportLine "## Checked: $($checkedAt.ToString('yyyy-MM-dd HH:mm:ss K'))"
  Write-ReportLine ''
  Write-ReportLine '| Metric | Now | 19:43 | Delta |'
  Write-ReportLine '|--------|-----|-------|-------|'
  Write-ReportLine "| PSS | $pssMb MB | $($baseline.pss_mb) MB | $dPss MB |"
  Write-ReportLine "| GL | $glMb MB | $($baseline.gl_mb) MB | $dGl MB |"
  Write-ReportLine "| Native | $natMb MB | $($baseline.native_mb) MB | $dNat MB |"
  Write-ReportLine "| Views | $views | $($baseline.views) | $dViews |"
  Write-ReportLine "| PID | $appPid | 22472 | - |"
  Write-ReportLine ''
  Write-ReportLine "**Verdict: $verdict**"
  Write-ReportLine ''
  Write-ReportLine '### Issues'
  if ($issues.Count -gt 0) {
    foreach ($i in $issues) { Write-ReportLine "- $i" }
  } else {
    Write-ReportLine '- none'
  }
  Write-ReportLine ''
  Write-ReportLine '### mem-timeline tail'
  Write-ReportLine '```'
  foreach ($ln in $recentLines) { Write-ReportLine $ln }
  Write-ReportLine '```'

  & (Join-Path $ScriptRoot 'manual-mem-snapshot.ps1') -Note "DELAYED_RECHECK_$verdict" | Out-Null
} else {
  Write-ReportLine "## Checked: $($checkedAt.ToString('yyyy-MM-dd HH:mm:ss K'))"
  Write-ReportLine ''
  Write-ReportLine "**Verdict: $verdict**"
  Write-ReportLine ''
  foreach ($i in $issues) { Write-ReportLine "- $i" }
}

$latest = Join-Path $logDir 'MEM_RECHECK_DELAYED_LATEST.md'
Copy-Item -Path $reportPath -Destination $latest -Force

@"
# Chat report pending - delayed mem recheck
generated: $($checkedAt.ToString('yyyy-MM-dd HH:mm:ss K'))
verdict: $verdict
report: $reportPath
"@ | Set-Content -Path $pendingChat -Encoding utf8

Write-Host "[mem-recheck] done verdict=$verdict report=$reportPath"
