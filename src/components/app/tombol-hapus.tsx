"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { hapusKomentar, hapusPost } from "@/server/hapus";

type Props = { jenis: "post" | "connex" | "komentar"; id: string; keBeranda?: boolean };

const NAMA = { post: "post", connex: "Connex", komentar: "komentar" } as const;

const KETERANGAN = {
  post: "Post ini akan dihapus dan tidak bisa dikembalikan. Foto di dalamnya ikut terhapus permanen.",
  connex: "Connex ini akan dihapus dan tidak bisa dikembalikan.",
  komentar: "Komentar ini akan dihapus dan tidak bisa dikembalikan.",
} as const;

export function TombolHapus({ jenis, id, keBeranda = false }: Props) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pesan, setPesan] = useState("");
  const [proses, mulai] = useTransition();

  function konfirmasi() {
    setPesan("");
    mulai(async () => {
      try {
        const hasil = jenis === "komentar" ? await hapusKomentar(id) : await hapusPost(id);
        if (!hasil.ok) {
          setPesan(hasil.pesan);
          return;
        }
        dialog.current?.close();
        if (keBeranda) router.push("/");
        else router.refresh();
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
        aria-label={`Hapus ${NAMA[jenis]}`}
        className="text-muted-foreground hover:text-destructive self-start rounded-full p-1.5"
      >
        <Trash2 className="size-4" />
      </button>

      <dialog
        ref={dialog}
        className="bg-background text-foreground m-auto w-[min(90vw,24rem)] rounded-2xl border p-6 shadow-lg backdrop:bg-black/50"
      >
        <h2 className="text-lg font-bold">Hapus {NAMA[jenis]}?</h2>
        <p className="text-muted-foreground mt-2 text-sm">{KETERANGAN[jenis]}</p>
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
            disabled={proses}
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