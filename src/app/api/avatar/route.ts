import { revalidatePath } from "next/cache";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { BATAS_UKURAN_AVATAR, JEDA_GANTI_FOTO_DETIK } from "@/lib/batas";
import { deteksiGambar } from "@/lib/jenis-gambar";
import { ambilPelaku } from "@/lib/pelaku";
import { hapusFile, simpanFile } from "@/lib/penyimpanan";

const AWALAN = "/media/";

function galat(status: number, pesan: string) {
  return Response.json({ ok: false, pesan }, { status });
}

function kunciDari(image: string | null) {
  return image && image.startsWith(`${AWALAN}avatar/`) ? image.slice(AWALAN.length) : null;
}

export async function POST(req: Request) {
  const pelaku = await ambilPelaku();
  if (!pelaku) return galat(401, "Masuk dulu.");
  if (pelaku.status === "DIBLOKIR") return galat(403, "Akunmu sedang diblokir.");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return galat(400, "Data tidak valid.");
  }

  const berkas = form.get("foto");
  if (!(berkas instanceof File)) return galat(400, "Pilih foto dulu.");
  if (berkas.size > BATAS_UKURAN_AVATAR) return galat(400, "Foto profil maksimal 300 KB.");

  const bytes = new Uint8Array(await berkas.arrayBuffer());
  const jenis = deteksiGambar(bytes);
  if (!jenis) return galat(400, "Hanya foto JPEG, PNG, atau WebP.");

  const [saya] = await db
    .select({ image: user.image, diubah: user.fotoDiubahPada })
    .from(user)
    .where(eq(user.id, pelaku.id))
    .limit(1);
  if (!saya) return galat(404, "Akun tidak ditemukan.");

  const jeda = JEDA_GANTI_FOTO_DETIK * 1000;
  if (saya.diubah && Date.now() - saya.diubah.getTime() < jeda) {
    return galat(429, "Tunggu sebentar sebelum mengganti foto lagi.");
  }

  const kunci = `avatar/${pelaku.id}/${crypto.randomUUID()}.${jenis.ekstensi}`;
  try {
    await simpanFile(kunci, bytes, jenis.mime);
    const r = await db
      .update(user)
      .set({ image: `${AWALAN}${kunci}`, fotoDiubahPada: new Date() })
      .where(
        and(
          eq(user.id, pelaku.id),
          or(isNull(user.fotoDiubahPada), lt(user.fotoDiubahPada, new Date(Date.now() - jeda))),
        ),
      )
      .returning({ id: user.id });
    if (r.length === 0) {
      await hapusFile([kunci]).catch(() => {});
      return galat(429, "Tunggu sebentar sebelum mengganti foto lagi.");
    }
  } catch (e) {
    console.error("Gagal menyimpan foto profil:", e);
    await hapusFile([kunci]).catch(() => {});
    return galat(500, "Gagal menyimpan foto. Coba lagi.");
  }

  const lama = kunciDari(saya.image);
  if (lama) await hapusFile([lama]).catch(() => {});

  revalidatePath("/", "layout");
  return Response.json({ ok: true, foto: `${AWALAN}${kunci}` });
}

export async function DELETE() {
  const pelaku = await ambilPelaku();
  if (!pelaku) return galat(401, "Masuk dulu.");

  const [saya] = await db
    .select({ image: user.image })
    .from(user)
    .where(eq(user.id, pelaku.id))
    .limit(1);
  const lama = kunciDari(saya?.image ?? null);

  await db.update(user).set({ image: null }).where(eq(user.id, pelaku.id));
  if (lama) await hapusFile([lama]).catch(() => {});

  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}