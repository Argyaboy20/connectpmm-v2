import { ambilMedia } from "@/lib/r2";

const POLA = /^post\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg|png)$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kunci: string[] }> },
) {
  const { kunci } = await params;
  const k = kunci.join("/");
  if (!POLA.test(k)) return new Response("Tidak ditemukan", { status: 404 });

  const obj = await ambilMedia().get(k);
  if (!obj) return new Response("Tidak ditemukan", { status: 404 });

  return new Response(obj.body as unknown as ReadableStream, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}