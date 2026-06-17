# One-shot mem snapshot (resume / manual check)
param(
  [string]$Package = 'com.arcfire.online',
  [string]$Note = 'MANUAL_RESUME_CHECK'
)

$ScriptRoot = $PSScriptRoot
. (Join-Path $ScriptRoot 'mem-gl-leak-rules.ps1')
$logDir = Join-Path $ScriptRoot 'logs'
$timelineCsv = Join-Path $logDir 'mem-timeline.csv'
$heartbeatLog = Join-Path $logDir 'heartbeat.log'
$iso = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$appPid = (adb shell "pidof $Package" 2>$null).ToString().Trim()
if (-not $appPid) {
  Write-Host 'APP_NOT_RUNNING'
  exit 1
}

$raw = (adb shell dumpsys meminfo $Package 2>&1 | Out-String)
$m = @{ PssKb = $null; RssKb = $null; GlKb = $null; EglKb = $null; GraphicsKb = $null; NativeHeapKb = $null; JavaHeapKb = $null; Threads = $null; Views = $null }
if ($raw -match 'TOTAL PSS:\s+(\d+)') { $m.PssKb = [int]$Matches[1] }
if ($raw -match 'TOTAL RSS:\s+(\d+)') { $m.RssKb = [int]$Matches[1] }
if ($raw -match '(?m)^\s*GL mtrack\s+(\d+)') { $m.GlKb = [int]$Matches[1] }
if ($raw -match '(?m)^\s*EGL mtrack\s+(\d+)') { $m.EglKb = [int]$Matches[1] }
if ($raw -match 'Graphics:\s+(\d+)') { $m.GraphicsKb = [int]$Matches[1] }
if ($raw -match 'Native Heap:\s+(\d+)') { $m.NativeHeapKb = [int]$Matches[1] }
if ($raw -match 'Java Heap:\s+(\d+)') { $m.JavaHeapKb = [int]$Matches[1] }
if ($raw -match 'Threads:\s+(\d+)') { $m.Threads = [int]$Matches[1] }
if ($raw -match 'Views:\s+(\d+)') { $m.Views = [int]$Matches[1] }

$pssMb = [math]::Round($m.PssKb / 1024, 1)
$rssMb = [math]::Round($m.RssKb / 1024, 1)
$glMb = [math]::Round($m.GlKb / 1024, 1)
$eglMb = [math]::Round($m.EglKb / 1024, 1)
$gfxMb = [math]::Round($m.GraphicsKb / 1024, 1)
$natMb = [math]::Round($m.NativeHeapKb / 1024, 1)
$javaMb = [math]::Round($m.JavaHeapKb / 1024, 1)
$curViews = if ($m.Views) { [int]$m.Views } else { 0 }

$deltaPss = ''
$deltaGl = ''
$note = $Note
$prev = Get-Content $timelineCsv -ErrorAction SilentlyContinue |
  Select-Object -Skip 1 |
  Where-Object { ($_ -split ',')[1] -eq $appPid -and ($_ -split ',')[2] -match '^\d' } |
  Select-Object -Last 1
if ($prev) {
  $c = $prev -split ','
  $prevPss = [double]$c[2]
  $prevGl = [double]$c[4]
  $prevViews = 0
  if ($c.Count -ge 11 -and $c[10] -match '^\d+') { $prevViews = [int]$c[10] }
  if ($prevPss -gt 0) { $deltaPss = [math]::Round($pssMb - $prevPss, 1) }
  if ($prevGl -gt 0) { $deltaGl = [math]::Round($glMb - $prevGl, 1) }
  if (Test-MemHubActivationTransition -PrevGlMb $prevGl -PrevViews $prevViews -CurViews $curViews) {
    $note = 'HUB_ACTIVATION gl_mount_ok MANUAL'
  } elseif ($deltaGl -ge $MEM_GL_SPIKE_DELTA_MB -and (Test-MemHubActive -Views $curViews)) {
    $note = 'GL_SPIKE suspect=hub_skia MANUAL'
  }
}

$line = "$iso,$appPid,$pssMb,$rssMb,$glMb,$eglMb,$gfxMb,$natMb,$javaMb,$($m.Threads),$curViews,$deltaPss,$deltaGl,$note"
Add-Content -Path $timelineCsv -Value $line -Encoding utf8
Add-Content -Path $heartbeatLog -Value "[$iso] MANUAL OK PSS ${pssMb}MB / GL ${glMb}MB / views $curViews ($note)" -Encoding utf8
Write-Host $line
& (Join-Path $ScriptRoot 'check-and-remediate.ps1') -LogDir $logDir -TimelineCsv $timelineCsv -IntervalMin 30 -Package $Package
