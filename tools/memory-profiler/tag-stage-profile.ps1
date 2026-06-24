# STAGE 전환 시점 스냅샷 + mem-timeline 연동 (플레이테스트·수동)
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('planet_hub', 'galaxy_map', 'combat_transit', 'sub_stage', 'unknown')]
  [string]$Stage,
  [Parameter(Mandatory = $true)]
  [ValidateSet('route_blur', 'route_focus', 'ingress_reclaim', 'system_change', 'planet_change', 'manual')]
  [string]$Event,
  [string]$Detail = '',
  [string]$Package = 'com.arcfire.online'
)

& (Join-Path $PSScriptRoot 'capture-snapshot.ps1') -Stage $Stage -Event $Event -Detail $Detail -Package $Package
