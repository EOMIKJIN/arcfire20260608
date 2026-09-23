/** RGBA → PNG (zlib stored). 런타임 개척 베이크·테스트 공용. 틱 금지. */

const PNG_SIG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    c = CRC_TABLE[(c ^ (bytes[i] ?? 0)) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(bytes: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < bytes.length; i += 1) {
    a = (a + (bytes[i] ?? 0)) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function u32be(n: number): Uint8Array {
  return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
}

function concat(parts: Uint8Array[]): Uint8Array {
  let n = 0;
  for (const p of parts) n += p.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeB = new Uint8Array([type.charCodeAt(0), type.charCodeAt(1), type.charCodeAt(2), type.charCodeAt(3)]);
  const crcIn = concat([typeB, data]);
  return concat([u32be(data.length), typeB, data, u32be(crc32(crcIn))]);
}

function zlibStore(raw: Uint8Array): Uint8Array {
  const blocks: Uint8Array[] = [new Uint8Array([0x78, 0x01])];
  let off = 0;
  while (off < raw.length) {
    const take = Math.min(65535, raw.length - off);
    const last = off + take >= raw.length ? 1 : 0;
    const nlen = (~take) & 0xffff;
    const header = new Uint8Array([
      last,
      take & 0xff,
      (take >>> 8) & 0xff,
      nlen & 0xff,
      (nlen >>> 8) & 0xff,
    ]);
    blocks.push(header, raw.subarray(off, off + take));
    off += take;
  }
  blocks.push(u32be(adler32(raw)));
  return concat(blocks);
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const a = bytes[i] ?? 0;
    const b = i + 1 < len ? (bytes[i + 1] ?? 0) : 0;
    const c = i + 2 < len ? (bytes[i + 2] ?? 0) : 0;
    out += B64[a >> 2];
    out += B64[((a & 3) << 4) | (b >> 4)];
    out += i + 1 < len ? B64[((b & 15) << 2) | (c >> 6)] : '=';
    out += i + 2 < len ? B64[c & 63] : '=';
  }
  return out;
}

/** `rgba`는 width*height*4, row-major, unpremultiplied 0–255. */
export function encodeRgbaToPng(rgba: Uint8Array, width: number, height: number): Uint8Array {
  if (rgba.length !== width * height * 4) {
    throw new Error(`rgba length ${rgba.length} ≠ ${width * height * 4}`);
  }
  const raw = new Uint8Array(height * (1 + width * 4));
  for (let y = 0; y < height; y += 1) {
    const dst = y * (1 + width * 4);
    raw[dst] = 0;
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), dst + 1);
  }
  const ihdr = concat([
    u32be(width),
    u32be(height),
    new Uint8Array([8, 6, 0, 0, 0]),
  ]);
  return concat([PNG_SIG, chunk('IHDR', ihdr), chunk('IDAT', zlibStore(raw)), chunk('IEND', new Uint8Array(0))]);
}

export function encodeRgbaToPngDataUri(rgba: Uint8Array, width: number, height: number): string {
  return `data:image/png;base64,${bytesToBase64(encodeRgbaToPng(rgba, width, height))}`;
}
