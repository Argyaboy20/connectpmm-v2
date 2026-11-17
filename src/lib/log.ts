import { and, desc, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { logModerasi, user } from "@/db/schema";
import type { KursorFeed } from "@/lib/feed";

export const UKURAN_LOG = 20;

export type OrangLog = { nama: string; username: string | null };

export type ItemLog = {
  id: string;
  kursor: string;
  aksi: string;
  sasaranTipe: string;
  dibuatPada: Date;
  aktor: OrangLog | null;
  sasaran: OrangLog | null;
  alasan: string | null;
  cuplikan: string | null;
  role: string | null;
};

export type HasilLog = { item: ItemLog[]; kursorBerikut: string | null };

function bacaCatatan(c: string | null): Record<string, unknown> {
  if (!c) return {};
  try {
    const o: unknown = JSON.parse(c);
    return o && typeof o === "object" ? (o as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function teks(v: unknown, maks = 200): string | null {
  return typeof v === "string" && v ? v.slice(0, maks) : null;
}

export async function ambilLog(opsi: { kursor?: KursorFeed | null } = {}): Promise<HasilLog> {
  const syarat: SQL[] = [];
  if (opsi.kursor) {
    syarat.push(
      sql`(${logModerasi.dibuatPada}, ${logModerasi.id}) < (${opsi.kursor.waktu}::timestamptz, ${opsi.kursor.id})`,
    );
  }

  const baris = await db
    .select({
      id: logModerasi.id,
      aksi: logModerasi.aksi,
      aktorId: logModerasi.aktorId,
      sasaranTipe: logModerasi.sasaranTipe,
      sasaranId: logModerasi.sasaranId,
      catatan: logModerasi.catatan,
      dibuatPada: logModerasi.dibuatPada,
      kursorWaktu: sql<string>`to_char(${logModerasi.dibuatPada} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
    })
    .from(logModerasi)
    .where(syarat.length ? and(...syarat) : undefined)
    .orderBy(desc(logModerasi.dibuatPada), desc(logModerasi.id))
    .limit(UKURAN_LOG + 1);

  const adaLagi = baris.length > UKURAN_LOG;
  const halaman = adaLagi ? baris.slice(0, UKURAN_LOG) : baris;
  if (halaman.length === 0) return { item: [], kursorBerikut: null };

  const rinci = halaman.map((b) => {
    const c = bacaCatatan(b.catatan);
      const konten = [
      "HAPUS_POST",
      "HAPUS_KOMENTAR",
      "HAPUS_LAPORAN",
      "SETUJUI_LAPORAN",
      "TOLAK_LAPORAN",
      "PULIHKAN_KONTEN",
      "HAPUS_STORY",
      "UBAH_PT"
    ].includes(b.aksi);
    const idSasaran = konten ? teks(c.penulisId, 100) : b.sasaranTipe === "USER" ? b.sasaranId : null;
    return { b, c, idSasaran };
  });

  const idOrang = new Set<string>();
  for (const { b, idSasaran } of rinci) {
    if (b.aktorId) idOrang.add(b.aktorId);
    if (idSasaran) idOrang.add(idSasaran);
  }
  const orang = idOrang.size
    ? await db
        .select({ id: user.id, nama: user.name, username: user.username })
        .from(user)
        .where(inArray(user.id, [...idOrang]))
    : [];
  const petaOrang = new Map<string, OrangLog>(
    orang.map((o) => [o.id, { nama: o.nama, username: o.username }]),
  );

  const item: ItemLog[] = rinci.map(({ b, c, idSasaran }) => ({
    id: b.id,
    kursor: `${b.kursorWaktu}|${b.id}`,
    aksi: b.aksi,
    sasaranTipe: b.sasaranTipe,
    dibuatPada: b.dibuatPada,
    aktor: b.aktorId ? (petaOrang.get(b.aktorId) ?? null) : null,
    sasaran: idSasaran ? (petaOrang.get(idSasaran) ?? null) : null,
    alasan: teks(c.alasan),
    cuplikan: teks(c.cuplikan, 100),
    role: teks(c.role, 20),
  }));

  return { item, kursorBerikut: adaLagi ? item[item.length - 1].kursor : null };
}