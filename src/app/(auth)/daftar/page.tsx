import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { perguruanTinggi } from "@/db/schema";
import { FormDaftar } from "./form-daftar";

export const metadata = { title: "Daftar · PMM Connect" };

export default async function HalamanDaftar() {
  const sesi = await auth.api.getSession({ headers: await headers() });
  if (sesi) redirect("/");

  const daftarPt = await db
    .select({ nama: perguruanTinggi.nama })
    .from(perguruanTinggi)
    .orderBy(asc(perguruanTinggi.nama));

  return <FormDaftar daftarPt={daftarPt.map((p) => p.nama)} />;
}