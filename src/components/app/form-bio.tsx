"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { BATAS_BIO } from "@/lib/batas";
import { ubahBio } from "@/server/profil";

export function FormBio({ awal }: { awal: string }) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [bio, setBio] = useState(awal);
  const [pesan, setPesan] = useState("");
  const [proses, mulai] = useTransition();

  function simpan() {
    setPesan("");
    mulai(async () => {
      const hasil = await ubahBio(bio);
      if (hasil.ok) {
        setBuka(false);
        router.refresh();
      } else {
        setPesan(hasil.pesan);
      }
    });
  }

  function batal() {
    setBio(awal);
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
        Ubah bio
      </button>
    );
  }

  return (
    <div className="w-full space-y-2">
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        maxLength={BATAS_BIO}
        rows={3}
        placeholder="Tulis bio singkat"
        aria-label="Bio"
        className="placeholder:text-muted-foreground w-full resize-none rounded-xl border bg-transparent p-3 text-sm outline-none"
      />
      {pesan && (
        <p role="alert" className="text-destructive text-sm">
          {pesan}
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <span className="text-muted-foreground mr-auto text-xs">{BATAS_BIO - bio.length}</span>
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