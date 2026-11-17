import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { ambilSesi } from "@/lib/sesi";
import { daftarJejaring } from "@/lib/jejaring";
import { MAKS_HALAMAN } from "@/lib/pencarian";
import { AvatarInisial } from "@/components/avatar-inisial";
import { RoleBadge } from "@/components/role-badge";
import { TombolIkuti } from "@/components/app/tombol-ikuti";

export const metadata = { title: "Pengikut · PMM Connect" };

const TAB = [
  { kunci: "pengikut", label: "Pengikut" },
  { kunci: "mengikuti", label: "Mengikuti" },
] as const;

export default async function Jejaring({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string; hal?: string }>;
}) {
  const { username } = await params;
  const sp = await searchParams;
  const tab = sp.tab === "mengikuti" ? "mengikuti" : "pengikut";
  const hal = Math.min(MAKS_HALAMAN, Math.max(1, parseInt(sp.hal ?? "1", 10) || 1));

  const [profil] = await db
    .select({ id: user.id, nama: user.name, username: user.username })
    .from(user)
    .where(eq(user.username, username.toLowerCase()))
    .limit(1);
  if (!profil) notFound();

  const sesi = await ambilSesi();
  const { item, adaLagi } = await daftarJejaring(profil.id, tab, hal, sesi?.user.id ?? null);
  const alamat = `/profil/${profil.username}`;
  const dasar = `${alamat}/jejaring`;

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <Link href={alamat} aria-label="Kembali ke profil" className="hover:text-primary p-1">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold">{profil.nama}</h1>
          <p className="text-muted-foreground truncate text-sm">@{profil.username}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 overflow-hidden rounded-xl border">
        {TAB.map(({ kunci, label }) => (
          <Link
            key={kunci}
            href={`${dasar}?tab=${kunci}`}
            scroll={false}
            className={`flex items-center justify-center py-2.5 text-sm font-semibold transition-colors ${
              tab === kunci ? "bg-brand-gradient text-white" : "hover:bg-muted"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {item.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center text-sm">
          <Users className="size-10 opacity-40" />
          <p>{tab === "pengikut" ? "Belum ada pengikut." : "Belum mengikuti siapa pun."}</p>
        </div>
      ) : (
        item.map((o) => (
          <div key={o.id} className="flex items-center gap-3 rounded-2xl border p-4">
            <Link href={`/profil/${o.username}`} className="flex min-w-0 flex-1 items-center gap-3">
              <AvatarInisial nama={o.nama} foto={o.foto} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="truncate font-semibold">{o.nama}</span>
                  <RoleBadge role={o.role ?? "UMUM"} />
                </div>
                <span className="text-muted-foreground truncate text-sm">@{o.username}</span>
              </div>
            </Link>
            {o.id !== sesi?.user.id && (
              <TombolIkuti
                key={`${o.id}:${o.sayaMengikuti}`}
                targetId={o.id}
                masuk={!!sesi}
                awal={o.sayaMengikuti}
              />
            )}
          </div>
        ))
      )}

      {adaLagi && hal < MAKS_HALAMAN && (
        <div className="flex justify-center">
          <Link
            href={`${dasar}?tab=${tab}&hal=${hal + 1}`}
            scroll={false}
            className="hover:bg-muted rounded-lg border px-5 py-2 text-sm font-semibold"
          >
            Muat lagi
          </Link>
        </div>
      )}
    </div>
  );
}