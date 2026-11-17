import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { laporanGambar, laporanKegiatan } from "@/db/schema";
import { ambilPelaku } from "@/lib/pelaku";
import { ambilFile } from "@/lib/penyimpanan";

const tidakAda = () => new Response("Tidak ditemukan", { status: 404 });

// Foto laporan hanya untuk penulisnya dan Koordinator.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pelaku = await ambilPelaku();
  if (!pelaku || pelaku.status === "DIBLOKIR") return tidakAda();

  const [g] = await db
    .select({ kunci: laporanGambar.kunci, penulisId: laporanKegiatan.penulisId })
    .from(laporanGambar)
    .innerJoin(laporanKegiatan, eq(laporanGambar.laporanId, laporanKegiatan.id))
    .where(and(eq(laporanGambar.id, id), isNull(laporanKegiatan.dihapusPada)))
    .limit(1);
  if (!g) return tidakAda();
  if (pelaku.role !== "KOORDINATOR" && g.penulisId !== pelaku.id) return tidakAda();

  const f = await ambilFile(g.kunci);
  if (!f) return tidakAda();

  return new Response(new Uint8Array(f.bytes), {
    headers: {
      "Content-Type": f.mime,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}