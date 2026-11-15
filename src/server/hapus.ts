"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { komentar, logModerasi, post, postGambar } from "@/db/schema";
import { ambilPelaku } from "@/lib/pelaku";
import { hapusFile } from "@/lib/penyimpanan";
import { skemaAlasan } from "@/lib/validasi-moderasi";
import type { HasilAksi } from "./post";

const skemaId = z.uuid("Permintaan tidak valid.");

export async function hapusPost(postId: string, alasan?: string): Promise<HasilAksi> {
  const pelaku = await ambilPelaku();
  if (!pelaku) return { ok: false, pesan: "Masuk dulu." };
  if (pelaku.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const id = skemaId.safeParse(postId);
  if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };

  const [target] = await db
    .select({ id: post.id, penulisId: post.penulisId, tipe: post.tipe, isi: post.isi })
    .from(post)
    .where(and(eq(post.id, id.data), isNull(post.dihapusPada)))
    .limit(1);
  if (!target) return { ok: false, pesan: "Post tidak ditemukan." };

  let alasanBersih: string | null = null;
  if (target.penulisId !== pelaku.id) {
    if (pelaku.role !== "KOORDINATOR") {
      return { ok: false, pesan: "Post tidak ditemukan atau bukan milikmu." };
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
        aksi: "HAPUS_POST",
        sasaranTipe: target.tipe,
        sasaranId: target.id,
        catatan: JSON.stringify({
          alasan: alasanBersih,
          penulisId: target.penulisId,
          cuplikan: target.isi.slice(0, 100),
        }),
      })
      .returning({ id: logModerasi.id });
    idLog = l.id;
  }

  const dihapus = await db
    .update(post)
    .set({ dihapusPada: new Date() })
    .where(and(eq(post.id, id.data), isNull(post.dihapusPada)))
    .returning({ id: post.id });
  if (dihapus.length === 0) {
    if (idLog) await db.delete(logModerasi).where(eq(logModerasi.id, idLog)).catch(() => {});
    return { ok: false, pesan: "Post tidak ditemukan." };
  }

  const gambar = await db
    .select({ kunci: postGambar.kunci })
    .from(postGambar)
    .where(eq(postGambar.postId, id.data));
  if (gambar.length > 0) {
    try {
      await hapusFile(gambar.map((g) => g.kunci));
      await db.delete(postGambar).where(eq(postGambar.postId, id.data));
    } catch (e) {
      console.error("Gagal membersihkan foto post", id.data, e);
    }
  }

  revalidatePath("/");
  return { ok: true };
}

export async function hapusKomentar(komentarId: string, alasan?: string): Promise<HasilAksi> {
  const pelaku = await ambilPelaku();
  if (!pelaku) return { ok: false, pesan: "Masuk dulu." };
  if (pelaku.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const id = skemaId.safeParse(komentarId);
  if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };

  const [k] = await db
    .select({
      id: komentar.id,
      postId: komentar.postId,
      penulisId: komentar.penulisId,
      isi: komentar.isi,
      pemilikPost: post.penulisId,
    })
    .from(komentar)
    .innerJoin(post, eq(komentar.postId, post.id))
    .where(and(eq(komentar.id, id.data), isNull(komentar.dihapusPada), isNull(post.dihapusPada)))
    .limit(1);
  if (!k) return { ok: false, pesan: "Komentar tidak ditemukan." };

  let alasanBersih: string | null = null;
  if (k.penulisId !== pelaku.id && k.pemilikPost !== pelaku.id) {
    if (pelaku.role !== "KOORDINATOR") {
      return { ok: false, pesan: "Kamu tidak berhak menghapus komentar ini." };
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
        aksi: "HAPUS_KOMENTAR",
        sasaranTipe: "KOMENTAR",
        sasaranId: k.id,
        catatan: JSON.stringify({
          alasan: alasanBersih,
          penulisId: k.penulisId,
          postId: k.postId,
          cuplikan: k.isi.slice(0, 100),
        }),
      })
      .returning({ id: logModerasi.id });
    idLog = l.id;
  }

  const dihapus = await db
    .update(komentar)
    .set({ dihapusPada: new Date() })
    .where(and(eq(komentar.id, k.id), isNull(komentar.dihapusPada)))
    .returning({ id: komentar.id });
  if (dihapus.length === 0) {
    if (idLog) await db.delete(logModerasi).where(eq(logModerasi.id, idLog)).catch(() => {});
    return { ok: false, pesan: "Komentar tidak ditemukan." };
  }

  revalidatePath("/");
  revalidatePath(`/post/${k.postId}`);
  return { ok: true };
}