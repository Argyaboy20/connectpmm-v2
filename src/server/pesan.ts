"use server";

import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { percakapan, pesan, user } from "@/db/schema";
import { BATAS_PESAN_PER_JAM } from "@/lib/batas";
import { ambilPelaku } from "@/lib/pelaku";
import {
  alasanTidakBoleh,
  ambilPercakapan,
  ambilRiwayat,
  ambilRiwayatLama,
  bolehMulai,
  urutkanPasangan,
  type DataPesan,
} from "@/lib/pesan";
import { skemaPesan } from "@/lib/validasi-pesan";
import type { HasilAksi } from "./post";

export type HasilMuat =
  | { ok: true; item: DataPesan[]; baruDibaca: number }
  | { ok: false; pesan: string };

const skemaIdUser = z.string().min(1).max(100);
const skemaIdPesan = z.uuid("Permintaan tidak valid.");

export async function kirimPesan(targetId: string, isi: string): Promise<HasilAksi> {
  const pelaku = await ambilPelaku();
  if (!pelaku) return { ok: false, pesan: "Masuk dulu untuk mengirim pesan." };
  if (pelaku.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const id = skemaIdUser.safeParse(targetId);
  if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };
  if (id.data === pelaku.id) return { ok: false, pesan: "Tidak bisa mengirim pesan ke diri sendiri." };

  const hasil = skemaPesan.safeParse(isi);
  if (!hasil.success) {
    return { ok: false, pesan: hasil.error.issues[0]?.message ?? "Isi tidak valid." };
  }

  const [target] = await db
    .select({ id: user.id, role: user.role, status: user.status })
    .from(user)
    .where(eq(user.id, id.data))
    .limit(1);
  if (!target || target.status === "DIBLOKIR") return { ok: false, pesan: "Akun tidak ditemukan." };

  let c = await ambilPercakapan(pelaku.id, target.id);
  if (!c && !bolehMulai(pelaku.role, target.role)) {
    return { ok: false, pesan: alasanTidakBoleh(pelaku.role) };
  }

  const satuJamLalu = new Date(Date.now() - 60 * 60 * 1000);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(pesan)
    .where(and(eq(pesan.pengirimId, pelaku.id), gte(pesan.dibuatPada, satuJamLalu)));
  if (n >= BATAS_PESAN_PER_JAM) {
    return {
      ok: false,
      pesan: `Batas ${BATAS_PESAN_PER_JAM} pesan per jam tercapai. Coba lagi nanti.`,
    };
  }

  if (!c) {
    const [a, b] = urutkanPasangan(pelaku.id, target.id);
    await db.insert(percakapan).values({ penggunaAId: a, penggunaBId: b }).onConflictDoNothing();
    c = await ambilPercakapan(pelaku.id, target.id);
    if (!c) return { ok: false, pesan: "Gagal membuat percakapan. Coba lagi." };
  }

  await db.insert(pesan).values({ percakapanId: c.id, pengirimId: pelaku.id, isi: hasil.data });
  await db
    .update(percakapan)
    .set({ pesanTerakhirPada: new Date() })
    .where(eq(percakapan.id, c.id));
  return { ok: true };
}

// Memuat riwayat sekaligus menandai pesan masuk sebagai sudah dibaca.
export async function muatPesan(targetId: string): Promise<HasilMuat> {
  const pelaku = await ambilPelaku();
  if (!pelaku) return { ok: false, pesan: "Masuk dulu." };

  const id = skemaIdUser.safeParse(targetId);
  if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };

  const c = await ambilPercakapan(pelaku.id, id.data);
  if (!c) return { ok: true, item: [], baruDibaca: 0 };

  const dibaca = await db
    .update(pesan)
    .set({ dibacaPada: new Date() })
    .where(
      and(eq(pesan.percakapanId, c.id), eq(pesan.pengirimId, id.data), isNull(pesan.dibacaPada)),
    )
    .returning({ id: pesan.id });

  return { ok: true, item: await ambilRiwayat(c.id, pelaku.id), baruDibaca: dibaca.length };
}

export async function hapusPesan(pesanId: string): Promise<HasilAksi> {
  const pelaku = await ambilPelaku();
  if (!pelaku) return { ok: false, pesan: "Masuk dulu." };
  if (pelaku.status === "DIBLOKIR") return { ok: false, pesan: "Akunmu sedang diblokir." };

  const id = skemaIdPesan.safeParse(pesanId);
  if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };

  const dihapus = await db
    .update(pesan)
    .set({ dihapusPada: new Date() })
    .where(and(eq(pesan.id, id.data), eq(pesan.pengirimId, pelaku.id), isNull(pesan.dihapusPada)))
    .returning({ id: pesan.id });
  if (dihapus.length === 0) return { ok: false, pesan: "Pesan tidak ditemukan." };
  return { ok: true };
}

export type HasilLama =
  | { ok: true; item: DataPesan[]; adaLagi: boolean }
  | { ok: false; pesan: string };

export async function muatPesanLama(targetId: string, sebelumId: string): Promise<HasilLama> {
  const pelaku = await ambilPelaku();
  if (!pelaku) return { ok: false, pesan: "Masuk dulu." };

  const id = skemaIdUser.safeParse(targetId);
  const kursor = skemaIdPesan.safeParse(sebelumId);
  if (!id.success || !kursor.success) return { ok: false, pesan: "Permintaan tidak valid." };

  const c = await ambilPercakapan(pelaku.id, id.data);
  if (!c) return { ok: true, item: [], adaLagi: false };

  const h = await ambilRiwayatLama(c.id, pelaku.id, kursor.data);
  return { ok: true, item: h.item, adaLagi: h.adaLagi };
}