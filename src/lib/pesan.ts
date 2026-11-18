import { and, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { percakapan, pesan, post, user } from "@/db/schema";

export const BATAS_RIWAYAT = 50;
export const BATAS_DAFTAR = 50;

export type PreviewPost = {
  id: string;
  nama: string;
  cuplikan: string;
  adaFoto: boolean;
  tersedia: boolean;
};

export type DataPesan = {
  id: string;
  dariSaya: boolean;
  isi: string;
  dibuat: string;
  dihapus: boolean;
  dibaca: boolean;
  post: PreviewPost | null;
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

// Aturan memulai chat. Kalau percakapan sudah ada, kedua pihak bebas saling membalas,
// kecuali Umum ke Koordinator (selalu ditolak, lihat bolehKirim).
export function bolehMulai(roleSaya: string, roleTujuan: string) {
  if (roleSaya === "KOORDINATOR") return true;
  if (roleSaya === "PESERTA") return true;
  return false;
}

// Aturan kirim secara keseluruhan, termasuk membalas percakapan yang sudah ada.
export function bolehKirim(roleSaya: string, roleTujuan: string, adaPercakapan: boolean) {
  if (roleSaya === "UMUM" && roleTujuan === "KOORDINATOR") return false;
  return adaPercakapan || bolehMulai(roleSaya, roleTujuan);
}

export function alasanTidakBoleh(roleSaya: string, roleTujuan?: string) {
  if (roleSaya === "UMUM" && roleTujuan === "KOORDINATOR") {
    return "Akun Umum tidak bisa mengirim pesan ke Koordinator.";
  }
  return "Akun Umum belum bisa memulai percakapan. Kamu bisa membalas kalau dihubungi lebih dulu.";
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

const kolomPesan = {
  id: pesan.id,
  pengirimId: pesan.pengirimId,
  isi: pesan.isi,
  dibuatPada: pesan.dibuatPada,
  dihapusPada: pesan.dihapusPada,
  dibacaPada: pesan.dibacaPada,
  postId: pesan.postId,
};

type BarisPesan = {
  id: string;
  pengirimId: string;
  isi: string;
  dibuatPada: Date;
  dihapusPada: Date | null;
  dibacaPada: Date | null;
  postId: string | null;
};

async function petakan(baris: BarisPesan[], idSaya: string): Promise<DataPesan[]> {
  const idPost = [
    ...new Set(baris.filter((b) => b.postId && !b.dihapusPada).map((b) => b.postId as string)),
  ];
  const preview =
    idPost.length > 0
      ? await db
          .select({
            id: post.id,
            isi: post.isi,
            tipe: post.tipe,
            dihapusPada: post.dihapusPada,
            nama: user.name,
          })
          .from(post)
          .innerJoin(user, eq(post.penulisId, user.id))
          .where(inArray(post.id, idPost))
      : [];

  return baris.map((b) => {
    let kartu: PreviewPost | null = null;
    if (b.postId && !b.dihapusPada) {
      const p = preview.find((x) => x.id === b.postId);
      kartu =
        p && !p.dihapusPada
          ? {
              id: p.id,
              nama: p.nama,
              cuplikan: p.isi.replace(/\s+/g, " ").slice(0, 100),
              adaFoto: p.tipe === "POST",
              tersedia: true,
            }
          : { id: b.postId, nama: "", cuplikan: "", adaFoto: false, tersedia: false };
    }
    return {
      id: b.id,
      dariSaya: b.pengirimId === idSaya,
      isi: b.dihapusPada ? "" : b.isi,
      dibuat: b.dibuatPada.toISOString(),
      dihapus: !!b.dihapusPada,
      dibaca: !!b.dibacaPada,
      post: kartu,
    };
  });
}

export async function ambilRiwayat(percakapanId: string, idSaya: string): Promise<DataPesan[]> {
  const baris = await db
    .select(kolomPesan)
    .from(pesan)
    .where(eq(pesan.percakapanId, percakapanId))
    .orderBy(desc(pesan.dibuatPada), desc(pesan.id))
    .limit(BATAS_RIWAYAT);
  return petakan(baris.reverse(), idSaya);
}

// Pesan yang lebih lama dari pesan dengan id `sebelumId`.
export async function ambilRiwayatLama(percakapanId: string, idSaya: string, sebelumId: string) {
  const baris = await db
    .select(kolomPesan)
    .from(pesan)
    .where(
      and(
        eq(pesan.percakapanId, percakapanId),
        sql`(${pesan.dibuatPada}, ${pesan.id}) < (select p2.dibuat_pada, p2.id from pesan p2 where p2.id = ${sebelumId})`,
      ),
    )
    .orderBy(desc(pesan.dibuatPada), desc(pesan.id))
    .limit(BATAS_RIWAYAT + 1);
  const adaLagi = baris.length > BATAS_RIWAYAT;
  return { item: await petakan(baris.slice(0, BATAS_RIWAYAT).reverse(), idSaya), adaLagi };
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
        postId: pesan.postId,
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
    const cuplikan = t.dihapusPada
      ? "Pesan dihapus"
      : t.postId && !t.isi
        ? "Membagikan sebuah post"
        : t.isi.replace(/\s+/g, " ").slice(0, 80);
    return [
      {
        ...d,
        cuplikan,
        dariSaya: t.pengirimId === idSaya,
        waktu: t.dibuatPada,
        belumDibaca: belum.find((b) => b.percakapanId === d.id)?.n ?? 0,
      },
    ];
  });
}