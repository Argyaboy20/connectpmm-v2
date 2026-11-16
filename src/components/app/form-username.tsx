"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ubahUsername } from "@/server/profil";

export function FormUsername({ awal }: { awal: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [buka, setBuka] = useState(false);
  const [nilai, setNilai] = useState(awal);
  const [pesan, setPesan] = useState("");
  const [proses, mulai] = useTransition();

  function simpan() {
    setPesan("");
    mulai(async () => {
      const hasil = await ubahUsername(nilai);
      if (hasil.ok) {
        setBuka(false);
        if (pathname === `/profil/${awal}`) router.replace(`/profil/${hasil.username}`);
        router.refresh();
      } else {
        setPesan(hasil.pesan);
      }
    });
  }

  function batal() {
    setNilai(awal);
    setPesan("");
    setBuka(false);
  }

  if (!buka) {
    return (
      <button
        type="button"
        onClick={() => setBuka(true)}
        className="hover:bg-muted inline-flex h-9 items-center rounded-lg border px-4 text-sm font-semibold"
      >
        Ubah username
      </button>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center rounded-xl border px-3">
        <span className="text-muted-foreground text-sm">@</span>
        <input
          value={nilai}
          onChange={(e) => setNilai(e.target.value.toLowerCase())}
          maxLength={30}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Username"
          className="h-10 w-full bg-transparent px-1 text-sm outline-none"
        />
      </div>
      <p className="text-muted-foreground text-xs">
        3 sampai 30 karakter: huruf, angka, garis bawah, titik. Hanya bisa diganti sekali per 24 jam.
      </p>
      {pesan && (
        <p role="alert" className="text-destructive text-sm">
          {pesan}
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={batal}
          disabled={proses}
          className="hover:bg-muted h-9 rounded-lg border px-4 text-sm font-semibold"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={simpan}
          disabled={proses}
          className="bg-brand-gradient inline-flex h-9 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {proses && <Loader2 className="size-4 animate-spin" />}
          Simpan
        </button>
      </div>
    </div>
  );
}