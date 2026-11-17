ALTER TABLE "notifikasi" DROP CONSTRAINT "notifikasi_tipe_check";--> statement-breakpoint
ALTER TABLE "notifikasi" ALTER COLUMN "post_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "pesan" ADD COLUMN "post_id" text;--> statement-breakpoint
ALTER TABLE "pesan" ADD CONSTRAINT "pesan_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notifikasi_ikuti_uniq" ON "notifikasi" USING btree ("aktor_id","penerima_id") WHERE "notifikasi"."tipe" = 'IKUTI';--> statement-breakpoint
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_post_check" CHECK ("notifikasi"."tipe" = 'IKUTI' or "notifikasi"."post_id" is not null);--> statement-breakpoint
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_tipe_check" CHECK ("notifikasi"."tipe" in ('SUKA','KOMENTAR','IKUTI'));