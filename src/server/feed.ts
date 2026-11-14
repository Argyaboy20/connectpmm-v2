"use server";

import { ambilFeed, bacaKursor, type HasilFeed } from "@/lib/feed";
import { ambilSesi } from "@/lib/sesi";

export type HasilMuat = ({ ok: true } & HasilFeed) | { ok: false; pesan: string };

export async function muatFeed(tipe: string, kursor: string): Promise<HasilMuat> {
  if (tipe !== "POST" && tipe !== "CONNEX") {
    return { ok: false, pesan: "Permintaan tidak valid." };
  }
  const k = bacaKursor(kursor);
  if (!k) return { ok: false, pesan: "Permintaan tidak valid." };

  const sesi = await ambilSesi();
  const hasil = await ambilFeed({ tipe, idSaya: sesi?.user.id ?? null, kursor: k });
  return { ok: true, ...hasil };
}