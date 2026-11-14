import { z } from "zod";
import { BATAS_CONNEX } from "./batas";

export const skemaConnex = z
  .string("Isi tidak valid.")
  .trim()
  .min(1, "Tulis sesuatu dulu.")
  .max(BATAS_CONNEX, `Maksimal ${BATAS_CONNEX} karakter.`);