import { and, eq, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { post } from "@/db/schema";
import { bacaKursor } from "@/lib/feed";

export const dynamic = "force-dynamic";

const BATAS = 50;

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;

  const tipe = params.get("tipe");
  if (tipe !== "POST" && tipe !== "CONNEX") {
    return Response.json({ n: 0, lebih: false }, { status: 400 });
  }

  const mentah = params.get("kursor");
  const kursor = bacaKursor(mentah);
  if (mentah && !kursor) {
    return Response.json({ n: 0, lebih: false }, { status: 400 });
  }

  const syarat: SQL[] = [eq(post.tipe, tipe), isNull(post.dihapusPada)];
  if (kursor) {
    syarat.push(
      sql`(${post.dibuatPada}, ${post.id}) > (${kursor.waktu}::timestamptz, ${kursor.id})`,
    );
  }

  const baris = await db
    .select({ id: post.id })
    .from(post)
    .where(and(...syarat))
    .limit(BATAS + 1);

  return Response.json(
    { n: Math.min(baris.length, BATAS), lebih: baris.length > BATAS },
    { headers: { "Cache-Control": "no-store" } },
  );
}