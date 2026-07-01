# PSS / memory management scheduled recheck + chat report (ASCII-safe)
param(
  [string]$TargetTime = '23:30',
  [string]$Package = 'com.arcfire.online',
  [string]$BaselineNote = 'PSS_MGMT_BASELINE_2230'
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$reportPath = Join-Path $logDir ("pss-mgmt-report-{0}.md" -f (Get-Date -Format 'yyyyMMdd-HHmm'))
$latestPath = Join-Path $logDir 'PSS_MGMT_REPORT_LATEST.md'
$pendingChat = Join-Path $logDir 'CHAT_REPORT_PENDING.md'
$timelineCsv = Join-Path $logDir 'mem-timeline.csv'

$thresholds = @{
  pss_soft = 800
  pss_hard = 950
  gl_idle = 55
  gl_spike = 120
  views_dup = 450
  pss_floor_delta_fail = 40
}

function Get-NextTarget([string]$hhmm) {
  $parts = $hhmm -split ':'
  $h = [int]$parts[0]
  $m = [int]$parts[1]
  $now = Get-Date
  $target = Get-Date -Year $now.Year -Month $now.Month -Day $now.Day -Hour $h -Minute $m -Second 0
  if ($target -le $now) { $target = $target.AddDays(1) }
  return $target
}

function Parse-MemSnapshot([string]$raw) {
  $o = @{ PssKb = 0; GlKb = 0; NatKb = 0; Views = 0; JavaKb = 0; EglKb = 0 }
  if ($raw -match 'TOTAL PSS:\s+(\d+)') { $o.PssKb = [int]$Matches[1] }
  if ($raw -match '(?m)^\s*GL mtrack\s+(\d+)') { $o.GlKb = [int]$Matches[1] }
  if ($raw -match '(?m)^\s*Native Heap:\s+(\d+)') { $o.NatKb = [int]$Matches[1] }
  if ($raw -match 'Views:\s+(\d+)') { $o.Views = [int]$Matches[1] }
  if ($raw -match 'Java Heap:\s+(\d+)') { $o.JavaKb = [int]$Matches[1] }
  if ($raw -match '(?m)^\s*EGL mtrack\s+(\d+)') { $o.EglKb = [int]$Matches[1] }
  return $o
}

function Get-BaselineFromTimeline([string]$note) {
  if (-not (Test-Path $timelineCsv)) { return $null }
  $rows = Get-Content $timelineCsv | Where-Object { $_ -match [regex]::Escape($note) } | Select-Object -Last 1
  if (-not $rows) { return $null }
  $c = $rows -split ','
  return @{
    iso = $c[0]; pid = $c[1]; pss = [double]$c[2]; gl = [double]$c[4]
    nat = [double]$c[7]; views = [int]$c[10]; note = $note
  }
}

$scheduledAt = Get-Date
$targetAt = Get-NextTarget $TargetTime
$waitSec = [math]::Max(1, [int](($targetAt - $scheduledAt).TotalSeconds))

Write-Host ("[pss-mgmt] scheduled={0} target={1} waitSec={2}" -f `
  $scheduledAt.ToString('yyyy-MM-dd HH:mm:ss K'), `
  $targetAt.ToString('yyyy-MM-dd HH:mm:ss K'), `
  $waitSec)

$baseline = Get-BaselineFromTimeline $BaselineNote
if (-not $baseline) {
  $baseline = @{ iso = 'unknown'; pid = '?'; pss = 862.5; gl = 148.8; nat = 321.2; views = 369; note = $BaselineNote }
}

Start-Sleep -Seconds $waitSec

$checkedAt = Get-Date
$issues = New-Object System.Collections.Generic.List[string]
$verdict = 'OK'
$releaseOk = $true

$devices = (adb devices 2>&1 | Out-String)
if ($devices -notmatch "`tdevice") {
  $verdict = 'FAIL'
  [void]$issues.Add('adb not connected')
  $releaseOk = $false
} else {
  $appPid = (adb shell "pidof $Package" 2>$null).ToString().Trim()
  if (-not $appPid) {
    $verdict = 'FAIL'
    [void]$issues.Add('app process not running')
    $releaseOk = $false
  } else {
    $raw = (adb shell dumpsys meminfo $Package 2>&1 | Out-String)
    $m = Parse-MemSnapshot $raw
    $pssMb = [math]::Round($m.PssKb / 1024, 1)
    $glMb = [math]::Round($m.GlKb / 1024, 1)
    $natMb = [math]::Round($m.NatKb / 1024, 1)
    $javaMb = [math]::Round($m.JavaKb / 1024, 1)
    $eglMb = [math]::Round($m.EglKb / 1024, 1)
    $views = $m.Views

    $dPss = [math]::Round($pssMb - $baseline.pss, 1)
    $dGl = [math]::Round($glMb - $baseline.gl, 1)
    $dNat = [math]::Round($natMb - $baseline.nat, 1)
    $dViews = $views - $baseline.views

    if ($pssMb -ge $thresholds.pss_hard) {
      $verdict = 'FAIL'; $releaseOk = $false
      [void]$issues.Add(('PSS HARD ge {0}MB actual={1}MB' -f $thresholds.pss_hard, $pssMb))
    } elseif ($pssMb -ge $thresholds.pss_soft) {
      if ($verdict -eq 'OK') { $verdict = 'WARN' }
      [void]$issues.Add(('PSS soft ge {0}MB actual={1}MB' -f $thresholds.pss_soft, $pssMb))
    }

    if ($glMb -ge $thresholds.gl_spike) {
      $verdict = 'FAIL'; $releaseOk = $false
      [void]$issues.Add(('GL not recovered ge {0}MB actual={1}MB' -f $thresholds.gl_spike, $glMb))
    } elseif ($glMb -ge $thresholds.gl_idle) {
      if ($verdict -eq 'OK') { $verdict = 'WARN' }
      [void]$issues.Add(('GL idle high ge {0}MB actual={1}MB' -f $thresholds.gl_idle, $glMb))
    }

    if ($views -ge $thresholds.views_dup) {
      $verdict = 'FAIL'; $releaseOk = $false
      [void]$issues.Add(('Views duplicate ge {0} count={1}' -f $thresholds.views_dup, $views))
    }

    if ($dPss -ge $thresholds.pss_floor_delta_fail) {
      if ($verdict -eq 'OK') { $verdict = 'WARN' }
      if ($dPss -ge 80) { $verdict = 'FAIL'; $releaseOk = $false }
      [void]$issues.Add(('PSS floor delta +{0}MB vs baseline (fail threshold +{1}MB)' -f $dPss, $thresholds.pss_floor_delta_fail))
    }

    if ($dGl -gt 5 -and $glMb -ge $thresholds.gl_idle) {
      [void]$issues.Add(('GL still elevated delta +{0}MB' -f $dGl))
      $releaseOk = $false
    } elseif ($dGl -le -10 -and $glMb -lt $thresholds.gl_idle) {
      [void]$issues.Add(('GL recovered ok actual={0}MB delta={1}MB' -f $glMb, $dGl))
    }

    if ($dNat -ge 30) {
      if ($verdict -eq 'OK') { $verdict = 'WARN' }
      [void]$issues.Add(('Native heap floor +{0}MB' -f $dNat))
    }

    & (Join-Path $ScriptRoot 'manual-mem-snapshot.ps1') -Note ("PSS_MGMT_RECHECK_{0}" -f $verdict) | Out-Null

    $recentTail = @()
    if (Test-Path $timelineCsv) { $recentTail = Get-Content $timelineCsv -Tail 8 -ErrorAction SilentlyContinue }

    $pidNote = 'same'
    if ($baseline.pid -ne $appPid) { $pidNote = 'CHANGED' }

    $lines = New-Object System.Collections.Generic.List[string]
    [void]$lines.Add('# PSS Memory Management Review')
    [void]$lines.Add('')
    [void]$lines.Add(('Checked: {0}' -f $checkedAt.ToString('yyyy-MM-dd HH:mm K')))
    [void]$lines.Add(('Verdict: {0} | Release path OK: {1}' -f $verdict, $(if ($releaseOk) { 'YES' } else { 'NO' })))
    [void]$lines.Add('')
    [void]$lines.Add('## Baseline vs Recheck')
    [void]$lines.Add('')
    [void]$lines.Add('| Metric | Baseline | Now | Delta |')
    [void]$lines.Add('|--------|----------|-----|-------|')
    [void]$lines.Add(('| PSS | {0} MB | {1} MB | {2} MB |' -f $baseline.pss, $pssMb, $dPss))
    [void]$lines.Add(('| GL | {0} MB | {1} MB | {2} MB |' -f $baseline.gl, $glMb, $dGl))
    [void]$lines.Add(('| Native | {0} MB | {1} MB | {2} MB |' -f $baseline.nat, $natMb, $dNat))
    [void]$lines.Add(('| Java | - | {0} MB | - |' -f $javaMb))
    [void]$lines.Add(('| Views | {0} | {1} | {2} |' -f $baseline.views, $views, $dViews))
    [void]$lines.Add(('| PID | {0} | {1} | {2} |' -f $baseline.pid, $appPid, $pidNote))
    [void]$lines.Add('')
    [void]$lines.Add('## Issues')
    if ($issues.Count -eq 0) {
      [void]$lines.Add('- none')
    } else {
      foreach ($i in $issues) { [void]$lines.Add("- $i") }
    }
    [void]$lines.Add('')
    [void]$lines.Add('## mem-timeline tail')
    [void]$lines.Add('```')
    foreach ($ln in $recentTail) { [void]$lines.Add($ln) }
    [void]$lines.Add('```')

    Set-Content -Path $reportPath -Value ($lines -join "`n") -Encoding utf8
    Copy-Item -Path $reportPath -Destination $latestPath -Force

    $chat = @(
      '# Chat report pending - PSS memory management review',
      ('generated: {0}' -f $checkedAt.ToString('yyyy-MM-dd HH:mm:ss K')),
      ('verdict: {0}' -f $verdict),
      ('release_ok: {0}' -f $releaseOk),
      ('report: {0}' -f $reportPath),
      ('latest: {0}' -f $latestPath)
    ) -join "`n"
    Set-Content -Path $pendingChat -Value $chat -Encoding utf8

    Write-Host ("[pss-mgmt] done verdict={0} releaseOk={1} report={2}" -f $verdict, $releaseOk, $reportPath)
    exit 0
  }
}

$failLines = @(
  '# PSS Memory Management Review',
  ('Checked: {0}' -f $checkedAt.ToString('yyyy-MM-dd HH:mm K')),
  ('Verdict: {0}' -f $verdict)
)
foreach ($i in $issues) { $failLines += "- $i" }
Set-Content -Path $reportPath -Value ($failLines -join "`n") -Encoding utf8
Copy-Item -Path $reportPath -Destination $latestPath -Force
Write-Host ("[pss-mgmt] done verdict={0} (no app data)" -f $verdict)
