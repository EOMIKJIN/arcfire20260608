<#
.SYNOPSIS
  Build + guided SAM deploy for ArcCore chat Groq Free Lambda (ZERO_BILL).
.NOTES
  Do NOT pass a card-linked Groq Developer key. Free tier only.
  Groq key is NOT a CFN Parameter (template.yaml). After sam deploy this script
  always runs set-groq-lambda-key.ps1 so ARC_CORE_CHAT_GROQ_API_KEY is not left blank.
  Then paste TurnUrl into ARC_CORE_CHAT_FREE_TIER_TURN_URL and set LIVE=true.
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$GroqApiKey,
  [string]$StackName = 'arcfire-arc-core-chat',
  [string]$Region = 'ap-northeast-2'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path (Join-Path $root 'aws\arc-core-chat\package.json'))) {
  $root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
}
$dir = Join-Path $root 'aws\arc-core-chat'
Set-Location $dir

if ($GroqApiKey -notmatch '^gsk_') {
  Write-Warning 'Groq keys usually start with gsk_. Continue only if intentional.'
}

Write-Host '[build] bundling lambda…'
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# template.yaml 에 GroqApiKey Parameter 없음(특수문자 ValidationError).
# sam deploy 는 env 를 '' 로 덮어쓰므로, 배포 직후 set-groq-lambda-key 로 키를 주입한다.
Write-Host '[deploy] sam deploy (Groq Free · no Bedrock IAM · key after deploy)…'
sam deploy `
  --stack-name $StackName `
  --region $Region `
  --capabilities CAPABILITY_IAM `
  --resolve-s3

Write-Host '[key] set Groq API key on Lambda (post-deploy)…'
$env:GROQ_KEY = $GroqApiKey
& (Join-Path $PSScriptRoot 'set-groq-lambda-key.ps1') -GroqApiKey $GroqApiKey -FunctionName 'arcfire-arc-core-chat-turn' -Region $Region
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Next: copy Outputs TurnUrl → src/arcCore/chat/arcCoreChatCloudGate.ts'
Write-Host '  ARC_CORE_CHAT_FREE_TIER_TURN_URL = ''<TurnUrl>'''
Write-Host '  ARC_CORE_CHAT_CLOUD_LIVE = true'
Write-Host 'Then: app reload → hub [대화] → ArcCore NL'
