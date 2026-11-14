"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { aturSuka } from "@/server/suka";

type Props = { postId: string; masuk: boolean; awalSuka: boolean; awalJumlah: number };

export function TombolSuka({ postId, masuk, awalSuka, awalJumlah }: Props) {
  const [disukai, setDisukai] = useState(awalSuka);
  const [jumlah, setJumlah] = useState(awalJumlah);
  const [galat, setGalat] = useState("");
  const sibuk = useRef(false);

  const isi = (
    <>
      <Heart className={`size-5 ${disukai ? "fill-current" : ""}`} />
      {jumlah > 0 && <span className="text-sm tabular-nums">{jumlah}</span>}
    </>
  );

  if (!masuk) {
    return (
      <Link
        href="/masuk"
        aria-label="Masuk untuk menyukai"
        className="hover:text-foreground flex items-center gap-1.5"
      >
        {isi}
      </Link>
    );
  }

  async function klik() {
    if (sibuk.current) return;
    sibuk.current = true;
    const sebelumSuka = disukai;
    const sebelumJumlah = jumlah;
    const target = !disukai;

    setGalat("");
    setDisukai(target);
    setJumlah(Math.max(0, jumlah + (target ? 1 : -1)));

    try {
      const hasil = await aturSuka(postId, target);
      if (hasil.ok) {
        setDisukai(hasil.disukai);
        setJumlah(hasil.jumlah);
      } else {
        setDisukai(sebelumSuka);
        setJumlah(sebelumJumlah);
        setGalat(hasil.pesan);
      }
    } catch {
      setDisukai(sebelumSuka);
      setJumlah(sebelumJumlah);
      setGalat("Gagal. Coba lagi.");
    } finally {
      sibuk.current = false;
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={klik}
        aria-pressed={disukai}
        aria-label={disukai ? "Batal menyukai" : "Sukai"}
        className={`flex items-center gap-1.5 ${disukai ? "text-red-500" : "hover:text-foreground"}`}
      >
        {isi}
      </button>
      {galat && (
        <span role="alert" className="text-destructive text-xs">
          {galat}
        </span>
      )}
    </div>
  );
}