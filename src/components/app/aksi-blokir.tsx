"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { BATAS_ALASAN, MIN_ALASAN } from "@/lib/batas";
import { blokirPengguna, bukaBlokirPengguna } from "@/server/pengguna";

type Props = { id: string; nama: string; diblokir: boolean };

export function AksiBlokir({ id, nama, diblokir }: Props) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [alasan, setAlasan] = useState("");
  const [pesan, setPesan] = useState("");
  const [proses, mulai] = useTransition();

  const alasanKurang = alasan.trim().length < MIN_ALASAN;
  const label = diblokir ? "Buka blokir" : "Blokir";

  function konfirmasi() {
    setPesan("");
    mulai(async () => {
      try {
        const h = diblokir ? await bukaBlokirPengguna(id, alasan) : await blokirPengguna(id, alasan);
        if (!h.ok) {
          setPesan(h.pesan);
          return;
        }
        dialog.current?.close();
        router.refresh();
      } catch {
        setPesan("Gagal. Coba lagi.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPesan("");
          setAlasan("");
          dialog.current?.showModal();
        }}
        className={`shrink-0 self-start rounded-lg border px-3 py-1.5 text-sm font-semibold ${
          diblokir ? "hover:bg-muted" : "text-destructive hover:bg-muted"
        }`}
      >
        {label}
      </button>

      <dialog
        ref={dialog}
        className="bg-background text-foreground m-auto w-[min(90vw,26rem)] rounded-2xl border p-6 shadow-lg backdrop:bg-black/50"
      >
        <h2 className="text-lg font-bold">
          {diblokir ? "Buka blokir" : "Blokir"} {nama}?
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {diblokir
            ? "Akun ini akan bisa memposting, menyukai, dan berkomentar lagi."
            : "Akun ini tetap bisa masuk dan membaca, tapi tidak bisa memposting, menyukai, atau berkomentar."}{" "}
          Tindakan ini tercatat di log moderasi.
        </p>
        <label htmlFor={`blokir-${id}`} className="mt-4 block text-sm font-semibold">
          Alasan
        </label>
        <textarea
          id={`blokir-${id}`}
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          maxLength={BATAS_ALASAN}
          rows={3}
          placeholder={diblokir ? "Contoh: sudah dibina" : "Contoh: spam berulang"}
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
            onClick={konfirmasi}
            disabled={proses || alasanKurang}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
              diblokir ? "bg-brand-gradient" : "bg-destructive"
            }`}
          >
            {proses && <Loader2 className="size-4 animate-spin" />}
            {label}
          </button>
        </div>
      </dialog>
    </>
  );
}