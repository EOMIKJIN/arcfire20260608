# 플레이테스트 세션 사후 분석 — 크래시 분류·GL floor·마일스톤 상관
param(
  [string]$SessionFile = '',
  [string]$LogDir = (Join-Path $PSScriptRoot 'logs'),
  [string]$ReportPath = ''
)

. (Join-Path $PSScriptRoot 'mem-gl-leak-rules.ps1')

function Get-KstNow { (Get-Date).ToUniversalTime().AddHours(9) }

if (-not $SessionFile) {
  $SessionFile = Join-Path $LogDir 'playtest-session-active.json'
}
if (-not (Test-Path $SessionFile)) {
  Write-Error "Session file not found: $SessionFile"
  exit 1
}

$sess = Get-Content $SessionFile -Raw | ConvertFrom-Json
$startedAt = [datetime]::Parse($sess.startedAtKst)
$endedAt = Get-KstNow
if ($sess.endedAtKst) { $endedAt = [datetime]::Parse($sess.endedAtKst) }

if (-not $ReportPath) {
  $tag = $sess.sessionId
  $ReportPath = Join-Path $LogDir "playtest-report-$tag.md"
}

$lines = @()
$lines += "# Arcfire playtest session report"
$lines += ""
$lines += "- **Session:** $($sess.sessionId)"
$lines += "- **Started (KST):** $($sess.startedAtKst)"
$lines += "- **Ended (KST):** $($endedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
$lines += "- **Commit:** $($sess.headCommit)"
$lines += "- **Build note:** $($sess.buildNote)"
$lines += "- **Auto-remediation paused:** $($sess.autoRemediationPaused)"
$lines += ""

# --- precision log tail ---
$precisionLogs = Get-ChildItem -Path $LogDir -Filter 'precision-playtest-*.log' -ErrorAction SilentlyContinue |
  Where-Object { $_.LastWriteTime -ge $startedAt.AddMinutes(-5) } |
  Sort-Object LastWriteTime

$crashText = ''
foreach ($f in $precisionLogs) {
  $crashText += (Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue) + "`n"
}
$crashEvents = Get-ArcfireCrashLogEvents -Text $crashText -MaxAgeMin 99999

$lines += "## Crash events (arcfire-filtered)"
if ($crashEvents.Count -eq 0) {
  $lines += "- **None detected** in precision log window"
} else {
  foreach ($ev in $crashEvents) {
    $lines += "- ``$($ev.Line)`` (age $($ev.AgeMin)m)"
  }
}
$lines += ""

# --- classify ---
$classify = @{
  worklet_executeSync = 0
  mqt_v_js = 0
  skia_librnskia = 0
  reanimated_error = 0
  finalizer_daemon = 0
  other = 0
}
foreach ($ev in $crashEvents) {
  $l = $ev.Line
  if ($l -match 'WorkletRuntime::executeSync|ShareableWorklet::toJSValue|executeSync') { $classify.worklet_executeSync++; continue }
  if ($l -match 'mqt_v_js') { $classify.mqt_v_js++; continue }
  if ($l -match 'librnskia|rnskia') { $classify.skia_librnskia++; continue }
  if ($l -match 'ReanimatedError|non-worklet') { $classify.reanimated_error++; continue }
  if ($l -match 'FinalizerDaemon') { $classify.finalizer_daemon++; continue }
  $classify.other++
}
$lines += "## Crash classification"
foreach ($k in $classify.Keys) {
  $lines += "- **$k:** $($classify[$k])"
}
$lines += ""

# --- playtest-alerts ---
$alertLog = Join-Path $LogDir 'playtest-alerts.log'
if (Test-Path $alertLog) {
  $alerts = Get-Content $alertLog | Where-Object { $_ -match '\[(PATTERN|ARCFIRE_CRASH)\]' }
  $lines += "## Real-time alerts ($($alerts.Count))"
  foreach ($a in ($alerts | Select-Object -Last 20)) { $lines += "- $a" }
  $lines += ""
}

# --- GL floor from timeline ---
$timeline = Join-Path $LogDir 'mem-timeline.csv'
$floorGl = $null
$peakGl = 0.0
$peakPss = 0.0
$spikeCount = 0
if (Test-Path $timeline) {
  $rows = Get-Content $timeline | Select-Object -Skip 1 | Where-Object { $_.Trim() -ne '' }
  $sessionRows = @()
  foreach ($r in $rows) {
    $c = $r -split ','
    if ($c.Count -lt 5) { continue }
    try {
      $rowTime = [datetime]::Parse($c[0])
      if ($rowTime -ge $startedAt.AddMinutes(-2)) { $sessionRows += ,$c }
    } catch {}
  }
  $glSamples = @()
  foreach ($c in $sessionRows) {
    $gl = 0.0; $pss = 0.0
    [void][double]::TryParse($c[4], [ref]$gl)
    [void][double]::TryParse($c[2], [ref]$pss)
    if ($gl -gt 0) { $glSamples += $gl }
    if ($gl -gt $peakGl) { $peakGl = $gl }
    if ($pss -gt $peakPss) { $peakPss = $pss }
    if ($c.Count -ge 12 -and $c[11] -like 'GL_SPIKE*') { $spikeCount++ }
  }
  if ($glSamples.Count -gt 0) {
    $sorted = $glSamples | Sort-Object
    $floorGl = $sorted[[Math]::Floor($sorted.Count * 0.2)]
  }
}
$lines += "## Memory (session window)"
$lines += "- **GL floor (p20):** $(if ($null -eq $floorGl) { 'n/a' } else { "$floorGl MB" })"
$lines += "- **GL peak:** $peakGl MB"
$lines += "- **PSS peak:** $peakPss MB"
$lines += "- **GL_SPIKE notes:** $spikeCount"
if ($sess.baseline -and $sess.baseline.glMb) {
  $baselineGl = [double]$sess.baseline.glMb
  if ($null -ne $floorGl -and $floorGl -ge ($baselineGl + 25)) {
    $lines += "- **WARN:** GL floor drift ≥25MB vs baseline ($baselineGl MB)"
  }
}
$lines += ""

# --- milestones ---
$lines += "## Milestones"
if ($sess.milestones) {
  foreach ($m in $sess.milestones) {
    $lines += "- $($m.atKst): $($m.label)"
  }
} else {
  $lines += "- (none tagged)"
}
$lines += ""

# --- focus areas for this build ---
$lines += "## Focus verification (worldmap / wave / long idle)"
$lines += "| Check | Pass criteria |"
$lines += "|-------|---------------|"
$lines += "| Depart → worldmap | No SIGSEGV in mqt_v_js within 30s |"
$lines += "| worldmap ↔ planet ×20 | No executeSync / withDecay crash |"
$lines += "| Wave combat enter/exit | GL recovers ±15MB within 2 samples |"
$lines += "| Long idle 30m+ | GL floor not +25MB vs baseline |"
$lines += "| Process death | playtest-alerts empty of ARCFIRE_CRASH |"
$lines += ""

$lines += "## Next steps (if FAIL)"
$lines += "1. ``adb logcat`` tail in latest ``precision-playtest-*.log``"
$lines += "2. Compare stack to prior ``mqt_v_js`` + ``executeSync`` pattern"
$lines += "3. ``arcfire-crash-fix-structural-gate.mdc`` before patch"
$lines += "4. Cursor: paste this report + say **했어** after repro"

$lines | Set-Content -Path $ReportPath -Encoding utf8
Write-Output "report=$ReportPath"
Write-Output "crashes=$($crashEvents.Count)"
Write-Output "classification=$($classify | ConvertTo-Json -Compress)"
