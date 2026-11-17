"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { BATAS_ALASAN, MIN_ALASAN } from "@/lib/batas";
import { putuskanLaporan } from "@/server/laporan";

export function AksiLaporan({ id }: { id: string }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<"setuju" | "tolak">("setuju");
  const [alasan, setAlasan] = useState("");
  const [pesan, setPesan] = useState("");
  const [proses, mulai] = useTransition();

  const setuju = mode === "setuju";
  const alasanKurang = !setuju && alasan.trim().length < MIN_ALASAN;

  function buka(m: "setuju" | "tolak") {
    setMode(m);
    setPesan("");
    setAlasan("");
    dialog.current?.showModal();
  }

  function konfirmasi() {
    setPesan("");
    mulai(async () => {
      try {
        const h = await putuskanLaporan(id, setuju, setuju ? undefined : alasan);
        if (!h.ok) {
          setPesan(h.pesan);
          return;
        }
        dialog.current?.close();
        window.dispatchEvent(new Event("notifikasi-berubah"));
        router.refresh();
      } catch {
        setPesan("Gagal menyimpan keputusan. Coba lagi.");
      }
    });
  }

  return (
    <>
      <div className="mt-4 flex gap-2 border-t pt-3">
        <button
          type="button"
          onClick={() => buka("setuju")}
          className="bg-brand-gradient inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white"
        >
          <Check className="size-4" />
          Setujui
        </button>
        <button
          type="button"
          onClick={() => buka("tolak")}
          className="text-destructive hover:bg-muted inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-sm font-semibold"
        >
          <X className="size-4" />
          Tolak
        </button>
      </div>

      <dialog
        ref={dialog}
        className="bg-background text-foreground m-auto w-[min(90vw,24rem)] rounded-2xl border p-6 shadow-lg backdrop:bg-black/50"
      >
        <h2 className="text-lg font-bold">{setuju ? "Setujui laporan?" : "Tolak laporan?"}</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Keputusan tidak bisa diubah setelah disimpan. Peserta akan mendapat notifikasi.
        </p>

        {!setuju && (
          <div className="mt-4">
            <label htmlFor={`tolak-${id}`} className="text-sm font-semibold">
              Alasan penolakan
            </label>
            <textarea
              id={`tolak-${id}`}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              maxLength={BATAS_ALASAN}
              rows={3}
              placeholder="Contoh: foto dokumentasi tidak sesuai kegiatan"
              className="mt-1 w-full resize-none rounded-lg border bg-transparent p-2 text-sm outline-none"
            />
            <p className="text-muted-foreground mt-1 text-right text-xs">{BATAS_ALASAN - alasan.length}</p>
          </div>
        )}

        {pesan && (
          <p role="alert" className="text-destructive mt-3 text-sm">
            {pesan}
          </p>
        )}
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
            disabled={proses || alasanKurang}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
              setuju ? "bg-brand-gradient" : "bg-destructive"
            }`}
          >
            {proses && <Loader2 className="size-4 animate-spin" />}
            {setuju ? "Setujui" : "Tolak"}
          </button>
        </div>
      </dialog>
    </>
  );
}