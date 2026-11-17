"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { komentar, pelaporan, post } from "@/db/schema";
import { ALASAN_LAPOR, AMBANG_LAPOR, BATAS_LAPOR_PER_JAM } from "@/lib/alasan-lapor";
import { ambilPelaku } from "@/lib/pelaku";
import { beritahuTahan } from "@/lib/tahan";
import type { HasilAksi } from "./post";

const skemaId = z.uuid("Permintaan tidak valid.");

export async function laporKonten(
  jenis: "POST" | "KOMENTAR",
  sasaranId: string,
  alasan: string,
): Promise<HasilAksi & { ditahan?: boolean }> {
  const pelaku = await ambilPelaku();
  if (!pelaku) return { ok: false, pesan: "Masuk dulu untuk melaporkan." };
  if (pelaku.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const id = skemaId.safeParse(sasaranId);
  const a = ALASAN_LAPOR.find((x) => x.kunci === alasan);
  if (!id.success || (jenis !== "POST" && jenis !== "KOMENTAR") || !a) {
    return { ok: false, pesan: "Permintaan tidak valid." };
  }

  let penulisId: string;
  let postId: string;
  let komentarId: string | null = null;

  if (jenis === "POST") {
    const [p] = await db
      .select({ id: post.id, penulisId: post.penulisId })
      .from(post)
      .where(and(eq(post.id, id.data), isNull(post.dihapusPada)))
      .limit(1);
    if (!p) return { ok: false, pesan: "Konten tidak ditemukan." };
    penulisId = p.penulisId;
    postId = p.id;
  } else {
    const [k] = await db
      .select({ id: komentar.id, penulisId: komentar.penulisId, postId: komentar.postId })
      .from(komentar)
      .innerJoin(post, eq(komentar.postId, post.id))
      .where(and(eq(komentar.id, id.data), isNull(komentar.dihapusPada), isNull(post.dihapusPada)))
      .limit(1);
    if (!k) return { ok: false, pesan: "Konten tidak ditemukan." };
    penulisId = k.penulisId;
    postId = k.postId;
    komentarId = k.id;
  }

  if (penulisId === pelaku.id) return { ok: false, pesan: "Kamu tidak bisa melaporkan kontenmu sendiri." };

  const satuJamLalu = new Date(Date.now() - 60 * 60 * 1000);
  const [{ n: terakhir }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(pelaporan)
    .where(and(eq(pelaporan.pelaporId, pelaku.id), gte(pelaporan.dibuatPada, satuJamLalu)));
  if (terakhir >= BATAS_LAPOR_PER_JAM) {
    return { ok: false, pesan: "Terlalu banyak laporan dalam satu jam. Coba lagi nanti." };
  }

  const baru = await db
    .insert(pelaporan)
    .values({ pelaporId: pelaku.id, sasaranTipe: jenis, sasaranId: id.data, alasan: a.kunci })
    .onConflictDoNothing()
    .returning({ id: pelaporan.id });
  if (baru.length === 0) return { ok: false, pesan: "Kamu sudah melaporkan konten ini." };

  const daftar = await db
    .select({ alasan: pelaporan.alasan })
    .from(pelaporan)
    .where(and(eq(pelaporan.sasaranTipe, jenis), eq(pelaporan.sasaranId, id.data)));
  if (daftar.length < AMBANG_LAPOR) return { ok: true };

  const label = [...new Set(daftar.map((d) => ALASAN_LAPOR.find((x) => x.kunci === d.alasan)?.label ?? d.alasan))];
  const teksAlasan = `Laporan ${daftar.length} pengguna: ${label.join(", ")}`;
  const sekarang = new Date();

  const ditahan =
    jenis === "POST"
      ? await db
          .update(post)
          .set({ dihapusPada: sekarang, ditahanPada: sekarang, ditahanAlasan: teksAlasan })
          .where(and(eq(post.id, id.data), isNull(post.dihapusPada)))
          .returning({ id: post.id })
      : await db
          .update(komentar)
          .set({ dihapusPada: sekarang, ditahanPada: sekarang, ditahanAlasan: teksAlasan })
          .where(and(eq(komentar.id, id.data), isNull(komentar.dihapusPada)))
          .returning({ id: komentar.id });

  if (ditahan.length > 0) {
    await beritahuTahan({ penulisId, postId, komentarId: komentarId ?? undefined });
    revalidatePath("/", "layout");
    return { ok: true, ditahan: true };
  }
  return { ok: true };
}