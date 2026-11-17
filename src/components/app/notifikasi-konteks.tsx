"use client";

import { createContext, useContext, useEffect, useState } from "react";

const KonteksNotifikasi = createContext(0);
const KonteksPesan = createContext(0);

export const useJumlahNotifikasi = () => useContext(KonteksNotifikasi);
export const useJumlahPesan = () => useContext(KonteksPesan);

export function NotifikasiProvider({
  awal,
  awalPesan,
  masuk,
  children,
}: {
  awal: number;
  awalPesan: number;
  masuk: boolean;
  children: React.ReactNode;
}) {
  const [jumlah, setJumlah] = useState(awal);
  const [pesan, setPesan] = useState(awalPesan);

  useEffect(() => setJumlah(awal), [awal]);
  useEffect(() => setPesan(awalPesan), [awalPesan]);

  useEffect(() => {
    if (!masuk) return;
    let batal = false;

    async function muat() {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch("/api/notifikasi/jumlah", { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        if (batal) return;
        if (typeof d.jumlah === "number") setJumlah(d.jumlah);
        if (typeof d.pesan === "number") setPesan(d.pesan);
      } catch {}
    }

    muat();
    const timer = setInterval(muat, 60_000);
    document.addEventListener("visibilitychange", muat);
    window.addEventListener("notifikasi-berubah", muat);
    return () => {
      batal = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", muat);
      window.removeEventListener("notifikasi-berubah", muat);
    };
  }, [masuk]);

  return (
    <KonteksNotifikasi.Provider value={masuk ? jumlah : 0}>
      <KonteksPesan.Provider value={masuk ? pesan : 0}>{children}</KonteksPesan.Provider>
    </KonteksNotifikasi.Provider>
  );
}