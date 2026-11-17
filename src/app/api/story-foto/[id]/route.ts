import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { story, user } from "@/db/schema";
import { ambilPelaku } from "@/lib/pelaku";
import { ambilFile } from "@/lib/penyimpanan";

const tidakAda = () => new Response("Tidak ditemukan", { status: 404 });

// Foto story hanya untuk akun yang login, selama story belum kedaluwarsa.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pelaku = await ambilPelaku();
  if (!pelaku || pelaku.status === "DIBLOKIR") return tidakAda();

  const [s] = await db
    .select({ kunci: story.kunci, kedaluwarsaPada: story.kedaluwarsaPada })
    .from(story)
    .innerJoin(user, eq(story.penulisId, user.id))
    .where(
      and(
        eq(story.id, id),
        gt(story.kedaluwarsaPada, new Date()),
        sql`${user.status} is distinct from 'DIBLOKIR'`,
      ),
    )
    .limit(1);
  if (!s) return tidakAda();

  const f = await ambilFile(s.kunci);
  if (!f) return tidakAda();

  const sisa = Math.floor((s.kedaluwarsaPada.getTime() - Date.now()) / 1000);
  return new Response(new Uint8Array(f.bytes), {
    headers: {
      "Content-Type": f.mime,
      "Cache-Control": `private, max-age=${Math.max(0, Math.min(3600, sisa))}`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}