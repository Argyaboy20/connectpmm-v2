# PMM Connect

Platform komunitas bergaya media sosial untuk **Pertukaran Mahasiswa Merdeka (PMM)**. Peserta, Koordinator, dan masyarakat umum bisa berbagi foto dan cerita, saling mengikuti, berkirim pesan, dan Peserta dapat mengirim **Laporan Kegiatan** yang ditinjau Koordinator.

> Seluruh antarmuka berbahasa Indonesia. Dibangun dengan layanan gratis (Vercel Hobby, Neon Free, Cloudflare R2, Cloudflare Turnstile).

## Fitur

**Beranda dan konten**
- **Post** foto (1 sampai 4 foto) dan **Connex** (tulisan singkat, maksimal 500 karakter), dengan feed cursor-pagination.
- **Story** foto yang hilang otomatis setelah 24 jam, tampil sebagai baris lingkaran yang bisa digeser.
- Suka, komentar, bagikan post ke Pesan, dan Pencarian orang atau post.

**Sosial**
- Ikuti akun lain, daftar pengikut dan mengikuti, serta "Disarankan untuk Anda".
- **Pesan** satu lawan satu (teks, bagikan post, tanda dibaca), dan **Notifikasi** dengan lencana angka.

**Laporan Kegiatan**
- Dibuat Peserta (judul, tanggal, lokasi, uraian, 1 sampai 4 foto). Hanya terlihat oleh penulis dan Koordinator, tidak muncul di Beranda.
- Koordinator menyetujui atau menolak (dengan alasan). Laporan yang disetujui bisa diunduh sebagai **PDF**.

**Moderasi**
- Verifikasi pendaftaran Peserta dan Koordinator, blokir pengguna, hapus konten dengan alasan, dan **log moderasi**.
- Penahanan otomatis konten yang mengandung kata terlarang (daftar bisa disunting) dan tombol **Laporkan**. Konten ditahan masuk antrean untuk dipulihkan atau dihapus Koordinator.

**Akun**
- Informasi Akun: foto profil, nama, username, password, dan data PT. Keluar dengan konfirmasi dan hapus akun permanen.
- Halaman Tentang Sistem dan Kebijakan Privasi.

## Jenis akun

| Peran | Kemampuan |
|---|---|
| **Umum** | Membaca, membuat Post/Connex/Story, suka, komentar, berkirim Pesan dengan Peserta dan Umum. Pesan dari Koordinator hanya bisa dibaca. |
| **Peserta** | Semua hak Umum, berkirim Pesan ke semua jenis akun, dan membuat Laporan Kegiatan. |
| **Koordinator** | Berkirim Pesan ke siapa saja, memverifikasi pendaftaran, menyetujui atau menolak laporan, menghapus konten dengan alasan, dan memblokir akun. |

Pendaftaran Peserta dan Koordinator diverifikasi Koordinator. Selama menunggu, akun berjalan sebagai Umum.

## Teknologi

- **Next.js 16** (App Router, Server Actions, Route Handlers), **React 19**, **TypeScript**
- **Tailwind CSS 4**, shadcn/ui (Radix), lucide-react
- **Better Auth** (sesi cookie httpOnly, login dengan username)
- **Drizzle ORM** + **Neon PostgreSQL**
- **Cloudflare R2** (foto, lewat S3 API) dan **Cloudflare Turnstile** (anti-bot)
- `zod` (validasi), `sharp` dan `pdf-lib` (PDF laporan)
- Hosting: **Vercel** (termasuk Cron harian untuk membersihkan Story)

## Struktur proyek

```
src/
├── app/
│   ├── (app)/          halaman utama: beranda, pencarian, pesan, notifikasi, profil, laporan, moderasi, akun, dll.
│   ├── masuk/ daftar/  autentikasi
│   └── api/            route handler: unggah foto, laporan + PDF, story, cron, notifikasi
├── components/         komponen UI dan komponen aplikasi
├── db/                 skema Drizzle
├── lib/                query, validasi, penyimpanan, aturan bisnis
└── server/             Server Actions
drizzle/                berkas migrasi SQL
```

