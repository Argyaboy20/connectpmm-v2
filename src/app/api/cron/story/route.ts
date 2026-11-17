import { bersihkanStoryLama } from "@/lib/story";

// Dipanggil penjadwal Vercel. Vercel mengirim "Authorization: Bearer <CRON_SECRET>".
export async function GET(req: Request) {
  const rahasia = process.env.CRON_SECRET;
  if (!rahasia || req.headers.get("authorization") !== `Bearer ${rahasia}`) {
    return new Response("Tidak berhak", { status: 401 });
  }
  let total = 0;
  for (let i = 0; i < 10; i++) {
    const n = await bersihkanStoryLama(200);
    total += n;
    if (n < 200) break;
  }
  return Response.json({ ok: true, dihapus: total });
}