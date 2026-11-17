"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Send, Trash2 } from "lucide-react";
import { BATAS_PESAN } from "@/lib/batas";
import { waktuJam, waktuTanggal } from "@/lib/waktu";
import { hapusPesan, kirimPesan, muatPesan } from "@/server/pesan";
import type { DataPesan } from "@/lib/pesan";

export function RuangObrolan({
  targetId,
  awal,
  bolehKirim,
  alasan,
}: {
  targetId: string;
  awal: DataPesan[];
  bolehKirim: boolean;
  alasan: string;
}) {
  const [item, setItem] = useState(awal);
  const [isi, setIsi] = useState("");
  const [galat, setGalat] = useState("");
  const [proses, mulai] = useTransition();
  const akhirRef = useRef<HTMLDivElement>(null);

  const muat = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const h = await muatPesan(targetId);
      if (!h.ok) return;
      setItem(h.item);
      if (h.baruDibaca > 0) window.dispatchEvent(new Event("notifikasi-berubah"));
    } catch {}
  }, [targetId]);

  useEffect(() => {
    muat();
    const timer = setInterval(muat, 5000);
    document.addEventListener("visibilitychange", muat);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", muat);
    };
  }, [muat]);

  const idAkhir = item[item.length - 1]?.id;
  useEffect(() => {
    akhirRef.current?.scrollIntoView({ block: "end" });
  }, [idAkhir]);

  const kosong = isi.trim().length === 0;
  const sisa = BATAS_PESAN - isi.length;

  function kirim() {
    if (kosong || proses) return;
    setGalat("");
    mulai(async () => {
      const h = await kirimPesan(targetId, isi);
      if (!h.ok) {
        setGalat(h.pesan);
        return;
      }
      setIsi("");
      await muat();
    });
  }

  function hapus(id: string) {
    if (!window.confirm("Hapus pesan ini?")) return;
    setGalat("");
    mulai(async () => {
      const h = await hapusPesan(id);
      if (!h.ok) setGalat(h.pesan);
      await muat();
    });
  }

  return (
    <div>
      <div className="space-y-1.5 pb-4">
        {item.length === 0 && (
          <p className="text-muted-foreground py-12 text-center text-sm">
            Belum ada pesan. Tulis pesan pertamamu.
          </p>
        )}
        {item.map((m, i) => {
          const tanggal = waktuTanggal(new Date(m.dibuat));
          const hariBaru = i === 0 || tanggal !== waktuTanggal(new Date(item[i - 1].dibuat));
          const kelas = m.dihapus
            ? "border border-dashed text-muted-foreground"
            : m.dariSaya
              ? "bg-brand-gradient text-white"
              : "bg-muted";
          const warnaJam = m.dihapus || !m.dariSaya ? "text-muted-foreground" : "text-white/80";
          return (
            <div key={m.id}>
              {hariBaru && (
                <p className="text-muted-foreground my-3 text-center text-xs">{tanggal}</p>
              )}
              <div className={`flex items-end gap-1 ${m.dariSaya ? "justify-end" : "justify-start"}`}>
                {m.dariSaya && !m.dihapus && (
                  <button
                    type="button"
                    onClick={() => hapus(m.id)}
                    aria-label="Hapus pesan"
                    className="text-muted-foreground hover:text-destructive p-1 opacity-60"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${kelas}`}>
                  {m.dihapus ? (
                    <p className="text-sm italic">Pesan dihapus</p>
                  ) : (
                    <p className="text-[15px] leading-snug break-words whitespace-pre-wrap">{m.isi}</p>
                  )}
                  <p className={`mt-1 text-right text-[10px] ${warnaJam}`}>
                    {waktuJam(new Date(m.dibuat))}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={akhirRef} className="scroll-mb-40" />
      </div>

      <div className="bg-background sticky bottom-[calc(49px+env(safe-area-inset-bottom))] border-t py-3 lg:bottom-0">
        {bolehKirim ? (
          <>
            {galat && (
              <p role="alert" className="text-destructive mb-2 text-sm">
                {galat}
              </p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={isi}
                onChange={(e) => setIsi(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    window.matchMedia("(pointer: fine)").matches
                  ) {
                    e.preventDefault();
                    kirim();
                  }
                }}
                maxLength={BATAS_PESAN}
                rows={2}
                placeholder="Tulis pesan"
                aria-label="Tulis pesan"
                className="placeholder:text-muted-foreground min-h-12 flex-1 resize-none rounded-lg border bg-transparent px-3 py-2 text-[15px] outline-none"
              />
              <button
                type="button"
                onClick={kirim}
                disabled={kosong || proses}
                aria-label="Kirim"
                className="bg-brand-gradient flex size-11 shrink-0 items-center justify-center rounded-lg text-white disabled:opacity-50"
              >
                {proses ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
              </button>
            </div>
            {sisa <= 100 && (
              <p className={`mt-1 text-right text-xs ${sisa <= 20 ? "text-amber-600" : "text-muted-foreground"}`}>
                {sisa}
              </p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-center text-sm">{alasan}</p>
        )}
      </div>
    </div>
  );
}