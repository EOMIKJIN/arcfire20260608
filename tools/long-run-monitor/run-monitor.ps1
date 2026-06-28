# Arcfire long-run monitor — meminfo + GL/PSS trend (hub Skia leak vs activation)
param(
  [string]$Package = 'com.arcfire.online',
  [int]$IntervalMin = 10
)

if ($IntervalMin -lt 1) {
  Write-Error 'IntervalMin must be >= 1. For one-shot use manual-mem-snapshot.ps1'
  exit 1
}

. (Join-Path $PSScriptRoot 'mem-gl-leak-rules.ps1')
. (Join-Path $PSScriptRoot 'monitor-host-budget.ps1')

$IntervalMin = Enforce-MonitorIntervalFloor -IntervalMin $IntervalMin -FloorMin $script:MONITOR_MIN_MEMINFO_INTERVAL_MIN

$logDir = Join-Path $PSScriptRoot 'logs'
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$memLog = Join-Path $logDir "meminfo-$ts.log"
$metaLog = Join-Path $logDir "monitor-$ts.log"
$timelineCsv = Join-Path $logDir "mem-timeline.csv"
$alertLog = Join-Path $logDir "mem-alerts.log"

function Write-Meta([string]$msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Add-Content -Path $metaLog -Value $line
  Write-Host $line
}

function Parse-MeminfoMetrics([string]$raw) {
  $m = @{
    PssKb = $null
    RssKb = $null
    GlKb = $null
    EglKb = $null
    GraphicsKb = $null
    NativeHeapKb = $null
    JavaHeapKb = $null
    Threads = $null
    Views = $null
  }
  if ($raw -match 'TOTAL PSS:\s+(\d+)') { $m.PssKb = [int]$Matches[1] }
  if ($raw -match 'TOTAL RSS:\s+(\d+)') { $m.RssKb = [int]$Matches[1] }
  if ($raw -match '(?m)^\s*GL mtrack\s+(\d+)') { $m.GlKb = [int]$Matches[1] }
  if ($raw -match '(?m)^\s*EGL mtrack\s+(\d+)') { $m.EglKb = [int]$Matches[1] }
  if ($raw -match 'Graphics:\s+(\d+)') { $m.GraphicsKb = [int]$Matches[1] }
  if ($raw -match 'Native Heap:\s+(\d+)') { $m.NativeHeapKb = [int]$Matches[1] }
  if ($raw -match 'Java Heap:\s+(\d+)') { $m.JavaHeapKb = [int]$Matches[1] }
  if ($raw -match 'Threads:\s+(\d+)') { $m.Threads = [int]$Matches[1] }
  if ($raw -match 'Views:\s+(\d+)') { $m.Views = [int]$Matches[1] }
  return $m
}

function Get-LastTimelineRowForPid([string]$targetPid) {
  if (-not (Test-Path $timelineCsv)) { return $null }
  $rows = Get-Content $timelineCsv | Select-Object -Skip 1 | Where-Object {
    $c = $_ -split ','
    $c.Count -ge 5 -and $c[1] -eq $targetPid -and $c[2] -match '^\d'
  }
  if ($rows.Count -eq 0) { return $null }
  return ($rows[-1] -split ',')
}

$header = 'iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note'
if (-not (Test-Path $timelineCsv)) {
  Set-Content -Path $timelineCsv -Value $header -Encoding utf8
}

Write-Meta "monitor start package=$Package interval=${IntervalMin}m rules=v2(hub_activation_excluded)"
Write-Meta "meminfo -> $memLog"
Write-Meta "timeline -> $timelineCsv"
Write-Meta "alerts -> $alertLog"
Write-Meta "FOCUS: hub Skia orbit + nebula + combat — restart only active hub GL>=${MEM_GL_CRITICAL_ACTIVE_MB}MB or 3x dGL>=${MEM_GL_SPIKE_DELTA_MB}MB"

