CREATE TABLE "ikuti" (
	"pengikut_id" text NOT NULL,
	"diikuti_id" text NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ikuti_pengikut_id_diikuti_id_pk" PRIMARY KEY("pengikut_id","diikuti_id"),
	CONSTRAINT "ikuti_bukan_diri_sendiri" CHECK ("ikuti"."pengikut_id" <> "ikuti"."diikuti_id")
);
--> statement-breakpoint
ALTER TABLE "ikuti" ADD CONSTRAINT "ikuti_pengikut_id_user_id_fk" FOREIGN KEY ("pengikut_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ikuti" ADD CONSTRAINT "ikuti_diikuti_id_user_id_fk" FOREIGN KEY ("diikuti_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ikuti_diikuti_idx" ON "ikuti" USING btree ("diikuti_id");