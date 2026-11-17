import { and, asc, desc, eq, isNotNull, ne, notExists, sql } from "drizzle-orm";
import { db } from "@/db";
import { ikuti, user } from "@/db/schema";

export type ItemSaran = {
  id: string;
  nama: string;
  username: string | null;
  role: string | null;
  foto: string | null;
};

// Akun terdaftar yang belum diikuti, bukan diri sendiri, tidak diblokir.
// Koordinator dulu, lalu yang terbaru.
export async function ambilSaran(idSaya: string | null, batas: number): Promise<ItemSaran[]> {
  return db
    .select({
      id: user.id,
      nama: user.name,
      username: user.username,
      role: user.role,
      foto: user.image,
    })
    .from(user)
    .where(
      and(
        sql`${user.status} is distinct from 'DIBLOKIR'`,
        isNotNull(user.username),
        idSaya ? ne(user.id, idSaya) : undefined,
        idSaya
          ? notExists(
              db
                .select({ x: sql`1` })
                .from(ikuti)
                .where(and(eq(ikuti.pengikutId, idSaya), eq(ikuti.diikutiId, user.id))),
            )
          : undefined,
      ),
    )
    .orderBy(sql`case when ${user.role} = 'KOORDINATOR' then 0 else 1 end`, desc(user.createdAt), asc(user.id))
    .limit(batas);
}

export async function infoIkuti(profilId: string, idSaya: string | null) {
  const [pengikut, mengikuti, saya] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(ikuti).where(eq(ikuti.diikutiId, profilId)),
    db.select({ n: sql<number>`count(*)::int` }).from(ikuti).where(eq(ikuti.pengikutId, profilId)),
    idSaya
      ? db
          .select({ x: ikuti.diikutiId })
          .from(ikuti)
          .where(and(eq(ikuti.pengikutId, idSaya), eq(ikuti.diikutiId, profilId)))
          .limit(1)
      : Promise.resolve([] as { x: string }[]),
  ]);
  return {
    pengikut: pengikut[0].n,
    mengikuti: mengikuti[0].n,
    sayaMengikuti: saya.length > 0,
  };
}