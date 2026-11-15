import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ambilFile } from "@/lib/penyimpanan";

export const dynamic = "force-dynamic";

async function coba(tugas: () => Promise<unknown>) {
  try {
    await tugas();
    return true;
  } catch (e) {
    console.error("Cek sehat gagal:", e);
    return false;
  }
}

export async function GET() {
  const [database, penyimpanan] = await Promise.all([
    coba(() => db.execute(sql`select 1`)),
    coba(() => ambilFile("post/sehat.webp")),
  ]);
  const ok = database && penyimpanan;
  return Response.json(
    { ok, database, penyimpanan },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}