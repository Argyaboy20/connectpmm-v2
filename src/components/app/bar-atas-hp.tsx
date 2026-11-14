"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useKeluar } from "@/lib/use-keluar";
import type { Pengguna } from "@/lib/pengguna";

export function BarAtasHp({ pengguna }: { pengguna: Pengguna | null }) {
  const keluar = useKeluar();
  return (
    <header className="bg-background/90 sticky top-0 z-10 -mx-4 mb-4 flex h-14 items-center justify-between border-b px-4 backdrop-blur lg:hidden">
      <div className="flex items-center gap-2">
        <Image src="/logo-pmm.png" alt="PMM Connect" width={28} height={28} />
        <span className="font-bold">PMM Connect</span>
      </div>
      {pengguna ? (
        <button
          type="button"
          onClick={keluar}
          aria-label="Keluar"
          className="text-muted-foreground hover:text-foreground p-2"
        >
          <LogOut className="size-5" />
        </button>
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
  );
}