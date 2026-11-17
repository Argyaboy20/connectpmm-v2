CREATE TABLE "pelaporan" (
	"id" text PRIMARY KEY NOT NULL,
	"pelapor_id" text NOT NULL,
	"sasaran_tipe" text NOT NULL,
	"sasaran_id" text NOT NULL,
	"alasan" text NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pelaporan_uniq" UNIQUE("pelapor_id","sasaran_tipe","sasaran_id"),
	CONSTRAINT "pelaporan_tipe_check" CHECK ("pelaporan"."sasaran_tipe" in ('POST','KOMENTAR'))
);
--> statement-breakpoint
ALTER TABLE "notifikasi" DROP CONSTRAINT "notifikasi_tipe_check";--> statement-breakpoint
ALTER TABLE "komentar" ADD COLUMN "ditahan_pada" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "komentar" ADD COLUMN "ditahan_alasan" text;--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "ditahan_pada" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "ditahan_alasan" text;--> statement-breakpoint
ALTER TABLE "pelaporan" ADD CONSTRAINT "pelaporan_pelapor_id_user_id_fk" FOREIGN KEY ("pelapor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pelaporan_sasaran_idx" ON "pelaporan" USING btree ("sasaran_tipe","sasaran_id");--> statement-breakpoint
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_tipe_check" CHECK ("notifikasi"."tipe" in ('SUKA','KOMENTAR','IKUTI','LAPORAN_BARU','LAPORAN_DISETUJUI','LAPORAN_DITOLAK','KONTEN_DITAHAN','KONTEN_DITAHAN_PENULIS'));