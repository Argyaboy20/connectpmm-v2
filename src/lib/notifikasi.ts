import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { komentar, laporanKegiatan, notifikasi, post, user } from "@/db/schema";
import { UKURAN_HALAMAN } from "@/lib/pencarian";

// Notifikasi yang boleh tampil: post, komentar, dan laporannya belum dihapus, pelakunya tidak diblokir.
function terlihat(userId: string) {
  return and(
    eq(notifikasi.penerimaId, userId),
    isNull(post.dihapusPada),
    isNull(komentar.dihapusPada),
    isNull(laporanKegiatan.dihapusPada),
    sql`${user.status} is distinct from 'DIBLOKIR'`,
  );
}

export async function jumlahBelumDibaca(userId: string) {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifikasi)
    .leftJoin(post, eq(notifikasi.postId, post.id))
    .innerJoin(user, eq(notifikasi.aktorId, user.id))
    .leftJoin(komentar, eq(notifikasi.komentarId, komentar.id))
    .leftJoin(laporanKegiatan, eq(notifikasi.laporanId, laporanKegiatan.id))
    .where(and(terlihat(userId), isNull(notifikasi.dibacaPada)));
  return n;
}

export async function daftarNotifikasi(userId: string, hal: number) {
  const batas = UKURAN_HALAMAN * hal;
  const baris = await db
    .select({
      id: notifikasi.id,
      tipe: notifikasi.tipe,
      postId: notifikasi.postId,
      dibacaPada: notifikasi.dibacaPada,
      dibuatPada: notifikasi.dibuatPada,
      aktorNama: user.name,
      aktorUsername: user.username,
      aktorFoto: user.image,
      isiKomentar: komentar.isi,
      judulLaporan: laporanKegiatan.judul,
    })
    .from(notifikasi)
    .leftJoin(post, eq(notifikasi.postId, post.id))
    .innerJoin(user, eq(notifikasi.aktorId, user.id))
    .leftJoin(komentar, eq(notifikasi.komentarId, komentar.id))
    .leftJoin(laporanKegiatan, eq(notifikasi.laporanId, laporanKegiatan.id))
    .where(terlihat(userId))
    .orderBy(desc(notifikasi.dibuatPada), desc(notifikasi.id))
    .limit(batas + 1);
  return { item: baris.slice(0, batas), adaLagi: baris.length > batas };
}