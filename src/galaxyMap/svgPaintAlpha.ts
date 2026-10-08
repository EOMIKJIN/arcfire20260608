/**
 * Android `GroupView`/`TextView`는 opacity≠1이면 캔버스 전체 ARGB를 하나 만든다.
 * 은하 지도(~4600×5000)에서는 라벨·흐린 노드마다 약 88MB다.
 * 그룹 opacity 대신 칠 알파로 같은 농도를 낸다.
 */
export function withSvgPaintAlpha(color: string, opacity: number): string {
  if (!Number.isFinite(opacity) || opacity >= 1) return color;
  const parsed = parseCssColor(color.trim());
  if (!parsed) return color;
  const a = Math.max(0, Math.min(1, parsed.a * Math.max(0, opacity)));
  const r = Math.round(parsed.r);
  const g = Math.round(parsed.g);
  const b = Math.round(parsed.b);
  if (a >= 1) return `rgb(${r},${g},${b})`;
  const aa = Math.round(a * 1000) / 1000;
  return `rgba(${r},${g},${b},${aa})`;
}

function parseCssColor(color: string): { r: number; g: number; b: number; a: number } | null {
  if (color.length === 0 || color.toLowerCase() === 'transparent') return null;
  if (color[0] === '#') {
    let h = color.slice(1);
    if (h.length === 3) {
      h = `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
    }
    if (h.length !== 6 && h.length !== 8) return null;
    const r = Number.parseInt(h.slice(0, 2), 16);
    const g = Number.parseInt(h.slice(2, 4), 16);
    const b = Number.parseInt(h.slice(4, 6), 16);
    const a = h.length === 8 ? Number.parseInt(h.slice(6, 8), 16) / 255 : 1;
    if (![r, g, b, a].every(Number.isFinite)) return null;
    return { r, g, b, a };
  }
  const m = color.match(
    /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/i,
  );
  if (!m) return null;
  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
  const a = m[4] != null ? Number(m[4]) : 1;
  if (![r, g, b, a].every(Number.isFinite)) return null;
  return { r, g, b, a };
}
