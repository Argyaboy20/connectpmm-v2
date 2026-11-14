"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { komentar, post, postGambar } from "@/db/schema";
import { ambilMedia } from "@/lib/r2";
import { ambilSesi } from "@/lib/sesi";
import type { HasilAksi } from "./post";

const skemaId = z.uuid("Permintaan tidak valid.");

export async function hapusPost(postId: string): Promise<HasilAksi> {
  const sesi = await ambilSesi();
  if (!sesi) return { ok: false, pesan: "Masuk dulu." };
  if (sesi.user.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const id = skemaId.safeParse(postId);
  if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };

  const dihapus = await db
    .update(post)
    .set({ dihapusPada: new Date() })
    .where(and(eq(post.id, id.data), eq(post.penulisId, sesi.user.id), isNull(post.dihapusPada)))
    .returning({ id: post.id });
  if (dihapus.length === 0) {
    return { ok: false, pesan: "Post tidak ditemukan atau bukan milikmu." };
  }

  const gambar = await db
    .select({ kunci: postGambar.kunci })
    .from(postGambar)
    .where(eq(postGambar.postId, id.data));
  if (gambar.length > 0) {
    try {
      await ambilMedia().delete(gambar.map((g) => g.kunci));
      await db.delete(postGambar).where(eq(postGambar.postId, id.data));
    } catch (e) {
      console.error("Gagal membersihkan foto post", id.data, e);
    }
  }

  revalidatePath("/");
  return { ok: true };
}

export async function hapusKomentar(komentarId: string): Promise<HasilAksi> {
  const sesi = await ambilSesi();
  if (!sesi) return { ok: false, pesan: "Masuk dulu." };
  if (sesi.user.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const id = skemaId.safeParse(komentarId);
  if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };

  const [k] = await db
    .select({
      id: komentar.id,
      postId: komentar.postId,
      penulisId: komentar.penulisId,
      pemilikPost: post.penulisId,
    })
    .from(komentar)
    .innerJoin(post, eq(komentar.postId, post.id))
    .where(and(eq(komentar.id, id.data), isNull(komentar.dihapusPada), isNull(post.dihapusPada)))
    .limit(1);
  if (!k) return { ok: false, pesan: "Komentar tidak ditemukan." };

  if (k.penulisId !== sesi.user.id && k.pemilikPost !== sesi.user.id) {
    return { ok: false, pesan: "Kamu tidak berhak menghapus komentar ini." };
  }

  await db
    .update(komentar)
    .set({ dihapusPada: new Date() })
    .where(and(eq(komentar.id, k.id), isNull(komentar.dihapusPada)));

  revalidatePath("/");
  revalidatePath(`/post/${k.postId}`);
  return { ok: true };
}