# Arcfire memory budget ledger — mem-timeline KPI 요약
param(
  [string]$LogDir = (Join-Path $PSScriptRoot 'logs'),
  [int]$TailRows = 500
)

$timelineCsv = Join-Path $LogDir 'mem-timeline.csv'
$ledgerCsv = Join-Path $LogDir 'arc-memory-budget-ledger.csv'
$reportMd = Join-Path $LogDir 'arc-memory-budget-ledger-latest.md'

if (-not (Test-Path $timelineCsv)) {
  Write-Host 'ledger SKIP no timeline'
  exit 0
}

$rows = Import-Csv $timelineCsv -ErrorAction SilentlyContinue | Select-Object -Last $TailRows
if (-not $rows -or $rows.Count -eq 0) { exit 0 }

$parsed = @()
foreach ($r in $rows) {
  if (-not $r.iso_time -or -not $r.pid) { continue }
  $pss = 0.0; $nat = 0.0; $gl = 0.0; $views = 0
  [void][double]::TryParse([string]$r.pss_mb, [ref]$pss)
  [void][double]::TryParse([string]$r.native_heap_mb, [ref]$nat)
  [void][double]::TryParse([string]$r.gl_mb, [ref]$gl)
  [void][int]::TryParse([string]$r.views, [ref]$views)
  if ($pss -le 0) { continue }
  $parsed += [pscustomobject]@{
    Time = $r.iso_time
    Pid = [string]$r.pid
    PssMb = $pss
    NativeMb = $nat
    GlMb = $gl
    Views = $views
    Note = [string]$r.note
  }
}

if ($parsed.Count -eq 0) { exit 0 }

$targetPid = ($parsed | Group-Object Pid | Sort-Object Count -Descending | Select-Object -First 1).Name
$pidRows = @($parsed | Where-Object { $_.Pid -eq $targetPid } | Sort-Object { [datetime]::Parse($_.Time) })

$pssVals = $pidRows | ForEach-Object { $_.PssMb } | Sort-Object
$natVals = @($pidRows | Where-Object { $_.NativeMb -gt 0 } | ForEach-Object { $_.NativeMb } | Sort-Object)
$idx50 = [Math]::Floor(($pssVals.Count - 1) * 0.5)
$idx90 = [Math]::Floor(($pssVals.Count - 1) * 0.9)
$pssP50 = $pssVals[$idx50]
$pssP90 = $pssVals[$idx90]
$pssMax = $pssVals[-1]
$natP50 = if ($natVals.Count -gt 0) { $natVals[[Math]::Floor(($natVals.Count - 1) * 0.5)] } else { 0 }
$ge800 = @($pidRows | Where-Object { $_.PssMb -ge 800 }).Count
$ge800Pct = [math]::Round(100.0 * $ge800 / $pidRows.Count, 1)

$iso = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
$line = "$iso,$targetPid,$pssP50,$pssP90,$pssMax,$natP50,$ge800Pct,$($pidRows.Count)"
if (-not (Test-Path $ledgerCsv)) {
  Set-Content -Path $ledgerCsv -Value 'generated_at,pid,pss_p50_mb,pss_p90_mb,pss_max_mb,native_p50_mb,pss_ge800_pct,samples' -Encoding utf8
}
Add-Content -Path $ledgerCsv -Value $line -Encoding utf8

$md = @"
# Arc memory budget ledger

generated: $iso KST
pid: $targetPid
samples: $($pidRows.Count) (tail $TailRows)

| metric | value | target (plan) |
|--------|-------|----------------|
| PSS p50 | $pssP50 MB | <=750 |
| PSS p90 | $pssP90 MB | <=900 |
| PSS max | $pssMax MB | <=950 hard |
| Native p50 | $natP50 MB | <=350 |
| PSS>=800 | $ge800Pct % | decreasing |

"@
Set-Content -Path $reportMd -Value $md -Encoding utf8
Write-Host "ledger pid=$targetPid pssP50=$pssP50 p90=$pssP90 natP50=$natP50 ge800=$ge800Pct%"
