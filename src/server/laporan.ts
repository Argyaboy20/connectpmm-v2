"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { laporanGambar, laporanKegiatan, logModerasi } from "@/db/schema";
import { ambilPelaku } from "@/lib/pelaku";
import { hapusFile } from "@/lib/penyimpanan";
import { skemaAlasan } from "@/lib/validasi-moderasi";
import type { HasilAksi } from "./post";

const skemaId = z.uuid("Permintaan tidak valid.");

export async function hapusLaporan(laporanId: string, alasan?: string): Promise<HasilAksi> {
  const pelaku = await ambilPelaku();
  if (!pelaku) return { ok: false, pesan: "Masuk dulu." };
  if (pelaku.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const id = skemaId.safeParse(laporanId);
  if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };

  const [target] = await db
    .select({ id: laporanKegiatan.id, penulisId: laporanKegiatan.penulisId, judul: laporanKegiatan.judul })
    .from(laporanKegiatan)
    .where(and(eq(laporanKegiatan.id, id.data), isNull(laporanKegiatan.dihapusPada)))
    .limit(1);
  if (!target) return { ok: false, pesan: "Laporan tidak ditemukan." };

  let alasanBersih: string | null = null;
  if (target.penulisId !== pelaku.id) {
    if (pelaku.role !== "KOORDINATOR") {
      return { ok: false, pesan: "Laporan tidak ditemukan atau bukan milikmu." };
    }
    const a = skemaAlasan.safeParse(alasan);
    if (!a.success) {
      return { ok: false, pesan: a.error.issues[0]?.message ?? "Alasan tidak valid." };
    }
    alasanBersih = a.data;
  }

  let idLog: string | null = null;
  if (alasanBersih) {
    const [l] = await db
      .insert(logModerasi)
      .values({
        aktorId: pelaku.id,
        aksi: "HAPUS_LAPORAN",
        sasaranTipe: "LAPORAN",
        sasaranId: target.id,
        catatan: JSON.stringify({
          alasan: alasanBersih,
          penulisId: target.penulisId,
          cuplikan: target.judul.slice(0, 100),
        }),
      })
      .returning({ id: logModerasi.id });
    idLog = l.id;
  }

  const dihapus = await db
    .update(laporanKegiatan)
    .set({ dihapusPada: new Date() })
    .where(and(eq(laporanKegiatan.id, id.data), isNull(laporanKegiatan.dihapusPada)))
    .returning({ id: laporanKegiatan.id });
  if (dihapus.length === 0) {
    if (idLog) await db.delete(logModerasi).where(eq(logModerasi.id, idLog)).catch(() => {});
    return { ok: false, pesan: "Laporan tidak ditemukan." };
  }

  const gambar = await db
    .select({ kunci: laporanGambar.kunci })
    .from(laporanGambar)
    .where(eq(laporanGambar.laporanId, id.data));
  if (gambar.length > 0) {
    try {
      await hapusFile(gambar.map((g) => g.kunci));
      await db.delete(laporanGambar).where(eq(laporanGambar.laporanId, id.data));
    } catch (e) {
      console.error("Gagal membersihkan foto laporan", id.data, e);
    }
  }

  revalidatePath("/laporan");
  revalidatePath("/moderasi");
  return { ok: true };
}