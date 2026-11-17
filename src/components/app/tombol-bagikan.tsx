"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Share2, X } from "lucide-react";
import { AvatarInisial } from "@/components/avatar-inisial";
import { bagikanPost, muatTujuanBagikan, type TujuanBagikan } from "@/server/bagikan";

export function TombolBagikan({ postId, masuk }: { postId: string; masuk: boolean }) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [daftar, setDaftar] = useState<TujuanBagikan[] | null>(null);
  const [galat, setGalat] = useState("");
  const [terkirim, setTerkirim] = useState<string[]>([]);
  const [proses, setProses] = useState<string | null>(null);

  async function bukaDialog() {
    if (!masuk) {
      router.push("/masuk");
      return;
    }
    setBuka(true);
    setGalat("");
    setTerkirim([]);
    setDaftar(null);
    try {
      const h = await muatTujuanBagikan();
      if (h.ok) setDaftar(h.item);
      else setGalat(h.pesan);
    } catch {
      setGalat("Gagal memuat. Coba lagi.");
    }
  }

  async function kirim(percakapanId: string) {
    if (proses) return;
    setProses(percakapanId);
    setGalat("");
    try {
      const h = await bagikanPost(postId, percakapanId);
      if (h.ok) setTerkirim((t) => [...t, percakapanId]);
      else setGalat(h.pesan);
    } catch {
      setGalat("Gagal mengirim. Coba lagi.");
    } finally {
      setProses(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={bukaDialog}
        aria-label="Bagikan ke Pesan"
        className="hover:text-foreground"
      >
        <Share2 className="size-5" />
      </button>

      {buka && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setBuka(false)}
        >
          <div
            role="dialog"
            aria-label="Bagikan ke Pesan"
            onClick={(e) => e.stopPropagation()}
            className="bg-background max-h-[70vh] w-full max-w-md space-y-3 overflow-y-auto rounded-t-2xl p-4 sm:rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <p className="text-foreground font-semibold">Bagikan ke Pesan</p>
              <button type="button" onClick={() => setBuka(false)} aria-label="Tutup" className="p-1">
                <X className="size-5" />
              </button>
            </div>

            {galat && (
              <p role="alert" className="text-destructive text-sm">
                {galat}
              </p>
            )}

            {daftar === null && !galat && (
              <div className="flex justify-center py-8">
                <Loader2 className="size-5 animate-spin" />
              </div>
            )}

            {daftar && daftar.length === 0 && (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Kamu belum punya percakapan. Mulai dari profil seseorang lewat tombol Pesan.
              </p>
            )}

            {daftar?.map((d) => {
              const sudah = terkirim.includes(d.id);
              return (
                <div key={d.id} className="flex items-center gap-3">
                  <AvatarInisial nama={d.nama} foto={d.foto} />
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-semibold">{d.nama}</p>
                    <p className="text-muted-foreground truncate text-xs">@{d.username}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => kirim(d.id)}
                    disabled={proses !== null}
                    className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold disabled:opacity-60 ${
                      sudah ? "border" : "bg-brand-gradient text-white"
                    }`}
                  >
                    {proses === d.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : sudah ? (
                      <>
                        <Check className="size-4" />
                        Terkirim
                      </>
                    ) : (
                      "Kirim"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}