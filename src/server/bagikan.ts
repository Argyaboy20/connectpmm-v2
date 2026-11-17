"use server";

import { and, eq, gte, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { percakapan, pesan, post, user } from "@/db/schema";
import { BATAS_PESAN_PER_JAM } from "@/lib/batas";
import { ambilPelaku } from "@/lib/pelaku";
import { daftarPercakapan } from "@/lib/pesan";
import type { HasilAksi } from "./post";

export type TujuanBagikan = {
  id: string;
  nama: string;
  username: string | null;
  foto: string | null;
};

const skemaId = z.uuid("Permintaan tidak valid.");

export async function muatTujuanBagikan(): Promise<
  { ok: true; item: TujuanBagikan[] } | { ok: false; pesan: string }
> {
  const pelaku = await ambilPelaku();
  if (!pelaku) return { ok: false, pesan: "Masuk dulu." };
  if (pelaku.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };
  const daftar = await daftarPercakapan(pelaku.id);
  return {
    ok: true,
    item: daftar.map((d) => ({ id: d.id, nama: d.nama, username: d.username, foto: d.foto })),
  };
}

// Hanya ke percakapan yang sudah ada. `percakapanId` harus milik pelaku.
export async function bagikanPost(postId: string, percakapanId: string): Promise<HasilAksi> {
  const pelaku = await ambilPelaku();
  if (!pelaku) return { ok: false, pesan: "Masuk dulu." };
  if (pelaku.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const p = skemaId.safeParse(postId);
  const k = skemaId.safeParse(percakapanId);
  if (!p.success || !k.success) return { ok: false, pesan: "Permintaan tidak valid." };

  const [ada] = await db
    .select({ id: post.id })
    .from(post)
    .where(and(eq(post.id, p.data), isNull(post.dihapusPada)))
    .limit(1);
  if (!ada) return { ok: false, pesan: "Post tidak ditemukan." };

  const [c] = await db
    .select({ id: percakapan.id, a: percakapan.penggunaAId, b: percakapan.penggunaBId })
    .from(percakapan)
    .where(
      and(
        eq(percakapan.id, k.data),
        or(eq(percakapan.penggunaAId, pelaku.id), eq(percakapan.penggunaBId, pelaku.id)),
      ),
    )
    .limit(1);
  if (!c) return { ok: false, pesan: "Percakapan tidak ditemukan." };

  const lawanId = c.a === pelaku.id ? c.b : c.a;
  const [lawan] = await db
    .select({ status: user.status })
    .from(user)
    .where(eq(user.id, lawanId))
    .limit(1);
  if (!lawan || lawan.status === "DIBLOKIR") return { ok: false, pesan: "Akun tidak ditemukan." };

  const satuJamLalu = new Date(Date.now() - 60 * 60 * 1000);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(pesan)
    .where(and(eq(pesan.pengirimId, pelaku.id), gte(pesan.dibuatPada, satuJamLalu)));
  if (n >= BATAS_PESAN_PER_JAM) {
    return { ok: false, pesan: `Batas ${BATAS_PESAN_PER_JAM} pesan per jam tercapai. Coba lagi nanti.` };
  }

  await db.insert(pesan).values({ percakapanId: c.id, pengirimId: pelaku.id, isi: "", postId: ada.id });
  await db
    .update(percakapan)
    .set({ pesanTerakhirPada: new Date() })
    .where(eq(percakapan.id, c.id));
  return { ok: true };
}