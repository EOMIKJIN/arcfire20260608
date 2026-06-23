# 김경제 장기감시 — heartbeat·실시간 알림 공통 필터 (오탐 차단)
# 정본: mem-gl-leak-rules.ps1 Get-ArcfireCrashLogEvents

function Test-WatchActionableIncident {
  param([string]$Line)
  if ([string]::IsNullOrWhiteSpace($Line)) { return $false }
  # 플레이테스트·기록 전용 — heartbeat 적색 제외
  if ($Line -match 'PLAYTEST_|SOAK_1H_|PLAYTEST_MILESTONE|MANUAL|RECORD_ONLY') { return $false }
  if ($Line -match 'GL_ELEVATED|restart_held|PROCESS_EXIT clean') { return $false }
  if ($Line -match 'REFIX_REQUESTED') { return $false }
  # monitor-paused 시 GL 하드실링은 mem-timeline/remediation INFO만 (incidents 미기록 목표)
  if ($Line -match 'GL_HARD_CEILING_RECORD_ONLY') { return $false }
  if ($Line -match '===== CRASH |PROCESS_DEATH|ABNORMAL_RESTART|GL_LEAK_SUSPECT|GL_BASELINE_DRIFT') {
    return $true
  }
  if ($Line -match 'GL_HARD_CEILING') { return $true }
  if ($Line -match 'CRITICAL process not running') { return $true }
  return $false
}

function Test-WatchActionableMemAlert {
  param([string]$Line)
  if ([string]::IsNullOrWhiteSpace($Line)) { return $false }
  if ($Line -match 'CRITICAL process not running') { return $true }
  if ($Line -match 'GL \+\d+MB.*active hub' -and $Line -notmatch 'GL \+([0-9.]+)MB') { return $false }
  # PSS spike alone is noisy — only if paired with process death in same tick (handled elsewhere)
  return $false
}

function Read-CrashLogTailBytes {
  param(
    [string]$CrashPath,
    [string]$OffsetFile,
    [int]$MaxAgeMin = 40
  )
  $result = @{ Events = @(); NewOffset = 0; Path = $CrashPath }
  if (-not (Test-Path $CrashPath)) { return $result }
  $offset = 0
  if (Test-Path $OffsetFile) {
    try { $offset = [int64](Get-Content $OffsetFile -Raw).Trim() } catch { $offset = 0 }
  }
  $fi = Get-Item $CrashPath
  if ($fi.Length -le $offset) {
    $result.NewOffset = $offset
    return $result
  }
  try {
    $fs = [System.IO.File]::Open($CrashPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
    $fs.Seek($offset, [System.IO.SeekOrigin]::Begin) | Out-Null
    $reader = New-Object System.IO.StreamReader($fs)
    $newText = $reader.ReadToEnd()
    $reader.Close()
    $fs.Close()
    $result.NewOffset = $fi.Length
    Set-Content -Path $OffsetFile -Value $fi.Length -NoNewline
    $result.Events = @(Get-ArcfireCrashLogEvents -Text $newText -MaxAgeMin $MaxAgeMin)
  } catch { }
  return $result
}

function Write-GlCeilingPausedThrottle {
  param(
    [string]$LogDir,
    [double]$GlMb,
    [double]$PssMb,
    [int]$Views,
    [int]$ThrottleMin = 30
  )
  $stateFile = Join-Path $LogDir '.gl-ceiling-paused-throttle.json'
  $now = Get-Date
  $shouldLog = $true
  if (Test-Path $stateFile) {
    try {
      $st = Get-Content $stateFile -Raw | ConvertFrom-Json
      $last = [datetime]::Parse($st.at)
      $ageMin = ($now - $last).TotalMinutes
      $glDelta = [math]::Abs($GlMb - [double]$st.glMb)
      if ($ageMin -lt $ThrottleMin -and $glDelta -lt 8) { $shouldLog = $false }
    } catch { }
  }
  if (-not $shouldLog) { return $false }
  @{ at = $now.ToString('o'); glMb = $GlMb; pssMb = $PssMb; views = $Views } |
    ConvertTo-Json -Compress | Set-Content -Path $stateFile -Encoding utf8
  return $true
}
