import { z } from "zod";
import { BATAS_KOMENTAR } from "./batas";

export const skemaKomentar = z
  .string("Komentar tidak valid.")
  .trim()
  .min(1, "Tulis sesuatu dulu.")
  .max(BATAS_KOMENTAR, `Maksimal ${BATAS_KOMENTAR} karakter.`);