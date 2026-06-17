# Arcfire long-run monitor — GL leak vs hub-activation classification (shared)
# idle→허브 mount 와 동일 상태 계단식 누수를 분리한다.

$script:MEM_GL_IDLE_MAX_MB = 10
$script:MEM_HUB_VIEWS_IDLE_MAX = 200
$script:MEM_HUB_VIEWS_ACTIVE_MIN = 280
$script:MEM_GL_SPIKE_DELTA_MB = 8
$script:MEM_GL_CRITICAL_ACTIVE_MB = 80
$script:MEM_CONSECUTIVE_SPIKE_LIMIT = 3
$script:MEM_BASELINE_LEAK_MARGIN_MB = 25
# 진짜 OOM 임박 — 안정 footprint라도 무조건 조치하는 하드 실링.
# 활성 Skia 전투의 정상 GL footprint(~110MB)는 이 아래에서 평탄 유지되므로
# 안정 plateau는 누수가 아닌 footprint로 간주해 재시작을 보류한다.
$script:MEM_GL_HARD_CEILING_MB = 200
$script:MEM_PSS_HARD_CEILING_MB = 950

function Test-MemHubActivationTransition {
  param(
    [double]$PrevGlMb,
    [int]$PrevViews,
    [int]$CurViews
  )
  if ($PrevGlMb -gt 0 -and $PrevGlMb -lt $script:MEM_GL_IDLE_MAX_MB) { return $true }
  if ($PrevViews -gt 0 -and $PrevViews -lt $script:MEM_HUB_VIEWS_IDLE_MAX -and $CurViews -ge $script:MEM_HUB_VIEWS_ACTIVE_MIN) {
    return $true
  }
  return $false
}

function Test-MemHubActive {
  param([int]$Views)
  return $Views -ge $script:MEM_HUB_VIEWS_ACTIVE_MIN
}

function Test-MemGlSpikeInActiveHub {
  param(
    [double]$DeltaGlMb,
    [double]$GlMb,
    [int]$Views,
    [bool]$IsActivation
  )
  if ($IsActivation) { return $false }
  if (-not (Test-MemHubActive -Views $Views)) { return $false }
  if ($DeltaGlMb -ge $script:MEM_GL_SPIKE_DELTA_MB) { return $true }
  if ($GlMb -ge $script:MEM_GL_CRITICAL_ACTIVE_MB) { return $true }
  return $false
}

function Test-MemGlCriticalActiveHub {
  param(
    [double]$GlMb,
    [int]$Views
  )
  return (Test-MemHubActive -Views $Views) -and ($GlMb -ge $script:MEM_GL_CRITICAL_ACTIVE_MB)
}

# 활성 Skia 세션(전투·웨이브 등)의 "안정 footprint"인가?
# GL 이 critical 이상이라도 (1) 최근 활성 표본에 GL_SPIKE 가 없고 (2) 표본 delta 가 작아
# 평탄하며 (3) 세션 baseline 대비 과도 상승이 없으면 누수가 아닌 정상 footprint 로 본다.
# → 이 경우 강제 재시작을 보류한다(전투 중 false-positive 재시작 차단).
function Test-MemGlStableCombatFootprint {
  param(
    [object[]]$RecentActiveCols,
    [double]$CurGlMb,
    [double]$BaselineGlMb
  )
  if (-not $RecentActiveCols -or $RecentActiveCols.Count -lt 2) { return $false }
  foreach ($c in $RecentActiveCols) {
    if ($c.Note -like 'GL_SPIKE*') { return $false }
    if ([math]::Abs($c.DeltaGlMb) -ge $script:MEM_GL_SPIKE_DELTA_MB) { return $false }
  }
  if ($BaselineGlMb -gt 0 -and $CurGlMb -ge ($BaselineGlMb + $script:MEM_BASELINE_LEAK_MARGIN_MB)) {
    return $false
  }
  return $true
}

# 안정 footprint 라도 무조건 재시작해야 하는 진짜 OOM 임박 여부.
function Test-MemHardCeilingBreach {
  param(
    [double]$GlMb,
    [double]$PssMb
  )
  return ($GlMb -ge $script:MEM_GL_HARD_CEILING_MB) -or ($PssMb -ge $script:MEM_PSS_HARD_CEILING_MB)
}

function Get-MemTimelineCols {
  param([string[]]$Cols)
  $out = @{
    GlMb = 0.0
    Views = 0
    DeltaGlMb = 0.0
    Note = ''
    Valid = $false
  }
  if ($Cols.Count -lt 14) { return $out }
  [void][double]::TryParse($Cols[4], [ref]$out.GlMb)
  if ($Cols[10] -match '^\d+') { $out.Views = [int]$Cols[10] }
  if ($Cols[12] -match '^-?\d') { [void][double]::TryParse($Cols[12], [ref]$out.DeltaGlMb) }
  $out.Note = $Cols[13]
  $out.Valid = $out.GlMb -gt 0
  return $out
}
