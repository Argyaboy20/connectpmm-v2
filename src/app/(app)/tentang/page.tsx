import { PEMBARUAN_TERAKHIR, PENGELOLA, VERSI_SISTEM } from "@/lib/info-sistem";

export const metadata = { title: "Tentang Sistem · PMM Connect" };

function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-bold">{judul}</h2>
      <div className="space-y-2 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

export default function Tentang() {
  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-xl font-bold">Tentang Sistem</h1>
        <p className="text-muted-foreground text-sm">
          PMM Connect, versi {VERSI_SISTEM}. Diperbarui {PEMBARUAN_TERAKHIR}.
        </p>
      </div>

      <Bagian judul="Apa itu PMM Connect">
        <p>
          PMM Connect adalah wadah komunitas Pertukaran Mahasiswa Merdeka. Di sini peserta, koordinator, dan
          masyarakat umum bisa berbagi foto dan cerita, saling mengikuti, berkomentar, dan berkirim pesan.
        </p>
      </Bagian>

      <Bagian judul="Fitur">
        <ul className="list-disc space-y-1 pl-5">
          <li>Post foto (1 sampai 4 foto) dan Connex (tulisan singkat, maksimal 500 karakter).</li>
          <li>Story: satu foto dengan caption singkat yang hilang otomatis setelah 24 jam.</li>
          <li>Suka, komentar, bagikan post ke Pesan, ikuti akun lain, dan Pencarian orang atau post.</li>
          <li>Pesan satu lawan satu dan Notifikasi.</li>
          <li>
            Laporan Kegiatan untuk Peserta. Laporan tidak tampil di Beranda dan hanya bisa dilihat oleh
            penulisnya dan Koordinator.
          </li>
        </ul>
      </Bagian>

      <Bagian judul="Jenis akun">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Umum:</strong> membaca, membuat post dan Connex, suka, komentar. Bisa membalas Pesan, tapi
            belum bisa memulai percakapan.
          </li>
          <li>
            <strong>Peserta:</strong> semua hak Umum, memulai Pesan ke Peserta dan Koordinator, serta membuat
            Laporan Kegiatan.
          </li>
          <li>
            <strong>Koordinator:</strong> memulai Pesan ke siapa saja, memverifikasi pendaftaran, menyetujui
            atau menolak laporan, menghapus konten dengan alasan, dan memblokir akun.
          </li>
        </ul>
        <p>
          Pendaftaran Peserta dan Koordinator diverifikasi Koordinator. Selama menunggu, akun berjalan sebagai
          Umum.
        </p>
      </Bagian>

      <Bagian judul="Aturan penggunaan">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Ada batas per jam: 5 post atau Connex, 20 komentar, 60 pesan, dan 5 laporan, untuk mencegah spam.
          </li>
          <li>Konten yang melanggar bisa dihapus Koordinator, dan akun bisa diblokir. Tindakan ini tercatat.</li>
          <li>Hormati sesama pengguna. Jangan membagikan konten SARA, kekerasan, atau data pribadi orang lain.</li>
        </ul>
      </Bagian>

      <Bagian judul="Pengelola">
        <p>PMM Connect dikelola oleh {PENGELOLA}.</p>
      </Bagian>
    </div>
  );
}