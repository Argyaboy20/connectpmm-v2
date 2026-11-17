import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, integer, index, uniqueIndex, unique, primaryKey, check, date } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

const waktu = (nama: string) => timestamp(nama, { withTimezone: true });
const idBaru = () => crypto.randomUUID();

export const perguruanTinggi = pgTable("perguruan_tinggi", {
  id: text("id").primaryKey().$defaultFn(idBaru),
  nama: text("nama").notNull().unique(),
});

export const post = pgTable(
  "post",
  {
    id: text("id").primaryKey().$defaultFn(idBaru),
    penulisId: text("penulis_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    tipe: text("tipe").notNull(),
    isi: text("isi").notNull().default(""),
    dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
    diubahPada: waktu("diubah_pada").defaultNow().$onUpdate(() => new Date()).notNull(),
    dihapusPada: waktu("dihapus_pada"),
    ditahanPada: waktu("ditahan_pada"),
    ditahanAlasan: text("ditahan_alasan"),
  },
  (t) => [
    check("post_tipe_check", sql`${t.tipe} in ('POST','CONNEX')`),
    index("post_penulis_waktu_idx").on(t.penulisId, t.dibuatPada),
    index("post_waktu_idx").on(t.dibuatPada),
  ],
);

export const postGambar = pgTable(
  "post_gambar",
  {
    id: text("id").primaryKey().$defaultFn(idBaru),
    postId: text("post_id").notNull().references(() => post.id, { onDelete: "cascade" }),
    kunci: text("kunci").notNull(),
    urutan: integer("urutan").notNull().default(0),
    lebar: integer("lebar"),
    tinggi: integer("tinggi"),
  },
  (t) => [
    check("post_gambar_urutan_check", sql`${t.urutan} >= 0 and ${t.urutan} <= 3`),
    unique("post_gambar_urutan_uniq").on(t.postId, t.urutan),
  ],
);

export const suka = pgTable(
  "suka",
  {
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    postId: text("post_id").notNull().references(() => post.id, { onDelete: "cascade" }),
    dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.postId] }),
    index("suka_post_idx").on(t.postId),
  ],
);

export const komentar = pgTable(
  "komentar",
  {
    id: text("id").primaryKey().$defaultFn(idBaru),
    postId: text("post_id").notNull().references(() => post.id, { onDelete: "cascade" }),
    penulisId: text("penulis_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    isi: text("isi").notNull(),
    dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
    dihapusPada: waktu("dihapus_pada"),
    ditahanPada: waktu("ditahan_pada"),
    ditahanAlasan: text("ditahan_alasan"),
  },
  (t) => [index("komentar_post_waktu_idx").on(t.postId, t.dibuatPada)],
);

export const logModerasi = pgTable("log_moderasi", {
  id: text("id").primaryKey().$defaultFn(idBaru),
  aktorId: text("aktor_id").references(() => user.id, { onDelete: "set null" }),
  aksi: text("aksi").notNull(),
  sasaranTipe: text("sasaran_tipe").notNull(),
  sasaranId: text("sasaran_id").notNull(),
  catatan: text("catatan"),
  dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
});

export const notifikasi = pgTable(
  "notifikasi",
  {
    id: text("id").primaryKey().$defaultFn(idBaru),
    penerimaId: text("penerima_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    aktorId: text("aktor_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    tipe: text("tipe").notNull(),
    postId: text("post_id").references(() => post.id, { onDelete: "cascade" }),
    komentarId: text("komentar_id").references(() => komentar.id, { onDelete: "cascade" }),
    laporanId: text("laporan_id").references(() => laporanKegiatan.id, { onDelete: "cascade" }),
    dibacaPada: waktu("dibaca_pada"),
    dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
  },
  (t) => [
    check(
      "notifikasi_tipe_check",
      sql`${t.tipe} in ('SUKA','KOMENTAR','IKUTI','LAPORAN_BARU','LAPORAN_DISETUJUI','LAPORAN_DITOLAK','KONTEN_DITAHAN','KONTEN_DITAHAN_PENULIS')`,
    ),
    check(
      "notifikasi_post_check",
      sql`${t.tipe} in ('IKUTI','LAPORAN_BARU','LAPORAN_DISETUJUI','LAPORAN_DITOLAK') or ${t.postId} is not null`,
    ),
    check(
      "notifikasi_laporan_check",
      sql`${t.tipe} not like 'LAPORAN%' or ${t.laporanId} is not null`,
    ),
    index("notifikasi_penerima_waktu_idx").on(t.penerimaId, t.dibuatPada),
    index("notifikasi_belum_dibaca_idx").on(t.penerimaId).where(sql`${t.dibacaPada} is null`),
    uniqueIndex("notifikasi_suka_uniq").on(t.aktorId, t.postId).where(sql`${t.tipe} = 'SUKA'`),
    uniqueIndex("notifikasi_ikuti_uniq").on(t.aktorId, t.penerimaId).where(sql`${t.tipe} = 'IKUTI'`),
  ],
);

export const ikuti = pgTable(
  "ikuti",
  {
    pengikutId: text("pengikut_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    diikutiId: text("diikuti_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.pengikutId, t.diikutiId] }),
    check("ikuti_bukan_diri_sendiri", sql`${t.pengikutId} <> ${t.diikutiId}`),
    index("ikuti_diikuti_idx").on(t.diikutiId),
  ],
);

