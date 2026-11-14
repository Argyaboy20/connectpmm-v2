import { z } from "zod";
import { BATAS_CAPTION } from "./batas";

export const skemaCaption = z
  .string("Keterangan tidak valid.")
  .trim()
  .max(BATAS_CAPTION, `Maksimal ${BATAS_CAPTION} karakter.`);