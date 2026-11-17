import { z } from "zod";
import { BATAS_PESAN } from "./batas";

export const skemaPesan = z
  .string("Isi tidak valid.")
  .trim()
  .min(1, "Tulis sesuatu dulu.")
  .max(BATAS_PESAN, `Maksimal ${BATAS_PESAN} karakter.`);