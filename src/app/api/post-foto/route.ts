import { revalidatePath } from "next/cache";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { post, postGambar } from "@/db/schema";
import { BATAS_FOTO, BATAS_POST_PER_JAM, BATAS_TOTAL_FOTO } from "@/lib/batas";
import { deteksiGambar } from "@/lib/jenis-gambar";
import { hapusFile, simpanFile } from "@/lib/penyimpanan";
import { ambilSesi } from "@/lib/sesi";
import { skemaCaption } from "@/lib/validasi-post";

function galat(status: number, pesan: string) {
  return Response.json({ ok: false, pesan }, { status });
}

function angka(v: FormDataEntryValue | undefined) {
  const n = typeof v === "string" ? Number(v) : NaN;
  return Number.isInteger(n) && n > 0 && n <= 10000 ? n : null;
}

export async function POST(req: Request) {
  const sesi = await ambilSesi();
  if (!sesi) return galat(401, "Masuk dulu untuk membagikan foto.");
  if (sesi.user.status === "DIBLOKIR") return galat(403, "Akunmu sedang diblokir.");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return galat(400, "Data tidak valid.");
  }

  const caption = skemaCaption.safeParse(form.get("caption") ?? "");
  if (!caption.success) {
    return galat(400, caption.error.issues[0]?.message ?? "Keterangan tidak valid.");
  }

  const berkas = form.getAll("foto").filter((f): f is File => f instanceof File);
  if (berkas.length === 0) return galat(400, "Pilih minimal 1 foto.");
  if (berkas.length > BATAS_FOTO) return galat(400, `Maksimal ${BATAS_FOTO} foto.`);
  const total = berkas.reduce((jumlah, f) => jumlah + f.size, 0);
  if (total > BATAS_TOTAL_FOTO) return galat(400, "Total foto maksimal 4 MB per post.");

  const lebar = form.getAll("lebar");
  const tinggi = form.getAll("tinggi");

  const siap: { bytes: Uint8Array; mime: string; ekstensi: string }[] = [];
  for (const f of berkas) {
    const bytes = new Uint8Array(await f.arrayBuffer());
    const jenis = deteksiGambar(bytes);
    if (!jenis) return galat(400, "Hanya foto JPEG, PNG, atau WebP.");
    siap.push({ bytes, ...jenis });
  }

  const satuJamLalu = new Date(Date.now() - 60 * 60 * 1000);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(post)
    .where(and(eq(post.penulisId, sesi.user.id), gte(post.dibuatPada, satuJamLalu)));
  if (n >= BATAS_POST_PER_JAM) {
    return galat(429, `Batas ${BATAS_POST_PER_JAM} post per jam tercapai. Coba lagi nanti.`);
  }

  const postId = crypto.randomUUID();
  const kunci = siap.map((s) => `post/${postId}/${crypto.randomUUID()}.${s.ekstensi}`);

  try {
    await Promise.all(siap.map((s, i) => simpanFile(kunci[i], s.bytes, s.mime)));
    await db.insert(post).values({
      id: postId,
      penulisId: sesi.user.id,
      tipe: "POST",
      isi: caption.data,
    });
    await db.insert(postGambar).values(
      kunci.map((k, i) => ({
        postId,
        kunci: k,
        urutan: i,
        lebar: angka(lebar[i]),
        tinggi: angka(tinggi[i]),
      })),
    );
  } catch (e) {
    console.error("Gagal menyimpan post foto:", e);
    await db.delete(post).where(eq(post.id, postId)).catch(() => {});
    await hapusFile(kunci).catch(() => {});
    return galat(500, "Gagal menyimpan foto. Coba lagi.");
  }

  revalidatePath("/");
  return Response.json({ ok: true, id: postId });
}