"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { logModerasi, user } from "@/db/schema";
import { ambilPelaku } from "@/lib/pelaku";
import { skemaAlasan } from "@/lib/validasi-moderasi";
import type { HasilAksi } from "./post";

const skemaIdUser = z.string().min(1).max(100);

async function ubahStatus(
  userId: string,
  alasan: string | undefined,
  blokir: boolean,
): Promise<HasilAksi> {
  const p = await ambilPelaku();
  if (!p) return { ok: false, pesan: "Masuk dulu." };
  if (p.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };
  if (p.role !== "KOORDINATOR") return { ok: false, pesan: "Kamu tidak berhak melakukan ini." };

  const id = skemaIdUser.safeParse(userId);
  if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };

  const a = skemaAlasan.safeParse(alasan);
  if (!a.success) {
    return { ok: false, pesan: a.error.issues[0]?.message ?? "Alasan tidak valid." };
  }

  const [t] = await db
    .select({ id: user.id, role: user.role, status: user.status })
    .from(user)
    .where(eq(user.id, id.data))
    .limit(1);
  if (!t) return { ok: false, pesan: "Pengguna tidak ditemukan." };

  if (blokir) {
    if (t.id === p.id) return { ok: false, pesan: "Kamu tidak bisa memblokir dirimu sendiri." };
    if (t.role === "KOORDINATOR") return { ok: false, pesan: "Koordinator tidak bisa diblokir." };
    if (t.status === "DIBLOKIR") return { ok: false, pesan: "Akun sudah diblokir." };
  } else if (t.status !== "DIBLOKIR") {
    return { ok: false, pesan: "Akun tidak sedang diblokir." };
  }

  const [l] = await db
    .insert(logModerasi)
    .values({
      aktorId: p.id,
      aksi: blokir ? "BLOKIR_PENGGUNA" : "BUKA_BLOKIR",
      sasaranTipe: "USER",
      sasaranId: t.id,
      catatan: JSON.stringify({ alasan: a.data }),
    })
    .returning({ id: logModerasi.id });

  const syarat: SQL[] = [eq(user.id, t.id), eq(user.status, blokir ? "AKTIF" : "DIBLOKIR")];
  if (blokir) syarat.push(ne(user.role, "KOORDINATOR"));

  const diubah = await db
    .update(user)
    .set({ status: blokir ? "DIBLOKIR" : "AKTIF" })
    .where(and(...syarat))
    .returning({ id: user.id });
  if (diubah.length === 0) {
    await db.delete(logModerasi).where(eq(logModerasi.id, l.id)).catch(() => {});
    return { ok: false, pesan: "Status akun sudah berubah. Muat ulang halaman." };
  }

  revalidatePath("/moderasi");
  return { ok: true };
}

export async function blokirPengguna(userId: string, alasan?: string): Promise<HasilAksi> {
  return ubahStatus(userId, alasan, true);
}

export async function bukaBlokirPengguna(userId: string, alasan?: string): Promise<HasilAksi> {
  return ubahStatus(userId, alasan, false);
}