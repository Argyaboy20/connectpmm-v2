import { z } from "zod";
import { BATAS_JUDUL_LAPORAN, BATAS_LOKASI_LAPORAN, BATAS_URAIAN_LAPORAN } from "./batas";
import { hariIniWIB } from "./waktu";

function tanggalValid(s: string) {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export const skemaLaporan = z.object({
  judul: z
    .string("Judul tidak valid.")
    .trim()
    .min(1, "Judul kegiatan wajib diisi.")
    .max(BATAS_JUDUL_LAPORAN, `Judul maksimal ${BATAS_JUDUL_LAPORAN} karakter.`),
  tanggal: z
    .string("Tanggal tidak valid.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal kegiatan wajib diisi.")
    .refine(tanggalValid, "Tanggal tidak valid.")
    .refine((s) => s >= "2020-01-01", "Tanggal terlalu lama.")
    .refine((s) => s <= hariIniWIB(), "Tanggal kegiatan tidak boleh di masa depan."),
  lokasi: z
    .string("Lokasi tidak valid.")
    .trim()
    .min(1, "Lokasi wajib diisi.")
    .max(BATAS_LOKASI_LAPORAN, `Lokasi maksimal ${BATAS_LOKASI_LAPORAN} karakter.`),
  uraian: z
    .string("Uraian tidak valid.")
    .trim()
    .min(1, "Uraian kegiatan wajib diisi.")
    .max(BATAS_URAIAN_LAPORAN, `Uraian maksimal ${BATAS_URAIAN_LAPORAN} karakter.`),
});