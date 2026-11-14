import { and, asc, desc, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { komentar, post, postGambar, suka, user } from "@/db/schema";
import type { DataPost, GambarPost } from "@/components/post-card";

export const UKURAN_FEED = 20;

export type ItemFeed = DataPost & { penulisId: string; kursor: string };
export type HasilFeed = { item: ItemFeed[]; kursorBerikut: string | null };
export type KursorFeed = { waktu: string; id: string };

const POLA_WAKTU = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z$/;
const POLA_ID = /^[0-9a-f-]{36}$/;

export function bacaKursor(k: string | null | undefined): KursorFeed | null {
  if (!k) return null;
  const [waktu, id] = k.split("|");
  if (!waktu || !id || !POLA_WAKTU.test(waktu) || !POLA_ID.test(id)) return null;
  return { waktu, id };
}

export async function ambilFeed(opsi: {
  tipe: "POST" | "CONNEX";
  idSaya: string | null;
  kursor?: KursorFeed | null;
}): Promise<HasilFeed> {
  const syarat: SQL[] = [eq(post.tipe, opsi.tipe), isNull(post.dihapusPada)];
  if (opsi.kursor) {
    syarat.push(
      sql`(${post.dibuatPada}, ${post.id}) < (${opsi.kursor.waktu}::timestamptz, ${opsi.kursor.id})`,
    );
  }

  const baris = await db
    .select({
      id: post.id,
      penulisId: post.penulisId,
      isi: post.isi,
      tipe: post.tipe,
      dibuatPada: post.dibuatPada,
      nama: user.name,
      username: user.username,
      role: user.role,
      kursorWaktu: sql<string>`to_char(${post.dibuatPada} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
    })
    .from(post)
    .innerJoin(user, eq(post.penulisId, user.id))
    .where(and(...syarat))
    .orderBy(desc(post.dibuatPada), desc(post.id))
    .limit(UKURAN_FEED + 1);

  const adaLagi = baris.length > UKURAN_FEED;
  const halaman = adaLagi ? baris.slice(0, UKURAN_FEED) : baris;
  if (halaman.length === 0) return { item: [], kursorBerikut: null };

  const idPost = halaman.map((b) => b.id);
  const [gambar, hitungSuka, milikku, hitungKomentar] = await Promise.all([
    db
      .select({
        postId: postGambar.postId,
        kunci: postGambar.kunci,
        lebar: postGambar.lebar,
        tinggi: postGambar.tinggi,
      })
      .from(postGambar)
      .where(inArray(postGambar.postId, idPost))
      .orderBy(asc(postGambar.urutan)),
    db
      .select({ postId: suka.postId, n: sql<number>`count(*)::int` })
      .from(suka)
      .where(inArray(suka.postId, idPost))
      .groupBy(suka.postId),
    opsi.idSaya
      ? db
          .select({ postId: suka.postId })
          .from(suka)
          .where(and(eq(suka.userId, opsi.idSaya), inArray(suka.postId, idPost)))
      : Promise.resolve([] as { postId: string }[]),
    db
      .select({ postId: komentar.postId, n: sql<number>`count(*)::int` })
      .from(komentar)
      .where(and(inArray(komentar.postId, idPost), isNull(komentar.dihapusPada)))
      .groupBy(komentar.postId),
  ]);

  const gambarPerPost = new Map<string, GambarPost[]>();
  for (const g of gambar) {
    const arr = gambarPerPost.get(g.postId) ?? [];
    arr.push({ kunci: g.kunci, lebar: g.lebar, tinggi: g.tinggi });
    gambarPerPost.set(g.postId, arr);
  }
  const jumlahSuka = new Map(hitungSuka.map((s) => [s.postId, s.n]));
  const jumlahKomentar = new Map(hitungKomentar.map((k) => [k.postId, k.n]));
  const disukai = new Set(milikku.map((s) => s.postId));

  const item: ItemFeed[] = halaman.map(({ kursorWaktu, ...b }) => ({
    ...b,
    kursor: `${kursorWaktu}|${b.id}`,
    gambar: gambarPerPost.get(b.id) ?? [],
    jumlahSuka: jumlahSuka.get(b.id) ?? 0,
    disukai: disukai.has(b.id),
    jumlahKomentar: jumlahKomentar.get(b.id) ?? 0,
  }));

  return { item, kursorBerikut: adaLagi ? item[item.length - 1].kursor : null };
}