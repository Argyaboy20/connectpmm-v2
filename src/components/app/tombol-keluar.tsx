"use client";

import { LogOut } from "lucide-react";
import { useKeluar } from "@/lib/use-keluar";

export function TombolKeluar() {
  const keluar = useKeluar();
  return (
    <button
      type="button"
      onClick={keluar}
      className="text-destructive hover:bg-muted inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-sm font-semibold"
    >
      <LogOut className="size-4" />
      Keluar
    </button>
  );
}