## Memulai (pengembangan lokal)

### Prasyarat
- Node.js 22 atau lebih baru
- Akun [Neon](https://neon.tech) (database PostgreSQL)
- (Opsional untuk lokal) bucket Cloudflare R2. Tanpa konfigurasi R2, foto disimpan di folder `.penyimpanan/`.

### Langkah

```bash
git clone https://github.com/NAMA-PENGGUNA/NAMA-REPO.git
cd NAMA-REPO
npm install
```

Buat file `.env.local` di akar proyek (tanpa tanda kutip pada nilai):

```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=string-acak-panjang
```

Terapkan migrasi ke database:

```bash
# Linux/macOS
npx drizzle-kit migrate
# Windows (drizzle-kit tidak membaca .env.local sendiri)
node --env-file=.env.local node_modules\drizzle-kit\bin.cjs migrate
```

Jalankan:

```bash
npm run dev
```

Buka `http://localhost:3000`. Cek tipe dan build sebelum commit:

```bash
npx tsc --noEmit
npm run build
```

### Variabel lingkungan

| Variabel | Fungsi |
|---|---|
| `DATABASE_URL` | Koneksi Neon. Produksi memakai koneksi *pooled*; migrasi memakai koneksi *non-pooled*. |
| `BETTER_AUTH_SECRET` | Rahasia Better Auth. Gunakan nilai berbeda untuk lokal dan produksi. |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Penyimpanan foto di R2. Wajib di produksi. |
| `CRON_SECRET` | Melindungi `/api/cron/story`. |
| Kunci Turnstile dan URL dasar Better Auth | Lihat `src/lib/auth.ts` dan komponen Turnstile untuk nama variabelnya. |

Jangan pernah meng-commit file `.env*`.

## Deploy ke Vercel

1. Impor repo di Vercel dan isi variabel lingkungan di atas.
2. Jalankan migrasi ke database produksi **sebelum** push kode yang mengubah skema.
3. Atur **Function Region** ke Singapura bila database Neon berada di Singapura.
4. `vercel.json` sudah memuat Cron harian untuk membersihkan Story kedaluwarsa. Paket Hobby hanya mengizinkan cron sekali sehari.
5. Buat widget Turnstile dengan hostname situs, lalu isi kuncinya.

## Batasan paket gratis

- Badan permintaan fungsi Vercel Hobby maksimal 4,5 MB, sehingga total foto Post dan Laporan dibatasi 4 MB dan foto Story 1,5 MB (foto dikompres di browser).
- Neon Free tidur saat lama tidak dipakai, jadi permintaan pertama bisa lambat.
- Pembaruan Pesan dan Notifikasi memakai polling berkala, bukan realtime.

## Keamanan

- Sesi memakai cookie httpOnly. Semua input divalidasi di server, dan hak akses diputuskan dari data pengguna di database.
- Teks pengguna dirender sebagai teks biasa. Foto diperiksa dari isi berkas, dan metadata/GPS dihapus lewat kompresi di browser.
- Foto Laporan hanya dilayani ke penulis dan Koordinator.
- Moderasi otomatis hanya memeriksa teks lewat daftar kata dan tidak memeriksa isi foto maupun Pesan pribadi.

Menemukan celah keamanan? Jangan buka issue publik. Hubungi pengelola lewat kontak di profil GitHub.

## Kontribusi

Saran dan perbaikan disambut lewat issue atau pull request. Sebelum mengirim PR, pastikan `npx tsc --noEmit` dan `npm run build` lolos, dan jangan menyertakan rahasia atau data pribadi.

## Lisensi

Kode sumber dirilis di bawah [Lisensi MIT](LICENSE). Nama dan logo "PMM" milik pihak masing-masing dan tidak termasuk dalam lisensi ini.

## Pengembang

**Maulana Farras** ([@Argyaboy20](https://github.com/Argyaboy20))