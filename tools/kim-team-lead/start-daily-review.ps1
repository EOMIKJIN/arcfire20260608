# 김팀장 일 1회 경제·밸런스 총괄 검수 (Windows 작업 스케줄러용)
# 권장: 매일 09:00 KST (김경제 야간·새벽 작업 후 김팀장 오전 검수)
$ErrorActionPreference = 'Stop'
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

$LogDir = Join-Path $PSScriptRoot 'reports'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$LogFile = Join-Path $LogDir 'daily-review-scheduler.log'

$ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
"[$ts] start audit:team-lead:daily" | Tee-Object -FilePath $LogFile -Append

npm run audit:team-lead:daily 2>&1 | Tee-Object -FilePath $LogFile -Append
$code = $LASTEXITCODE

"[$ts] exit=$code" | Tee-Object -FilePath $LogFile -Append
exit $code
