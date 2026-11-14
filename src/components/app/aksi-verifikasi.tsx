"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { BATAS_ALASAN, MIN_ALASAN } from "@/lib/batas";
import { setujuiPemohon, tolakPemohon } from "@/server/verifikasi";

type Props = { id: string; nama: string; roleDiminta: "PESERTA" | "KOORDINATOR" };

export function AksiVerifikasi({ id, nama, roleDiminta }: Props) {
  const router = useRouter();
  const dialogSetuju = useRef<HTMLDialogElement>(null);
  const dialogTolak = useRef<HTMLDialogElement>(null);
  const [alasan, setAlasan] = useState("");
  const [paham, setPaham] = useState(false);
  const [pesan, setPesan] = useState("");
  const [proses, mulai] = useTransition();

  const koordinator = roleDiminta === "KOORDINATOR";
  const label = koordinator ? "Koordinator" : "Peserta";
  const alasanKurang = alasan.trim().length < MIN_ALASAN;

  function setuju() {
    setPesan("");
    mulai(async () => {
      try {
        const h = await setujuiPemohon(id, koordinator ? paham : undefined);
        if (!h.ok) {
          setPesan(h.pesan);
          return;
        }
        dialogSetuju.current?.close();
        router.refresh();
      } catch {
        setPesan("Gagal. Coba lagi.");
      }
    });
  }

  function tolak() {
    setPesan("");
    mulai(async () => {
      try {
        const h = await tolakPemohon(id, alasan);
        if (!h.ok) {
          setPesan(h.pesan);
          return;
        }
        dialogTolak.current?.close();
        router.refresh();
      } catch {
        setPesan("Gagal. Coba lagi.");
      }
    });
  }

  const kelasDialog =
    "bg-background text-foreground m-auto w-[min(90vw,26rem)] rounded-2xl border p-6 shadow-lg backdrop:bg-black/50";

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setPesan("");
            setPaham(false);
            dialogSetuju.current?.showModal();
          }}
          className="bg-brand-gradient inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
        >
          <Check className="size-4" />
          Setujui
        </button>
        <button
          type="button"
          onClick={() => {
            setPesan("");
            setAlasan("");
            dialogTolak.current?.showModal();
          }}
          className="hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold"
        >
          <X className="size-4" />
          Tolak
        </button>
      </div>

      <dialog ref={dialogSetuju} className={kelasDialog}>
        <h2 className="text-lg font-bold">Setujui sebagai {label}?</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {nama} akan menjadi {label}. Tindakan ini tercatat di log moderasi.
        </p>
        {koordinator && (
          <label className="mt-4 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={paham}
              onChange={(e) => setPaham(e.target.checked)}
              className="mt-1"
            />
            <span>
              Saya paham bahwa Koordinator dapat menghapus konten dan memblokir akun, dan sudah memeriksa
              data pemohon.
            </span>
          </label>
        )}
        {pesan && (
          <p role="alert" className="text-destructive mt-3 text-sm">
            {pesan}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => dialogSetuju.current?.close()}
            disabled={proses}
            className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={setuju}
            disabled={proses || (koordinator && !paham)}
            className="bg-brand-gradient inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {proses && <Loader2 className="size-4 animate-spin" />}
            Setujui
          </button>
        </div>
      </dialog>

      <dialog ref={dialogTolak} className={kelasDialog}>
        <h2 className="text-lg font-bold">Tolak permohonan {label}?</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {nama} tetap sebagai Umum. Alasanmu akan ditampilkan kepadanya di banner.
        </p>
        <label htmlFor={`tolak-${id}`} className="mt-4 block text-sm font-semibold">
          Alasan penolakan
        </label>
        <textarea
          id={`tolak-${id}`}
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          maxLength={BATAS_ALASAN}
          rows={3}
          placeholder="Contoh: data NIM tidak cocok"
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
            onClick={() => dialogTolak.current?.close()}
            disabled={proses}
            className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={tolak}
            disabled={proses || alasanKurang}
            className="bg-destructive inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {proses && <Loader2 className="size-4 animate-spin" />}
            Tolak
          </button>
        </div>
      </dialog>
    </>
  );
}