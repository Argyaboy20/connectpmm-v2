"use client";

import { LogOut } from "lucide-react";
import { useKeluar } from "@/lib/use-keluar";

export function TombolKeluar() {
  const keluar = useKeluar();
  return (
    <button
      type="button"
      onClick={keluar}
      className="text-destructive hover:bg-muted inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold sm:h-9 sm:gap-2 sm:px-4 sm:text-sm"
    >
      <LogOut className="size-3.5 sm:size-4" />
      Keluar
    </button>
  );
}