"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { logModerasi, story } from "@/db/schema";
import { ambilPelaku } from "@/lib/pelaku";
import { hapusFile } from "@/lib/penyimpanan";
import { skemaAlasan } from "@/lib/validasi-moderasi";
import type { HasilAksi } from "./post";

const skemaId = z.uuid("Permintaan tidak valid.");

export async function hapusStory(storyId: string, alasan?: string): Promise<HasilAksi> {
  const pelaku = await ambilPelaku();
  if (!pelaku) return { ok: false, pesan: "Masuk dulu." };
  if (pelaku.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const id = skemaId.safeParse(storyId);
  if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };

  const [t] = await db
    .select({ id: story.id, penulisId: story.penulisId, kunci: story.kunci, caption: story.caption })
    .from(story)
    .where(eq(story.id, id.data))
    .limit(1);
  if (!t) return { ok: false, pesan: "Story tidak ditemukan." };

  let alasanBersih: string | null = null;
  if (t.penulisId !== pelaku.id) {
    if (pelaku.role !== "KOORDINATOR") return { ok: false, pesan: "Story tidak ditemukan." };
    const a = skemaAlasan.safeParse(alasan);
    if (!a.success) return { ok: false, pesan: a.error.issues[0]?.message ?? "Alasan tidak valid." };
    alasanBersih = a.data;
  }

  let idLog: string | null = null;
  if (alasanBersih) {
    const [l] = await db
      .insert(logModerasi)
      .values({
        aktorId: pelaku.id,
        aksi: "HAPUS_STORY",
        sasaranTipe: "STORY",
        sasaranId: t.id,
        catatan: JSON.stringify({
          alasan: alasanBersih,
          penulisId: t.penulisId,
          cuplikan: t.caption.slice(0, 100),
        }),
      })
      .returning({ id: logModerasi.id });
    idLog = l.id;
  }

  const dihapus = await db.delete(story).where(eq(story.id, t.id)).returning({ id: story.id });
  if (dihapus.length === 0) {
    if (idLog) await db.delete(logModerasi).where(eq(logModerasi.id, idLog)).catch(() => {});
    return { ok: false, pesan: "Story tidak ditemukan." };
  }

  await hapusFile([t.kunci]).catch((e) => console.error("Gagal menghapus foto story", t.id, e));

  revalidatePath("/");
  return { ok: true };
}