export type JenisGambar = { mime: string; ekstensi: string };

function teks(b: Uint8Array, dari: number, sampai: number) {
  return String.fromCharCode(...b.subarray(dari, sampai));
}

export function deteksiGambar(b: Uint8Array): JenisGambar | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { mime: "image/jpeg", ekstensi: "jpg" };
  }
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return { mime: "image/png", ekstensi: "png" };
  }
  if (b.length >= 12 && teks(b, 0, 4) === "RIFF" && teks(b, 8, 12) === "WEBP") {
    return { mime: "image/webp", ekstensi: "webp" };
  }
  return null;
}