import { revalidatePath } from "next/cache";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { laporanGambar, laporanKegiatan } from "@/db/schema";
import { BATAS_FOTO, BATAS_LAPORAN_PER_JAM, BATAS_TOTAL_FOTO } from "@/lib/batas";
import { deteksiGambar } from "@/lib/jenis-gambar";
import { ambilPelaku } from "@/lib/pelaku";
import { hapusFile, simpanFile } from "@/lib/penyimpanan";
import { skemaLaporan } from "@/lib/validasi-laporan";

function galat(status: number, pesan: string) {
  return Response.json({ ok: false, pesan }, { status });
}

function angka(v: FormDataEntryValue | undefined) {
  const n = typeof v === "string" ? Number(v) : NaN;
  return Number.isInteger(n) && n > 0 && n <= 10000 ? n : null;
}

export async function POST(req: Request) {
  const pelaku = await ambilPelaku();
  if (!pelaku) return galat(401, "Masuk dulu untuk membuat laporan.");
  if (pelaku.status === "DIBLOKIR") return galat(403, "Akunmu sedang diblokir.");
  if (pelaku.role !== "PESERTA") return galat(403, "Hanya Peserta yang bisa membuat laporan.");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return galat(400, "Data tidak valid.");
  }

  const isi = skemaLaporan.safeParse({
    judul: form.get("judul") ?? "",
    tanggal: form.get("tanggal") ?? "",
    lokasi: form.get("lokasi") ?? "",
    uraian: form.get("uraian") ?? "",
  });
  if (!isi.success) return galat(400, isi.error.issues[0]?.message ?? "Data tidak valid.");

  const berkas = form.getAll("foto").filter((f): f is File => f instanceof File);
  if (berkas.length === 0) return galat(400, "Pilih minimal 1 foto dokumentasi.");
  if (berkas.length > BATAS_FOTO) return galat(400, `Maksimal ${BATAS_FOTO} foto.`);
  const total = berkas.reduce((jumlah, f) => jumlah + f.size, 0);
  if (total > BATAS_TOTAL_FOTO) return galat(400, "Total foto maksimal 4 MB per laporan.");

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
    .from(laporanKegiatan)
    .where(and(eq(laporanKegiatan.penulisId, pelaku.id), gte(laporanKegiatan.dibuatPada, satuJamLalu)));
  if (n >= BATAS_LAPORAN_PER_JAM) {
    return galat(429, `Batas ${BATAS_LAPORAN_PER_JAM} laporan per jam tercapai. Coba lagi nanti.`);
  }

  const laporanId = crypto.randomUUID();
  const kunci = siap.map((s) => `laporan/${laporanId}/${crypto.randomUUID()}.${s.ekstensi}`);

  try {
    await Promise.all(siap.map((s, i) => simpanFile(kunci[i], s.bytes, s.mime)));
    await db.insert(laporanKegiatan).values({
      id: laporanId,
      penulisId: pelaku.id,
      judul: isi.data.judul,
      tanggalKegiatan: isi.data.tanggal,
      lokasi: isi.data.lokasi,
      uraian: isi.data.uraian,
    });
    await db.insert(laporanGambar).values(
      kunci.map((k, i) => ({
        laporanId,
        kunci: k,
        urutan: i,
        lebar: angka(lebar[i]),
        tinggi: angka(tinggi[i]),
      })),
    );
  } catch (e) {
    console.error("Gagal menyimpan laporan:", e);
    await db.delete(laporanKegiatan).where(eq(laporanKegiatan.id, laporanId)).catch(() => {});
    await hapusFile(kunci).catch(() => {});
    return galat(500, "Gagal menyimpan laporan. Coba lagi.");
  }

  revalidatePath("/laporan");
  revalidatePath("/moderasi");
  return Response.json({ ok: true, id: laporanId });
}