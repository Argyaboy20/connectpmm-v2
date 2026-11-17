"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu as IkonMenu } from "lucide-react";
import type { Pengguna } from "@/lib/pengguna";
import { MENU } from "./menu";
import { LencanaNotifikasi } from "./lencana-notifikasi";
import { menuAktif } from "./menu-aktif";
import { PanelMenu } from "./panel-menu";

const HALAMAN_MENU = ["/tentang", "/privasi"];

export function BarAtasHp({ pengguna }: { pengguna: Pengguna | null }) {
  const pathname = usePathname();
  const dari = useSearchParams().get("dari");
  const [menuBuka, setMenuBuka] = useState(false);

  const kunci = pengguna?.role === "KOORDINATOR" ? ["notifikasi", "pesan"] : ["pesan"];
  const item = kunci.map((k) => MENU.find((m) => m.kunci === k)!);
  const profil = MENU.find((m) => m.kunci === "profil")!;
  const modeMenu =
    !!pengguna &&
    (menuAktif(profil, pathname, dari, pengguna.username ?? null) ||
      HALAMAN_MENU.some((p) => pathname === p || pathname.startsWith(`${p}/`)));

  return (
    <>
      <header className="bg-background/90 sticky top-0 z-10 -mx-4 mb-4 flex h-14 items-center justify-between border-b px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <Image src="/logo-pmm.png" alt="PMM Connect" width={28} height={28} />
          <span className="font-bold">PMM Connect</span>
        </div>
        {pengguna ? (
          modeMenu ? (
            <button
              type="button"
              onClick={() => setMenuBuka(true)}
              aria-label="Buka menu"
              aria-expanded={menuBuka}
              className="hover:text-primary p-2"
            >
              <IkonMenu className="size-5" />
            </button>
          ) : (
            <div className="flex items-center">
              {item.map((m) => {
                const Ikon = m.ikon;
                if (!m.siap) {
                  return (
                    <div
                      key={m.kunci}
                      aria-disabled
                      aria-label={`${m.label} (segera)`}
                      className="text-muted-foreground/40 p-2"
                    >
                      <Ikon className="size-5" />
                    </div>
                  );
                }
                return (
                  <Link
                    key={m.kunci}
                    href={m.href}
                    aria-label={m.label}
                    className="text-foreground hover:text-primary p-2"
                  >
                    <span className="relative inline-flex">
                      <Ikon className="size-5" />
                      {(m.kunci === "notifikasi" || m.kunci === "pesan") && (
                        <LencanaNotifikasi jenis={m.kunci} />
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          )
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/masuk" className="text-primary px-3 py-1.5 text-sm font-semibold">
              Masuk
            </Link>
            <Link
              href="/daftar"
              className="bg-brand-gradient rounded-lg px-3 py-1.5 text-sm font-semibold text-white"
            >
              Daftar
            </Link>
          </div>
        )}
      </header>
      {pengguna && <PanelMenu buka={menuBuka} tutup={() => setMenuBuka(false)} />}
    </>
  );
}