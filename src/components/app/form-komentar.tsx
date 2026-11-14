"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { AvatarInisial } from "@/components/avatar-inisial";
import { BATAS_KOMENTAR } from "@/lib/batas";
import { buatKomentar } from "@/server/komentar";

export function FormKomentar({ postId, nama }: { postId: string; nama: string }) {
  const [isi, setIsi] = useState("");
  const [pesan, setPesan] = useState("");
  const [proses, mulai] = useTransition();

  const sisa = BATAS_KOMENTAR - isi.length;
  const kosong = isi.trim().length === 0;

  function kirim() {
    setPesan("");
    mulai(async () => {
      const hasil = await buatKomentar(postId, isi);
      if (hasil.ok) setIsi("");
      else setPesan(hasil.pesan);
    });
  }

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex gap-3">
        <AvatarInisial nama={nama} />
        <textarea
          value={isi}
          onChange={(e) => setIsi(e.target.value)}
          maxLength={BATAS_KOMENTAR}
          rows={2}
          placeholder="Tulis komentar..."
          aria-label="Tulis komentar"
          className="placeholder:text-muted-foreground min-h-16 w-full resize-none bg-transparent pt-2 outline-none"
        />
      </div>

      {pesan && (
        <p role="alert" className="text-destructive mt-2 text-sm">
          {pesan}
        </p>
      )}

      <div className="mt-3 flex items-center justify-end gap-3 border-t pt-3">
        <span className={`text-xs ${sisa <= 50 ? "text-amber-600" : "text-muted-foreground"}`}>
          {sisa}
        </span>
        <button
          type="button"
          onClick={kirim}
          disabled={kosong || proses}
          className="bg-brand-gradient inline-flex h-9 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {proses && <Loader2 className="size-4 animate-spin" />}
          Kirim
        </button>
      </div>
    </div>
  );
}