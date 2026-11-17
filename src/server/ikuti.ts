"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { ikuti, notifikasi, user } from "@/db/schema";
import { ambilSesi } from "@/lib/sesi";

export type HasilIkuti = { ok: true } | { ok: false; pesan: string };

const skemaId = z.string().min(1).max(100);

export async function aturIkuti(targetId: string, mengikuti: boolean): Promise<HasilIkuti> {
  const sesi = await ambilSesi();
  if (!sesi) return { ok: false, pesan: "Masuk dulu untuk mengikuti." };
  if (sesi.user.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const id = skemaId.safeParse(targetId);
  if (!id.success || typeof mengikuti !== "boolean") {
    return { ok: false, pesan: "Permintaan tidak valid." };
  }
  if (id.data === sesi.user.id) return { ok: false, pesan: "Tidak bisa mengikuti diri sendiri." };

  if (mengikuti) {
    const [t] = await db
      .select({ status: user.status })
      .from(user)
      .where(eq(user.id, id.data))
      .limit(1);
    if (!t || t.status === "DIBLOKIR") return { ok: false, pesan: "Akun tidak ditemukan." };
    await db
      .insert(ikuti)
      .values({ pengikutId: sesi.user.id, diikutiId: id.data })
      .onConflictDoNothing();
    try {
      await db
        .insert(notifikasi)
        .values({ penerimaId: id.data, aktorId: sesi.user.id, tipe: "IKUTI" })
        .onConflictDoNothing();
    } catch (e) {
      console.error("Gagal membuat notifikasi ikuti", e);
    }
  } else {
    await db
      .delete(ikuti)
      .where(and(eq(ikuti.pengikutId, sesi.user.id), eq(ikuti.diikutiId, id.data)));
    await db
      .delete(notifikasi)
      .where(
        and(
          eq(notifikasi.aktorId, sesi.user.id),
          eq(notifikasi.penerimaId, id.data),
          eq(notifikasi.tipe, "IKUTI"),
        ),
      );
  }

  // Layout ikut disegarkan supaya panel "Disarankan" langsung memuat akun pengganti.
  revalidatePath("/", "layout");
  return { ok: true };
}