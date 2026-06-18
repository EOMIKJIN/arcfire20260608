# Post-snapshot: incident detect + GL baseline stair-step (active hub only)
param(
  [string]$LogDir = (Join-Path $PSScriptRoot 'logs'),
  [string]$TimelineCsv = '',
  [string]$Package = 'com.arcfire.online',
  [int]$IntervalMin = 30
)

. (Join-Path $PSScriptRoot 'mem-gl-leak-rules.ps1')

if (-not $TimelineCsv) {
  $TimelineCsv = Join-Path $LogDir 'mem-timeline.csv'
}

$incidentLog = Join-Path $LogDir 'incidents.log'
$remediationLog = Join-Path $LogDir 'remediation.log'
$baselineJson = Join-Path $LogDir 'mem-baseline.json'
$refixFlag = Join-Path $LogDir 'gl-leak-refix-requested.flag'
$crashGlob = Join-Path $LogDir 'crash-*.log'

function Write-Remediation([string]$msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Add-Content -Path $remediationLog -Value $line
  Write-Host $line
}

function Request-Refix([string]$reason, [hashtable]$ctx) {
  $payload = @{
    requestedAt = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
    reason = $reason
    intervalMin = $IntervalMin
    ctx = $ctx
  } | ConvertTo-Json -Compress
  Set-Content -Path $refixFlag -Value $payload -Encoding utf8
  Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] REFIX_REQUESTED $reason"
  Write-Remediation "REFIX_REQUESTED $reason -> gl-leak-refix-requested.flag"
  & (Join-Path $PSScriptRoot 'apply-auto-remediation.ps1') -LogDir $LogDir -Package $Package -Reason $reason -Ctx $ctx -MinIntervalMin 45
}

if (-not (Test-Path $TimelineCsv)) {
  exit 0
}

$rows = Get-Content $TimelineCsv | Select-Object -Skip 1 | Where-Object { $_.Trim() -ne '' }
if ($rows.Count -lt 1) { exit 0 }

$last = ($rows[-1] -split ',')
$lastPid = $last[1]
$lastGl = 0.0
$lastPss = 0.0
$lastViews = 0
[void][double]::TryParse($last[4], [ref]$lastGl)
[void][double]::TryParse($last[2], [ref]$lastPss)
if ($last.Count -ge 11 -and $last[10] -match '^\d+') { $lastViews = [int]$last[10] }

