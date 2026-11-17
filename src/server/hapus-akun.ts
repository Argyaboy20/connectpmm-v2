"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { laporanGambar, laporanKegiatan, post, postGambar, user } from "@/db/schema";
import { ambilPelaku } from "@/lib/pelaku";
import { hapusFile } from "@/lib/penyimpanan";
import type { HasilAksi } from "./post";

export async function hapusAkun(konfirmasi: string): Promise<HasilAksi> {
  const pelaku = await ambilPelaku();
  if (!pelaku) return { ok: false, pesan: "Masuk dulu." };
  if (typeof konfirmasi !== "string" || konfirmasi.trim() !== "HAPUS") {
    return { ok: false, pesan: "Ketik HAPUS untuk mengonfirmasi." };
  }

  if (pelaku.role === "KOORDINATOR") {
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(user)
      .where(
        and(
          eq(user.role, "KOORDINATOR"),
          ne(user.id, pelaku.id),
          sql`${user.status} is distinct from 'DIBLOKIR'`,
        ),
      );
    if (n === 0) {
      return {
        ok: false,
        pesan: "Kamu Koordinator terakhir. Angkat Koordinator lain dulu sebelum menghapus akun.",
      };
    }
  }

  const fotoPost = await db
    .select({ kunci: postGambar.kunci })
    .from(postGambar)
    .innerJoin(post, eq(postGambar.postId, post.id))
    .where(eq(post.penulisId, pelaku.id));
  const fotoLaporan = await db
    .select({ kunci: laporanGambar.kunci })
    .from(laporanGambar)
    .innerJoin(laporanKegiatan, eq(laporanGambar.laporanId, laporanKegiatan.id))
    .where(eq(laporanKegiatan.penulisId, pelaku.id));
  const kunci = [...fotoPost, ...fotoLaporan].map((f) => f.kunci);

  // Basis data dulu. Semua data turunan ikut terhapus lewat cascade.
  try {
    await db.delete(user).where(eq(user.id, pelaku.id));
  } catch (e) {
    console.error("Gagal menghapus akun", e);
    return { ok: false, pesan: "Gagal menghapus akun. Coba lagi." };
  }

  // Foto: kalau gagal, hanya jadi file yatim di penyimpanan.
  for (let i = 0; i < kunci.length; i += 500) {
    try {
      await hapusFile(kunci.slice(i, i + 500));
    } catch (e) {
      console.error("Gagal membersihkan foto akun terhapus", e);
    }
  }

  revalidatePath("/", "layout");
  return { ok: true };
}