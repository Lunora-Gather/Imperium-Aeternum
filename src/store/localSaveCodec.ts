import { compress, uncompress } from 'snappyjs';

export const MAX_SAVE_BYTES = 5 * 1024 * 1024;
const COMPRESSION_THRESHOLD = 512 * 1024;
const PREFIX = 'IA-SNAPPY-1:';

function checksum(bytes: Uint8Array): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) hash = Math.imul(hash ^ bytes[i], 0x01000193);
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// Web Storage accepts DOMStrings, including NUL and Latin-1. Each compressed byte
// occupies one code unit, avoiding base64 overhead across the five shared slots.
export function encodeLocalSave(raw: string, bytes: Uint8Array): string {
  if (bytes.byteLength < COMPRESSION_THRESHOLD) return raw;
  const packed = compress(bytes);
  if (PREFIX.length + 8 + packed.length >= raw.length) return raw;
  const chunks = [PREFIX, checksum(bytes)];
  for (let i = 0; i < packed.length; i += 8192) {
    chunks.push(String.fromCharCode(...packed.subarray(i, i + 8192)));
  }
  return chunks.join('');
}

export function decodeLocalSave(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored;
  const headerLength = PREFIX.length + 8;
  const length = stored.length - headerLength;
  if (length < 1 || length > MAX_SAVE_BYTES) throw new Error('本地存档压缩长度无效');
  const packed = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    const value = stored.charCodeAt(headerLength + i);
    if (value > 255) throw new Error('本地存档压缩数据无效');
    packed[i] = value;
  }
  const bytes = uncompress(packed, MAX_SAVE_BYTES);
  if (checksum(bytes) !== stored.slice(PREFIX.length, headerLength)) throw new Error('本地存档校验失败');
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
