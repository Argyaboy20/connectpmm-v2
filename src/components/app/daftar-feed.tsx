"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, MessageCircle } from "lucide-react";
import { PostCard } from "@/components/post-card";
import { muatFeed } from "@/server/feed";
import type { ItemFeed } from "@/lib/feed";

type Props = {
  tab: "post" | "connex";
  awal: ItemFeed[];
  kursorAwal: string | null;
  masuk: boolean;
  idSaya: string | null;
};

export function DaftarFeed({ tab, awal, kursorAwal, masuk, idSaya }: Props) {
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
      const hasil = await muatFeed(tab === "connex" ? "CONNEX" : "POST", k);
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
  }, [tab]);

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

  useEffect(() => {
    function saatHapus(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      setItem((lama) => lama.filter((x) => x.id !== id));
    }
    window.addEventListener("post-dihapus", saatHapus);
    return () => window.removeEventListener("post-dihapus", saatHapus);
  }, []);

  if (item.length === 0 && !kursor) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center text-sm">
        {tab === "post" ? (
          <ImageIcon className="size-10 opacity-40" />
        ) : (
          <MessageCircle className="size-10 opacity-40" />
        )}
        <p>{tab === "post" ? "Belum ada post foto." : "Belum ada Connex."}</p>
        <p>Jadilah yang pertama berbagi cerita.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {item.map((d) => (
        <PostCard key={d.id} data={d} masuk={masuk} bolehHapus={idSaya === d.penulisId} />
      ))}

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