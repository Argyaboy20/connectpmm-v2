"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { BATAS_ALASAN, MIN_ALASAN } from "@/lib/batas";
import { hapusLaporan } from "@/server/laporan";

export function TombolHapusLaporan({ id, moderasi = false }: { id: string; moderasi?: boolean }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pesan, setPesan] = useState("");
  const [alasan, setAlasan] = useState("");
  const [proses, mulai] = useTransition();

  const alasanKurang = moderasi && alasan.trim().length < MIN_ALASAN;

  function konfirmasi() {
    setPesan("");
    mulai(async () => {
      try {
        const hasil = await hapusLaporan(id, moderasi ? alasan : undefined);
        if (!hasil.ok) {
          setPesan(hasil.pesan);
          return;
        }
        dialog.current?.close();
        router.refresh();
      } catch {
        setPesan("Gagal menghapus. Coba lagi.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPesan("");
          dialog.current?.showModal();
        }}
        aria-label="Hapus laporan"
        className="text-muted-foreground hover:text-destructive self-start rounded-full p-1.5"
      >
        <Trash2 className="size-4" />
      </button>

      <dialog
        ref={dialog}
        className="bg-background text-foreground m-auto w-[min(90vw,24rem)] rounded-2xl border p-6 shadow-lg backdrop:bg-black/50"
      >
        <h2 className="text-lg font-bold">Hapus laporan?</h2>
        {moderasi && (
          <p className="mt-2 text-sm font-medium">
            Kamu menghapus laporan milik orang lain sebagai Koordinator. Tindakan ini tercatat di log moderasi.
          </p>
        )}
        <p className="text-muted-foreground mt-2 text-sm">
          Laporan ini akan dihapus dan tidak bisa dikembalikan. Foto di dalamnya ikut terhapus permanen.
        </p>

        {moderasi && (
          <div className="mt-4">
            <label htmlFor={`alasan-${id}`} className="text-sm font-semibold">
              Alasan penghapusan
            </label>
            <textarea
              id={`alasan-${id}`}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              maxLength={BATAS_ALASAN}
              rows={3}
              placeholder="Contoh: laporan tidak sesuai kegiatan"
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
            className="bg-destructive inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {proses && <Loader2 className="size-4 animate-spin" />}
            Hapus
          </button>
        </div>
      </dialog>
    </>
  );
}