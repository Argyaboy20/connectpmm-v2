import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { captcha, username } from "better-auth/plugins";
import { db } from "../db";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { skemaDaftar } from "./validasi-daftar";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "UMUM", input: false },
      roleDiminta: { type: "string", required: false },
      status: { type: "string", required: false, defaultValue: "AKTIF", input: false },
      nim: { type: "string", required: false },
      nidn: { type: "string", required: false },
      ptPengirim: { type: "string", required: false },
      ptPenerima: { type: "string", required: false },
      statusKoordinator: { type: "string", required: false },
      bio: { type: "string", required: false },
      disetujuiOleh: { type: "string", required: false, input: false },
      disetujuiPada: { type: "date", required: false, input: false },
      roleDitolak: { type: "string", required: false, input: false },
      alasanPenolakan: { type: "string", required: false, input: false },
    },
  },
  plugins: [
    username(),
    captcha({
      provider: "cloudflare-turnstile",
      // Kalau kunci belum diatur, dipakai nilai palsu yang pasti ditolak Cloudflare:
      // semua daftar dan masuk gagal (aman), dan build tidak error.
      secretKey: process.env.TURNSTILE_SECRET_KEY ?? "kunci-belum-diatur",
      endpoints: ["/sign-up/email", "/sign-in/email", "/sign-in/username"],
    }),
    nextCookies(),
  ],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const hasil = skemaDaftar.safeParse(ctx.body);
      if (!hasil.success) {
        throw new APIError("BAD_REQUEST", {
          message: hasil.error.issues[0]?.message ?? "Data pendaftaran tidak valid.",
        });
      }
    }),
  },
});