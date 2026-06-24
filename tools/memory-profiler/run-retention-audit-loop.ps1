param(
  [int]$RetentionAuditEveryMin = 60,
  [string]$ProfileLogcat = ''
)

$ScriptRoot = $PSScriptRoot
while ($true) {
  Start-Sleep -Seconds ($RetentionAuditEveryMin * 60)
  if ($ProfileLogcat -and (Test-Path $ProfileLogcat)) {
    Copy-Item -Path $ProfileLogcat -Destination (Join-Path $ScriptRoot 'reports\mem-profile-logcat.txt') -Force
  } else {
    & (Join-Path $ScriptRoot 'pull-mem-profile-logcat.ps1') | Out-Null
  }
  node (Join-Path $ScriptRoot 'run-retention-audit.cjs') 2>&1 | Out-Null
}
