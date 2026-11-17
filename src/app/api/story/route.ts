import { revalidatePath } from "next/cache";
import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { story } from "@/db/schema";
import {
  BATAS_CAPTION_STORY,
  BATAS_FOTO_STORY,
  BATAS_STORY_PER_JAM,
  DURASI_STORY_JAM,
} from "@/lib/batas";
import { deteksiGambar } from "@/lib/jenis-gambar";
import { periksaTeks } from "@/lib/kata-terlarang";
import { ambilPelaku } from "@/lib/pelaku";
import { hapusFile, simpanFile } from "@/lib/penyimpanan";
import { bersihkanStoryLama } from "@/lib/story";

const skemaCaption = z
  .string("Caption tidak valid.")
  .trim()
  .max(BATAS_CAPTION_STORY, `Caption maksimal ${BATAS_CAPTION_STORY} karakter.`);

function galat(status: number, pesan: string) {
  return Response.json({ ok: false, pesan }, { status });
}

function angka(v: FormDataEntryValue | null) {
  const n = typeof v === "string" ? Number(v) : NaN;
  return Number.isInteger(n) && n > 0 && n <= 10000 ? n : null;
}

export async function POST(req: Request) {
  const pelaku = await ambilPelaku();
  if (!pelaku) return galat(401, "Masuk dulu untuk membuat story.");
  if (pelaku.status === "DIBLOKIR") return galat(403, "Akunmu sedang diblokir.");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return galat(400, "Data tidak valid.");
  }

  const caption = skemaCaption.safeParse(form.get("caption") ?? "");
  if (!caption.success) return galat(400, caption.error.issues[0]?.message ?? "Caption tidak valid.");
  if (periksaTeks(caption.data).terlarang) {
    return galat(400, "Caption mengandung kata yang tidak diperbolehkan.");
  }

  const berkas = form.get("foto");
  if (!(berkas instanceof File)) return galat(400, "Pilih foto dulu.");
  if (berkas.size > BATAS_FOTO_STORY) return galat(400, "Foto story maksimal 1,5 MB.");

  const bytes = new Uint8Array(await berkas.arrayBuffer());
  const jenis = deteksiGambar(bytes);
  if (!jenis) return galat(400, "Hanya foto JPEG, PNG, atau WebP.");

  const satuJamLalu = new Date(Date.now() - 60 * 60 * 1000);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(story)
    .where(and(eq(story.penulisId, pelaku.id), gte(story.dibuatPada, satuJamLalu)));
  if (n >= BATAS_STORY_PER_JAM) {
    return galat(429, `Batas ${BATAS_STORY_PER_JAM} story per jam tercapai. Coba lagi nanti.`);
  }

  const id = crypto.randomUUID();
  const kunci = `story/${id}/${crypto.randomUUID()}.${jenis.ekstensi}`;
  try {
    await simpanFile(kunci, bytes, jenis.mime);
    await db.insert(story).values({
      id,
      penulisId: pelaku.id,
      kunci,
      caption: caption.data,
      lebar: angka(form.get("lebar")),
      tinggi: angka(form.get("tinggi")),
      kedaluwarsaPada: new Date(Date.now() + DURASI_STORY_JAM * 60 * 60 * 1000),
    });
  } catch (e) {
    console.error("Gagal menyimpan story:", e);
    await db.delete(story).where(eq(story.id, id)).catch(() => {});
    await hapusFile([kunci]).catch(() => {});
    return galat(500, "Gagal menyimpan story. Coba lagi.");
  }

  // Pembersihan tambahan di luar jadwal harian. Kegagalannya tidak boleh menggagalkan story.
  await bersihkanStoryLama(50).catch(() => {});

  revalidatePath("/");
  return Response.json({ ok: true, id });
}