while ($true) {
  $iso = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  $appPidRaw = adb shell "pidof $Package" 2>$null
  $appPid = if ($appPidRaw) { ($appPidRaw | Out-String).Trim() } else { '' }
  Add-Content -Path $memLog -Value "`n===== $iso pid=$appPid ====="

  if (-not $appPid) {
    Add-Content -Path $memLog -Value 'PROCESS NOT RUNNING'
    $line = "$iso,,,,,,,,,,,PROCESS_NOT_RUNNING"
    Add-Content -Path $timelineCsv -Value $line
    Add-Content -Path $alertLog -Value "[$iso] CRITICAL process not running — check crash-*.log"
    Write-Meta "WARN: $Package not running"
    Start-Sleep -Seconds ($IntervalMin * 60)
    continue
  }

  $raw = (adb shell dumpsys meminfo $Package 2>&1 | Out-String)
  Register-AdbMeminfoInvocation -LogDir $logDir
  $raw | Out-File -Append -FilePath $memLog -Encoding utf8
  $status = adb shell "cat /proc/$appPid/status 2>/dev/null | grep -E 'VmRSS|VmSwap|Threads'" 2>&1
  Add-Content -Path $memLog -Value $status

  $met = Parse-MeminfoMetrics $raw
  $pssMb = if ($met.PssKb) { [math]::Round($met.PssKb / 1024, 1) } else { '' }
  $rssMb = if ($met.RssKb) { [math]::Round($met.RssKb / 1024, 1) } else { '' }
  $glMb = if ($met.GlKb) { [math]::Round($met.GlKb / 1024, 1) } else { '' }
  $eglMb = if ($met.EglKb) { [math]::Round($met.EglKb / 1024, 1) } else { '' }
  $gfxMb = if ($met.GraphicsKb) { [math]::Round($met.GraphicsKb / 1024, 1) } else { '' }
  $natMb = if ($met.NativeHeapKb) { [math]::Round($met.NativeHeapKb / 1024, 1) } else { '' }
  $javaMb = if ($met.JavaHeapKb) { [math]::Round($met.JavaHeapKb / 1024, 1) } else { '' }
  $curViews = if ($met.Views) { [int]$met.Views } else { 0 }

  $deltaPss = ''
  $deltaGl = ''
  $note = ''
  $prev = Get-LastTimelineRowForPid $appPid
  if ($prev -and $prev.Count -ge 10) {
    $prevPss = [double]$prev[2]
    $prevGl = [double]$prev[4]
    $prevViews = 0
    if ($prev.Count -ge 11 -and $prev[10] -match '^\d+') { $prevViews = [int]$prev[10] }

    if ($pssMb -ne '' -and $prevPss -gt 0) {
      $deltaPss = [math]::Round($pssMb - $prevPss, 1)
    }
    if ($glMb -ne '' -and $prevGl -gt 0) {
      $deltaGl = [math]::Round($glMb - $prevGl, 1)
    }

    $isActivation = Test-MemHubActivationTransition -PrevGlMb $prevGl -PrevViews $prevViews -CurViews $curViews
    $hubActive = Test-MemHubActive -Views $curViews

    if ($deltaGl -ge $MEM_GL_SPIKE_DELTA_MB) {
      if ($isActivation) {
        $note = 'HUB_ACTIVATION gl_mount_ok'
        Write-Meta "INFO hub activation GL ${prevGl}->${glMb}MB views ${prevViews}->${curViews} (no restart)"
      } elseif ($hubActive) {
        $note = 'GL_SPIKE suspect=hub_skia_orbit_nebula_combat'
        Add-Content -Path $alertLog -Value "[$iso] GL +${deltaGl}MB views=${curViews} (PSS ${deltaPss}MB) — active hub"
        Write-Meta "ALERT GL +${deltaGl}MB active hub views=${curViews}"
        # 단일 스파이크만으로 즉시 재시작하지 않는다(전투 진입 마운트 급상승 false-positive 방지).
        # 재시작 판단은 직후 호출되는 check-and-remediate(추세·plateau·하드실링 컨텍스트 보유)에 위임.
        # 단, 진짜 OOM 임박(하드 실링)은 추세와 무관하게 즉시 조치 — check-and-remediate 단일 경로로 coalesce.
        if (Test-MemHardCeilingBreach -GlMb ([double]$glMb) -PssMb ([double]$pssMb)) {
          Write-Meta "ALERT GL/PSS hard-ceiling breach gl=${glMb}MB pss=${pssMb}MB — defer remediation to check-and-remediate"
        }
      } else {
        $note = 'GL_DELTA background_or_transition'
        Write-Meta "INFO GL +${deltaGl}MB views=${curViews} (not active hub — log only)"
      }
    } elseif ($deltaPss -ge 40) {
      $note = 'PSS_SPIKE review=graphics+native'
      Add-Content -Path $alertLog -Value "[$iso] PSS +${deltaPss}MB GL ${glMb}MB views=${curViews}"
      Write-Meta "ALERT PSS +${deltaPss}MB"
    } elseif ($deltaGl -le -5) {
      $note = 'GL_RECOVERED idle_ok'
    }
  }

  $csvLine = "$iso,$appPid,$pssMb,$rssMb,$glMb,$eglMb,$gfxMb,$natMb,$javaMb,$($met.Threads),$curViews,$deltaPss,$deltaGl,$note"
  Add-Content -Path $timelineCsv -Value $csvLine
  Write-Meta "snap PSS=${pssMb}MB GL=${glMb}MB views=${curViews} dPSS=${deltaPss} dGL=${deltaGl} $note"

  & (Join-Path $PSScriptRoot 'check-and-remediate.ps1') -LogDir $logDir -TimelineCsv $timelineCsv -IntervalMin $IntervalMin -Package $Package

  Start-Sleep -Seconds ($IntervalMin * 60)
}
