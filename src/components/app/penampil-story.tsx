"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, X } from "lucide-react";
import { AvatarInisial } from "@/components/avatar-inisial";
import { BATAS_ALASAN, MIN_ALASAN } from "@/lib/batas";
import { waktuRingkas } from "@/lib/waktu";
import { hapusStory } from "@/server/story";
import type { GrupStory } from "@/lib/story";

const DURASI_MS = 5000;

export function PenampilStory({
  grup,
  mulai,
  idSaya,
  koordinator,
  tutup,
  saatLihat,
}: {
  grup: GrupStory[];
  mulai: number;
  idSaya: string | null;
  koordinator: boolean;
  tutup: () => void;
  saatLihat: (id: string) => void;
}) {
  const router = useRouter();
  const [gi, setGi] = useState(mulai);
  const [si, setSi] = useState(0);
  const [ulang, setUlang] = useState(0);
  const [siap, setSiap] = useState(false);
  const [galatFoto, setGalatFoto] = useState(false);
  const [hapusBuka, setHapusBuka] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [pesan, setPesan] = useState("");
  const [proses, setProses] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const g = grup[gi];
  const s = g?.stories[si];

  const berikut = useCallback(() => {
    setSiap(false);
    setGalatFoto(false);
    if (si < g.stories.length - 1) setSi(si + 1);
    else if (gi < grup.length - 1) {
      setGi(gi + 1);
      setSi(0);
    } else tutup();
  }, [si, gi, g, grup.length, tutup]);

  const sebelum = useCallback(() => {
    if (si > 0) {
      setSiap(false);
      setGalatFoto(false);
      setSi(si - 1);
    } else if (gi > 0) {
      setSiap(false);
      setGalatFoto(false);
      setGi(gi - 1);
      setSi(grup[gi - 1].stories.length - 1);
    } else {
      setUlang((u) => u + 1);
    }
  }, [si, gi, grup]);

  useEffect(() => {
    if (s) saatLihat(s.id);
  }, [s, saatLihat]);

  // Foto yang sudah ada di cache kadang tidak memicu onLoad.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setSiap(true);
  }, [s?.id]);

  useEffect(() => {
    const asli = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = asli;
    };
  }, []);

  useEffect(() => {
    function tekan(e: KeyboardEvent) {
      if (hapusBuka) return;
      if (e.key === "Escape") tutup();
      else if (e.key === "ArrowRight") berikut();
      else if (e.key === "ArrowLeft") sebelum();
    }
    document.addEventListener("keydown", tekan);
    return () => document.removeEventListener("keydown", tekan);
  }, [hapusBuka, tutup, berikut, sebelum]);

  if (!g || !s) return null;

  const bisaHapus = idSaya === g.userId || koordinator;
  const moderasi = koordinator && idSaya !== g.userId;

  async function konfirmasiHapus() {
    setPesan("");
    setProses(true);
    try {
      const h = await hapusStory(s.id, moderasi ? alasan : undefined);
      if (!h.ok) {
        setPesan(h.pesan);
        setProses(false);
        return;
      }
      tutup();
      router.refresh();
    } catch {
      setPesan("Gagal menghapus. Coba lagi.");
      setProses(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black" role="dialog" aria-label="Story">
      <style>{"@keyframes story-isi{from{width:0}to{width:100%}}"}</style>
      <div className="relative h-full w-full max-w-[480px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`${s.id}-${ulang}`}
          ref={imgRef}
          src={`/api/story-foto/${s.id}`}
          alt="Story"
          onLoad={() => setSiap(true)}
          onError={() => setGalatFoto(true)}
          className="size-full object-contain"
        />

        {!siap && !galatFoto && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <Loader2 className="size-8 animate-spin" />
          </div>
        )}
        {galatFoto && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-white">
            Story tidak tersedia.
          </p>
        )}

        <button
          type="button"
          onClick={sebelum}
          aria-label="Sebelumnya"
          className="absolute inset-y-20 left-0 w-2/5"
        />
        <button
          type="button"
          onClick={berikut}
          aria-label="Berikutnya"
          className="absolute inset-y-20 right-0 w-3/5"
        />

        <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex gap-1">
            {g.stories.map((x, i) => (
              <div key={x.id} className="h-0.5 flex-1 overflow-hidden rounded bg-white/30">
                {i < si ? (
                  <div className="h-full w-full bg-white" />
                ) : i === si ? (
                  <div
                    key={`${gi}-${si}-${ulang}`}
                    className="h-full bg-white"
                    style={
                      siap
                        ? {
                            animation: `story-isi ${DURASI_MS}ms linear forwards`,
                            animationPlayState: hapusBuka ? "paused" : "running",
                          }
                        : { width: 0 }
                    }
                    onAnimationEnd={berikut}
                  />
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-white">
            <AvatarInisial nama={g.nama} foto={g.foto} ukuran={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{g.nama}</p>
              <p className="text-xs text-white/70">{waktuRingkas(new Date(s.dibuat))}</p>
            </div>
            {bisaHapus && (
              <button
                type="button"
                onClick={() => {
                  setAlasan("");
                  setPesan("");
                  setHapusBuka(true);
                }}
                aria-label="Hapus story"
                className="rounded-full p-2 hover:bg-white/10"
              >
                <Trash2 className="size-5" />
              </button>
            )}
            <button
              type="button"
              onClick={tutup}
              aria-label="Tutup"
              className="rounded-full p-2 hover:bg-white/10"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {s.caption && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p className="text-center text-[15px] break-words whitespace-pre-wrap text-white">{s.caption}</p>
          </div>
        )}

        {hapusBuka && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-background text-foreground w-full max-w-sm rounded-2xl border p-5">
              <h2 className="text-lg font-bold">Hapus story?</h2>
              {moderasi && (
                <p className="mt-2 text-sm font-medium">
                  Kamu menghapus story milik orang lain sebagai Koordinator. Tindakan ini tercatat di log
                  moderasi.
                </p>
              )}
              <p className="text-muted-foreground mt-2 text-sm">
                Story dan fotonya dihapus permanen dan tidak bisa dikembalikan.
              </p>
              {moderasi && (
                <div className="mt-3">
                  <label htmlFor="alasan-story" className="text-sm font-semibold">
                    Alasan penghapusan
                  </label>
                  <textarea
                    id="alasan-story"
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    maxLength={BATAS_ALASAN}
                    rows={3}
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
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setHapusBuka(false)}
                  disabled={proses}
                  className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={konfirmasiHapus}
                  disabled={proses || (moderasi && alasan.trim().length < MIN_ALASAN)}
                  className="bg-destructive inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {proses && <Loader2 className="size-4 animate-spin" />}
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}