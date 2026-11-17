import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { ambilSesi } from "@/lib/sesi";
import {
  BATAS_RIWAYAT,
  alasanTidakBoleh,
  ambilPercakapan,
  ambilRiwayat,
  bolehMulai,
} from "@/lib/pesan";
import { AvatarInisial } from "@/components/avatar-inisial";
import { RoleBadge } from "@/components/role-badge";
import { RuangObrolan } from "@/components/app/ruang-obrolan";

export const metadata = { title: "Pesan · PMM Connect" };

export default async function RuangPesan({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const sesi = await ambilSesi();
  if (!sesi) redirect("/masuk");

  const [lawan] = await db
    .select({
      id: user.id,
      nama: user.name,
      username: user.username,
      role: user.role,
      foto: user.image,
      status: user.status,
    })
    .from(user)
    .where(eq(user.username, username.toLowerCase()))
    .limit(1);
  if (!lawan || lawan.status === "DIBLOKIR") notFound();
  if (lawan.id === sesi.user.id) redirect("/pesan");

  const c = await ambilPercakapan(sesi.user.id, lawan.id);
  const riwayat = c ? await ambilRiwayat(c.id, sesi.user.id) : [];

  const roleSaya = sesi.user.role ?? "UMUM";
  const diblokir = sesi.user.status === "DIBLOKIR";
  const boleh = !diblokir && (!!c || bolehMulai(roleSaya, lawan.role));
  const alasan = diblokir ? "Akunmu sedang diblokir." : alasanTidakBoleh(roleSaya);

  return (
    <div className="-mb-11 space-y-3 lg:mb-0">
      <header className="flex items-center gap-3 border-b pb-3">
        <Link href="/pesan" aria-label="Kembali ke daftar pesan" className="hover:text-primary p-1">
          <ArrowLeft className="size-5" />
        </Link>
        <Link href={`/profil/${lawan.username}`} className="flex min-w-0 items-center gap-3">
          <AvatarInisial nama={lawan.nama} foto={lawan.foto} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold">{lawan.nama}</span>
              <RoleBadge role={lawan.role} />
            </div>
            <p className="text-muted-foreground truncate text-sm">@{lawan.username}</p>
          </div>
        </Link>
      </header>

      <RuangObrolan
        key={lawan.id}
        targetId={lawan.id}
        awal={riwayat}
        adaLagiAwal={riwayat.length >= BATAS_RIWAYAT}
        bolehKirim={boleh}
        alasan={alasan}
      />
    </div>
  );
}