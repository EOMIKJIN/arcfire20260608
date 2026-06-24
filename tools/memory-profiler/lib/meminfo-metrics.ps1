function Parse-ArcfireMeminfoMetrics([string]$Raw) {
  $m = @{
    PssKb        = $null
    RssKb        = $null
    GlKb         = $null
    EglKb        = $null
    GraphicsKb   = $null
    NativeHeapKb = $null
    JavaHeapKb   = $null
    Threads      = $null
    Views        = $null
  }
  if ($Raw -match 'TOTAL PSS:\s+(\d+)') { $m.PssKb = [int]$Matches[1] }
  if ($Raw -match 'TOTAL RSS:\s+(\d+)') { $m.RssKb = [int]$Matches[1] }
  if ($Raw -match '(?m)^\s*GL mtrack\s+(\d+)') { $m.GlKb = [int]$Matches[1] }
  if ($Raw -match '(?m)^\s*EGL mtrack\s+(\d+)') { $m.EglKb = [int]$Matches[1] }
  if ($Raw -match 'Graphics:\s+(\d+)') { $m.GraphicsKb = [int]$Matches[1] }
  if ($Raw -match 'Native Heap:\s+(\d+)') { $m.NativeHeapKb = [int]$Matches[1] }
  if ($Raw -match 'Java Heap:\s+(\d+)') { $m.JavaHeapKb = [int]$Matches[1] }
  if ($Raw -match 'Threads:\s+(\d+)') { $m.Threads = [int]$Matches[1] }
  if ($Raw -match 'Views:\s+(\d+)') { $m.Views = [int]$Matches[1] }
  return $m
}

function Convert-ArcfireMemMetricsToMb([hashtable]$M) {
  @{
    PssMb    = if ($M.PssKb) { [math]::Round($M.PssKb / 1024, 1) } else { $null }
    RssMb    = if ($M.RssKb) { [math]::Round($M.RssKb / 1024, 1) } else { $null }
    GlMb     = if ($M.GlKb) { [math]::Round($M.GlKb / 1024, 1) } else { $null }
    EglMb    = if ($M.EglKb) { [math]::Round($M.EglKb / 1024, 1) } else { $null }
    GfxMb    = if ($M.GraphicsKb) { [math]::Round($M.GraphicsKb / 1024, 1) } else { $null }
    NativeMb = if ($M.NativeHeapKb) { [math]::Round($M.NativeHeapKb / 1024, 1) } else { $null }
    JavaMb   = if ($M.JavaHeapKb) { [math]::Round($M.JavaHeapKb / 1024, 1) } else { $null }
    Threads  = $M.Threads
    Views    = $M.Views
  }
}
