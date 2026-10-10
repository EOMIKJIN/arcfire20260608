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
# 장시간 허브 floor(~830) + 정상 전투 GL(80~200) 첫 마운트가 PSS 950을 넘는 경우
# (2026-09-09 10:14: GL 159 / PSS 1025, 크래시 없음) — GL 하드실링·PSS 추가 상승만 재시작.
$script:MEM_COMBAT_MOUNT_PSS_CLIMB_MB = 40
# Native Reclaim Tier soft zone — 기록·앱 soft pass 권고, force-stop 없음
$script:MEM_PSS_SOFT_CEILING_MB = 800
# views/native_heap 단독 급증 조기 경보 — PSS 하드실링(950) 전에 먼저 감지·기록만(force-stop 없음).
# 2026-07-07 native_heap 주도 하드실링(views 19→464·native_heap +243MB, GL 정상) 재발 감지용.
$script:MEM_VIEWS_RETENTION_WARN = 450
$script:MEM_NATIVE_HEAP_WARN_MB = 420

# ── 빌드별 상한 (대표님 지시 2026-10-10) ──────────────────────────────
# release: 대표님 기준 「600까지 허용 · 800~900 위험」 → soft 600 · hard 800.
#          (10-10 release 실측: 허브 400~450 · 전환 최고 562 · 야간 7h43m 누적 없음)
# 개발 빌드: 정상 플레이에서도 790~990(번들 비압축·개발 도구로 부풀림) → soft 1000 · hard 1300.
#          950 하드 상한이 정상 개발 플레이를 강제 재시작시켰다(10-10 14:06 PSS 992).
# GL 하드 상한(200)은 두 빌드 공통 유지. 판별: 설치 패키지 flags 의 DEBUGGABLE(2분 캐시).
function Get-ArcfireBuildVariant {
  $cache = Join-Path $PSScriptRoot 'logs/.build-variant.txt'
  try {
    if (Test-Path $cache) {
      $item = Get-Item $cache
      if (((Get-Date) - $item.LastWriteTime).TotalSeconds -lt 120) {
        $v = (Get-Content $cache -Raw).Trim()
        if ($v -in @('debug', 'release')) { return $v }
      }
    }
    $flags = (adb shell dumpsys package com.arcfire.online 2>$null | Select-String 'flags=\[' | Select-Object -First 1).Line
    if (-not $flags) { return 'unknown' }
    $variant = if ($flags -match 'DEBUGGABLE') { 'debug' } else { 'release' }
    Set-Content -Path $cache -Value $variant -Encoding ascii
    return $variant
  } catch {
    return 'unknown'
  }
}

$script:MEM_BUILD_VARIANT = 'unknown'
# 장시간 루프(run-monitor 등)는 이 파일을 시작 시 1회만 dot-source 한다 → 판정 함수가 호출될 때마다 갱신(2분 캐시).
function Update-MemBuildCeilings {
  $variant = Get-ArcfireBuildVariant
  if ($variant -eq $script:MEM_BUILD_VARIANT) { return }
  $script:MEM_BUILD_VARIANT = $variant
  switch ($variant) {
    'release' {
      $script:MEM_PSS_SOFT_CEILING_MB = 600
      $script:MEM_PSS_HARD_CEILING_MB = 800
      $script:MEM_VIEWS_RETENTION_WARN = 600
      $script:MEM_NATIVE_HEAP_WARN_MB = 300
    }
    'debug' {
      $script:MEM_PSS_SOFT_CEILING_MB = 1000
      $script:MEM_PSS_HARD_CEILING_MB = 1300
      $script:MEM_VIEWS_RETENTION_WARN = 600
      $script:MEM_NATIVE_HEAP_WARN_MB = 650
    }
    default {
      # 판별 실패(기기 미연결 등) — 직전 값 유지
    }
  }
}
Update-MemBuildCeilings

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
# PSS-only + 전투 GL 구간은 Test-MemPssOnlyHardCeilingCombatGrace 로 1차 보류 가능.
function Test-MemHardCeilingBreach {
  param(
    [double]$GlMb,
    [double]$PssMb
  )
  Update-MemBuildCeilings
  return ($GlMb -ge $script:MEM_GL_HARD_CEILING_MB) -or ($PssMb -ge $script:MEM_PSS_HARD_CEILING_MB)
}

# PSS>=950 이지만 GL 은 정상 전투 구간(80~200) — 장시간 floor 위 전투 마운트 false-kill 후보.
# GL>=200 · idle GL · 비허브는 제외(즉시 하드실링 유지).
function Test-MemPssOnlyHardCeilingCombatGrace {
  param(
    [double]$GlMb,
    [double]$PssMb,
    [int]$Views
  )
  if (-not (Test-MemHubActive -Views $Views)) { return $false }
  if ($GlMb -ge $script:MEM_GL_HARD_CEILING_MB) { return $false }
  if ($GlMb -lt $script:MEM_GL_CRITICAL_ACTIVE_MB) { return $false }
  if ($PssMb -lt $script:MEM_PSS_HARD_CEILING_MB) { return $false }
  return $true
}

function Test-MemPssSoftCeilingBreach {
  param([double]$PssMb)
  Update-MemBuildCeilings
  return ($PssMb -ge $script:MEM_PSS_SOFT_CEILING_MB) -and ($PssMb -lt $script:MEM_PSS_HARD_CEILING_MB)
}

# views/native_heap 단독 급증 조기 경보 — PSS 하드실링(950) 도달 전에 감지.
# GL은 정상이라 GL 계열 판정에 안 걸리고 PSS도 아직 soft 미만일 수 있는 native_heap/views 축을 잡는다.
# 기록·advisory 전용(강제 재시작 없음) — force-stop 확대로 인한 false-positive 재기동을 피한다.
function Test-MemViewsNativeAdvisory {
  param(
    [int]$Views,
    [double]$NativeHeapMb,
    [double]$PssMb
  )
  # 이미 soft/hard 실링에서 다뤄지는 구간은 중복 기록하지 않는다.
  if ($PssMb -ge $script:MEM_PSS_SOFT_CEILING_MB) { return $false }
  if ($Views -ge $script:MEM_VIEWS_RETENTION_WARN) { return $true }
  if ($NativeHeapMb -ge $script:MEM_NATIVE_HEAP_WARN_MB) { return $true }
  return $false
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
