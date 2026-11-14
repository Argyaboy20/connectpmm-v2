"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut, Menu as IkonMenu } from "lucide-react";
import { useKeluar } from "@/lib/use-keluar";
import type { Pengguna } from "@/lib/pengguna";
import { MENU } from "./menu";

export function Sidebar({ pengguna }: { pengguna: Pengguna | null }) {
  const pathname = usePathname();
  const keluar = useKeluar();
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
        {MENU.map((m) => {
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
          const aktif = m.href === "/" ? pathname === "/" : pathname.startsWith(m.href);
          const tujuan = m.perluLogin && !pengguna ? "/masuk" : m.href;
          return (
            <Link
              key={m.kunci}
              href={tujuan}
              title={m.label}
              className={`${kelas} ${aktif ? "bg-brand-gradient text-white" : "hover:bg-muted"}`}
            >
              <Ikon className="size-5 shrink-0" />
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
          <div className="bg-popover absolute bottom-full left-3 mb-2 w-52 rounded-xl border p-1 shadow-lg">
            {pengguna ? (
              <button
                type="button"
                onClick={keluar}
                className="text-destructive hover:bg-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm"
              >
                <LogOut className="size-4" />
                Keluar
              </button>
            ) : (
              <Link
                href="/masuk"
                className="hover:bg-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm"
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