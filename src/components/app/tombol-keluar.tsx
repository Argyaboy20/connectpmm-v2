"use client";

import { useRef, useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { useKeluar } from "@/lib/use-keluar";

export function TombolKeluar() {
  const keluar = useKeluar();
  const dialog = useRef<HTMLDialogElement>(null);
  const [proses, setProses] = useState(false);

  async function konfirmasi() {
    setProses(true);
    try {
      await keluar();
    } finally {
      setProses(false);
      dialog.current?.close();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="text-destructive hover:bg-muted inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold sm:h-9 sm:gap-2 sm:px-4 sm:text-sm"
      >
        <LogOut className="size-3.5 sm:size-4" />
        Keluar
      </button>

      <dialog
        ref={dialog}
        className="bg-background text-foreground m-auto w-[min(90vw,24rem)] rounded-2xl border p-6 shadow-lg backdrop:bg-black/50"
      >
        <h2 className="text-lg font-bold">Keluar dari akun?</h2>
        <p className="text-muted-foreground mt-2 text-sm">Kamu perlu masuk lagi untuk memakai akunmu.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            disabled={proses}
            className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={konfirmasi}
            disabled={proses}
            className="bg-destructive inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {proses && <Loader2 className="size-4 animate-spin" />}
            Keluar
          </button>
        </div>
      </dialog>
    </>
  );
}