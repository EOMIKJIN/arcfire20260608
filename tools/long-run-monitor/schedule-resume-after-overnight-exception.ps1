# Wait until resumeAt KST then call resume-after-overnight-exception.ps1
param(
  [Parameter(Mandatory = $true)]
  [string]$ResumeAt
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$scheduleLog = Join-Path $logDir 'overnight-resume-schedule.log'

function Log([string]$msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Add-Content -Path $scheduleLog -Value $line -Encoding utf8
  Write-Output $line
}

try {
  $target = [DateTime]::ParseExact($ResumeAt, 'yyyy-MM-dd HH:mm:ss', $null)
} catch {
  Log "PARSE_FAIL resumeAt=$ResumeAt"
  exit 1
}

$waitSec = [math]::Max(1, [int](($target - (Get-Date)).TotalSeconds))
Log "SCHEDULED resume_at_kst=$ResumeAt waitSec=$waitSec"

Start-Sleep -Seconds $waitSec

Log 'WAKE resume-after-overnight-exception'
& (Join-Path $ScriptRoot 'resume-after-overnight-exception.ps1') | ForEach-Object { Log $_ }
