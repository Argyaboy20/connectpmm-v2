import { and, asc, eq, gt, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { story, user } from "@/db/schema";
import { hapusFile } from "@/lib/penyimpanan";

export type ItemStory = { id: string; caption: string; dibuat: string };
export type GrupStory = {
  userId: string;
  nama: string;
  username: string | null;
  foto: string | null;
  stories: ItemStory[];
};

// Story yang belum kedaluwarsa, dikelompokkan per akun. Grup dengan story terbaru ada di depan.
export async function ambilStoryAktif(): Promise<GrupStory[]> {
  const baris = await db
    .select({
      id: story.id,
      caption: story.caption,
      dibuatPada: story.dibuatPada,
      userId: user.id,
      nama: user.name,
      username: user.username,
      foto: user.image,
    })
    .from(story)
    .innerJoin(user, eq(story.penulisId, user.id))
    .where(
      and(gt(story.kedaluwarsaPada, new Date()), sql`${user.status} is distinct from 'DIBLOKIR'`),
    )
    .orderBy(asc(story.dibuatPada))
    .limit(300);

  const peta = new Map<string, GrupStory>();
  for (const b of baris) {
    const g =
      peta.get(b.userId) ??
      { userId: b.userId, nama: b.nama, username: b.username, foto: b.foto, stories: [] };
    g.stories.push({ id: b.id, caption: b.caption, dibuat: b.dibuatPada.toISOString() });
    peta.set(b.userId, g);
  }
  return [...peta.values()].sort((a, b) =>
    a.stories[a.stories.length - 1].dibuat < b.stories[b.stories.length - 1].dibuat ? 1 : -1,
  );
}

// Menghapus story kedaluwarsa dari basis data dan penyimpanan. Kalau foto gagal dihapus,
// barisnya dibiarkan supaya dicoba lagi di pembersihan berikutnya.
export async function bersihkanStoryLama(maks = 200) {
  const lama = await db
    .select({ id: story.id, kunci: story.kunci })
    .from(story)
    .where(lte(story.kedaluwarsaPada, new Date()))
    .limit(maks);
  if (lama.length === 0) return 0;
  try {
    await hapusFile(lama.map((l) => l.kunci));
  } catch (e) {
    console.error("Gagal menghapus foto story kedaluwarsa", e);
    return 0;
  }
  await db.delete(story).where(inArray(story.id, lama.map((l) => l.id)));
  return lama.length;
}