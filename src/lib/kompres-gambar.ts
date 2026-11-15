const SISI_MAKS = 1600;

export type FotoSiap = { blob: Blob; lebar: number; tinggi: number };

function keBlob(canvas: HTMLCanvasElement, tipe: string, mutu: number) {
  return new Promise<Blob | null>((res) => canvas.toBlob(res, tipe, mutu));
}

export async function kompresFoto(file: File, batas: number): Promise<FotoSiap> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Foto tidak bisa dibaca. Coba foto lain.");
  }

  const skala = Math.min(1, SISI_MAKS / Math.max(bmp.width, bmp.height));
  const lebar = Math.max(1, Math.round(bmp.width * skala));
  const tinggi = Math.max(1, Math.round(bmp.height * skala));

  const canvas = document.createElement("canvas");
  canvas.width = lebar;
  canvas.height = tinggi;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bmp.close();
    throw new Error("Browser tidak mendukung pemrosesan foto.");
  }
  ctx.drawImage(bmp, 0, 0, lebar, tinggi);
  bmp.close();

  for (const tipe of ["image/webp", "image/jpeg"]) {
    for (const mutu of [0.82, 0.7, 0.55]) {
      const blob = await keBlob(canvas, tipe, mutu);
      if (blob && blob.type === tipe && blob.size <= batas) {
        return { blob, lebar, tinggi };
      }
    }
  }
  throw new Error("Foto terlalu besar setelah dikecilkan. Coba foto lain.");
}