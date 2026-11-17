"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Trash2 } from "lucide-react";
import { BATAS_ALASAN, MIN_ALASAN } from "@/lib/batas";
import { hapusTahanan, pulihkanKonten } from "@/server/tahanan";

export function AksiTahanan({ jenis, id }: { jenis: "POST" | "KOMENTAR"; id: string }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [alasan, setAlasan] = useState("");
  const [pesan, setPesan] = useState("");
  const [proses, mulai] = useTransition();

  function pulihkan() {
    setPesan("");
    mulai(async () => {
      try {
        const h = await pulihkanKonten(jenis, id);
        if (!h.ok) setPesan(h.pesan);
        else {
          window.dispatchEvent(new Event("notifikasi-berubah"));
          router.refresh();
        }
      } catch {
        setPesan("Gagal. Coba lagi.");
      }
    });
  }

  function hapus() {
    setPesan("");
    mulai(async () => {
      try {
        const h = await hapusTahanan(jenis, id, alasan);
        if (!h.ok) {
          setPesan(h.pesan);
          return;
        }
        dialog.current?.close();
        window.dispatchEvent(new Event("notifikasi-berubah"));
        router.refresh();
      } catch {
        setPesan("Gagal. Coba lagi.");
      }
    });
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
        <button
          type="button"
          onClick={pulihkan}
          disabled={proses}
          className="bg-brand-gradient inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {proses ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Pulihkan
        </button>
        <button
          type="button"
          onClick={() => {
            setAlasan("");
            setPesan("");
            dialog.current?.showModal();
          }}
          disabled={proses}
          className="text-destructive hover:bg-muted inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-sm font-semibold disabled:opacity-50"
        >
          <Trash2 className="size-4" />
          Hapus
        </button>
      </div>
      {pesan && (
        <p role="alert" className="text-destructive mt-2 text-sm">
          {pesan}
        </p>
      )}

      <dialog
        ref={dialog}
        className="bg-background text-foreground m-auto w-[min(90vw,24rem)] rounded-2xl border p-6 shadow-lg backdrop:bg-black/50"
      >
        <h2 className="text-lg font-bold">Hapus permanen?</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Konten ini dihapus dan tidak bisa dikembalikan. Foto di dalamnya ikut terhapus. Tindakan tercatat di
          log moderasi.
        </p>
        <label htmlFor={`hapus-${id}`} className="mt-4 block text-sm font-semibold">
          Alasan penghapusan
        </label>
        <textarea
          id={`hapus-${id}`}
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          maxLength={BATAS_ALASAN}
          rows={3}
          className="mt-1 w-full resize-none rounded-lg border bg-transparent p-2 text-sm outline-none"
        />
        <p className="text-muted-foreground mt-1 text-right text-xs">{BATAS_ALASAN - alasan.length}</p>
        {pesan && (
          <p role="alert" className="text-destructive mt-2 text-sm">
            {pesan}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
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
            onClick={hapus}
            disabled={proses || alasan.trim().length < MIN_ALASAN}
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