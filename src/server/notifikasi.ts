"use server";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { notifikasi } from "@/db/schema";
import { ambilSesi } from "@/lib/sesi";
import type { HasilAksi } from "./post";

const skemaId = z.uuid("Permintaan tidak valid.");

export async function tandaiDibaca(id: string): Promise<HasilAksi> {
  const sesi = await ambilSesi();
  if (!sesi) return { ok: false, pesan: "Masuk dulu." };
  const v = skemaId.safeParse(id);
  if (!v.success) return { ok: false, pesan: "Permintaan tidak valid." };
  await db
    .update(notifikasi)
    .set({ dibacaPada: new Date() })
    .where(
      and(eq(notifikasi.id, v.data), eq(notifikasi.penerimaId, sesi.user.id), isNull(notifikasi.dibacaPada)),
    );
  return { ok: true };
}

export async function tandaiSemuaDibaca(): Promise<HasilAksi> {
  const sesi = await ambilSesi();
  if (!sesi) return { ok: false, pesan: "Masuk dulu." };
  await db
    .update(notifikasi)
    .set({ dibacaPada: new Date() })
    .where(and(eq(notifikasi.penerimaId, sesi.user.id), isNull(notifikasi.dibacaPada)));
  return { ok: true };
}