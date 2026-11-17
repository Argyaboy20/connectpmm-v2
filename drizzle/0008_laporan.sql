CREATE TABLE "laporan_gambar" (
	"id" text PRIMARY KEY NOT NULL,
	"laporan_id" text NOT NULL,
	"kunci" text NOT NULL,
	"urutan" integer DEFAULT 0 NOT NULL,
	"lebar" integer,
	"tinggi" integer,
	CONSTRAINT "laporan_gambar_urutan_uniq" UNIQUE("laporan_id","urutan"),
	CONSTRAINT "laporan_gambar_urutan_check" CHECK ("laporan_gambar"."urutan" >= 0 and "laporan_gambar"."urutan" <= 3)
);
--> statement-breakpoint
CREATE TABLE "laporan_kegiatan" (
	"id" text PRIMARY KEY NOT NULL,
	"penulis_id" text NOT NULL,
	"judul" text NOT NULL,
	"tanggal_kegiatan" date NOT NULL,
	"lokasi" text NOT NULL,
	"uraian" text NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"dihapus_pada" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "laporan_gambar" ADD CONSTRAINT "laporan_gambar_laporan_id_laporan_kegiatan_id_fk" FOREIGN KEY ("laporan_id") REFERENCES "public"."laporan_kegiatan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laporan_kegiatan" ADD CONSTRAINT "laporan_kegiatan_penulis_id_user_id_fk" FOREIGN KEY ("penulis_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "laporan_waktu_idx" ON "laporan_kegiatan" USING btree ("dibuat_pada");--> statement-breakpoint
CREATE INDEX "laporan_penulis_waktu_idx" ON "laporan_kegiatan" USING btree ("penulis_id","dibuat_pada");