"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { notifikasi, post, suka } from "@/db/schema";
import { ambilSesi } from "@/lib/sesi";

export type HasilSuka =
  | { ok: true; disukai: boolean; jumlah: number }
  | { ok: false; pesan: string };

const skemaId = z.uuid("Post tidak valid.");

export async function aturSuka(postId: string, disukai: boolean): Promise<HasilSuka> {
  const sesi = await ambilSesi();
  if (!sesi) return { ok: false, pesan: "Masuk dulu untuk menyukai post." };
  if (sesi.user.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const id = skemaId.safeParse(postId);
  if (!id.success || typeof disukai !== "boolean") {
    return { ok: false, pesan: "Permintaan tidak valid." };
  }

  const ada = await db
    .select({ id: post.id, penulisId: post.penulisId })
    .from(post)
    .where(and(eq(post.id, id.data), isNull(post.dihapusPada)))
    .limit(1);
  if (ada.length === 0) return { ok: false, pesan: "Post tidak ditemukan." };

  if (disukai) {
    await db.insert(suka).values({ userId: sesi.user.id, postId: id.data }).onConflictDoNothing();
    if (ada[0].penulisId !== sesi.user.id) {
      try {
        await db
          .insert(notifikasi)
          .values({
            penerimaId: ada[0].penulisId,
            aktorId: sesi.user.id,
            tipe: "SUKA",
            postId: id.data,
          })
          .onConflictDoNothing();
      } catch (e) {
        console.error("Gagal membuat notifikasi suka", e);
      }
    }
  } else {
    await db.delete(suka).where(and(eq(suka.userId, sesi.user.id), eq(suka.postId, id.data)));
    await db
      .delete(notifikasi)
      .where(
        and(
          eq(notifikasi.aktorId, sesi.user.id),
          eq(notifikasi.postId, id.data),
          eq(notifikasi.tipe, "SUKA"),
        ),
      );
  }

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(suka)
    .where(eq(suka.postId, id.data));
  return { ok: true, disukai, jumlah: n };
}