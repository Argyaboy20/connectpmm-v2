import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail } from "lucide-react";
import { ambilSesi } from "@/lib/sesi";
import { daftarPercakapan } from "@/lib/pesan";
import { waktuRingkas } from "@/lib/waktu";
import { AvatarInisial } from "@/components/avatar-inisial";
import { RoleBadge } from "@/components/role-badge";

export const metadata = { title: "Pesan · PMM Connect" };

export default async function DaftarPesan() {
  const sesi = await ambilSesi();
  if (!sesi) redirect("/masuk");

  const daftar = await daftarPercakapan(sesi.user.id);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Pesan</h1>

      {daftar.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center text-sm">
          <Mail className="size-10 opacity-40" />
          <p>Belum ada percakapan.</p>
          <p>Mulai dari profil seseorang lewat tombol Pesan.</p>
        </div>
      ) : (
        daftar.map((p) => (
          <Link
            key={p.id}
            href={`/pesan/${p.username}`}
            className="hover:bg-muted flex items-center gap-3 rounded-2xl border p-4 transition-colors"
          >
            <AvatarInisial nama={p.nama} foto={p.foto} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold">{p.nama}</span>
                <RoleBadge role={p.role ?? "UMUM"} />
                <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                  {waktuRingkas(p.waktu)}
                </span>
              </div>
              <p
                className={`truncate text-sm ${
                  p.belumDibaca > 0 ? "font-semibold" : "text-muted-foreground"
                }`}
              >
                {p.dariSaya && "Kamu: "}
                {p.cuplikan}
              </p>
            </div>
            {p.belumDibaca > 0 && (
              <span aria-label="Belum dibaca" className="bg-primary size-2.5 shrink-0 rounded-full" />
            )}
          </Link>
        ))
      )}
    </div>
  );
}