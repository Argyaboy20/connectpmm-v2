"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { post } from "@/db/schema";
import { BATAS_POST_PER_JAM } from "@/lib/batas";
import { ambilSesi } from "@/lib/sesi";
import { skemaConnex } from "@/lib/validasi-connex";
import { periksaTeks } from "@/lib/kata-terlarang";
import { beritahuTahan } from "@/lib/tahan";

export type HasilAksi = { ok: true } | { ok: false; pesan: string };

export async function buatConnex(isi: string): Promise<HasilAksi & { ditahan?: boolean }> {
  const sesi = await ambilSesi();
  if (!sesi) return { ok: false, pesan: "Masuk dulu untuk membagikan cerita." };
  if (sesi.user.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const hasil = skemaConnex.safeParse(isi);
  if (!hasil.success) {
    return { ok: false, pesan: hasil.error.issues[0]?.message ?? "Isi tidak valid." };
  }

  const satuJamLalu = new Date(Date.now() - 60 * 60 * 1000);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(post)
    .where(and(eq(post.penulisId, sesi.user.id), gte(post.dibuatPada, satuJamLalu)));
  if (n >= BATAS_POST_PER_JAM) {
    return { ok: false, pesan: `Batas ${BATAS_POST_PER_JAM} post per jam tercapai. Coba lagi nanti.` };
  }

  const cek = periksaTeks(hasil.data);
  const sekarang = new Date();
  const [baru] = await db
    .insert(post)
    .values({
      penulisId: sesi.user.id,
      tipe: "CONNEX",
      isi: hasil.data,
      ...(cek.terlarang
        ? { dihapusPada: sekarang, ditahanPada: sekarang, ditahanAlasan: cek.alasan }
        : {}),
    })
    .returning({ id: post.id });
  if (cek.terlarang) {
    await beritahuTahan({ penulisId: sesi.user.id, postId: baru.id });
    revalidatePath("/", "layout");
    return { ok: true, ditahan: true };
  }
  revalidatePath("/");
  return { ok: true };
}