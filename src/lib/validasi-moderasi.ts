import { z } from "zod";
import { BATAS_ALASAN, MIN_ALASAN } from "./batas";

export const skemaAlasan = z
  .string("Alasan tidak valid.")
  .trim()
  .min(MIN_ALASAN, `Alasan minimal ${MIN_ALASAN} karakter.`)
  .max(BATAS_ALASAN, `Alasan maksimal ${BATAS_ALASAN} karakter.`);