"use client";

import { createContext, useContext, useEffect, useState } from "react";

const Konteks = createContext(0);

export const useJumlahNotifikasi = () => useContext(Konteks);

export function NotifikasiProvider({
  awal,
  masuk,
  children,
}: {
  awal: number;
  masuk: boolean;
  children: React.ReactNode;
}) {
  const [jumlah, setJumlah] = useState(awal);

  useEffect(() => setJumlah(awal), [awal]);

  useEffect(() => {
    if (!masuk) return;
    let batal = false;

    async function muat() {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch("/api/notifikasi/jumlah", { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        if (!batal && typeof d.jumlah === "number") setJumlah(d.jumlah);
      } catch {}
    }

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

  return <Konteks.Provider value={masuk ? jumlah : 0}>{children}</Konteks.Provider>;
}