import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, integer, index, unique, primaryKey, check } from "drizzle-orm/pg-core";
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