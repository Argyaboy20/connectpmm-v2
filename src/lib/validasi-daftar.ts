import { z } from "zod";

const teks = (maks: number) =>
  z.string().trim().min(1, "Wajib diisi.").max(maks, "Terlalu panjang.");

const kode = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9.\-/]{5,30}$/, "Format NIM/NIDN tidak valid.");

export const skemaDaftar = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100, "Nama maksimal 100 karakter."),
    email: z.email("Email tidak valid.").max(254, "Email terlalu panjang."),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter.")
      .max(128, "Password terlalu panjang.")
      .regex(/[A-Z]/, "Password harus memuat huruf kapital.")
      .regex(/[a-z]/, "Password harus memuat huruf kecil.")
      .regex(/[0-9]/, "Password harus memuat angka."),
    roleDiminta: z.enum(["PESERTA", "KOORDINATOR"]).optional(),
    nim: kode.optional(),
    nidn: kode.optional(),
    ptPengirim: teks(150).optional(),
    ptPenerima: teks(150).optional(),
    statusKoordinator: z.enum(["PENGIRIM", "PENERIMA"]).optional(),
  })
  .superRefine((d, ctx) => {
    const salah = (message: string) => ctx.addIssue({ code: "custom", message });

    if (!d.roleDiminta) {
      if (d.nim || d.nidn || d.ptPengirim || d.ptPenerima || d.statusKoordinator) {
        salah("Data Peserta/Koordinator tidak boleh dikirim untuk akun Umum.");
      }
      return;
    }

    if (d.roleDiminta === "PESERTA") {
      if (!d.nim) salah("NIM wajib diisi.");
      if (!d.ptPengirim) salah("PT Pengirim wajib diisi.");
      if (!d.ptPenerima) salah("PT Penerima wajib diisi.");
      if (d.nidn || d.statusKoordinator) salah("Data Koordinator tidak boleh dikirim untuk Peserta.");
      return;
    }

    if (!d.nidn) salah("NIDN wajib diisi.");
    if (!d.statusKoordinator) salah("Status wajib dipilih.");
    if (d.nim) salah("NIM tidak boleh dikirim untuk Koordinator.");
    const pt = d.statusKoordinator === "PENGIRIM" ? d.ptPengirim : d.ptPenerima;
    const lain = d.statusKoordinator === "PENGIRIM" ? d.ptPenerima : d.ptPengirim;
    if (!pt) salah("PT wajib diisi.");
    if (lain) salah("Hanya satu PT yang boleh diisi untuk Koordinator.");
  });