CREATE TABLE "story" (
	"id" text PRIMARY KEY NOT NULL,
	"penulis_id" text NOT NULL,
	"kunci" text NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"lebar" integer,
	"tinggi" integer,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"kedaluwarsa_pada" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "story" ADD CONSTRAINT "story_penulis_id_user_id_fk" FOREIGN KEY ("penulis_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "story_kedaluwarsa_idx" ON "story" USING btree ("kedaluwarsa_pada");--> statement-breakpoint
CREATE INDEX "story_penulis_waktu_idx" ON "story" USING btree ("penulis_id","dibuat_pada");