# Arcfire long-run monitor — GL leak vs hub-activation classification (shared)
# idle→허브 mount 와 동일 상태 계단식 누수를 분리한다.

$script:MEM_GL_IDLE_MAX_MB = 10
$script:MEM_HUB_VIEWS_IDLE_MAX = 200
$script:MEM_HUB_VIEWS_ACTIVE_MIN = 280
$script:MEM_GL_SPIKE_DELTA_MB = 8
$script:MEM_GL_CRITICAL_ACTIVE_MB = 80
$script:MEM_CONSECUTIVE_SPIKE_LIMIT = 3
$script:MEM_BASELINE_LEAK_MARGIN_MB = 25

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