# --- Crash log tail ---
$crashFiles = Get-ChildItem -Path $crashGlob -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
if ($crashFiles) {
  $crashPath = $crashFiles[0].FullName
  $stateFile = Join-Path $LogDir '.crash-byte-offset'
  $offset = 0
  if (Test-Path $stateFile) { $offset = [int](Get-Content $stateFile -Raw) }
  $fi = Get-Item $crashPath
  if ($fi.Length -gt $offset) {
    try {
      $fs = [System.IO.File]::Open($crashPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
      $fs.Seek($offset, [System.IO.SeekOrigin]::Begin) | Out-Null
      $reader = New-Object System.IO.StreamReader($fs)
      $newText = $reader.ReadToEnd()
      $reader.Close()
      $fs.Close()
      Set-Content -Path $stateFile -Value $fi.Length -NoNewline
      if ($newText -match 'FATAL|AndroidRuntime|SIGSEGV|signal 11|ReactNativeJS') {
        $snippet = ($newText -split "`n" | Select-Object -Last 40) -join "`n"
        Add-Content -Path $incidentLog -Value "`n===== CRASH $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') =====`n$snippet"
        Write-Remediation 'INCIDENT CRASH logged -> incidents.log'
      }
    } catch {
      Write-Remediation "WARN crash log read skipped: $($_.Exception.Message)"
    }
  }
}

$hubActiveNow = Test-MemHubActive -Views $lastViews

# --- Session GL baseline (per pid, active hub samples only) ---
$baseline = @{ pid = $lastPid; glMb = $lastGl; pssMb = $lastPss; peakGlMb = $lastGl; updatedAt = (Get-Date -Format 'o') }
if (Test-Path $baselineJson) {
  try {
    $saved = Get-Content $baselineJson -Raw | ConvertFrom-Json
    if ($saved.pid -eq $lastPid) {
      $baseline.glMb = [double]$saved.glMb
      $baseline.pssMb = [double]$saved.pssMb
      $baseline.peakGlMb = [double]$saved.peakGlMb
    }
  } catch { }
}
if ($hubActiveNow -and $lastGl -gt 0) {
  if ($baseline.glMb -le 0 -or $lastGl -lt $baseline.glMb) { $baseline.glMb = $lastGl }
  if ($lastGl -gt $baseline.peakGlMb) { $baseline.peakGlMb = $lastGl }
  $baseline | ConvertTo-Json | Set-Content -Path $baselineJson -Encoding utf8
}

$peakAboveBaseline = $baseline.peakGlMb - ($baseline.glMb + $MEM_BASELINE_LEAK_MARGIN_MB)

# --- GL stair-step: active hub only, skip HUB_ACTIVATION ---
$recent = @($rows | Where-Object {
  $c = $_ -split ','
  $c.Count -ge 5 -and $c[1] -eq $lastPid -and $c[4] -match '^\d'
} | Select-Object -Last 6)

$spikeCount = 0
$noRecoveryCount = 0
foreach ($row in $recent) {
  $cols = Get-MemTimelineCols -Cols ($row -split ',')
  if (-not $cols.Valid) { continue }
  if ($cols.Note -like 'HUB_ACTIVATION*') { continue }
  if (-not (Test-MemHubActive -Views $cols.Views)) { continue }

  if ($cols.Note -like 'GL_SPIKE*' -or ($cols.DeltaGlMb -ge $MEM_GL_SPIKE_DELTA_MB)) {
    $spikeCount += 1
  } elseif ($cols.Note -eq 'GL_RECOVERED idle_ok') {
    $spikeCount = 0
    $noRecoveryCount = 0
  } elseif ($cols.DeltaGlMb -ge 0 -and $cols.DeltaGlMb -lt 5) {
    $noRecoveryCount += 1
  }
}

if ($hubActiveNow -and $spikeCount -ge $MEM_CONSECUTIVE_SPIKE_LIMIT) {
  Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] GL_LEAK_SUSPECT consecutive_spikes=$spikeCount views=$lastViews active_hub_only"
  Write-Remediation "INCIDENT GL_LEAK_SUSPECT spikes=$spikeCount views=$lastViews (interval=${IntervalMin}m)"
  Request-Refix 'consecutive_gl_spikes' @{
    spikes = $spikeCount
    lastGlMb = $lastGl
    baselineGlMb = $baseline.glMb
    views = $lastViews
  }
}

if ($hubActiveNow -and $peakAboveBaseline -ge $MEM_BASELINE_LEAK_MARGIN_MB -and $noRecoveryCount -ge 2 -and $lastGl -ge ($baseline.glMb + 15)) {
  Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] GL_BASELINE_DRIFT peak=$($baseline.peakGlMb) baseline=$($baseline.glMb) current=$lastGl views=$lastViews"
  Write-Remediation "INCIDENT GL_BASELINE_DRIFT peak=$($baseline.peakGlMb) baseline=$($baseline.glMb) current=$lastGl views=$lastViews"
  Request-Refix 'baseline_gl_drift' @{
    peakGlMb = $baseline.peakGlMb
    baselineGlMb = $baseline.glMb
    currentGlMb = $lastGl
    marginMb = $MEM_BASELINE_LEAK_MARGIN_MB
    views = $lastViews
  }
}

