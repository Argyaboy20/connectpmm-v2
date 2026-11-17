import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { laporanGambar, laporanKegiatan, user } from "@/db/schema";
import { UKURAN_HALAMAN } from "@/lib/pencarian";

export type StatusLaporan = "MENUNGGU" | "DISETUJUI" | "DITOLAK";

export type DataLaporan = {
  id: string;
  judul: string;
  tanggal: string;
  lokasi: string;
  uraian: string;
  status: string;
  ditolakAlasan: string | null;
  dibuatPada: Date;
  penulisId: string;
  nama: string;
  username: string | null;
  role: string | null;
  foto: string | null;
  gambar: { id: string; lebar: number | null; tinggi: number | null }[];
};

// Koordinator melihat semua laporan. Peserta hanya laporannya sendiri.
export async function daftarLaporan(
  pelaku: { id: string; role: string },
  hal: number,
  status: StatusLaporan | null = null,
) {
  const batas = UKURAN_HALAMAN * hal;
  const semua = pelaku.role === "KOORDINATOR";

  const baris = await db
    .select({
      id: laporanKegiatan.id,
      judul: laporanKegiatan.judul,
      tanggal: laporanKegiatan.tanggalKegiatan,
      lokasi: laporanKegiatan.lokasi,
      uraian: laporanKegiatan.uraian,
      status: laporanKegiatan.status,
      ditolakAlasan: laporanKegiatan.ditolakAlasan,
      dibuatPada: laporanKegiatan.dibuatPada,
      penulisId: laporanKegiatan.penulisId,
      nama: user.name,
      username: user.username,
      role: user.role,
      foto: user.image,
    })
    .from(laporanKegiatan)
    .innerJoin(user, eq(laporanKegiatan.penulisId, user.id))
    .where(
      and(
        isNull(laporanKegiatan.dihapusPada),
        semua ? undefined : eq(laporanKegiatan.penulisId, pelaku.id),
        status ? eq(laporanKegiatan.status, status) : undefined,
      ),
    )
    .orderBy(desc(laporanKegiatan.dibuatPada), desc(laporanKegiatan.id))
    .limit(batas + 1);

  const adaLagi = baris.length > batas;
  const terpilih = baris.slice(0, batas);
  if (terpilih.length === 0) return { item: [] as DataLaporan[], adaLagi: false };

  const gambar = await db
    .select({
      id: laporanGambar.id,
      laporanId: laporanGambar.laporanId,
      lebar: laporanGambar.lebar,
      tinggi: laporanGambar.tinggi,
    })
    .from(laporanGambar)
    .where(inArray(laporanGambar.laporanId, terpilih.map((b) => b.id)))
    .orderBy(asc(laporanGambar.urutan));

  const item: DataLaporan[] = terpilih.map((b) => ({
    ...b,
    gambar: gambar
      .filter((g) => g.laporanId === b.id)
      .map(({ id, lebar, tinggi }) => ({ id, lebar, tinggi })),
  }));
  return { item, adaLagi };
}