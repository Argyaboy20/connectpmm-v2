"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { komentar, logModerasi, notifikasi, post, postGambar } from "@/db/schema";
import { ambilPelaku } from "@/lib/pelaku";
import { hapusFile } from "@/lib/penyimpanan";
import { skemaAlasan } from "@/lib/validasi-moderasi";
import type { HasilAksi } from "./post";

const skemaId = z.uuid("Permintaan tidak valid.");
const TIPE_NOTIF = ["KONTEN_DITAHAN", "KONTEN_DITAHAN_PENULIS"];

async function cekKoordinator() {
  const p = await ambilPelaku();
  if (!p) return { ok: false as const, pesan: "Masuk dulu." };
  if (p.status === "DIBLOKIR") return { ok: false as const, pesan: "Akunmu sedang diblokir." };
  if (p.role !== "KOORDINATOR") return { ok: false as const, pesan: "Kamu tidak berhak melakukan ini." };
  return { ok: true as const, id: p.id };
}

async function cariTahanan(jenis: "POST" | "KOMENTAR", id: string) {
  if (jenis === "POST") {
    const [t] = await db
      .select({ id: post.id, penulisId: post.penulisId, isi: post.isi, tipe: post.tipe })
      .from(post)
      .where(and(eq(post.id, id), isNotNull(post.ditahanPada), isNotNull(post.dihapusPada)))
      .limit(1);
    return t ? { ...t, sasaranTipe: t.tipe } : null;
  }
  const [t] = await db
    .select({ id: komentar.id, penulisId: komentar.penulisId, isi: komentar.isi })
    .from(komentar)
    .where(and(eq(komentar.id, id), isNotNull(komentar.ditahanPada), isNotNull(komentar.dihapusPada)))
    .limit(1);
  return t ? { ...t, sasaranTipe: "KOMENTAR" } : null;
}

async function bersihkanNotif(jenis: "POST" | "KOMENTAR", id: string) {
  await db
    .delete(notifikasi)
    .where(
      and(
        inArray(notifikasi.tipe, TIPE_NOTIF),
        jenis === "POST" ? eq(notifikasi.postId, id) : eq(notifikasi.komentarId, id),
      ),
    )
    .catch(() => {});
}

export async function pulihkanKonten(jenis: "POST" | "KOMENTAR", sasaranId: string): Promise<HasilAksi> {
  const c = await cekKoordinator();
  if (!c.ok) return { ok: false, pesan: c.pesan };
  const id = skemaId.safeParse(sasaranId);
  if (!id.success || (jenis !== "POST" && jenis !== "KOMENTAR")) {
    return { ok: false, pesan: "Permintaan tidak valid." };
  }

  const t = await cariTahanan(jenis, id.data);
  if (!t) return { ok: false, pesan: "Konten tidak ditemukan atau sudah diproses." };

  const kosong = { dihapusPada: null, ditahanPada: null, ditahanAlasan: null };
  const diubah =
    jenis === "POST"
      ? await db
          .update(post)
          .set(kosong)
          .where(and(eq(post.id, t.id), isNotNull(post.ditahanPada)))
          .returning({ id: post.id })
      : await db
          .update(komentar)
          .set(kosong)
          .where(and(eq(komentar.id, t.id), isNotNull(komentar.ditahanPada)))
          .returning({ id: komentar.id });
  if (diubah.length === 0) return { ok: false, pesan: "Konten sudah diproses." };

  await db.insert(logModerasi).values({
    aktorId: c.id,
    aksi: "PULIHKAN_KONTEN",
    sasaranTipe: t.sasaranTipe,
    sasaranId: t.id,
    catatan: JSON.stringify({ penulisId: t.penulisId, cuplikan: t.isi.slice(0, 100) }),
  });
  await bersihkanNotif(jenis, t.id);

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function hapusTahanan(
  jenis: "POST" | "KOMENTAR",
  sasaranId: string,
  alasan?: string,
): Promise<HasilAksi> {
  const c = await cekKoordinator();
  if (!c.ok) return { ok: false, pesan: c.pesan };
  const id = skemaId.safeParse(sasaranId);
  if (!id.success || (jenis !== "POST" && jenis !== "KOMENTAR")) {
    return { ok: false, pesan: "Permintaan tidak valid." };
  }
  const a = skemaAlasan.safeParse(alasan);
  if (!a.success) return { ok: false, pesan: a.error.issues[0]?.message ?? "Alasan tidak valid." };

  const t = await cariTahanan(jenis, id.data);
  if (!t) return { ok: false, pesan: "Konten tidak ditemukan atau sudah diproses." };

  const [l] = await db
    .insert(logModerasi)
    .values({
      aktorId: c.id,
      aksi: jenis === "POST" ? "HAPUS_POST" : "HAPUS_KOMENTAR",
      sasaranTipe: t.sasaranTipe,
      sasaranId: t.id,
      catatan: JSON.stringify({
        alasan: a.data,
        penulisId: t.penulisId,
        cuplikan: t.isi.slice(0, 100),
      }),
    })
    .returning({ id: logModerasi.id });

  // Ditahan -> dihapus: dihapus_pada tetap terisi, tanda ditahan dibuang.
  const diubah =
    jenis === "POST"
      ? await db
          .update(post)
          .set({ ditahanPada: null })
          .where(and(eq(post.id, t.id), isNotNull(post.ditahanPada)))
          .returning({ id: post.id })
      : await db
          .update(komentar)
          .set({ ditahanPada: null })
          .where(and(eq(komentar.id, t.id), isNotNull(komentar.ditahanPada)))
          .returning({ id: komentar.id });
  if (diubah.length === 0) {
    await db.delete(logModerasi).where(eq(logModerasi.id, l.id)).catch(() => {});
    return { ok: false, pesan: "Konten sudah diproses." };
  }

  if (jenis === "POST") {
    const gambar = await db
      .select({ kunci: postGambar.kunci })
      .from(postGambar)
      .where(eq(postGambar.postId, t.id));
    if (gambar.length > 0) {
      try {
        await hapusFile(gambar.map((g) => g.kunci));
        await db.delete(postGambar).where(eq(postGambar.postId, t.id));
      } catch (e) {
        console.error("Gagal membersihkan foto post ditahan", t.id, e);
      }
    }
  }
  await bersihkanNotif(jenis, t.id);

  revalidatePath("/", "layout");
  return { ok: true };
}