export const percakapan = pgTable(
  "percakapan",
  {
    id: text("id").primaryKey().$defaultFn(idBaru),
    penggunaAId: text("pengguna_a_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    penggunaBId: text("pengguna_b_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
    pesanTerakhirPada: waktu("pesan_terakhir_pada").defaultNow().notNull(),
  },
  (t) => [
    check("percakapan_beda_check", sql`${t.penggunaAId} <> ${t.penggunaBId}`),
    unique("percakapan_pasangan_uniq").on(t.penggunaAId, t.penggunaBId),
    index("percakapan_a_waktu_idx").on(t.penggunaAId, t.pesanTerakhirPada),
    index("percakapan_b_waktu_idx").on(t.penggunaBId, t.pesanTerakhirPada),
  ],
);

export const pesan = pgTable(
  "pesan",
  {
    id: text("id").primaryKey().$defaultFn(idBaru),
    percakapanId: text("percakapan_id").notNull().references(() => percakapan.id, { onDelete: "cascade" }),
    pengirimId: text("pengirim_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    isi: text("isi").notNull(),
    postId: text("post_id").references(() => post.id, { onDelete: "set null" }),
    dibacaPada: waktu("dibaca_pada"),
    dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
    dihapusPada: waktu("dihapus_pada"),
  },
  (t) => [
    index("pesan_percakapan_waktu_idx").on(t.percakapanId, t.dibuatPada),
    index("pesan_belum_dibaca_idx").on(t.percakapanId).where(sql`${t.dibacaPada} is null`),
  ],
);

export const laporanKegiatan = pgTable(
  "laporan_kegiatan",
  {
    id: text("id").primaryKey().$defaultFn(idBaru),
    penulisId: text("penulis_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    judul: text("judul").notNull(),
    tanggalKegiatan: date("tanggal_kegiatan", { mode: "string" }).notNull(),
    lokasi: text("lokasi").notNull(),
    uraian: text("uraian").notNull(),
    status: text("status").notNull().default("MENUNGGU"),
    ditolakAlasan: text("ditolak_alasan"),
    diputuskanOleh: text("diputuskan_oleh").references(() => user.id, { onDelete: "set null" }),
    diputuskanPada: waktu("diputuskan_pada"),
    dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
    dihapusPada: waktu("dihapus_pada"),
  },
  (t) => [
    check("laporan_status_check", sql`${t.status} in ('MENUNGGU','DISETUJUI','DITOLAK')`),
    index("laporan_waktu_idx").on(t.dibuatPada),
    index("laporan_penulis_waktu_idx").on(t.penulisId, t.dibuatPada),
    index("laporan_status_waktu_idx").on(t.status, t.dibuatPada),
  ],
);

export const laporanGambar = pgTable(
  "laporan_gambar",
  {
    id: text("id").primaryKey().$defaultFn(idBaru),
    laporanId: text("laporan_id").notNull().references(() => laporanKegiatan.id, { onDelete: "cascade" }),
    kunci: text("kunci").notNull(),
    urutan: integer("urutan").notNull().default(0),
    lebar: integer("lebar"),
    tinggi: integer("tinggi"),
  },
  (t) => [
    check("laporan_gambar_urutan_check", sql`${t.urutan} >= 0 and ${t.urutan} <= 3`),
    unique("laporan_gambar_urutan_uniq").on(t.laporanId, t.urutan),
  ],
);

export const pelaporan = pgTable(
  "pelaporan",
  {
    id: text("id").primaryKey().$defaultFn(idBaru),
    pelaporId: text("pelapor_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    sasaranTipe: text("sasaran_tipe").notNull(),
    sasaranId: text("sasaran_id").notNull(),
    alasan: text("alasan").notNull(),
    dibuatPada: waktu("dibuat_pada").defaultNow().notNull(),
  },
  (t) => [
    check("pelaporan_tipe_check", sql`${t.sasaranTipe} in ('POST','KOMENTAR')`),
    unique("pelaporan_uniq").on(t.pelaporId, t.sasaranTipe, t.sasaranId),
    index("pelaporan_sasaran_idx").on(t.sasaranTipe, t.sasaranId),
  ],
);