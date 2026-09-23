import { createHash, createHmac } from 'node:crypto';
import { MAX_REPLY_CHARS } from './pack';

export const DEFAULT_BEDROCK_REGION = 'ap-northeast-2';
export const DEFAULT_BEDROCK_MODEL = 'anthropic.claude-3-haiku-20240307-v1:0';

export type BedrockClaudeBody = {
  anthropic_version: 'bedrock-2023-05-31';
  max_tokens: number;
  temperature: number;
  system: string;
  messages: Array<{ role: 'user'; content: string }>;
};

export type BedrockCredentials = {
  accessKey: string;
  secretKey: string;
  sessionToken: string;
  region: string;
  model: string;
};

export function buildBedrockClaudeBody(system: string, user: string): BedrockClaudeBody {
  return {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 256,
    temperature: 0.4,
    system,
    messages: [{ role: 'user', content: user }],
  };
}

export function extractBedrockClaudeText(json: unknown): string {
  if (!json || typeof json !== 'object') return '';
  const content = (json as { content?: Array<{ type?: string; text?: string }> }).content;
  if (!Array.isArray(content)) return '';
  let out = '';
  for (let i = 0; i < content.length; i += 1) {
    const part = content[i];
    if (part?.type === 'text' && typeof part.text === 'string') out += part.text;
  }
  return out.trim().slice(0, MAX_REPLY_CHARS);
}

function sha256Hex(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}

function amzDate(now: Date): { amz: string; date: string } {
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { amz: iso, date: iso.slice(0, 8) };
}

export function readBedrockCredentials(): BedrockCredentials | null {
  const accessKey =
    process.env.ARC_CORE_CHAT_AWS_ACCESS_KEY_ID?.trim() || process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretKey =
    process.env.ARC_CORE_CHAT_AWS_SECRET_ACCESS_KEY?.trim()
    || process.env.AWS_SECRET_ACCESS_KEY?.trim();
  if (!accessKey || !secretKey) return null;
  return {
    accessKey,
    secretKey,
    sessionToken:
      process.env.ARC_CORE_CHAT_AWS_SESSION_TOKEN?.trim()
      || process.env.AWS_SESSION_TOKEN?.trim()
      || '',
    region:
      process.env.ARC_CORE_CHAT_AWS_REGION?.trim()
      || process.env.AWS_REGION?.trim()
      || DEFAULT_BEDROCK_REGION,
    model: process.env.ARC_CORE_CHAT_BEDROCK_MODEL?.trim() || DEFAULT_BEDROCK_MODEL,
  };
}

export function signBedrockHeaders(input: {
  region: string;
  modelId: string;
  body: string;
  accessKey: string;
  secretKey: string;
  sessionToken?: string;
  now?: Date;
}): { url: string; headers: Record<string, string> } {
  const host = `bedrock-runtime.${input.region}.amazonaws.com`;
  const path = `/model/${encodeURIComponent(input.modelId)}/invoke`;
  const { amz, date } = amzDate(input.now ?? new Date());
  const payloadHash = sha256Hex(input.body);
  const token = (input.sessionToken ?? '').trim();
  const headerLines = [
    `content-type:application/json`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amz}`,
  ];
  const signedNames = ['content-type', 'host', 'x-amz-content-sha256', 'x-amz-date'];
  if (token) {
    headerLines.push(`x-amz-security-token:${token}`);
    signedNames.push('x-amz-security-token');
  }
  const canonicalHeaders = `${headerLines.join('\n')}\n`;
  const signedHeaders = signedNames.join(';');
  const canonicalRequest = ['POST', path, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const scope = `${date}/${input.region}/bedrock/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amz, scope, sha256Hex(canonicalRequest)].join('\n');
  const kDate = hmac(`AWS4${input.secretKey}`, date);
  const kRegion = hmac(kDate, input.region);
  const kService = hmac(kRegion, 'bedrock');
  const kSigning = hmac(kService, 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Host: host,
    'X-Amz-Content-Sha256': payloadHash,
    'X-Amz-Date': amz,
    Authorization: `AWS4-HMAC-SHA256 Credential=${input.accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
  if (token) headers['X-Amz-Security-Token'] = token;
  return { url: `https://${host}${path}`, headers };
}

export async function invokeBedrockClaude(
  system: string,
  user: string,
): Promise<string | null> {
  const creds = readBedrockCredentials();
  if (!creds) return null;
  const body = JSON.stringify(buildBedrockClaudeBody(system, user));
  const signed = signBedrockHeaders({
    region: creds.region,
    modelId: creds.model,
    body,
    accessKey: creds.accessKey,
    secretKey: creds.secretKey,
    sessionToken: creds.sessionToken,
  });
  const timeoutMs = Math.max(
    1000,
    Number(process.env.ARC_CORE_CHAT_BEDROCK_TIMEOUT_MS) || 12_000,
  );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(signed.url, {
      method: 'POST',
      headers: signed.headers,
      body,
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return extractBedrockClaudeText(await res.json()) || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
