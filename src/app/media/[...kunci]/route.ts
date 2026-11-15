import { ambilFile } from "@/lib/penyimpanan";

const POLA = /^post\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg|png)$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kunci: string[] }> },
) {
  const { kunci } = await params;
  const k = kunci.join("/");
  if (!POLA.test(k)) return new Response("Tidak ditemukan", { status: 404 });

  const file = await ambilFile(k);
  if (!file) return new Response("Tidak ditemukan", { status: 404 });

  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}