"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flag, Loader2 } from "lucide-react";
import { ALASAN_LAPOR } from "@/lib/alasan-lapor";
import { laporKonten } from "@/server/lapor";

export function TombolLapor({
  jenis,
  id,
  masuk,
}: {
  jenis: "POST" | "KOMENTAR";
  id: string;
  masuk: boolean;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [alasan, setAlasan] = useState("");
  const [pesan, setPesan] = useState("");
  const [selesai, setSelesai] = useState(false);
  const [proses, mulai] = useTransition();

  function buka() {
    if (!masuk) {
      router.push("/masuk");
      return;
    }
    setAlasan("");
    setPesan("");
    setSelesai(false);
    dialog.current?.showModal();
  }

  function kirim() {
    setPesan("");
    mulai(async () => {
      try {
        const h = await laporKonten(jenis, id, alasan);
        if (!h.ok) {
          setPesan(h.pesan);
          return;
        }
        setSelesai(true);
        if (h.ditahan) {
          if (jenis === "POST") window.dispatchEvent(new CustomEvent("post-dihapus", { detail: id }));
          router.refresh();
        }
      } catch {
        setPesan("Gagal mengirim laporan. Coba lagi.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={buka}
        aria-label="Laporkan"
        className="text-muted-foreground hover:text-destructive p-1"
      >
        <Flag className="size-4" />
      </button>

      <dialog
        ref={dialog}
        className="bg-background text-foreground m-auto w-[min(90vw,24rem)] rounded-2xl border p-6 shadow-lg backdrop:bg-black/50"
      >
        <h2 className="text-lg font-bold">Laporkan konten</h2>
        {selesai ? (
          <>
            <p className="text-muted-foreground mt-2 text-sm">
              Terima kasih. Laporanmu diterima dan akan ditinjau Koordinator.
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => dialog.current?.close()}
                className="rounded-lg border px-4 py-2 text-sm font-semibold"
              >
                Tutup
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted-foreground mt-2 text-sm">Pilih alasan yang paling sesuai.</p>
            <div className="mt-3 space-y-2">
              {ALASAN_LAPOR.map((a) => (
                <label key={a.kunci} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`alasan-${id}`}
                    checked={alasan === a.kunci}
                    onChange={() => setAlasan(a.kunci)}
                  />
                  {a.label}
                </label>
              ))}
            </div>
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
                onClick={kirim}
                disabled={proses || !alasan}
                className="bg-destructive inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {proses && <Loader2 className="size-4 animate-spin" />}
                Laporkan
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}