# logcat tail → [MEM_PROFILE] 마커 추출 (Hermes heap proxy)
param(
  [string]$LogDir = (Join-Path (Split-Path $PSScriptRoot -Parent) 'long-run-monitor\logs'),
  [string]$OutFile = (Join-Path $PSScriptRoot 'reports\mem-profile-logcat.txt'),
  [int]$TailLines = 8000
)

$crashLogs = Get-ChildItem -Path $LogDir -Filter 'crash-*.log' -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 3

if (-not $crashLogs -or $crashLogs.Count -eq 0) {
  Write-Host 'NO_CRASH_LOGS'
  exit 0
}

$matches = New-Object System.Collections.Generic.List[string]
foreach ($f in $crashLogs) {
  Get-Content $f -Tail $TailLines -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_ -match '\[MEM_PROFILE\]') {
      $matches.Add($_)
    }
  }
}

New-Item -ItemType Directory -Force -Path (Split-Path $OutFile -Parent) | Out-Null
Set-Content -Path $OutFile -Value ($matches | Select-Object -Unique) -Encoding utf8
Write-Host "mem_profile_lines=$($matches.Count) out=$OutFile"
