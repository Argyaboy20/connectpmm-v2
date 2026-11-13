import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { FormMasuk } from "./form-masuk";

export const metadata = { title: "Masuk · PMM Connect" };

export default async function HalamanMasuk() {
  const sesi = await auth.api.getSession({ headers: await headers() });
  if (sesi) redirect("/");
  return <FormMasuk />;
}