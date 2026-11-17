"use client";

import { useJumlahNotifikasi, useJumlahPesan } from "./notifikasi-konteks";

export function LencanaNotifikasi({ jenis = "notifikasi" }: { jenis?: string }) {
  const notifikasi = useJumlahNotifikasi();
  const pesan = useJumlahPesan();
  const n = jenis === "pesan" ? pesan : notifikasi;
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