"use client";

import { useJumlahNotifikasi } from "./notifikasi-konteks";

export function LencanaNotifikasi() {
  const n = useJumlahNotifikasi();
  if (n <= 0) return null;
  return (
    <span
      aria-label={`${n} belum dibaca`}
      className="bg-destructive absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-bold text-white"
    >
      {n > 9 ? "9+" : n}
    </span>
  );
}