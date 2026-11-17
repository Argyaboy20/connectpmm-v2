"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ubahNama } from "@/server/akun";

export function FormNama({ awal }: { awal: string }) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [nilai, setNilai] = useState(awal);
  const [pesan, setPesan] = useState("");
  const [proses, mulai] = useTransition();

  function simpan() {
    setPesan("");
    mulai(async () => {
      const h = await ubahNama(nilai);
      if (h.ok) {
        setBuka(false);
        router.refresh();
      } else setPesan(h.pesan);
    });
  }

  if (!buka) {
    return (
      <button
        type="button"
        onClick={() => setBuka(true)}
        className="hover:bg-muted inline-flex h-8 items-center rounded-lg border px-3 text-xs font-semibold"
      >
        Ubah nama
      </button>
    );
  }

  return (
    <div className="w-full space-y-2">
      <input
        value={nilai}
        onChange={(e) => setNilai(e.target.value)}
        maxLength={100}
        aria-label="Nama lengkap"
        className="h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none"
      />
      {pesan && (
        <p role="alert" className="text-destructive text-sm">
          {pesan}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setNilai(awal);
            setPesan("");
            setBuka(false);
          }}
          disabled={proses}
          className="hover:bg-muted h-9 rounded-lg border px-4 text-sm font-semibold"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={simpan}
          disabled={proses || nilai.trim() === awal}
          className="bg-brand-gradient inline-flex h-9 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {proses && <Loader2 className="size-4 animate-spin" />}
          Simpan
        </button>
      </div>
    </div>
  );
}