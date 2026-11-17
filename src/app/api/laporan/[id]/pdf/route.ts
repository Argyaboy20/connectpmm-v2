import { and, asc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage } from "pdf-lib";
import sharp from "sharp";
import { db } from "@/db";
import { laporanGambar, laporanKegiatan, user } from "@/db/schema";
import { ambilPelaku } from "@/lib/pelaku";
import { ambilFile } from "@/lib/penyimpanan";
import { tanggalKegiatan, waktuLengkap } from "@/lib/waktu";

const tidakAda = () => new Response("Tidak ditemukan", { status: 404 });

const PERAN: Record<string, string> = { PESERTA: "Peserta", KOORDINATOR: "Koordinator", UMUM: "Umum" };
const STATUS: Record<string, string> = {
  MENUNGGU: "Menunggu persetujuan",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
};

// Font bawaan PDF hanya mendukung Latin. Karakter lain diganti.
function bersih(s: string) {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[^\n\x20-\x7E\xA0-\xFF]/g, "?");
}

function bungkus(teks: string, font: PDFFont, ukuran: number, lebar: number) {
  const hasil: string[] = [];
  for (const para of bersih(teks).split("\n")) {
    if (!para.trim()) {
      hasil.push("");
      continue;
    }
    let baris = "";
    for (const kata of para.split(" ")) {
      let k = kata;
      while (font.widthOfTextAtSize(k, ukuran) > lebar) {
        let n = k.length;
        while (n > 1 && font.widthOfTextAtSize(k.slice(0, n), ukuran) > lebar) n--;
        if (baris) {
          hasil.push(baris);
          baris = "";
        }
        hasil.push(k.slice(0, n));
        k = k.slice(n);
      }
      const coba = baris ? `${baris} ${k}` : k;
      if (font.widthOfTextAtSize(coba, ukuran) <= lebar) baris = coba;
      else {
        hasil.push(baris);
        baris = k;
      }
    }
    hasil.push(baris);
  }
  return hasil;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pelaku = await ambilPelaku();
  if (!pelaku || pelaku.status === "DIBLOKIR") return tidakAda();

  const pemutus = alias(user, "pemutus");
  const [l] = await db
    .select({
      id: laporanKegiatan.id,
      penulisId: laporanKegiatan.penulisId,
      judul: laporanKegiatan.judul,
      tanggal: laporanKegiatan.tanggalKegiatan,
      lokasi: laporanKegiatan.lokasi,
      uraian: laporanKegiatan.uraian,
      status: laporanKegiatan.status,
      ditolakAlasan: laporanKegiatan.ditolakAlasan,
      diputuskanPada: laporanKegiatan.diputuskanPada,
      dibuatPada: laporanKegiatan.dibuatPada,
      nama: user.name,
      username: user.username,
      role: user.role,
      ptPengirim: user.ptPengirim,
      ptPenerima: user.ptPenerima,
      pemutusNama: pemutus.name,
    })
    .from(laporanKegiatan)
    .innerJoin(user, eq(laporanKegiatan.penulisId, user.id))
    .leftJoin(pemutus, eq(laporanKegiatan.diputuskanOleh, pemutus.id))
    .where(and(eq(laporanKegiatan.id, id), isNull(laporanKegiatan.dihapusPada)))
    .limit(1);
  if (!l) return tidakAda();

  const koordinator = pelaku.role === "KOORDINATOR";
  if (!koordinator) {
    if (l.penulisId !== pelaku.id) return tidakAda();
    if (l.status !== "DISETUJUI") {
      return new Response("PDF tersedia setelah laporan disetujui.", { status: 403 });
    }
  }

  // Foto: kecilkan dan ubah ke JPEG supaya PDF ringan dan didukung pdf-lib.
  const daftarGambar = await db
    .select({ kunci: laporanGambar.kunci })
    .from(laporanGambar)
    .where(eq(laporanGambar.laporanId, l.id))
    .orderBy(asc(laporanGambar.urutan));

  const doc = await PDFDocument.create();
  const foto: PDFImage[] = [];
  for (const g of daftarGambar) {
    try {
      const f = await ambilFile(g.kunci);
      if (!f) continue;
      const jpeg = await sharp(Buffer.from(f.bytes))
        .rotate()
        .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toBuffer();
      foto.push(await doc.embedJpg(jpeg));
    } catch (e) {
      console.error("Gagal memproses foto laporan untuk PDF", g.kunci, e);
    }
  }

  const biasa = await doc.embedFont(StandardFonts.Helvetica);
  const tebal = await doc.embedFont(StandardFonts.HelveticaBold);

  const A4: [number, number] = [595.28, 841.89];
  const M = 50;
  const lebar = A4[0] - M * 2;
  const abu = rgb(0.4, 0.4, 0.4);
  const hitam = rgb(0.1, 0.1, 0.1);

  let page = doc.addPage(A4);
  let y = A4[1] - M;

  function ruang(h: number) {
    if (y - h < M + 20) {
      page = doc.addPage(A4);
      y = A4[1] - M;
    }
  }

  function tulis(teks: string, font: PDFFont, ukuran: number, warna = hitam, jarakAkhir = 0) {
    const tinggi = ukuran * 1.4;
    for (const baris of bungkus(teks, font, ukuran, lebar)) {
      ruang(tinggi);
      if (baris) page.drawText(baris, { x: M, y: y - ukuran, size: ukuran, font, color: warna });
      y -= tinggi;
    }
    y -= jarakAkhir;
  }

  function pasangan(label: string, nilai: string) {
    const lebarLabel = 110;
    const baris = bungkus(nilai, biasa, 10.5, lebar - lebarLabel);
    const tinggi = 10.5 * 1.4;
    ruang(tinggi);
    page.drawText(bersih(label), { x: M, y: y - 10.5, size: 10.5, font: tebal, color: abu });
    for (const b of baris) {
      ruang(tinggi);
      if (b) page.drawText(b, { x: M + lebarLabel, y: y - 10.5, size: 10.5, font: biasa, color: hitam });
      y -= tinggi;
    }
  }

  tulis("LAPORAN KEGIATAN PMM", tebal, 11, abu, 4);
  tulis(l.judul, tebal, 18, hitam, 8);
  page.drawLine({
    start: { x: M, y },
    end: { x: M + lebar, y },
    thickness: 0.8,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 14;

  pasangan("Nama", l.nama);
  pasangan("Username", l.username ? `@${l.username}` : "-");
  pasangan("Peran", PERAN[l.role] ?? l.role);
  if (l.ptPengirim) pasangan("PT Pengirim", l.ptPengirim);
  if (l.ptPenerima) pasangan("PT Penerima", l.ptPenerima);
  pasangan("Tanggal kegiatan", tanggalKegiatan(l.tanggal));
  pasangan("Lokasi", l.lokasi);
  pasangan("Dikirim", waktuLengkap(l.dibuatPada));
  pasangan("Status", STATUS[l.status] ?? l.status);
  if (l.status !== "MENUNGGU" && l.diputuskanPada) {
    pasangan(
      l.status === "DISETUJUI" ? "Disetujui pada" : "Ditolak pada",
      `${waktuLengkap(l.diputuskanPada)}${l.pemutusNama ? ` oleh ${l.pemutusNama}` : ""}`,
    );
  }
  if (l.status === "DITOLAK" && l.ditolakAlasan) pasangan("Alasan penolakan", l.ditolakAlasan);
  y -= 12;

  if (foto.length > 0) {
    tulis("Dokumentasi", tebal, 12, hitam, 4);
    const satu = foto.length === 1;
    const kolom = satu ? 1 : 2;
    const jarak = 8;
    const kotakL = (lebar - jarak * (kolom - 1)) / kolom;
    const kotakT = satu ? 320 : 220;

    for (let i = 0; i < foto.length; i += kolom) {
      const baris = foto.slice(i, i + kolom).map((f) => {
        const s = Math.min(kotakL / f.width, kotakT / f.height);
        return { f, w: f.width * s, h: f.height * s };
      });
      const tinggiBaris = Math.max(...baris.map((b) => b.h));
      ruang(tinggiBaris);
      baris.forEach((b, k) => {
        page.drawImage(b.f, { x: M + k * (kotakL + jarak), y: y - b.h, width: b.w, height: b.h });
      });
      y -= tinggiBaris + jarak;
    }
    y -= 8;
  }

  tulis("Uraian kegiatan", tebal, 12, hitam, 4);
  tulis(l.uraian, biasa, 11, hitam, 0);

  const cetak = bersih(`Dicetak dari PMM Connect pada ${waktuLengkap(new Date())}`);
  const halaman = doc.getPages();
  halaman.forEach((p, i) => {
    p.drawText(`${cetak}  |  Halaman ${i + 1} dari ${halaman.length}`, {
      x: M,
      y: 28,
      size: 8,
      font: biasa,
      color: abu,
    });
  });

  const bytes = await doc.save();
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="laporan-${l.id.slice(0, 8)}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}