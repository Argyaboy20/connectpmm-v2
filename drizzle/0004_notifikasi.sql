CREATE TABLE "notifikasi" (
	"id" text PRIMARY KEY NOT NULL,
	"penerima_id" text NOT NULL,
	"aktor_id" text NOT NULL,
	"tipe" text NOT NULL,
	"post_id" text NOT NULL,
	"komentar_id" text,
	"dibaca_pada" timestamp with time zone,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifikasi_tipe_check" CHECK ("notifikasi"."tipe" in ('SUKA','KOMENTAR'))
);
--> statement-breakpoint
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_penerima_id_user_id_fk" FOREIGN KEY ("penerima_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_aktor_id_user_id_fk" FOREIGN KEY ("aktor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_komentar_id_komentar_id_fk" FOREIGN KEY ("komentar_id") REFERENCES "public"."komentar"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifikasi_penerima_waktu_idx" ON "notifikasi" USING btree ("penerima_id","dibuat_pada");--> statement-breakpoint
CREATE INDEX "notifikasi_belum_dibaca_idx" ON "notifikasi" USING btree ("penerima_id") WHERE "notifikasi"."dibaca_pada" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "notifikasi_suka_uniq" ON "notifikasi" USING btree ("aktor_id","post_id") WHERE "notifikasi"."tipe" = 'SUKA';