import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { ikuti, user } from "@/db/schema";
import { UKURAN_HALAMAN } from "@/lib/pencarian";

export type JenisJejaring = "pengikut" | "mengikuti";

export async function daftarJejaring(
  profilId: string,
  jenis: JenisJejaring,
  hal: number,
  idSaya: string | null,
) {
  const batas = UKURAN_HALAMAN * hal;
  const lawan = jenis === "pengikut" ? ikuti.pengikutId : ikuti.diikutiId;
  const pemilik = jenis === "pengikut" ? ikuti.diikutiId : ikuti.pengikutId;

  const baris = await db
    .select({
      id: user.id,
      nama: user.name,
      username: user.username,
      role: user.role,
      foto: user.image,
    })
    .from(ikuti)
    .innerJoin(user, eq(user.id, lawan))
    .where(and(eq(pemilik, profilId), sql`${user.status} is distinct from 'DIBLOKIR'`))
    .orderBy(desc(ikuti.dibuatPada), desc(user.id))
    .limit(batas + 1);

  const item = baris.slice(0, batas);
  const diikuti =
    idSaya && item.length > 0
      ? await db
          .select({ id: ikuti.diikutiId })
          .from(ikuti)
          .where(and(eq(ikuti.pengikutId, idSaya), inArray(ikuti.diikutiId, item.map((i) => i.id))))
      : [];

  return {
    item: item.map((i) => ({ ...i, sayaMengikuti: diikuti.some((d) => d.id === i.id) })),
    adaLagi: baris.length > batas,
  };
}