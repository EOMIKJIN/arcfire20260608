# 김경제 감시 — mem-timeline 요약 실시간 뷰 (읽기 전용 · 앱 무영향)
# 출력: mem pss=.. gl=.. views=.. @ iso_time  (15분 주기 샘플)
param([int]$Tail = 16)

$csv = Join-Path $PSScriptRoot 'logs/mem-timeline.csv'
$host.UI.RawUI.WindowTitle = 'Arcfire 김경제 감시 모니터 (mem 요약)'
Write-Host '=== Arcfire 김경제 감시 모니터 — 시간대별 메모리 요약 ===' -ForegroundColor Cyan
Write-Host '(15분 주기 갱신 · 창을 닫아도 백그라운드 감시는 유지)' -ForegroundColor DarkGray
Write-Host ''

function Show-MemLine([string]$line) {
    if (-not $line -or $line.StartsWith('iso_time')) { return }
    $c = $line.Split(',')
    if ($c.Count -lt 11) { return }
    $time = $c[0]
    if ($line -match 'PROCESS_NOT_RUNNING') {
        Write-Host ("app off                                   @ {0}" -f $time) -ForegroundColor DarkGray
        return
    }
    $pss = $c[2]; $gl = $c[4]; $views = $c[10]
    if (-not $pss) { return }
    $color = 'Green'
    if ([double]$pss -ge 800 -or ($views -and [int]$views -ge 450)) { $color = 'Yellow' }
    if ([double]$pss -ge 1000) { $color = 'Red' }
    Write-Host ("mem pss={0} gl={1} views={2} @ {3}" -f $pss, $gl, $views, $time) -ForegroundColor $color
}

Get-Content $csv -Tail $Tail -Wait | ForEach-Object { Show-MemLine $_ }
