# Cursor 에이전트 3h wake — balance-ops 감사 요약 보고
param(
  [int]$IntervalHours = 3
)

$intervalSec = $IntervalHours * 3600
$prompt = 'npm run audit:balance-ops 실행 후 tools/balance-ops-audit/reports/latest.md 요약 보고'

while ($true) {
  Start-Sleep -Seconds $intervalSec
  $payload = @{ prompt = $prompt } | ConvertTo-Json -Compress
  Write-Output "AGENT_LOOP_TICK_balance_ops $payload"
}
