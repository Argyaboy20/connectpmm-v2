import { redirect } from "next/navigation";
import { ambilSesi } from "@/lib/sesi";

export default async function ProfilSaya() {
  const sesi = await ambilSesi();
  if (!sesi) redirect("/masuk");
  if (!sesi.user.username) redirect("/");
  redirect(`/profil/${sesi.user.username}`);
}