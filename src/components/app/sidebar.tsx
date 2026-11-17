"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Menu as IkonMenu } from "lucide-react";
import type { Pengguna } from "@/lib/pengguna";
import { MENU } from "./menu";
import { LencanaNotifikasi } from "./lencana-notifikasi";
import { menuAktif } from "./menu-aktif";
import { MENU_LAINNYA } from "./menu-lainnya";

export function Sidebar({ pengguna }: { pengguna: Pengguna | null }) {
  const pathname = usePathname();
  const dari = useSearchParams().get("dari");
  const [ringkas, setRingkas] = useState(false);
  const [lainnya, setLainnya] = useState(false);

  const kelas = `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    ringkas ? "justify-center" : ""
  }`;

  return (
    <aside
      className={`bg-background sticky top-0 hidden h-screen shrink-0 flex-col border-r transition-[width] duration-200 lg:flex ${
        ringkas ? "w-[72px]" : "w-64"
      }`}
    >
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <Image src="/logo-pmm.png" alt="PMM Connect" width={32} height={32} />
        {!ringkas && <span className="text-lg font-bold">PMM Connect</span>}
      </div>

      <button
        type="button"
        onClick={() => setRingkas(!ringkas)}
        aria-label={ringkas ? "Perlebar menu" : "Ciutkan menu"}
        className="bg-background text-muted-foreground hover:text-foreground absolute top-20 -right-3 z-10 flex size-6 items-center justify-center rounded-full border"
      >
        {ringkas ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
      </button>

      <nav className="flex-1 space-y-1 p-3">
        {MENU.filter((m) => !m.hanyaKoordinator || pengguna?.role === "KOORDINATOR").map((m) => {
          const Ikon = m.ikon;
          if (!m.siap) {
            return (
              <div
                key={m.kunci}
                title="Segera hadir"
                aria-disabled
                className={`${kelas} text-muted-foreground/60 cursor-not-allowed`}
              >
                <Ikon className="size-5 shrink-0" />
                {!ringkas && (
                  <>
                    <span>{m.label}</span>
                    <span className="bg-muted ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold">
                      Segera
                    </span>
                  </>
                )}
              </div>
            );
          }
          const aktif = menuAktif(m, pathname, dari, pengguna?.username ?? null);
          const tujuan = m.perluLogin && !pengguna ? "/masuk" : m.href;
          return (
            <Link
              key={m.kunci}
              href={tujuan}
              title={m.label}
              className={`${kelas} ${aktif ? "bg-brand-gradient text-white" : "hover:bg-muted"}`}
            >
              <span className="relative inline-flex shrink-0">
                <Ikon className="size-5" />
                {(m.kunci === "notifikasi" || m.kunci === "pesan") && <LencanaNotifikasi jenis={m.kunci} />}
              </span>
              {!ringkas && <span>{m.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="relative border-t p-3">
        <button
          type="button"
          onClick={() => setLainnya(!lainnya)}
          aria-expanded={lainnya}
          className={`${kelas} hover:bg-muted w-full`}
        >
          <IkonMenu className="size-5 shrink-0" />
          {!ringkas && <span>Lainnya</span>}
        </button>
        {lainnya && (
          <div className="bg-popover absolute bottom-full left-3 mb-2 w-56 rounded-xl border p-1 shadow-lg">
            {MENU_LAINNYA.filter((m) => !m.perluLogin || pengguna).map((m) => {
              const Ikon = m.ikon;
              return (
                <Link
                  key={m.kunci}
                  href={m.href}
                  onClick={() => setLainnya(false)}
                  className="hover:bg-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm"
                >
                  <Ikon className="size-4" />
                  {m.label}
                </Link>
              );
            })}
            {!pengguna && (
              <Link
                href="/masuk"
                onClick={() => setLainnya(false)}
                className="hover:bg-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
              >
                Masuk
              </Link>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}