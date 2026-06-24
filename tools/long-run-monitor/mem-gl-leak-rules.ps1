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
# Native Reclaim Tier soft zone — 기록·앱 soft pass 권고, force-stop 없음
$script:MEM_PSS_SOFT_CEILING_MB = 800

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

function Test-MemPssSoftCeilingBreach {
  param([double]$PssMb)
  return ($PssMb -ge $script:MEM_PSS_SOFT_CEILING_MB) -and ($PssMb -lt $script:MEM_PSS_HARD_CEILING_MB)
}

# logcat tail — Firebase deprecation(W ReactNativeJS) · 타앱 crashed service · 자동조치 force-stop 제외.
# arcfire.online 한정 FATAL + 타임스탬프 신선도(≤MaxAgeMin) 필수.
function Get-ArcfireCrashLogEvents {
  param(
    [string]$Text,
    [int]$MaxAgeMin = 40
  )
  if ([string]::IsNullOrWhiteSpace($Text)) { return @() }

  $now = Get-Date
  $year = $now.Year
  $events = @()

  foreach ($line in ($Text -split "`n")) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    if ($line -match 'Force stopping com\.arcfire\.online') { continue }
    if ($line -match 'stop com\.arcfire\.online due to') { continue }
    if ($line -match 'Killing \d+:com\.arcfire\.online[^\n]*: stop\b') { continue }
    if ($line -match 'Scheduling restart of crashed service(?! com\.arcfire\.online)') { continue }

    $isArcfireFatal = $false
    if ($line -match '\.arcfire\.online' -and $line -match 'Fatal signal \d+|F libc\s*:\s*Fatal signal') {
      $isArcfireFatal = $true
    }
    if ($line -match 'Killing \d+:com\.arcfire\.online[^\n]*: crash\b') {
      $isArcfireFatal = $true
    }
    if ($line -match 'Process com\.arcfire\.online .* has died') {
      $isArcfireFatal = $true
    }
    if ($line -match 'F DEBUG\s*:.*Cmdline: com\.arcfire\.online' -and $line -match 'signal 11|SIGSEGV') {
      $isArcfireFatal = $true
    }
    if ($line -match '\bE ReactNativeJS:.*(?:Error|Exception|Invariant|Fatal|TypeError|ReferenceError)' -and $line -match '\.arcfire\.online') {
      $isArcfireFatal = $true
    }
    if (-not $isArcfireFatal) { continue }

    $ageMin = 9999.0
    if ($line -match '^(\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\.') {
      try {
        $evt = [datetime]::ParseExact("$year-$($Matches[1]) $($Matches[2])", 'yyyy-MM-dd HH:mm:ss', $null)
        if ($evt -gt $now.AddMinutes(5)) {
          $evtPrevDay = $evt.AddDays(-1)
          if ($evtPrevDay -le $now.AddMinutes(5)) {
            $evt = $evtPrevDay
          } else {
            $evt = $evt.AddYears(-1)
          }
        }
        $ageMin = ($now - $evt).TotalMinutes
        if ($ageMin -lt 0) { $ageMin = 0 }
      } catch { }
    }
    if ($ageMin -le $MaxAgeMin) {
      $events += @{ Line = $line.Trim(); AgeMin = [math]::Round($ageMin, 1) }
    }
  }
  return $events
}

function Test-ArcfireCrashLogText {
  param(
    [string]$Text,
    [int]$MaxAgeMin = 40
  )
  return ((Get-ArcfireCrashLogEvents -Text $Text -MaxAgeMin $MaxAgeMin).Count -gt 0)
}

function Get-RefixReasonPriority {
  param([string]$Reason)
  switch ($Reason) {
    'gl_critical_active_hub' { return 100 }
    'process_death' { return 90 }
    'consecutive_gl_spikes' { return 50 }
    'baseline_gl_drift' { return 40 }
    default { return 0 }
  }
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
