"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { MENU_LAINNYA } from "./menu-lainnya";

export function PanelMenu({ buka, tutup }: { buka: boolean; tutup: () => void }) {
  useEffect(() => {
    if (!buka) return;
    const tekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") tutup();
    };
    document.addEventListener("keydown", tekan);
    return () => document.removeEventListener("keydown", tekan);
  }, [buka, tutup]);

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${buka ? "" : "pointer-events-none"}`}
      aria-hidden={!buka}
      inert={!buka}
    >
      <div
        onClick={tutup}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          buka ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-label="Menu"
        className={`bg-background absolute inset-y-0 right-0 flex w-72 max-w-[85%] flex-col border-l shadow-xl transition-transform duration-300 ${
          buka ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="font-bold">Menu</span>
          <button type="button" onClick={tutup} aria-label="Tutup menu" className="hover:bg-muted rounded-full p-2">
            <X className="size-5" />
          </button>
        </div>
        <nav className="space-y-1 p-3">
          {MENU_LAINNYA.map((m) => {
            const Ikon = m.ikon;
            return (
              <Link
                key={m.kunci}
                href={m.href}
                onClick={tutup}
                className="hover:bg-muted flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium"
              >
                <Ikon className="size-5" />
                {m.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}