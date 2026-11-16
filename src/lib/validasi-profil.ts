import { z } from "zod";
import { BATAS_BIO } from "./batas";

export const skemaBio = z
  .string("Isi tidak valid.")
  .trim()
  .max(BATAS_BIO, `Maksimal ${BATAS_BIO} karakter.`);

export const skemaUsername = z
  .string("Isi tidak valid.")
  .trim()
  .toLowerCase()
  .min(3, "Username minimal 3 karakter.")
  .max(30, "Username maksimal 30 karakter.")
  .regex(/^[a-z0-9_.]+$/, "Username hanya boleh huruf, angka, garis bawah, dan titik.");