CREATE TABLE "komentar" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"penulis_id" text NOT NULL,
	"isi" text NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"dihapus_pada" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "log_moderasi" (
	"id" text PRIMARY KEY NOT NULL,
	"aktor_id" text,
	"aksi" text NOT NULL,
	"sasaran_tipe" text NOT NULL,
	"sasaran_id" text NOT NULL,
	"catatan" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "perguruan_tinggi" (
	"id" text PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	CONSTRAINT "perguruan_tinggi_nama_unique" UNIQUE("nama")
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" text PRIMARY KEY NOT NULL,
	"penulis_id" text NOT NULL,
	"tipe" text NOT NULL,
	"isi" text DEFAULT '' NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diubah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"dihapus_pada" timestamp with time zone,
	CONSTRAINT "post_tipe_check" CHECK ("post"."tipe" in ('POST','CONNEX'))
);
--> statement-breakpoint
CREATE TABLE "post_gambar" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"kunci" text NOT NULL,
	"urutan" integer DEFAULT 0 NOT NULL,
	"lebar" integer,
	"tinggi" integer,
	CONSTRAINT "post_gambar_urutan_uniq" UNIQUE("post_id","urutan"),
	CONSTRAINT "post_gambar_urutan_check" CHECK ("post_gambar"."urutan" >= 0 and "post_gambar"."urutan" <= 3)
);
--> statement-breakpoint
CREATE TABLE "suka" (
	"user_id" text NOT NULL,
	"post_id" text NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suka_user_id_post_id_pk" PRIMARY KEY("user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"username" text,
	"display_username" text,
	"role" text DEFAULT 'UMUM' NOT NULL,
	"role_diminta" text,
	"status" text DEFAULT 'AKTIF' NOT NULL,
	"nim" text,
	"nidn" text,
	"pt_pengirim" text,
	"pt_penerima" text,
	"status_koordinator" text,
	"bio" text,
	"disetujui_oleh" text,
	"disetujui_pada" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username"),
	CONSTRAINT "user_role_check" CHECK ("user"."role" in ('UMUM','PESERTA','KOORDINATOR')),
	CONSTRAINT "user_status_check" CHECK ("user"."status" in ('AKTIF','DIBLOKIR')),
	CONSTRAINT "user_role_diminta_check" CHECK ("user"."role_diminta" is null or "user"."role_diminta" in ('PESERTA','KOORDINATOR'))
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "komentar" ADD CONSTRAINT "komentar_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "komentar" ADD CONSTRAINT "komentar_penulis_id_user_id_fk" FOREIGN KEY ("penulis_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_moderasi" ADD CONSTRAINT "log_moderasi_aktor_id_user_id_fk" FOREIGN KEY ("aktor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_penulis_id_user_id_fk" FOREIGN KEY ("penulis_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_gambar" ADD CONSTRAINT "post_gambar_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suka" ADD CONSTRAINT "suka_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suka" ADD CONSTRAINT "suka_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "komentar_post_waktu_idx" ON "komentar" USING btree ("post_id","dibuat_pada");--> statement-breakpoint
CREATE INDEX "post_penulis_waktu_idx" ON "post" USING btree ("penulis_id","dibuat_pada");--> statement-breakpoint
CREATE INDEX "post_waktu_idx" ON "post" USING btree ("dibuat_pada");--> statement-breakpoint
CREATE INDEX "suka_post_idx" ON "suka" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");