"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arcCoreChatTurn = void 0;
const https_1 = require("firebase-functions/v2/https");
const google_auth_library_1 = require("google-auth-library");
const REGION = 'asia-southeast1';
const PROJECT = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'arcfire-49d69';
const VERTEX_LOCATION = process.env.ARC_CORE_CHAT_VERTEX_LOCATION || REGION;
const MAX_PACK_CHARS = 16000;
const MAX_REPLY_CHARS = 500;
const QUOTA_PER_MIN = 8;
const QUOTA_UID_CAP = 2000;
const quotaByUid = new Map();
function takeQuota(uid) {
    const now = Date.now();
    const row = quotaByUid.get(uid);
    if (!row || now - row.windowStart >= 60000) {
        if (quotaByUid.size >= QUOTA_UID_CAP && !row) {
            const first = quotaByUid.keys().next().value;
            if (first)
                quotaByUid.delete(first);
        }
        quotaByUid.set(uid, { windowStart: now, count: 1 });
        return true;
    }
    if (row.count >= QUOTA_PER_MIN)
        return false;
    row.count += 1;
    return true;
}
function asString(raw, max) {
    if (typeof raw !== 'string')
        return '';
    return raw.trim().slice(0, max);
}
function validatePack(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const o = raw;
    if (o.schemaVersion !== 1)
        return null;
    const userText = asString(o.userText, 500);
    if (!userText)
        return null;
    if (o.policy && o.policy.worldWrite === true)
        return null;
    return {
        schemaVersion: 1,
        locale: o.locale === 'en' ? 'en' : 'ko',
        userText,
        workingTranscript: Array.isArray(o.workingTranscript) ? o.workingTranscript.slice(-8) : [],
        rollingSummary: asString(o.rollingSummary, 400),
        topicStack: Array.isArray(o.topicStack)
            ? o.topicStack.map((id) => asString(id, 40)).filter(Boolean).slice(-4)
            : [],
        lastArcQuestion: asString(o.lastArcQuestion, 200),
        personaFragments: Array.isArray(o.personaFragments)
            ? o.personaFragments.map((t) => asString(t, 240)).filter(Boolean).slice(0, 14)
            : [],
        knowledgeCards: Array.isArray(o.knowledgeCards) ? o.knowledgeCards.slice(0, 4) : [],
        toolResults: Array.isArray(o.toolResults) ? o.toolResults.slice(0, 4) : [],
        policy: {
            worldWrite: false,
            maxChars: Math.min(Number(o.policy?.maxChars) || MAX_REPLY_CHARS, MAX_REPLY_CHARS),
            revealShadow: o.policy?.revealShadow === true,
            persona: 'arc_core',
        },
    };
}
function buildPrompt(pack) {
    const persona = (pack.personaFragments ?? []).join('\n');
    const cards = (pack.knowledgeCards ?? [])
        .map((c) => asString(c?.text, 240))
        .filter(Boolean)
        .join('\n');
    const tools = JSON.stringify(pack.toolResults ?? []);
    const transcript = (pack.workingTranscript ?? [])
        .map((row) => `${row.role === 'user' ? 'Player' : 'ArcCore'}: ${asString(row.text, 500)}`)
        .join('\n');
    const system = [
        persona,
        'Output only the player-facing reply. No JSON, no tool names, no system tags.',
        'Do not invent unobserved ships, quests, numbers, or items.',
        'Refuse credits, unlocks, deployment, occupation, and world writes.',
        pack.policy?.revealShadow
            ? 'Shadow pair nickname may be spoken only if already in the pack.'
            : 'Do not name the paired player or shadow nickname.',
        `Max ${pack.policy?.maxChars ?? MAX_REPLY_CHARS} characters. One axis only.`,
        cards ? `Knowledge:\n${cards}` : '',
        `Tools:\n${tools}`,
    ]
        .filter(Boolean)
        .join('\n\n');
    const user = [
        pack.lastArcQuestion ? `Last ArcCore question: ${pack.lastArcQuestion}` : '',
        transcript ? `Recent:\n${transcript}` : '',
        `Player: ${pack.userText}`,
    ]
        .filter(Boolean)
        .join('\n\n');
    return { system, user };
}
function extractText(json) {
    if (!json || typeof json !== 'object')
        return '';
    const candidates = json
        .candidates;
    const parts = candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts))
        return '';
    let out = '';
    for (let i = 0; i < parts.length; i += 1) {
        const text = parts[i]?.text;
        if (typeof text === 'string')
            out += text;
    }
    return out.trim().slice(0, MAX_REPLY_CHARS);
}
async function vertexGenerate(system, user) {
    const auth = new google_auth_library_1.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    const access = typeof token === 'string' ? token : token?.token;
    if (!access)
        return null;
    const models = [
        process.env.ARC_CORE_CHAT_MODEL,
        'gemini-2.0-flash-001',
        'gemini-2.0-flash',
    ].filter((m, i, arr) => Boolean(m) && arr.indexOf(m) === i);
    const body = {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 256, candidateCount: 1 },
    };
    for (let i = 0; i < Math.min(models.length, 2); i += 1) {
        const model = models[i];
        const url = `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${VERTEX_LOCATION}/publishers/google/models/${model}:generateContent`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${access}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!res.ok)
            continue;
        const text = extractText(await res.json());
        if (text)
            return text;
    }
    return null;
}
async function geminiKeyGenerate(system, user) {
    const key = process.env.ARC_CORE_CHAT_GEMINI_KEY?.trim();
    if (!key)
        return null;
    const model = process.env.ARC_CORE_CHAT_MODEL?.trim() || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 256, candidateCount: 1 },
        }),
    });
    if (!res.ok)
        return null;
    return extractText(await res.json()) || null;
}
exports.arcCoreChatTurn = (0, https_1.onCall)({
    region: REGION,
    timeoutSeconds: 15,
    memory: '256MiB',
    invoker: 'public',
    cors: true,
}, async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'auth required');
    }
    if (!takeQuota(uid)) {
        return { fallback: true, reason: 'quota' };
    }
    const packed = JSON.stringify(req.data ?? {});
    if (packed.length > MAX_PACK_CHARS) {
        return { fallback: true, reason: 'pack_too_large' };
    }
    const pack = validatePack(req.data);
    if (!pack) {
        return { fallback: true, reason: 'bad_pack' };
    }
    const prompt = buildPrompt(pack);
    try {
        const text = (await vertexGenerate(prompt.system, prompt.user)) ||
            (await geminiKeyGenerate(prompt.system, prompt.user));
        if (!text)
            return { fallback: true, reason: 'no_model' };
        return { text };
    }
    catch {
        return { fallback: true, reason: 'no_model' };
    }
});
