export function pickDominantSkipReason(counts: Record<string, number>): string {
  let best = 'no_route';
  let n = -1;
  const keys = Object.keys(counts);
  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i]!;
    const v = counts[k] ?? 0;
    if (v > n) {
      best = k;
      n = v;
    }
  }
  return best;
}

export type ArcConvoyMissDiagnosis = {
  planetId: string;
  dominantReason: string;
  skipCounts: Record<string, number>;
  candidateCount: number;
};

export function formatArcConvoyMissLog(diag: ArcConvoyMissDiagnosis, tripReason?: string): string {
  const parts: string[] = [];
  const keys = Object.keys(diag.skipCounts);
  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i]!;
    parts.push(`${k}=${diag.skipCounts[k]}`);
  }
  const skip = parts.join(',');
  const trip = tripReason ? ` trip=${tripReason}` : '';
  return `[ArcCore/Convoy] miss planet=${diag.planetId} reason=${diag.dominantReason} candidates=${diag.candidateCount}${trip} skips=${skip}`;
}
