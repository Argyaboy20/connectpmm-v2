"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Pengguna } from "@/lib/pengguna";
import { MENU } from "./menu";

const ITEM_HP = ["beranda", "pencarian", "buat", "notifikasi", "profil"];
const ITEM_KOORDINATOR = ["beranda", "pencarian", "buat", "moderasi", "profil"];
const LABEL_HP: Record<string, string> = { buat: "Tambah Foto", profil: "Akun" };

export function MenuBawah({ pengguna }: { pengguna: Pengguna | null }) {
  const pathname = usePathname();
  const kunci = pengguna?.role === "KOORDINATOR" ? ITEM_KOORDINATOR : ITEM_HP;
  const item = kunci.map((k) => MENU.find((m) => m.kunci === k)!);

  return (
    <nav className="bg-background fixed inset-x-0 bottom-0 z-20 flex border-t pb-[env(safe-area-inset-bottom)] lg:hidden">
      {item.map((m) => {
        const Ikon = m.ikon;
        const label = LABEL_HP[m.kunci] ?? m.label;
        const kelas = "flex flex-1 items-center justify-center py-3";
        if (!m.siap) {
          return (
            <div
              key={m.kunci}
              aria-disabled
              aria-label={`${label} (segera)`}
              className={`${kelas} text-muted-foreground/40`}
            >
              <Ikon className="size-6" />
            </div>
          );
        }
        const aktif = m.href === "/" ? pathname === "/" : pathname.startsWith(m.href);
        const tujuan = m.perluLogin && !pengguna ? "/masuk" : m.href;
        return (
          <Link
            key={m.kunci}
            href={tujuan}
            aria-label={label}
            className={`${kelas} ${aktif ? "text-primary" : "text-foreground"}`}
          >
            <Ikon className="size-6" />
          </Link>
        );
      })}
    </nav>
  );
}