CREATE TABLE "percakapan" (
	"id" text PRIMARY KEY NOT NULL,
	"pengguna_a_id" text NOT NULL,
	"pengguna_b_id" text NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"pesan_terakhir_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "percakapan_pasangan_uniq" UNIQUE("pengguna_a_id","pengguna_b_id"),
	CONSTRAINT "percakapan_beda_check" CHECK ("percakapan"."pengguna_a_id" <> "percakapan"."pengguna_b_id")
);
--> statement-breakpoint
CREATE TABLE "pesan" (
	"id" text PRIMARY KEY NOT NULL,
	"percakapan_id" text NOT NULL,
	"pengirim_id" text NOT NULL,
	"isi" text NOT NULL,
	"dibaca_pada" timestamp with time zone,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"dihapus_pada" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "percakapan" ADD CONSTRAINT "percakapan_pengguna_a_id_user_id_fk" FOREIGN KEY ("pengguna_a_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "percakapan" ADD CONSTRAINT "percakapan_pengguna_b_id_user_id_fk" FOREIGN KEY ("pengguna_b_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pesan" ADD CONSTRAINT "pesan_percakapan_id_percakapan_id_fk" FOREIGN KEY ("percakapan_id") REFERENCES "public"."percakapan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pesan" ADD CONSTRAINT "pesan_pengirim_id_user_id_fk" FOREIGN KEY ("pengirim_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "percakapan_a_waktu_idx" ON "percakapan" USING btree ("pengguna_a_id","pesan_terakhir_pada");--> statement-breakpoint
CREATE INDEX "percakapan_b_waktu_idx" ON "percakapan" USING btree ("pengguna_b_id","pesan_terakhir_pada");--> statement-breakpoint
CREATE INDEX "pesan_percakapan_waktu_idx" ON "pesan" USING btree ("percakapan_id","dibuat_pada");--> statement-breakpoint
CREATE INDEX "pesan_belum_dibaca_idx" ON "pesan" USING btree ("percakapan_id") WHERE "pesan"."dibaca_pada" is null;