if ($hubActiveNow -and (Test-MemGlCriticalActiveHub -GlMb $lastGl -Views $lastViews)) {
  # 활성 Skia 세션(전투·웨이브)의 높은 GL 은 정상 footprint 다(이탈 시 GL_RECOVERED 로 회수).
  # 절대 GL 수치만으로는 재시작하지 않는다 — 30분 간격에선 전투 진입 첫 고-GL 샘플이
  # plateau 를 확정할 표본이 없어 false-positive 재시작을 유발했다(2026-06-17).
  # 진짜 누수는 consecutive_gl_spikes·baseline_gl_drift(상단)가, 진짜 OOM 임박은
  # 하드 실링(GL>=200MB·PSS>=950MB)이 담당한다. 여기서는 하드 실링일 때만 강제 조치.
  $hardCeiling = Test-MemHardCeilingBreach -GlMb $lastGl -PssMb $lastPss
  if ($hardCeiling) {
    Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] GL_HARD_CEILING gl=$lastGl pss=$lastPss views=$lastViews"
    Write-Remediation "INCIDENT GL_HARD_CEILING gl=$lastGl pss=$lastPss views=$lastViews -> immediate remediation (OOM imminent)"
    Request-Refix 'gl_critical_active_hub' @{ lastGlMb = $lastGl; pssMb = $lastPss; views = $lastViews; hardCeiling = $true }
  } else {
    $recentActiveCols = @(
      $recent | ForEach-Object { Get-MemTimelineCols -Cols ($_ -split ',') } |
        Where-Object { $_.Valid -and (Test-MemHubActive -Views $_.Views) -and ($_.Note -notlike 'HUB_ACTIVATION*') }
    )
    $stableFootprint = Test-MemGlStableCombatFootprint -RecentActiveCols $recentActiveCols -CurGlMb $lastGl -BaselineGlMb $baseline.glMb
    $tag = if ($stableFootprint) { 'GL_ELEVATED_STABLE active_combat_footprint' } else { 'GL_ELEVATED mounting_or_insufficient_samples' }
    Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $tag gl=$lastGl pss=$lastPss views=$lastViews restart_held"
    Write-Remediation "INFO $tag gl=$lastGl pss=$lastPss views=$lastViews -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)"
  }
}

# --- Process death ---
# 프로세스 미발견 != 크래시. 클린 종료(앱 닫기·재설치·검증)에서도 PROCESS_NOT_RUNNING 이 찍힌다.
# 따라서 "최근 크래시 흔적"이 있을 때만 비정상종료로 보고 + 재기동한다.
# 흔적이 없으면 PROCESS_EXIT(clean)로 기록만 — 검증·수동 종료 중 강제 재시작을 막는다.
if ($rows[-1] -match 'PROCESS_NOT_RUNNING') {
  if (Test-Path $baselineJson) { Remove-Item $baselineJson -Force -ErrorAction SilentlyContinue }

  $recentCrash = $null
  if ($crashFiles) {
    $ageMin = ((Get-Date) - $crashFiles[0].LastWriteTime).TotalMinutes
    if ($ageMin -le ([math]::Max(15, $IntervalMin * 2))) { $recentCrash = $crashFiles[0] }
  }

  if ($recentCrash) {
    Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] PROCESS_DEATH crash=$($recentCrash.Name) age<=$([math]::Max(15, $IntervalMin*2))m"
    Write-Remediation "INCIDENT PROCESS_DEATH (recent crash $($recentCrash.Name)) -> relaunch"
    & (Join-Path $PSScriptRoot 'apply-auto-remediation.ps1') -LogDir $LogDir -Package $Package -Reason 'process_death' -Ctx @{ lastGlMb = $lastGl } -MinIntervalMin 20
  } else {
    Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] PROCESS_EXIT clean (no recent crash signature) — relaunch skipped"
    Write-Remediation 'INFO PROCESS_EXIT clean (no recent crash) -> relaunch skipped (manual close / verification safe)'
  }
}

exit 0
