import Link from "next/link";
import { Users } from "lucide-react";
import { AvatarInisial } from "@/components/avatar-inisial";
import { RoleBadge } from "@/components/role-badge";
import { FormFoto } from "@/components/app/form-foto";
import { FormUsername } from "@/components/app/form-username";
import type { Pengguna } from "@/lib/pengguna";

export function PanelKanan({ pengguna }: { pengguna: Pengguna | null }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-80 shrink-0 flex-col gap-6 border-l p-6 xl:flex">
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

      <div>
        <p className="text-muted-foreground text-sm font-semibold">Disarankan untuk Anda</p>
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
          <Users className="size-10 opacity-40" />
          Tidak ada saran untuk ditampilkan
        </div>
      </div>
    </aside>
  );
}