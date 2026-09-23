<#
.SYNOPSIS
  Set Groq Free API key on deployed Lambda (not via CFN Parameter).
.EXAMPLE
  .\set-groq-lambda-key.ps1
  (prompts securely / reads $env:GROQ_KEY)
#>
param(
  [string]$FunctionName = 'arcfire-arc-core-chat-turn',
  [string]$Region = 'ap-northeast-2',
  [string]$GroqApiKey = ''
)

$ErrorActionPreference = 'Stop'

if (-not $GroqApiKey) {
  $GroqApiKey = $env:GROQ_KEY
}
if (-not $GroqApiKey) {
  $secure = Read-Host 'Groq API key (gsk_…)' -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $GroqApiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}
$GroqApiKey = $GroqApiKey.Trim()
if (-not $GroqApiKey.StartsWith('gsk_')) {
  Write-Warning 'Key does not start with gsk_. Continue only if intentional.'
}

# Preserve other env vars from current config
$cfg = aws lambda get-function-configuration --function-name $FunctionName --region $Region | ConvertFrom-Json
$vars = @{}
if ($cfg.Environment.Variables) {
  $cfg.Environment.Variables.PSObject.Properties | ForEach-Object { $vars[$_.Name] = $_.Value }
}
$vars['ARC_CORE_CHAT_GROQ_API_KEY'] = $GroqApiKey
$vars['ARC_CORE_CHAT_LLM_PROVIDER'] = 'groq'
$vars['ARC_CORE_CHAT_ALLOW_BEDROCK'] = '0'
if (-not $vars['ARC_CORE_CHAT_GROQ_MODEL']) {
  $vars['ARC_CORE_CHAT_GROQ_MODEL'] = 'openai/gpt-oss-20b'
}
if (-not $vars['ARC_CORE_CHAT_FIREBASE_PROJECT_ID']) {
  $vars['ARC_CORE_CHAT_FIREBASE_PROJECT_ID'] = 'arcfire-49d69'
}

$pairs = ($vars.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ','
aws lambda update-function-configuration `
  --function-name $FunctionName `
  --region $Region `
  --environment "Variables={$pairs}"

Write-Host 'OK — Groq key set on Lambda. Do not paste the key in chat.'
