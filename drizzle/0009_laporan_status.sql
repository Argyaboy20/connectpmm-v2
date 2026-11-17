ALTER TABLE "notifikasi" DROP CONSTRAINT "notifikasi_tipe_check";--> statement-breakpoint
ALTER TABLE "notifikasi" DROP CONSTRAINT "notifikasi_post_check";--> statement-breakpoint
ALTER TABLE "laporan_kegiatan" ADD COLUMN "status" text DEFAULT 'MENUNGGU' NOT NULL;--> statement-breakpoint
ALTER TABLE "laporan_kegiatan" ADD COLUMN "ditolak_alasan" text;--> statement-breakpoint
ALTER TABLE "laporan_kegiatan" ADD COLUMN "diputuskan_oleh" text;--> statement-breakpoint
ALTER TABLE "laporan_kegiatan" ADD COLUMN "diputuskan_pada" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notifikasi" ADD COLUMN "laporan_id" text;--> statement-breakpoint
ALTER TABLE "laporan_kegiatan" ADD CONSTRAINT "laporan_kegiatan_diputuskan_oleh_user_id_fk" FOREIGN KEY ("diputuskan_oleh") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_laporan_id_laporan_kegiatan_id_fk" FOREIGN KEY ("laporan_id") REFERENCES "public"."laporan_kegiatan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "laporan_status_waktu_idx" ON "laporan_kegiatan" USING btree ("status","dibuat_pada");--> statement-breakpoint
ALTER TABLE "laporan_kegiatan" ADD CONSTRAINT "laporan_status_check" CHECK ("laporan_kegiatan"."status" in ('MENUNGGU','DISETUJUI','DITOLAK'));--> statement-breakpoint
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_laporan_check" CHECK ("notifikasi"."tipe" not like 'LAPORAN%' or "notifikasi"."laporan_id" is not null);--> statement-breakpoint
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_tipe_check" CHECK ("notifikasi"."tipe" in ('SUKA','KOMENTAR','IKUTI','LAPORAN_BARU','LAPORAN_DISETUJUI','LAPORAN_DITOLAK'));--> statement-breakpoint
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_post_check" CHECK ("notifikasi"."tipe" in ('IKUTI','LAPORAN_BARU','LAPORAN_DISETUJUI','LAPORAN_DITOLAK') or "notifikasi"."post_id" is not null);