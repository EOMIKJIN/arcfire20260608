# 18:00 KST 종합 감시 보고 — 이상·미회수·관리 빈틈·잠재 리스크·향후 개발
param(
  [string]$Package = 'com.arcfire.online',
  [string]$ReportPath = '',
  [string]$TimelineMarker = 'EVENING_WATCH_6PM_START',
  [string]$ReportTitle = 'Arcfire evening watch — 18:00 KST comprehensive report'
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$Root = Split-Path $ScriptRoot -Parent | Split-Path -Parent
$retentionPath = Join-Path $Root 'tools\memory-profiler\reports\latest-retention-audit.md'

if (-not $ReportPath) {
  $kst = (Get-Date).ToUniversalTime().AddHours(9)
  $ReportPath = Join-Path $logDir ("evening-watch-report-{0}.md" -f $kst.ToString('yyyyMMdd-HHmm'))
}

function Get-KstNow { (Get-Date).ToUniversalTime().AddHours(9) }

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

function Get-TimelineStats([string]$timelinePath, [string]$marker) {
  $rows = Get-LinesAfter $timelinePath $marker |
    Where-Object { $_ -match '^\d{4}-\d{2}-\d{2}' -and $_ -notmatch '^iso_time' }
  if (-not $rows.Count) { return $null }
  $pssList = New-Object System.Collections.Generic.List[double]
  $glList = New-Object System.Collections.Generic.List[double]
  $viewList = New-Object System.Collections.Generic.List[int]
  $glRecovered = 0
  $pssSpike = 0
  foreach ($line in $rows) {
    $cols = $line -split ','
    if ($cols.Count -lt 4) { continue }
    $pss = 0.0
    $gl = 0.0
    $views = 0
    [void][double]::TryParse($cols[2], [ref]$pss)
    [void][double]::TryParse($cols[4], [ref]$gl)
    [void][int]::TryParse($cols[10], [ref]$views)
    if ($pss -gt 0) { $pssList.Add($pss) }
    if ($gl -gt 0) { $glList.Add($gl) }
    if ($views -gt 0) { $viewList.Add($views) }
    if ($line -match 'GL_RECOVERED') { $glRecovered++ }
    if ($line -match 'PSS_SPIKE') { $pssSpike++ }
  }
  if ($pssList.Count -eq 0) { return $null }
  return [ordered]@{
    samples = $pssList.Count
    pssMin = ($pssList | Measure-Object -Minimum).Minimum
    pssMax = ($pssList | Measure-Object -Maximum).Maximum
    pssLast = $pssList[$pssList.Count - 1]
    pssFloorDrift = $pssList[$pssList.Count - 1] - $pssList[0]
    glMin = if ($glList.Count) { ($glList | Measure-Object -Minimum).Minimum } else { $null }
    glMax = if ($glList.Count) { ($glList | Measure-Object -Maximum).Maximum } else { $null }
    glLast = if ($glList.Count) { $glList[$glList.Count - 1] } else { $null }
    viewsMax = if ($viewList.Count) { ($viewList | Measure-Object -Maximum).Maximum } else { $null }
    viewsLast = if ($viewList.Count) { $viewList[$viewList.Count - 1] } else { $null }
    glRecoveredCount = $glRecovered
    pssSpikeCount = $pssSpike
  }
}

$kst = Get-KstNow
$lines = @()
$lines += "# $ReportTitle"
$lines += ""
$lines += "Generated (KST): $($kst.ToString('yyyy-MM-dd HH:mm:ss'))"
$lines += "Package: ``$Package``"
$lines += "Timeline marker: ``$TimelineMarker``"
$lines += ""

# Runtime
$pidApp = (adb shell "pidof $Package" 2>$null).ToString().Trim()
$lines += "## 1. Runtime snapshot"
$lines += ""
$pssMb = '?'; $glMb = '?'; $views = '?'
if ($pidApp) {
  $raw = adb shell dumpsys meminfo $Package 2>&1 | Out-String
  if ($raw -match 'TOTAL PSS:\s+(\d+)') { $pssMb = [math]::Round([int]$Matches[1] / 1024, 1) }
  if ($raw -match '(?m)^\s*GL mtrack\s+(\d+)') { $glMb = [math]::Round([int]$Matches[1] / 1024, 1) }
  if ($raw -match 'Views:\s+(\d+)') { $views = $Matches[1] }
  $lines += "| pid | PSS (MB) | GL (MB) | Views |"
  $lines += "|-----|----------|---------|-------|"
  $lines += "| $pidApp | $pssMb | $glMb | $views |"
} else {
  $lines += "**APP_NOT_RUNNING**"
}
$lines += ""

$memVerdict = 'OK'
if ($pssMb -ne '?' -and [double]$pssMb -ge 950) { $memVerdict = 'CRITICAL' }
elseif ($pssMb -ne '?' -and [double]$pssMb -ge 850) { $memVerdict = 'WARN' }
elseif ($views -ne '?' -and [int]$views -ge 450) { $memVerdict = 'WARN_VIEWS' }
$lines += "**Verdict:** $memVerdict"
$lines += ""

# Timeline stats
$timeline = Join-Path $logDir 'mem-timeline.csv'
$stats = Get-TimelineStats $timeline $TimelineMarker
$lines += "## 2. Memory trend (since marker)"
$lines += ""
if ($stats) {
  $lines += "| Metric | Value |"
  $lines += "|--------|-------|"
  $lines += "| Samples | $($stats.samples) |"
  $lines += "| PSS min / max / last | $($stats.pssMin) / $($stats.pssMax) / $($stats.pssLast) MB |"
  $lines += "| PSS floor drift (last-first) | $([math]::Round($stats.pssFloorDrift, 1)) MB |"
  $lines += "| GL min / max / last | $($stats.glMin) / $($stats.glMax) / $($stats.glLast) MB |"
  $lines += "| Views max / last | $($stats.viewsMax) / $($stats.viewsLast) |"
  $lines += "| GL_RECOVERED events | $($stats.glRecoveredCount) |"
  $lines += "| PSS_SPIKE events | $($stats.pssSpikeCount) |"
  if ($stats.pssFloorDrift -ge 40) {
    $lines += ""
    $lines += "> **PSS_FLOOR_UP** — idle floor +$([math]::Round($stats.pssFloorDrift,0))MB during watch window."
  }
  if ($stats.viewsMax -ge 450) {
    $lines += ""
    $lines += "> **VIEWS_RETAINED** — duplicate RN tree suspected (max views $($stats.viewsMax))."
  }
} else {
  $lines += "_No timeline rows since marker — check adb / watch-30m._"
}
$lines += ""

$tlRows = Get-LinesAfter $timeline $TimelineMarker
$lines += "### mem-timeline tail (30 rows)"
$lines += ""
$lines += '```csv'
$lines += ($tlRows | Select-Object -Last 30) -join "`n"
$lines += '```'
$lines += ""

# Incidents
$lines += "## 3. Incidents & remediation (tail)"
$lines += ""
foreach ($pair in @(
  @('incidents.log', 'incidents'),
  @('remediation.log', 'remediation'),
  @('mem-alerts.log', 'mem-alerts')
)) {
  $p = Join-Path $logDir $pair[0]
  $lines += "### $($pair[1])"
  $lines += '```'
  $tail = Get-Content $p -Tail 20 -ErrorAction SilentlyContinue
  if ($tail) { $lines += ($tail -join "`n") } else { $lines += '(empty)' }
  $lines += '```'
  $lines += ""
}

# Retention
$lines += "## 4. Retention audit"
$lines += ""
if (Test-Path $retentionPath) {
  $ret = Get-Content $retentionPath -Raw -ErrorAction SilentlyContinue
  $verdict = if ($ret -match 'Verdict:\s*\*\*([^*]+)\*\*') { $Matches[1].Trim() } else { 'UNKNOWN' }
  $lines += "- **latest-retention-audit:** ``$verdict`` — ``tools/memory-profiler/reports/latest-retention-audit.md``"
  if ($verdict -eq 'NO_DATA') {
    $lines += "- route_blur / STAGE close 스냅샷 부족 — ``npm run audit:memory:retention`` 실측 필요"
  }
} else {
  $lines += "_retention report missing_"
}
$lines += ""

# Optimization gaps
$lines += "## 5. Management / optimization gaps (known + watch window)"
$lines += ""
$lines += "| # | Gap | Status |"
$lines += "|---|-----|--------|"
$lines += "| 1 | SUB-STAGE blur / route_blur release (Views 558) | patched / release soak pending |"
$lines += "| 2 | Metro HMR / galaxy dispose loop / PSS spike | devMetroReloadGuard / release verify |"
$lines += "| 3 | hub_periodic backdrop remount / native_heap floor | skipBackdropRemount / 60m floor |"
$lines += "| 4 | audit:memory:all PASS vs runtime PSS floor drift | static PASS / runtime FAIL |"
$lines += "| 5 | retention audit NO_DATA / route_blur snapshot | playtest snapshot missing |"
$lines += "| 6 | monitor-paused / auto-fix OFF | record-only by design |"
$lines += "| 7 | central bank + convoy 30% / mem audit gap | daily batch AsyncStorage only |"
$lines += "| 8 | planet ownership deedOwnerClanId persist | purge/reset linkage check |"
$lines += "| 9 | Galaxy map contested ring / AppState | worklet freeze patch |"
$lines += "| 10 | CHAT_REPORT_PENDING / session hook | schedule-6pm standalone |"
$lines += ""

# Potential risks
$lines += "## 6. Potential risks (18:00 assessment)"
$lines += ""
$lines += "- **PSS floor creep** without GL spike → native_heap / Fresco / ingress reclaim race (P1)."
$lines += "- **Views ≥450** after Metro reload → duplicate planet hub tree until cold restart."
$lines += "- **PID_CHANGE** during soak → baseline 비교 왜곡; timeline marker 필수."
$lines += "- **Uncommitted dev stack** (ownership·central bank·native reclaim) → 6/30 handoff 대비 회귀 여부 watch."
$lines += "- **Retention NO_DATA** → STAGE 전환 회수 PASS/FAIL 판정 불가."
$lines += ""

# Future feature dev
$lines += "## 7. Future content / feature add — memory watch focus"
$lines += ""
$lines += "| Area | Pre-dev gate | Post-dev gate |"
$lines += "|------|--------------|---------------|"
$lines += "| Skia / Canvas / Reanimated | arcfire-skia-memory-lifecycle §1-2 | audit:skia-memory + GL mtrack ±15MB |"
$lines += "| STAGE / Modal / SUB-STAGE | hubSubStageNavRef blur 게이트 | SUB-STAGE 왕복 5회 + route_blur snapshot |"
$lines += "| arcCore daily batch / economy | onBoot 동기 패스 금지 | audit:balance-ops + native floor 30m |"
$lines += "| New AsyncStorage store | purgeLocalAccountData 연동 | mem-post-dev-recheck handoff |"
$lines += "| Galaxy map / worldmap | worklet contract | audit:worklet-contract + galaxy round-trip GL |"
$lines += "| Planet hub UI plate / i18n | zero tick loop | Views idle ±20 |"
$lines += ""

# Action items
$lines += "## 8. Kim Team Lead — recommended actions"
$lines += ""
$floorDriftHigh = $false
if ($null -ne $stats -and $stats.pssFloorDrift -ge 40) { $floorDriftHigh = $true }
if ($memVerdict -eq 'CRITICAL') {
  $lines += "1. **P0** - PSS>=950: hub exit cold restart + Skia dispose order check."
} elseif ($memVerdict -eq 'WARN' -or $floorDriftHigh) {
  $lines += "1. **P1** - PSS floor / soft ceiling: native reclaim coalesce + ingress remount audit."
} else {
  $lines += "1. **OK** - evening soak stable; continue floor trend watch."
}
$lines += "2. Release 빌드에서 Metro HMR 제외 soak 2h — PSS floor·Views 380 이하 확인."
$lines += "3. ``npm run audit:memory:retention`` + route_blur 스냅샷 1회 — NO_DATA 해소."
$lines += "4. 신규 기능(중앙은행·소유권) merge 전 ``mem-post-dev-recheck`` handoff."
$lines += ""

$text = $lines -join "`n"
Set-Content -Path $ReportPath -Value $text -Encoding utf8
Write-Output $ReportPath
