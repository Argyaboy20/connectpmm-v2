import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { db } from "../db";

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
    },
  },
  plugins: [username(), nextCookies()],
});