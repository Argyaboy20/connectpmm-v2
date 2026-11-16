import { and, asc, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { komentar, post, postGambar, suka, user } from "@/db/schema";
import type { DataPost } from "@/components/post-card";

export const MIN_KATA_KUNCI = 2;
export const UKURAN_HALAMAN = 20;
export const MAKS_HALAMAN = 10;

export function bersihkanKataKunci(mentah: string | string[] | undefined) {
  const s = Array.isArray(mentah) ? (mentah[0] ?? "") : (mentah ?? "");
  return s.replace(/\s+/g, " ").trim().slice(0, 50);
}

// Karakter khusus ILIKE (%, _, \) dianggap huruf biasa.
function pola(q: string) {
  return `%${q.replace(/[\\%_]/g, "\\$&")}%`;
}

const tidakDiblokir = sql`${user.status} is distinct from 'DIBLOKIR'`;

export type HasilOrang = {
  id: string;
  nama: string;
  username: string | null;
  role: string | null;
  foto: string | null;
};

export async function cariOrang(q: string, hal: number) {
  const batas = UKURAN_HALAMAN * hal;
  const p = pola(q);
  const baris = await db
    .select({
      id: user.id,
      nama: user.name,
      username: user.username,
      role: user.role,
      foto: user.image,
    })
    .from(user)
    .where(and(tidakDiblokir, or(ilike(user.name, p), ilike(user.username, p))))
    .orderBy(asc(user.name), asc(user.id))
    .limit(batas + 1);
  return { item: baris.slice(0, batas) as HasilOrang[], adaLagi: baris.length > batas };
}

export async function cariPost(q: string, hal: number, idSaya: string | null) {
  const batas = UKURAN_HALAMAN * hal;
  const baris = await db
    .select({
      id: post.id,
      isi: post.isi,
      tipe: post.tipe,
      dibuatPada: post.dibuatPada,
      nama: user.name,
      username: user.username,
      role: user.role,
      foto: user.image,
    })
    .from(post)
    .innerJoin(user, eq(post.penulisId, user.id))
    .where(and(isNull(post.dihapusPada), tidakDiblokir, ilike(post.isi, pola(q))))
    .orderBy(desc(post.dibuatPada), desc(post.id))
    .limit(batas + 1);

  const adaLagi = baris.length > batas;
  const terpilih = baris.slice(0, batas);
  const ids = terpilih.map((b) => b.id);
  if (ids.length === 0) return { item: [] as DataPost[], adaLagi: false };

  const [gambar, jumlahSuka, disukai, jumlahKomentar] = await Promise.all([
    db
      .select({
        postId: postGambar.postId,
        kunci: postGambar.kunci,
        lebar: postGambar.lebar,
        tinggi: postGambar.tinggi,
      })
      .from(postGambar)
      .where(inArray(postGambar.postId, ids))
      .orderBy(asc(postGambar.urutan)),
    db
      .select({ postId: suka.postId, n: sql<number>`count(*)::int` })
      .from(suka)
      .where(inArray(suka.postId, ids))
      .groupBy(suka.postId),
    idSaya
      ? db
          .select({ postId: suka.postId })
          .from(suka)
          .where(and(eq(suka.userId, idSaya), inArray(suka.postId, ids)))
      : Promise.resolve([] as { postId: string }[]),
    db
      .select({ postId: komentar.postId, n: sql<number>`count(*)::int` })
      .from(komentar)
      .where(and(inArray(komentar.postId, ids), isNull(komentar.dihapusPada)))
      .groupBy(komentar.postId),
  ]);

  const item: DataPost[] = terpilih.map((b) => ({
    ...b,
    gambar: gambar
      .filter((g) => g.postId === b.id)
      .map(({ kunci, lebar, tinggi }) => ({ kunci, lebar, tinggi })),
    jumlahSuka: jumlahSuka.find((s) => s.postId === b.id)?.n ?? 0,
    disukai: disukai.some((s) => s.postId === b.id),
    jumlahKomentar: jumlahKomentar.find((k) => k.postId === b.id)?.n ?? 0,
  }));
  return { item, adaLagi };
}