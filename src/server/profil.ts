"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { ambilPelaku } from "@/lib/pelaku";
import { JEDA_GANTI_USERNAME_JAM } from "@/lib/batas";
import { skemaBio, skemaUsername } from "@/lib/validasi-profil";
import type { HasilAksi } from "./post";

export async function ubahBio(bio: string): Promise<HasilAksi> {
  const pelaku = await ambilPelaku();
  if (!pelaku) return { ok: false, pesan: "Masuk dulu." };
  if (pelaku.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const hasil = skemaBio.safeParse(bio);
  if (!hasil.success) {
    return { ok: false, pesan: hasil.error.issues[0]?.message ?? "Bio tidak valid." };
  }

  await db
    .update(user)
    .set({ bio: hasil.data === "" ? null : hasil.data })
    .where(eq(user.id, pelaku.id));

  revalidatePath("/profil", "layout");
  return { ok: true };
}

export type HasilUsername = { ok: true; username: string } | { ok: false; pesan: string };

export async function ubahUsername(username: string): Promise<HasilUsername> {
  const pelaku = await ambilPelaku();
  if (!pelaku) return { ok: false, pesan: "Masuk dulu." };
  if (pelaku.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const hasil = skemaUsername.safeParse(username);
  if (!hasil.success) {
    return { ok: false, pesan: hasil.error.issues[0]?.message ?? "Username tidak valid." };
  }
  const baru = hasil.data;

  const [saya] = await db
    .select({ username: user.username, diubah: user.usernameDiubahPada })
    .from(user)
    .where(eq(user.id, pelaku.id))
    .limit(1);
  if (!saya) return { ok: false, pesan: "Akun tidak ditemukan." };
  if (saya.username === baru) return { ok: false, pesan: "Itu sudah username-mu sekarang." };

  const jeda = JEDA_GANTI_USERNAME_JAM * 60 * 60 * 1000;
  if (saya.diubah) {
    const sisa = saya.diubah.getTime() + jeda - Date.now();
    if (sisa > 0) {
      const total = Math.ceil(sisa / 60000);
      return {
        ok: false,
        pesan: `Username baru bisa diganti lagi dalam ${Math.floor(total / 60)} jam ${total % 60} menit.`,
      };
    }
  }

  const [dipakai] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.username, baru))
    .limit(1);
  if (dipakai) return { ok: false, pesan: "Username sudah dipakai." };

  try {
    const r = await db
      .update(user)
      .set({ username: baru, displayUsername: baru, usernameDiubahPada: new Date() })
      .where(
        and(
          eq(user.id, pelaku.id),
          or(isNull(user.usernameDiubahPada), lt(user.usernameDiubahPada, new Date(Date.now() - jeda))),
        ),
      )
      .returning({ username: user.username });
    if (r.length === 0) return { ok: false, pesan: "Username baru saja diganti. Coba lagi nanti." };
  } catch (e) {
    console.error("Gagal mengganti username:", e);
    const [ada] = await db.select({ id: user.id }).from(user).where(eq(user.username, baru)).limit(1);
    return { ok: false, pesan: ada ? "Username sudah dipakai." : "Gagal mengganti username. Coba lagi." };
  }

  revalidatePath("/", "layout");
  return { ok: true, username: baru };
}