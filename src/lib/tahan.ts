import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifikasi, user } from "@/db/schema";

// Notifikasi untuk semua Koordinator aktif dan untuk penulisnya. Kegagalan di sini tidak boleh
// membatalkan penahanan.
export async function beritahuTahan(o: { penulisId: string; postId: string; komentarId?: string }) {
  try {
    const koordinator = await db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.role, "KOORDINATOR"), sql`${user.status} is distinct from 'DIBLOKIR'`));
    const baris = koordinator
      .filter((k) => k.id !== o.penulisId)
      .map((k) => ({
        penerimaId: k.id,
        aktorId: o.penulisId,
        tipe: "KONTEN_DITAHAN",
        postId: o.postId,
        komentarId: o.komentarId ?? null,
      }));
    baris.push({
      penerimaId: o.penulisId,
      aktorId: o.penulisId,
      tipe: "KONTEN_DITAHAN_PENULIS",
      postId: o.postId,
      komentarId: o.komentarId ?? null,
    });
    await db.insert(notifikasi).values(baris);
  } catch (e) {
    console.error("Gagal membuat notifikasi konten ditahan", e);
  }
}