import Link from "next/link";
import { AvatarInisial } from "@/components/avatar-inisial";
import { RoleBadge } from "@/components/role-badge";
import { FormFoto } from "@/components/app/form-foto";
import { FormUsername } from "@/components/app/form-username";
import { DaftarSaran } from "@/components/app/daftar-saran";
import { ambilSaran } from "@/lib/saran";
import type { Pengguna } from "@/lib/pengguna";

export async function PanelKanan({ pengguna }: { pengguna: Pengguna | null }) {
  const saran = await ambilSaran(pengguna?.id ?? null, 5);

  return (
    <aside className="sticky top-0 hidden h-screen w-80 shrink-0 flex-col gap-6 overflow-y-auto border-l p-6 xl:flex">
      {pengguna ? (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <FormFoto nama={pengguna.nama} foto={pengguna.foto ?? null} ukuran={48} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{pengguna.nama}</p>
              <p className="text-muted-foreground truncate text-sm">@{pengguna.username}</p>
              <div className="mt-1">
                <RoleBadge role={pengguna.role} />
              </div>
            </div>
          </div>
          {pengguna.username && <FormUsername key={pengguna.username} awal={pengguna.username} />}
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border p-4">
          <p className="font-semibold">Gabung PMM Connect</p>
          <p className="text-muted-foreground text-sm">
            Masuk untuk membuat post, memberi like, dan berkomentar.
          </p>
          <div className="flex gap-2">
            <Link href="/masuk" className="flex-1 rounded-lg border py-2 text-center text-sm font-semibold">
              Masuk
            </Link>
            <Link
              href="/daftar"
              className="bg-brand-gradient flex-1 rounded-lg py-2 text-center text-sm font-semibold text-white"
            >
              Daftar
            </Link>
          </div>
        </div>
      )}

      <DaftarSaran items={saran} masuk={!!pengguna} tata="kolom" />
    </aside>
  );
}