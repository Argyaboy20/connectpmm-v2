"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { komentar, post } from "@/db/schema";
import { BATAS_KOMENTAR_PER_JAM } from "@/lib/batas";
import { ambilSesi } from "@/lib/sesi";
import { skemaKomentar } from "@/lib/validasi-komentar";
import type { HasilAksi } from "./post";

const skemaId = z.uuid("Post tidak valid.");

export async function buatKomentar(postId: string, isi: string): Promise<HasilAksi> {
  const sesi = await ambilSesi();
  if (!sesi) return { ok: false, pesan: "Masuk dulu untuk berkomentar." };
  if (sesi.user.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const id = skemaId.safeParse(postId);
  if (!id.success) return { ok: false, pesan: "Post tidak valid." };

  const hasil = skemaKomentar.safeParse(isi);
  if (!hasil.success) {
    return { ok: false, pesan: hasil.error.issues[0]?.message ?? "Komentar tidak valid." };
  }

  const ada = await db
    .select({ id: post.id })
    .from(post)
    .where(and(eq(post.id, id.data), isNull(post.dihapusPada)))
    .limit(1);
  if (ada.length === 0) return { ok: false, pesan: "Post tidak ditemukan." };

  const satuJamLalu = new Date(Date.now() - 60 * 60 * 1000);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(komentar)
    .where(and(eq(komentar.penulisId, sesi.user.id), gte(komentar.dibuatPada, satuJamLalu)));
  if (n >= BATAS_KOMENTAR_PER_JAM) {
    return {
      ok: false,
      pesan: `Batas ${BATAS_KOMENTAR_PER_JAM} komentar per jam tercapai. Coba lagi nanti.`,
    };
  }

  await db.insert(komentar).values({ postId: id.data, penulisId: sesi.user.id, isi: hasil.data });
  revalidatePath(`/post/${id.data}`);
  revalidatePath("/");
  return { ok: true };
}