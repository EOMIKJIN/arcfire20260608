# 5h hub soak — 종료 시 mem-timeline + correlation 분석 리포트
param(
  [string]$SessionJson = '',
  [string]$LogDir = ''
)

$ScriptRoot = $PSScriptRoot
if (-not $LogDir) { $LogDir = Join-Path $ScriptRoot 'logs' }
if (-not $SessionJson) {
  $SessionJson = Get-ChildItem (Join-Path $LogDir 'soak-5h-session-*.json') -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1 -ExpandProperty FullName
}
if (-not $SessionJson -or -not (Test-Path $SessionJson)) {
  Write-Error 'No soak session JSON found. Run start-soak-5h-watch.ps1 first.'
  exit 1
}

$session = Get-Content $SessionJson -Raw | ConvertFrom-Json
$timelineCsv = Join-Path $LogDir 'mem-timeline.csv'
$corrCsv = Join-Path $LogDir $session.correlationCsv
$incidentLog = Join-Path $LogDir 'incidents.log'
$remediationLog = Join-Path $LogDir 'remediation.log'
$reportPath = Join-Path $LogDir ("soak-5h-report-{0}.md" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
$startedAt = [datetime]::ParseExact($session.startedAtKst, 'yyyy-MM-dd HH:mm:ss', $null)

function Parse-Dt([string]$s) {
  if (-not $s) { return $null }
  try { return [datetime]::ParseExact($s.Trim(), 'yyyy-MM-dd HH:mm:ss', $null) } catch { return $null }
}

function InSession([datetime]$t) {
  return $t -ge $startedAt
}

# --- timeline rows in session ---
$timelineRows = @()
if (Test-Path $timelineCsv) {
  $lines = Get-Content $timelineCsv -ErrorAction SilentlyContinue | Select-Object -Skip 1
  foreach ($line in $lines) {
    if (-not $line) { continue }
    $c = $line -split ','
    if ($c.Count -lt 3) { continue }
    $t = Parse-Dt $c[0]
    if (-not $t -or -not (InSession $t)) { continue }
    $timelineRows += [pscustomobject]@{
      Time     = $c[0]
      Pid      = $c[1]
      PssMb    = [double]$c[2]
      GlMb     = if ($c[4]) { [double]$c[4] } else { 0 }
      NativeMb = if ($c.Count -ge 8 -and $c[7]) { [double]$c[7] } else { 0 }
      Views    = if ($c.Count -ge 11 -and $c[10] -match '^\d') { [int]$c[10] } else { 0 }
      Note     = if ($c.Count -ge 14) { ($c[13..($c.Count - 1)] -join ',') } else { '' }
    }
  }
}

# --- correlation rows ---
$corrRows = @()
if (Test-Path $corrCsv) {
  $lines = Get-Content $corrCsv -ErrorAction SilentlyContinue | Select-Object -Skip 1
  foreach ($line in $lines) {
    if (-not $line) { continue }
    $c = $line -split ','
    if ($c.Count -lt 3) { continue }
    $t = Parse-Dt $c[0]
    if (-not $t -or -not (InSession $t)) { continue }
    if (-not $c[2]) { continue }
    $corrRows += [pscustomobject]@{
      Time     = $c[0]
      Pid      = $c[1]
      PssMb    = [double]$c[2]
      GlMb     = if ($c[3]) { [double]$c[3] } else { 0 }
      NativeMb = if ($c[4]) { [double]$c[4] } else { 0 }
      UnknownMb = if ($c.Count -ge 7 -and $c[6]) { [double]$c[6] } else { 0 }
      Views    = if ($c.Count -ge 8 -and $c[7] -match '^\d') { [int]$c[7] } else { 0 }
    }
  }
}

$allPss = @($timelineRows | ForEach-Object { $_.PssMb }) + @($corrRows | ForEach-Object { $_.PssMb }) | Where-Object { $_ -gt 0 }
$allNative = @($timelineRows | ForEach-Object { $_.NativeMb }) + @($corrRows | ForEach-Object { $_.NativeMb }) | Where-Object { $_ -gt 0 }
$allGl = @($timelineRows | ForEach-Object { $_.GlMb }) + @($corrRows | ForEach-Object { $_.GlMb }) | Where-Object { $_ -gt 0 }

$pids = @($timelineRows + $corrRows | ForEach-Object { $_.Pid } | Where-Object { $_ } | Select-Object -Unique)

# floor estimate: 20th percentile of PSS (GC valley proxy)
function Percentile([double[]]$arr, [double]$p) {
  if ($arr.Count -eq 0) { return 0 }
  $sorted = $arr | Sort-Object
  $idx = [math]::Floor(($sorted.Count - 1) * $p)
  return $sorted[[int]$idx]
}

$floorPss = Percentile @($allPss) 0.2
$peakPss = if ($allPss.Count) { ($allPss | Measure-Object -Maximum).Maximum } else { 0 }
$endRow = if ($corrRows.Count) { $corrRows[-1] } elseif ($timelineRows.Count) { $timelineRows[-1] } else { $null }
$startRow = if ($timelineRows.Count) { ($timelineRows | Where-Object { $_.Note -match 'SOAK5H' } | Select-Object -First 1) } else { $null }
if (-not $startRow -and $timelineRows.Count) { $startRow = $timelineRows[0] }

$floorCreep = if ($startRow -and $endRow) { $endRow.PssMb - $floorPss } else { 0 }
$hardCeiling = @($timelineRows | Where-Object { $_.Note -match 'GL_HARD|985|950' -or $_.PssMb -ge 950 }).Count

# incidents in window
$incidents = @()
if (Test-Path $incidentLog) {
  foreach ($line in Get-Content $incidentLog -ErrorAction SilentlyContinue) {
    if ($line -notmatch '^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]') { continue }
    $t = Parse-Dt $Matches[1]
    if ($t -and (InSession $t)) { $incidents += $line.Trim() }
  }
}

$autoRestarts = @($incidents | Where-Object { $_ -match 'GL_HARD_CEILING|AUTO_FIX app relaunch|PROCESS_DEATH' }).Count
$glHard = @($incidents | Where-Object { $_ -match 'GL_HARD_CEILING' }).Count

$passFloor = $floorCreep -le [double]$session.passCriteria.floorCreepMaxMb
$passCeiling = $glHard -eq 0
$verdict = if ($passFloor -and $passCeiling -and $autoRestarts -eq 0) { 'PASS' } elseif ($glHard -gt 0 -or $peakPss -ge 950) { 'FAIL (hard ceiling / restart)' } else { 'WARN (floor creep or GC sawtooth)' }

$md = @"
# 5h Hub Soak Report — $($session.session)

Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') KST  
Session start: $($session.startedAtKst)  
Scenario: $($session.scenario)

## Verdict: **$verdict**

| Gate | Criteria | Result |
|------|----------|--------|
| PSS floor creep (end vs P20 floor) | ≤ $($session.passCriteria.floorCreepMaxMb) MB | **$([math]::Round($floorCreep, 1)) MB** $(if ($passFloor) { '✓' } else { '✗' }) |
| GL_HARD_CEILING / PSS≥950 | 0 events | **$glHard** $(if ($passCeiling) { '✓' } else { '✗' }) |
| Auto restart during session | 0 | **$autoRestarts** $(if ($autoRestarts -eq 0) { '✓' } else { '✗' }) |

## Applied fixes (this soak)

$(($session.appliedFixes | ForEach-Object { "- $_" }) -join "`n")

## Memory summary

| Metric | Start | End | Min (floor proxy) | Max (peak) |
|--------|-------|-----|-------------------|------------|
| PSS MB | $(if ($startRow) { $startRow.PssMb } else { 'n/a' }) | $(if ($endRow) { $endRow.PssMb } else { 'n/a' }) | $([math]::Round($floorPss, 1)) (P20) | $([math]::Round($peakPss, 1)) |
| GL MB | $(if ($startRow) { $startRow.GlMb } else { 'n/a' }) | $(if ($endRow) { $endRow.GlMb } else { 'n/a' }) | $([math]::Round((Percentile @($allGl) 0.2), 1)) | $([math]::Round(($allGl | Measure-Object -Maximum).Maximum, 1)) |
| Native MB | $(if ($startRow) { $startRow.NativeMb } else { 'n/a' }) | $(if ($endRow) { $endRow.NativeMb } else { 'n/a' }) | $([math]::Round((Percentile @($allNative) 0.2), 1)) | $([math]::Round(($allNative | Measure-Object -Maximum).Maximum, 1)) |
| PID(s) | $(if ($startRow) { $startRow.Pid } else { 'n/a' }) | $(if ($endRow) { $endRow.Pid } else { 'n/a' }) | — | unique: $($pids -join ', ') |

Samples: timeline=$($timelineRows.Count), correlation(10m)=$($corrRows.Count)

## 10m correlation tail (last 8)

``````csv
iso_time,pid,pss_mb,gl_mb,native_mb,unknown_mb,views
$(($corrRows | Select-Object -Last 8 | ForEach-Object { "$($_.Time),$($_.Pid),$($_.PssMb),$($_.GlMb),$($_.NativeMb),$($_.UnknownMb),$($_.Views)" }) -join "`n")
``````

## Incidents in session window

$(if ($incidents.Count -eq 0) { '_None_' } else { ($incidents | ForEach-Object { "- $_" }) -join "`n" })

## Interpretation

- **GC sawtooth**: large peak↔valley swings with GL flat → transient allocation (not necessarily leak).
- **True floor creep**: P20(min valley) rises over session while GL stable → native/JS retention (leak suspect).
- **Hard ceiling**: PSS≥950 → monitor force-stop (session invalid for leak test if occurred).

Run again: ``powershell -File tools/long-run-monitor/report-soak-5h.ps1``
"@

Set-Content -Path $reportPath -Value $md -Encoding utf8
Write-Host $md
Write-Host ""
Write-Host "Report written: $reportPath"
