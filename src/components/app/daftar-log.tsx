"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, ScrollText } from "lucide-react";
import { waktuLengkap } from "@/lib/waktu";
import { muatLog } from "@/server/log";
import type { ItemLog, OrangLog } from "@/lib/log";

const PERAN: Record<string, string> = { PESERTA: "Peserta", KOORDINATOR: "Koordinator" };
const BAHAYA = new Set([
  "HAPUS_POST",
  "HAPUS_KOMENTAR",
  "HAPUS_LAPORAN",
  "TOLAK_LAPORAN",
  "TOLAK_PEMOHON",
  "BLOKIR_PENGGUNA",
]);

function sebut(o: OrangLog | null) {
  if (!o) return "akun yang sudah dihapus";
  return o.username ? `${o.nama} (@${o.username})` : o.nama;
}

function uraikan(i: ItemLog): { badge: string; kalimat: string } {
  const peran = i.role ? (PERAN[i.role] ?? i.role) : "peran yang diminta";
  switch (i.aksi) {
    case "HAPUS_POST": {
      const jenis = i.sasaranTipe === "CONNEX" ? "Connex" : "post";
      return { badge: `Hapus ${jenis}`, kalimat: `menghapus ${jenis} milik ${sebut(i.sasaran)}` };
    }
    case "HAPUS_KOMENTAR":
      return { badge: "Hapus komentar", kalimat: `menghapus komentar milik ${sebut(i.sasaran)}` };
    case "SETUJUI_PEMOHON":
      return { badge: "Setujui", kalimat: `menyetujui ${sebut(i.sasaran)} sebagai ${peran}` };
    case "TOLAK_PEMOHON":
      return { badge: "Tolak", kalimat: `menolak permohonan ${sebut(i.sasaran)} sebagai ${peran}` };
    case "BLOKIR_PENGGUNA":
      return { badge: "Blokir", kalimat: `memblokir ${sebut(i.sasaran)}` };
    case "BUKA_BLOKIR":
      return { badge: "Buka blokir", kalimat: `membuka blokir ${sebut(i.sasaran)}` };
    case "HAPUS_LAPORAN":
      return { badge: "Hapus laporan", kalimat: `menghapus laporan milik ${sebut(i.sasaran)}` };
    case "SETUJUI_LAPORAN":
      return { badge: "Setujui laporan", kalimat: `menyetujui laporan milik ${sebut(i.sasaran)}` };
    case "TOLAK_LAPORAN":
      return { badge: "Tolak laporan", kalimat: `menolak laporan milik ${sebut(i.sasaran)}` };
    default:
      return { badge: i.aksi, kalimat: `melakukan ${i.aksi}` };
  }
}

type Props = { awal: ItemLog[]; kursorAwal: string | null };

export function DaftarLog({ awal, kursorAwal }: Props) {
  const [item, setItem] = useState(awal);
  const [kursor, setKursor] = useState(kursorAwal);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const kursorRef = useRef(kursorAwal);
  const sibuk = useRef(false);
  const penanda = useRef<HTMLDivElement>(null);

  const muat = useCallback(async () => {
    const k = kursorRef.current;
    if (!k || sibuk.current) return;
    sibuk.current = true;
    setMemuat(true);
    setGalat("");
    try {
      const hasil = await muatLog(k);
      if (!hasil.ok) {
        setGalat(hasil.pesan);
        return;
      }
      setItem((lama) => {
        const ada = new Set(lama.map((x) => x.id));
        return [...lama, ...hasil.item.filter((x) => !ada.has(x.id))];
      });
      kursorRef.current = hasil.kursorBerikut;
      setKursor(hasil.kursorBerikut);
    } catch {
      setGalat("Gagal memuat. Coba lagi.");
    } finally {
      sibuk.current = false;
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    const el = penanda.current;
    if (!el || !kursor || galat) return;
    const pengamat = new IntersectionObserver(
      (e) => {
        if (e[0]?.isIntersecting) void muat();
      },
      { rootMargin: "400px" },
    );
    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, [kursor, galat, item.length, muat]);

  if (item.length === 0 && !kursor) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center text-sm">
        <ScrollText className="size-10 opacity-40" />
        <p>Belum ada aksi moderasi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {item.map((i) => {
        const { badge, kalimat } = uraikan(i);
        return (
          <article key={i.id} data-log={i.id} className="space-y-2 rounded-2xl border p-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  BAHAYA.has(i.aksi) ? "bg-destructive/10 text-destructive" : "bg-muted"
                }`}
              >
                {badge}
              </span>
              <time dateTime={i.dibuatPada.toISOString()} className="text-muted-foreground text-xs">
                {waktuLengkap(i.dibuatPada)}
              </time>
            </div>

            <p className="text-sm break-words">
              <span className={i.aktor ? "font-semibold" : "text-muted-foreground font-semibold italic"}>
                {i.aktor ? i.aktor.nama : "Akun terhapus"}
              </span>{" "}
              {kalimat}
            </p>

            {i.alasan && (
              <p className="text-sm break-words">
                <span className="text-muted-foreground">Alasan: </span>
                {i.alasan}
              </p>
            )}

            {i.cuplikan && (
              <p className="bg-muted/50 text-muted-foreground rounded-lg px-3 py-2 text-sm break-words whitespace-pre-wrap">
                “{i.cuplikan}”
              </p>
            )}
          </article>
        );
      })}

      {kursor && <div ref={penanda} aria-hidden className="h-px" />}

      {memuat && (
        <div className="flex justify-center py-4" role="status" aria-label="Memuat">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        </div>
      )}

      {galat && (
        <div role="alert" className="flex flex-col items-center gap-2 py-4 text-sm">
          <p className="text-destructive">{galat}</p>
          <button
            type="button"
            onClick={() => void muat()}
            className="rounded-lg border px-4 py-2 font-semibold"
          >
            Coba lagi
          </button>
        </div>
      )}

      {!kursor && item.length > 0 && (
        <p className="text-muted-foreground py-6 text-center text-sm">Kamu sudah sampai di akhir.</p>
      )}
    </div>
  );
}