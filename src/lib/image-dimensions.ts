/**
 * Minimal, dependency-free intrinsic-size reader for the formats the media
 * library accepts. Native decoders (sharp/canvas) are unavailable in the Worker
 * runtime, so the header bytes are parsed directly.
 */
export type ImageDimensions = { width: number; height: number };

export function getImageDimensions(buffer: Uint8Array): ImageDimensions | null {
  return readPng(buffer) ?? readGif(buffer) ?? readWebp(buffer) ?? readJpeg(buffer);
}

function u16(b: Uint8Array, i: number) {
  return (b[i]! << 8) | b[i + 1]!;
}
function u32(b: Uint8Array, i: number) {
  return ((b[i]! << 24) | (b[i + 1]! << 16) | (b[i + 2]! << 8) | b[i + 3]!) >>> 0;
}
function ascii(b: Uint8Array, i: number, len: number) {
  return String.fromCharCode(...b.slice(i, i + len));
}

function readPng(b: Uint8Array): ImageDimensions | null {
  if (b.length < 24 || b[0] !== 0x89 || ascii(b, 1, 3) !== "PNG") return null;
  return { width: u32(b, 16), height: u32(b, 20) };
}

function readGif(b: Uint8Array): ImageDimensions | null {
  if (b.length < 10 || ascii(b, 0, 3) !== "GIF") return null;
  return { width: b[6]! | (b[7]! << 8), height: b[8]! | (b[9]! << 8) };
}

function readWebp(b: Uint8Array): ImageDimensions | null {
  if (b.length < 30 || ascii(b, 0, 4) !== "RIFF" || ascii(b, 8, 4) !== "WEBP") return null;
  const kind = ascii(b, 12, 4);
  if (kind === "VP8 ") {
    return { width: (b[26]! | (b[27]! << 8)) & 0x3fff, height: (b[28]! | (b[29]! << 8)) & 0x3fff };
  }
  if (kind === "VP8L") {
    const bits = b[21]! | (b[22]! << 8) | (b[23]! << 16) | (b[24]! << 24);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (kind === "VP8X") {
    return {
      width: 1 + (b[24]! | (b[25]! << 8) | (b[26]! << 16)),
      height: 1 + (b[27]! | (b[28]! << 8) | (b[29]! << 16)),
    };
  }
  return null;
}

function readJpeg(b: Uint8Array): ImageDimensions | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < b.length) {
    if (b[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = b[offset + 1]!;
    // SOF0..SOF15, excluding DHT (c4), JPG (c8) and DAC (cc)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: u16(b, offset + 5), width: u16(b, offset + 7) };
    }
    const length = u16(b, offset + 2);
    if (length <= 0) return null;
    offset += 2 + length;
  }
  return null;
}
