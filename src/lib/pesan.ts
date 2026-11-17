import { and, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { percakapan, pesan, user } from "@/db/schema";

export const BATAS_RIWAYAT = 50;
export const BATAS_DAFTAR = 50;

export type DataPesan = {
  id: string;
  dariSaya: boolean;
  isi: string;
  dibuat: string;
  dihapus: boolean;
};

export type BarisPercakapan = {
  id: string;
  nama: string;
  username: string | null;
  role: string | null;
  foto: string | null;
  cuplikan: string;
  dariSaya: boolean;
  waktu: Date;
  belumDibaca: number;
};

// Urutan pasangan selalu ditentukan di sini, supaya satu pasangan = satu percakapan.
export function urutkanPasangan(x: string, y: string): [string, string] {
  return x < y ? [x, y] : [y, x];
}

// Aturan memulai chat. Kalau percakapan sudah ada, kedua pihak bebas saling membalas.
export function bolehMulai(roleSaya: string, roleTujuan: string) {
  if (roleSaya === "KOORDINATOR") return true;
  if (roleSaya === "PESERTA") return roleTujuan === "PESERTA" || roleTujuan === "KOORDINATOR";
  return false;
}

export function alasanTidakBoleh(roleSaya: string) {
  return roleSaya === "PESERTA"
    ? "Peserta hanya bisa memulai percakapan dengan Peserta dan Koordinator."
    : "Akun Umum belum bisa memulai percakapan. Kamu bisa membalas kalau dihubungi lebih dulu.";
}

export async function ambilPercakapan(idX: string, idY: string) {
  const [a, b] = urutkanPasangan(idX, idY);
  const [c] = await db
    .select({ id: percakapan.id })
    .from(percakapan)
    .where(and(eq(percakapan.penggunaAId, a), eq(percakapan.penggunaBId, b)))
    .limit(1);
  return c ?? null;
}

export async function ambilRiwayat(percakapanId: string, idSaya: string): Promise<DataPesan[]> {
  const baris = await db
    .select({
      id: pesan.id,
      pengirimId: pesan.pengirimId,
      isi: pesan.isi,
      dibuatPada: pesan.dibuatPada,
      dihapusPada: pesan.dihapusPada,
    })
    .from(pesan)
    .where(eq(pesan.percakapanId, percakapanId))
    .orderBy(desc(pesan.dibuatPada), desc(pesan.id))
    .limit(BATAS_RIWAYAT);

  return baris.reverse().map((b) => ({
    id: b.id,
    dariSaya: b.pengirimId === idSaya,
    isi: b.dihapusPada ? "" : b.isi,
    dibuat: b.dibuatPada.toISOString(),
    dihapus: !!b.dihapusPada,
  }));
}

// Jumlah percakapan yang punya pesan masuk belum dibaca.
export async function jumlahPesanBelumDibaca(idSaya: string) {
  const [{ n }] = await db
    .select({ n: sql<number>`count(distinct ${pesan.percakapanId})::int` })
    .from(pesan)
    .innerJoin(percakapan, eq(pesan.percakapanId, percakapan.id))
    .innerJoin(user, eq(pesan.pengirimId, user.id))
    .where(
      and(
        or(eq(percakapan.penggunaAId, idSaya), eq(percakapan.penggunaBId, idSaya)),
        ne(pesan.pengirimId, idSaya),
        isNull(pesan.dibacaPada),
        isNull(pesan.dihapusPada),
        sql`${user.status} is distinct from 'DIBLOKIR'`,
      ),
    );
  return n;
}

export async function daftarPercakapan(idSaya: string): Promise<BarisPercakapan[]> {
  const lawanId = sql<string>`case when ${percakapan.penggunaAId} = ${idSaya} then ${percakapan.penggunaBId} else ${percakapan.penggunaAId} end`;

  const daftar = await db
    .select({
      id: percakapan.id,
      nama: user.name,
      username: user.username,
      role: user.role,
      foto: user.image,
    })
    .from(percakapan)
    .innerJoin(user, eq(user.id, lawanId))
    .where(
      and(
        or(eq(percakapan.penggunaAId, idSaya), eq(percakapan.penggunaBId, idSaya)),
        sql`${user.status} is distinct from 'DIBLOKIR'`,
      ),
    )
    .orderBy(desc(percakapan.pesanTerakhirPada), desc(percakapan.id))
    .limit(BATAS_DAFTAR);
  if (daftar.length === 0) return [];

  const ids = daftar.map((d) => d.id);
  const [terakhir, belum] = await Promise.all([
    db
      .selectDistinctOn([pesan.percakapanId], {
        percakapanId: pesan.percakapanId,
        pengirimId: pesan.pengirimId,
        isi: pesan.isi,
        dibuatPada: pesan.dibuatPada,
        dihapusPada: pesan.dihapusPada,
      })
      .from(pesan)
      .where(inArray(pesan.percakapanId, ids))
      .orderBy(pesan.percakapanId, desc(pesan.dibuatPada)),
    db
      .select({ percakapanId: pesan.percakapanId, n: sql<number>`count(*)::int` })
      .from(pesan)
      .where(
        and(
          inArray(pesan.percakapanId, ids),
          ne(pesan.pengirimId, idSaya),
          isNull(pesan.dibacaPada),
          isNull(pesan.dihapusPada),
        ),
      )
      .groupBy(pesan.percakapanId),
  ]);

  return daftar.flatMap((d) => {
    const t = terakhir.find((x) => x.percakapanId === d.id);
    if (!t) return [];
    return [
      {
        ...d,
        cuplikan: t.dihapusPada ? "Pesan dihapus" : t.isi.replace(/\s+/g, " ").slice(0, 80),
        dariSaya: t.pengirimId === idSaya,
        waktu: t.dibuatPada,
        belumDibaca: belum.find((b) => b.percakapanId === d.id)?.n ?? 0,
      },
    ];
  });
}