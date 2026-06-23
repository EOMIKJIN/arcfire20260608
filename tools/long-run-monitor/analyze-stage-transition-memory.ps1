# STAGE 전환 구간 mem-timeline 분석 — planet↔worldmap floor drift
param(
  [string]$LogDir = (Join-Path $PSScriptRoot 'logs'),
  [int]$ViewSpikeThreshold = 400
)

$timeline = Join-Path $LogDir 'mem-timeline.csv'
if (-not (Test-Path $timeline)) { Write-Error "missing $timeline"; exit 1 }

$rows = @()
Get-Content $timeline | Select-Object -Skip 1 | ForEach-Object {
  $c = $_ -split ','
  if ($c.Count -lt 3) { return }
  $rows += [PSCustomObject]@{
    Time     = $c[0]
    Pid      = $c[1]
    Pss      = if ($c[2]) { [double]$c[2] } else { 0 }
    Gl       = if ($c[4]) { [double]$c[4] } else { 0 }
    Native   = if ($c[7]) { [double]$c[7] } else { 0 }
    Views    = if ($c[10]) { [int]$c[10] } else { 0 }
    DeltaPss = if ($c.Count -gt 11 -and $c[11]) { $c[11] } else { '' }
    Note     = if ($c.Count -gt 12) { ($c[12..($c.Count - 1)] -join ',') } else { '' }
  }
}

Write-Output "# STAGE transition memory analysis"
Write-Output "generated: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss')) KST"
Write-Output "samples: $($rows.Count)"
Write-Output ""

Write-Output "## View spikes (views >= $ViewSpikeThreshold) — duplicate RN tree footprint"
$spikes = $rows | Where-Object { $_.Views -ge $ViewSpikeThreshold } | Sort-Object Time
foreach ($s in $spikes) {
  Write-Output "- $($s.Time) pid=$($s.Pid) pss=$($s.Pss) gl=$($s.Gl) native=$($s.Native) views=$($s.Views) note=$($s.Note)"
}
Write-Output ""

Write-Output "## Milestone-adjacent samples (depart/land/hub)"
$milestones = $rows | Where-Object { $_.Note -match 'depart|HUB_ACTIVATION|GL_RECOVERED|PLAYTEST_MILESTONE|worldmap' }
foreach ($m in $milestones | Select-Object -Last 25) {
  Write-Output "- $($m.Time) pss=$($m.Pss) gl=$($m.Gl) native=$($m.Native) views=$($m.Views) $($m.Note)"
}
Write-Output ""

Write-Output "## Per-PID floor drift (p20 PSS / native / GL within same session pid)"
$pids = ($rows | Where-Object { $_.Pid -and $_.Pid -ne '' } | Select-Object -ExpandProperty Pid -Unique)
foreach ($procId in $pids | Select-Object -Last 8) {
  $grp = @($rows | Where-Object { $_.Pid -eq $procId -and $_.Pss -gt 0 })
  if ($grp.Count -lt 3) { continue }
  $pssSorted = ($grp | ForEach-Object { $_.Pss } | Sort-Object)
  $natSorted = ($grp | Where-Object { $_.Native -gt 0 } | ForEach-Object { $_.Native } | Sort-Object)
  $glSorted  = ($grp | Where-Object { $_.Gl -gt 0 } | ForEach-Object { $_.Gl } | Sort-Object)
  $p20 = $pssSorted[[Math]::Floor($pssSorted.Count * 0.2)]
  $p80 = $pssSorted[[Math]::Floor($pssSorted.Count * 0.8)]
  $natP20 = if ($natSorted.Count -gt 0) { $natSorted[[Math]::Floor($natSorted.Count * 0.2)] } else { 0 }
  $natP80 = if ($natSorted.Count -gt 0) { $natSorted[[Math]::Floor($natSorted.Count * 0.8)] } else { 0 }
  $glP20  = if ($glSorted.Count -gt 0) { $glSorted[[Math]::Floor($glSorted.Count * 0.2)] } else { 0 }
  $glP80  = if ($glSorted.Count -gt 0) { $glSorted[[Math]::Floor($glSorted.Count * 0.8)] } else { 0 }
  $first = $grp[0].Time; $last = $grp[-1].Time
  Write-Output "- pid=$procId samples=$($grp.Count) window=$first .. $last"
  Write-Output "  PSS p20-p80: $p20 - $p80 MB (spread $([math]::Round($p80 - $p20, 1)))"
  Write-Output "  Native p20-p80: $natP20 - $natP80 MB (spread $([math]::Round($natP80 - $natP20, 1)))"
  Write-Output "  GL p20-p80: $glP20 - $glP80 MB (spread $([math]::Round($glP80 - $glP20, 1)))"
}
