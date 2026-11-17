import { KONTAK_EMAIL, PEMBARUAN_TERAKHIR, PENGELOLA } from "@/lib/info-sistem";

export const metadata = { title: "Kebijakan Privasi · PMM Connect" };

function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-bold">{judul}</h2>
      <div className="space-y-2 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

export default function Privasi() {
  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-xl font-bold">Kebijakan Privasi</h1>
        <p className="text-muted-foreground text-sm">Diperbarui {PEMBARUAN_TERAKHIR}.</p>
      </div>

      <Bagian judul="Data yang kami simpan">
        <ul className="list-disc space-y-1 pl-5">
          <li>Akun: nama, username, email, foto profil, bio, dan password (disimpan dalam bentuk hash, bukan teks asli).</li>
          <li>Peserta: NIM, PT Pengirim, PT Penerima. Koordinator: NIDN dan PT.</li>
          <li>Konten: post, Connex, Story, foto, komentar, suka, pengikut, pesan, dan laporan kegiatan.</li>
          <li>Sesi login: alamat IP dan jenis perangkat.</li>
        </ul>
      </Bagian>

      <Bagian judul="Foto">
        <p>
          Foto dikecilkan di browser sebelum diunggah, dan proses itu menghapus lokasi GPS serta metadata
          kamera dari foto.
        </p>
      </Bagian>

      <Bagian judul="Siapa yang bisa melihat apa">
        <ul className="list-disc space-y-1 pl-5">
          <li>Post, Connex, komentar, dan profil bersifat publik, termasuk bagi pengunjung yang belum masuk.</li>
          <li>Story hanya bisa dilihat akun yang sudah masuk, dan hilang otomatis setelah 24 jam.</li>
          <li>Laporan Kegiatan hanya bisa dilihat penulisnya dan Koordinator.</li>
          <li>
            Pesan hanya tampil untuk dua pihak dalam percakapan. Pesan tidak dienkripsi ujung ke ujung, dan
            pengelola secara teknis memiliki akses ke basis data.
          </li>
          <li>Email, NIM, dan NIDN tidak ditampilkan di profil publik, tapi Koordinator melihatnya saat verifikasi.</li>
        </ul>
      </Bagian>

      <Bagian judul="Penyedia layanan">
        <p>
          Kami memakai Vercel (hosting), Neon (database), Cloudflare R2 (penyimpanan foto), dan Cloudflare
          Turnstile (anti-bot saat daftar dan masuk). Data diproses oleh layanan tersebut sesuai fungsinya.
        </p>
      </Bagian>

      <Bagian judul="Penghapusan konten">
        <p>
          Saat post atau laporan dihapus, fotonya dihapus permanen dari penyimpanan. Teksnya disembunyikan dari
          tampilan, tapi masih tersimpan di basis data sebagai arsip internal. Pesan yang dihapus juga hanya
          disembunyikan. Story dan fotonya dihapus permanen secara otomatis 24 jam setelah dibuat. Tindakan moderasi dicatat dalam log yang hanya dilihat Koordinator.
        </p>
      </Bagian>

      <Bagian judul="Cookie">
        <p>Kami hanya memakai cookie untuk menjaga sesi login. Kami tidak memakai cookie iklan.</p>
      </Bagian>

      <Bagian judul="Hak kamu">
        <p>
          Kamu bisa mengubah nama, username, foto, password, dan data PT lewat menu Informasi Akun. Untuk
          meminta penghapusan akun beserta datanya atau bertanya soal privasi, hubungi {PENGELOLA} di{" "}
          <strong>{KONTAK_EMAIL}</strong>.
        </p>
      </Bagian>

      <p className="text-muted-foreground text-xs">
        Kebijakan ini bisa berubah. Tanggal pembaruan terakhir tertera di atas.
      </p>
    </div>
  );
}